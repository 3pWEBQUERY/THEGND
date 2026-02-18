import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const sendMessageSchema = z.object({
  receiverId: z.string().min(1, 'Empfänger-ID ist erforderlich'),
  content: z.string().min(1, 'Nachrichteninhalt ist erforderlich').max(1000, 'Nachricht darf maximal 1000 Zeichen haben')
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const url = new URL(request.url)
    const conversationWith = url.searchParams.get('conversationWith')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    if (conversationWith) {
      // Get messages for a specific conversation
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            {
              senderId: session.user.id,
              receiverId: conversationWith
            },
            {
              senderId: conversationWith,
              receiverId: session.user.id
            }
          ]
        },
        include: {
          sender: {
            include: {
              profile: true
            }
          },
          receiver: {
            include: {
              profile: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        },
        take: limit
      })

      // Mark messages as read
      await prisma.message.updateMany({
        where: {
          senderId: conversationWith,
          receiverId: session.user.id,
          isRead: false
        },
        data: {
          isRead: true
        }
      })

      return NextResponse.json(messages)
    } else {
      // Get conversation list
      const conversations = await prisma.$queryRaw`
        WITH latest_messages AS (
          SELECT 
            CASE 
              WHEN "senderId" = ${session.user.id} THEN "receiverId"
              ELSE "senderId"
            END as conversation_partner_id,
            MAX("createdAt") as last_message_time
          FROM "messages" 
          WHERE "senderId" = ${session.user.id} OR "receiverId" = ${session.user.id}
          GROUP BY conversation_partner_id
        )
        SELECT 
          m.*,
          u.email as partner_email,
          u."userType" as partner_user_type,
          p."displayName" as partner_display_name,
          p.avatar as partner_avatar,
          CAST(COALESCE(unread.unread_count, 0) AS INTEGER) as unread_count
        FROM latest_messages lm
        JOIN "messages" m ON (
          (m."senderId" = ${session.user.id} AND m."receiverId" = lm.conversation_partner_id) OR
          (m."senderId" = lm.conversation_partner_id AND m."receiverId" = ${session.user.id})
        ) AND m."createdAt" = lm.last_message_time
        JOIN "users" u ON u.id = lm.conversation_partner_id
        LEFT JOIN "profiles" p ON p."userId" = u.id
        LEFT JOIN (
          SELECT 
            "senderId",
            COUNT(*) as unread_count
          FROM "messages" 
          WHERE "receiverId" = ${session.user.id} AND "isRead" = false
          GROUP BY "senderId"
        ) unread ON unread."senderId" = lm.conversation_partner_id
        ORDER BY lm.last_message_time DESC
      ` as any[]

      return NextResponse.json(conversations)
    }
  } catch (error) {
    console.error('Fehler beim Laden der Nachrichten:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = sendMessageSchema.parse(body)

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: validatedData.receiverId }
    })

    if (!receiver) {
      return NextResponse.json({ error: 'Empfänger nicht gefunden' }, { status: 404 })
    }

    if (validatedData.receiverId === session.user.id) {
      return NextResponse.json({ error: 'Sie können sich nicht selbst schreiben' }, { status: 400 })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content: validatedData.content,
        senderId: session.user.id,
        receiverId: validatedData.receiverId
      },
      include: {
        sender: {
          include: {
            profile: true
          }
        },
        receiver: {
          include: {
            profile: true
          }
        }
      }
    })

    // Resolve sender display name from profile/companyName for all user types
    const senderUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true }
    })
    const senderName = senderUser?.profile?.displayName ?? senderUser?.profile?.companyName ?? 'Ein Nutzer'

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: validatedData.receiverId,
        type: 'message',
        title: 'Neue Nachricht',
        message: `${senderName} hat Ihnen eine Nachricht gesendet`
      }
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ungültige Daten', details: error.issues }, { status: 400 })
    }
    
    console.error('Fehler beim Senden der Nachricht:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
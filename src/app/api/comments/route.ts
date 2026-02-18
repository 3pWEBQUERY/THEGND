import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const targetUserId = searchParams.get('targetUserId') || undefined
    const authorId = searchParams.get('authorId') || undefined
    const includeAll = searchParams.get('all') === '1'

    const session = await getServerSession(authOptions)
    const requesterId: string | undefined = session?.user?.id || undefined

    if (!targetUserId && !authorId) {
      return NextResponse.json([], { status: 200 })
    }

    const where: any = {}
    if (targetUserId) {
      where.targetUserId = targetUserId
      if (!(includeAll && requesterId && requesterId === targetUserId)) {
        // Public listing only visible comments
        where.isVisible = true
      }
    }
    if (authorId) {
      const aid = authorId === 'me' ? requesterId : authorId
      if (!aid) return NextResponse.json([], { status: 200 })
      where.authorId = aid
    }

    const comments = await prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        authorId: true,
        postId: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
        rating: true,
        verifiedByTicket: true,
        reviewTicketId: true,
        isVisible: true,
        hiddenByOwner: true,
        deletionRequested: true,
        deletionRequestMessage: true,
        editRequested: true,
        editRequestMessage: true,
        targetUserId: true,
        author: { select: { email: true, profile: { select: { displayName: true, avatar: true } } } },
      } as any,
    })

    return NextResponse.json(comments)
  } catch (e) {
    console.error('Comments GET error', e)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const body = await req.json()
    const { content, targetUserId, postId, parentId, rating } = body || {}

    if (!content || (!targetUserId && !postId)) {
      return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })
    }

    const parsedRating = typeof rating === 'number' ? Math.max(1, Math.min(5, Math.floor(rating))) : undefined
    let created
    try {
      created = await prisma.comment.create({
        data: {
          content: String(content),
          targetUserId: targetUserId ? String(targetUserId) : undefined,
          postId: postId ? String(postId) : undefined,
          parentId: parentId ? String(parentId) : undefined,
          rating: parsedRating,
          authorId: session.user.id,
        } as any,
        include: {
          author: { select: { email: true, profile: { select: { displayName: true, avatar: true } } } },
        },
      })
    } catch (e: any) {
      const msg = String(e?.message || '')
      if (msg.includes('rating') || msg.includes('column') || msg.includes('Unknown arg')) {
        // Retry without rating to be resilient if migration isn't applied yet
        created = await prisma.comment.create({
          data: {
            content: String(content),
            targetUserId: targetUserId ? String(targetUserId) : undefined,
            postId: postId ? String(postId) : undefined,
            parentId: parentId ? String(parentId) : undefined,
            authorId: session.user.id,
          } as any,
          include: {
            author: { select: { email: true, profile: { select: { displayName: true, avatar: true } } } },
          },
        })
      } else {
        throw e
      }
    }

    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    console.error('Comments POST error', e)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}

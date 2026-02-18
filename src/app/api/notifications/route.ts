import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true'

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Replace any embedded email addresses in message with display names
    const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
    const emails = new Set<string>()
    for (const n of notifications) {
      const found = n.message.match(emailRegex)
      if (found) {
        for (const e of found) emails.add(e)
      }
    }

    let emailToName: Record<string, string> = {}
    if (emails.size > 0) {
      const users = await prisma.user.findMany({
        where: { email: { in: Array.from(emails) } },
        include: { profile: true },
      })
      emailToName = users.reduce((acc, u) => {
        const name = u.profile?.displayName ?? (u.profile as any)?.companyName ?? 'Ein Nutzer'
        acc[u.email] = name
        return acc
      }, {} as Record<string, string>)
    }

    const sanitized = notifications.map((n) => {
      const newTitle = n.title ? n.title.replace(emailRegex, (match) => emailToName[match] ?? 'Ein Nutzer') : n.title
      const newMessage = n.message ? n.message.replace(emailRegex, (match) => emailToName[match] ?? 'Ein Nutzer') : n.message
      return {
        ...n,
        title: newTitle,
        message: newMessage,
      }
    })

    return NextResponse.json(sanitized)
  } catch (error) {
    console.error('Fehler beim Laden der Benachrichtigungen:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
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
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50))
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true'
    const cursor = url.searchParams.get('cursor') || undefined

    const where = {
      userId: session.user.id,
      ...(unreadOnly ? { isRead: false } : {}),
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })

    // Extract emails to map to display names
    const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
    const emails = new Set<string>()
    for (const n of notifications) {
      const found = n.message?.match(emailRegex)
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

    const items = notifications.map((n) => {
      const newTitle = n.title ? n.title.replace(emailRegex, (match) => emailToName[match] ?? 'Ein Nutzer') : n.title
      const newMessage = n.message ? n.message.replace(emailRegex, (match) => emailToName[match] ?? 'Ein Nutzer') : n.message
      return {
        ...n,
        title: newTitle,
        message: newMessage,
      }
    })

    const nextCursor = items.length === limit ? items[items.length - 1].id : null

    return NextResponse.json({ items, nextCursor }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

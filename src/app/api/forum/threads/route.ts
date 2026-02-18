import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { awardEvent } from '@/lib/gamification'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const forumSlug = searchParams.get('forumSlug')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    if (!forumSlug) return NextResponse.json({ error: 'forumSlug erforderlich' }, { status: 400 })

    const forum = await prisma.forum.findUnique({ where: { slug: forumSlug } })
    if (!forum || forum.isHidden) return NextResponse.json({ error: 'Forum nicht gefunden' }, { status: 404 })

    const [total, threads] = await Promise.all([
      prisma.forumThread.count({ where: { forumId: forum.id } }),
      prisma.forumThread.findMany({
        where: { forumId: forum.id },
        orderBy: [{ isPinned: 'desc' }, { lastPostAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: { select: { id: true, email: true, profile: { select: { displayName: true, avatar: true } } } },
          _count: { select: { posts: true } },
        },
      }),
    ])

    return NextResponse.json({ forum, total, page, limit, threads })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const body = await req.json()
    const { forumSlug, title, content } = body || {}
    if (!forumSlug || !title || !content) return NextResponse.json({ error: 'forumSlug, title, content erforderlich' }, { status: 400 })

    const forum = await prisma.forum.findUnique({ where: { slug: forumSlug } })
    if (!forum || forum.isHidden || forum.isLocked) return NextResponse.json({ error: 'Forum gesperrt oder nicht vorhanden' }, { status: 400 })

    const now = new Date()
    const [thread] = await prisma.$transaction([
      prisma.forumThread.create({
        data: {
          forumId: forum.id,
          authorId: session.user.id,
          title: String(title).slice(0, 200),
          lastPostAt: now,
        },
      }),
    ])

    await prisma.forumPost.create({
      data: {
        threadId: thread.id,
        authorId: session.user.id,
        content: String(content),
      },
    })

    // Gamification: award points for creating a new thread
    try {
      await awardEvent(session.user.id, 'FORUM_THREAD' as any, 25, { forumSlug, threadId: thread.id })
    } catch {}

    return NextResponse.json({ ok: true, threadId: thread.id }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { awardEvent } from '@/lib/gamification'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const threadId = searchParams.get('threadId')
    if (!threadId) return NextResponse.json({ error: 'threadId erforderlich' }, { status: 400 })

    const posts = await prisma.forumPost.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, email: true, profile: { select: { displayName: true, avatar: true } } } },
      },
    })

    return NextResponse.json({ posts })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const body = await req.json()
    const { threadId, content, parentId } = body || {}
    if (!threadId || !content) return NextResponse.json({ error: 'threadId, content erforderlich' }, { status: 400 })

    const thread = await prisma.forumThread.findUnique({ where: { id: threadId }, include: { forum: true } })
    if (!thread) return NextResponse.json({ error: 'Thread nicht gefunden' }, { status: 404 })
    if (thread.forum.isLocked) return NextResponse.json({ error: 'Forum gesperrt' }, { status: 400 })
    if (thread.isClosed) return NextResponse.json({ error: 'Thread geschlossen' }, { status: 400 })

    const post = await prisma.forumPost.create({
      data: {
        threadId,
        authorId: session.user.id,
        content: String(content),
        parentId: parentId ? String(parentId) : undefined,
      },
    })

    await prisma.forumThread.update({ where: { id: threadId }, data: { lastPostAt: new Date() } })

    // Gamification: award points for forum activity (post vs reply)
    try {
      const isReply = !!parentId
      await awardEvent(session.user.id, (isReply ? 'FORUM_REPLY' : 'FORUM_POST') as any, isReply ? 10 : 15, { threadId })
    } catch {}

    // Notify subscribers (best-effort)
    try {
      const subs: Array<{ userId: string }> = await (prisma as any).threadSubscription.findMany({
        where: { threadId },
        select: { userId: true },
      })
      const targets = subs.filter((s) => s.userId !== session.user.id)
      if (targets.length > 0) {
        await prisma.notification.createMany({
          data: targets.map((t) => ({
            userId: t.userId,
            type: 'forum_post',
            title: 'Neuer Beitrag im abonnierten Thread',
            message: 'Ein abonniertes Thema hat einen neuen Beitrag erhalten.',
          })),
        })
      }
    } catch {}

    return NextResponse.json({ ok: true, id: post.id }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, getSessionUserId, getMembership, isBanned } from '@/lib/community'
import { awardEvent } from '@/lib/gamification'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/communities/posts/[id]/comments — Load comment tree */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params
    const { searchParams } = new URL(req.url)
    const sort = searchParams.get('sort') || 'best' // best, new, old, controversial
    const userId = await getSessionUserId()

    const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { id: true, communityId: true } })
    if (!post) return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })

    let orderBy: any = { score: 'desc' }
    if (sort === 'new') orderBy = { createdAt: 'desc' }
    if (sort === 'old') orderBy = { createdAt: 'asc' }
    if (sort === 'controversial') orderBy = { score: 'asc' }

    const comments = await prisma.communityComment.findMany({
      where: { postId },
      orderBy,
      include: {
        author: { select: { id: true, email: true, karma: true, profile: { select: { displayName: true, avatar: true } } } },
        ...(userId ? { votes: { where: { userId }, select: { type: true } } } : {}),
      },
    })

    // Build tree in memory
    const map = new Map<string, any>()
    const roots: any[] = []

    for (const c of comments) {
      map.set(c.id, { ...c, children: [] })
    }
    for (const c of comments) {
      const node = map.get(c.id)!
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    return NextResponse.json({ comments: roots, total: comments.length })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

/** POST /api/communities/posts/[id]/comments — Create a comment */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth()
    const { id: postId } = await params

    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      select: { id: true, communityId: true, authorId: true, isLocked: true, isDeleted: true, isRemoved: true, community: { select: { type: true, slug: true } } },
    })
    if (!post || post.isDeleted || post.isRemoved) return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })
    if (post.isLocked) return NextResponse.json({ error: 'Post ist gesperrt' }, { status: 403 })

    // Check membership for RESTRICTED/PRIVATE
    if (post.community.type !== 'PUBLIC') {
      const member = await getMembership(post.communityId, userId)
      if (!member) return NextResponse.json({ error: 'Du musst Mitglied sein, um zu kommentieren' }, { status: 403 })
    }

    if (await isBanned(post.communityId, userId)) {
      return NextResponse.json({ error: 'Du bist in dieser Community gebannt' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const content = String(body?.content || '').trim().slice(0, 10000)
    if (!content) return NextResponse.json({ error: 'Kommentar darf nicht leer sein' }, { status: 400 })

    const parentId = body?.parentId || null

    // Verify parent exists and belongs to this post
    if (parentId) {
      const parent = await prisma.communityComment.findUnique({ where: { id: parentId }, select: { postId: true } })
      if (!parent || parent.postId !== postId) return NextResponse.json({ error: 'Ungültiger Parent-Kommentar' }, { status: 400 })
    }

    const comment = await prisma.communityComment.create({
      data: { postId, authorId: userId, content, parentId, score: 1 },
      include: {
        author: { select: { id: true, email: true, karma: true, profile: { select: { displayName: true, avatar: true } } } },
      },
    })

    // Auto-upvote own comment
    await prisma.vote.create({ data: { userId, commentId: comment.id, type: 'UP' } })

    // Update comment count cache
    await prisma.communityPost.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } })

    // Notify post author (if different user)
    if (post.authorId !== userId) {
      const commenter = await prisma.user.findUnique({ where: { id: userId }, select: { profile: { select: { displayName: true } }, email: true } })
      const displayName = commenter?.profile?.displayName || commenter?.email?.split('@')[0] || 'Jemand'
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'community_comment',
          title: 'Neuer Kommentar',
          message: `${displayName} hat deinen Post kommentiert`,
        },
      }).catch(() => {})
    }

    // Notify parent comment author (if replying to someone else)
    if (parentId) {
      const parentComment = await prisma.communityComment.findUnique({ where: { id: parentId }, select: { authorId: true } })
      if (parentComment && parentComment.authorId !== userId && parentComment.authorId !== post.authorId) {
        const commenter = await prisma.user.findUnique({ where: { id: userId }, select: { profile: { select: { displayName: true } }, email: true } })
        const displayName = commenter?.profile?.displayName || commenter?.email?.split('@')[0] || 'Jemand'
        await prisma.notification.create({
          data: {
            userId: parentComment.authorId,
            type: 'community_comment_reply',
            title: 'Antwort auf deinen Kommentar',
            message: `${displayName} hat auf deinen Kommentar geantwortet`,
          },
        }).catch(() => {})
      }
    }

    // Award gamification
    try { await awardEvent(userId, 'COMMUNITY_COMMENT' as any, 10, { postId, commentId: comment.id }) } catch {}

    return NextResponse.json({ ok: true, comment }, { status: 201 })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

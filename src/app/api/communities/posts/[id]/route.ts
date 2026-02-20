import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, getSessionUserId, isModerator, logModAction } from '@/lib/community'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/communities/posts/[id] — Get post detail */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = await getSessionUserId()

    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: {
        community: { select: { id: true, name: true, slug: true, type: true, icon: true } },
        author: { select: { id: true, email: true, karma: true, profile: { select: { displayName: true, avatar: true } } } },
        flair: true,
        pollOptions: { orderBy: { sortOrder: 'asc' }, include: { _count: { select: { votes: true } } } },
        _count: { select: { comments: true } },
        ...(userId ? { votes: { where: { userId }, select: { type: true } } } : {}),
        ...(userId ? { savedBy: { where: { userId }, select: { id: true } } } : {}),
      },
    })

    if (!post || (post.isRemoved && !(userId && await isModerator(post.communityId, userId)))) {
      return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })
    }

    // Increment view count
    await prisma.communityPost.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {})

    // Check if user voted on poll
    let pollUserVote = null
    if (post.type === 'POLL' && userId) {
      const optionIds = post.pollOptions.map((o: any) => o.id)
      if (optionIds.length) {
        pollUserVote = await prisma.pollVote.findFirst({
          where: { userId, optionId: { in: optionIds } },
          select: { optionId: true },
        })
      }
    }

    return NextResponse.json({ post, pollUserVote })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

/** PATCH /api/communities/posts/[id] — Edit post (author only, text/content only) */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth()
    const { id } = await params

    const post = await prisma.communityPost.findUnique({ where: { id } })
    if (!post) return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })
    if (post.authorId !== userId) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    if (post.isDeleted || post.isRemoved) return NextResponse.json({ error: 'Post wurde gelöscht' }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const data: any = { updatedAt: new Date() }
    if (typeof body.content === 'string') data.content = body.content.slice(0, 40000)
    if (body.flairId !== undefined) data.flairId = body.flairId || null

    const updated = await prisma.communityPost.update({ where: { id }, data })
    return NextResponse.json({ ok: true, post: updated })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

/** DELETE /api/communities/posts/[id] — Soft-delete post */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth()
    const { id } = await params

    const post = await prisma.communityPost.findUnique({ where: { id } })
    if (!post) return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })

    const isMod = await isModerator(post.communityId, userId)

    if (post.authorId === userId) {
      // Author deletes own post
      await prisma.communityPost.update({ where: { id }, data: { isDeleted: true } })
    } else if (isMod) {
      // Mod removes post
      await prisma.communityPost.update({ where: { id }, data: { isRemoved: true } })
      await logModAction({
        communityId: post.communityId,
        moderatorId: userId,
        action: 'REMOVE_POST',
        targetPostId: id,
        targetUserId: post.authorId,
      })
    } else {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

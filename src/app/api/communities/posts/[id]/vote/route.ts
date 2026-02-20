import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, getSessionUserId } from '@/lib/community'
import { awardEvent } from '@/lib/gamification'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** POST /api/communities/posts/[id]/vote — Upvote / Downvote / Remove vote */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth()
    const { id: postId } = await params

    const body = await req.json().catch(() => ({}))
    const voteType = body?.type // 'UP', 'DOWN', or 'NONE' (remove)

    const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { id: true, authorId: true, score: true } })
    if (!post) return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })

    const existing = await prisma.vote.findUnique({ where: { userId_postId: { userId, postId } } })

    let scoreDelta = 0
    let karmaDelta = 0

    if (voteType === 'NONE' || (!['UP', 'DOWN'].includes(voteType) && existing)) {
      // Remove existing vote
      if (existing) {
        await prisma.vote.delete({ where: { id: existing.id } })
        scoreDelta = existing.type === 'UP' ? -1 : 1
        karmaDelta = existing.type === 'UP' ? -1 : 1
      }
    } else if (existing) {
      // Change vote direction
      if (existing.type !== voteType) {
        await prisma.vote.update({ where: { id: existing.id }, data: { type: voteType as any } })
        scoreDelta = voteType === 'UP' ? 2 : -2
        karmaDelta = voteType === 'UP' ? 2 : -2
      }
    } else {
      // New vote
      await prisma.vote.create({ data: { userId, postId, type: voteType as any } })
      scoreDelta = voteType === 'UP' ? 1 : -1
      karmaDelta = voteType === 'UP' ? 1 : -1
    }

    // Update post score cache
    if (scoreDelta !== 0) {
      await prisma.communityPost.update({ where: { id: postId }, data: { score: { increment: scoreDelta } } })
    }

    // Update author's karma (don't give karma for self-votes)
    if (karmaDelta !== 0 && post.authorId !== userId) {
      await prisma.user.update({ where: { id: post.authorId }, data: { karma: { increment: karmaDelta } } }).catch(() => {})
      // Award gamification for receiving upvotes
      if (karmaDelta > 0) {
        try { await awardEvent(post.authorId, 'COMMUNITY_RECEIVE_UPVOTE' as any, 2) } catch {}
      }
    }

    const updatedPost = await prisma.communityPost.findUnique({ where: { id: postId }, select: { score: true } })

    return NextResponse.json({ ok: true, score: updatedPost?.score ?? 0 })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

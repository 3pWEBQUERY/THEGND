import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/community'
import { awardEvent } from '@/lib/gamification'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** POST /api/communities/comments/[id]/vote — Vote on a comment */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth()
    const { id: commentId } = await params

    const body = await req.json().catch(() => ({}))
    const voteType = body?.type // 'UP', 'DOWN', 'NONE'

    const comment = await prisma.communityComment.findUnique({ where: { id: commentId }, select: { id: true, authorId: true } })
    if (!comment) return NextResponse.json({ error: 'Kommentar nicht gefunden' }, { status: 404 })

    const existing = await prisma.vote.findUnique({ where: { userId_commentId: { userId, commentId } } })

    let scoreDelta = 0
    let karmaDelta = 0

    if (voteType === 'NONE' && existing) {
      await prisma.vote.delete({ where: { id: existing.id } })
      scoreDelta = existing.type === 'UP' ? -1 : 1
      karmaDelta = existing.type === 'UP' ? -1 : 1
    } else if (existing && existing.type !== voteType) {
      await prisma.vote.update({ where: { id: existing.id }, data: { type: voteType as any } })
      scoreDelta = voteType === 'UP' ? 2 : -2
      karmaDelta = voteType === 'UP' ? 2 : -2
    } else if (!existing && ['UP', 'DOWN'].includes(voteType)) {
      await prisma.vote.create({ data: { userId, commentId, type: voteType as any } })
      scoreDelta = voteType === 'UP' ? 1 : -1
      karmaDelta = voteType === 'UP' ? 1 : -1
    }

    if (scoreDelta !== 0) {
      await prisma.communityComment.update({ where: { id: commentId }, data: { score: { increment: scoreDelta } } })
    }

    if (karmaDelta !== 0 && comment.authorId !== userId) {
      await prisma.user.update({ where: { id: comment.authorId }, data: { karma: { increment: karmaDelta } } }).catch(() => {})
      if (karmaDelta > 0) {
        try { await awardEvent(comment.authorId, 'COMMUNITY_RECEIVE_UPVOTE' as any, 2) } catch {}
      }
    }

    const updated = await prisma.communityComment.findUnique({ where: { id: commentId }, select: { score: true } })
    return NextResponse.json({ ok: true, score: updated?.score ?? 0 })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isModerator, logModAction } from '@/lib/community'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** POST /api/communities/posts/[id]/lock — Toggle lock */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth()
    const { id: postId } = await params

    const post = await prisma.communityPost.findUnique({ where: { id: postId } })
    if (!post) return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })

    if (!await isModerator(post.communityId, userId)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const newLocked = !post.isLocked
    await prisma.communityPost.update({ where: { id: postId }, data: { isLocked: newLocked } })

    await logModAction({
      communityId: post.communityId,
      moderatorId: userId,
      action: newLocked ? 'LOCK_POST' : 'UNLOCK_POST',
      targetPostId: postId,
    })

    return NextResponse.json({ ok: true, isLocked: newLocked })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

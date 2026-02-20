import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isModerator, logModAction } from '@/lib/community'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** POST /api/communities/posts/[id]/pin — Toggle pin */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth()
    const { id: postId } = await params

    const post = await prisma.communityPost.findUnique({ where: { id: postId } })
    if (!post) return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })

    if (!await isModerator(post.communityId, userId)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Max 2 pinned posts per community
    if (!post.isPinned) {
      const pinnedCount = await prisma.communityPost.count({ where: { communityId: post.communityId, isPinned: true } })
      if (pinnedCount >= 2) return NextResponse.json({ error: 'Maximal 2 gepinnte Posts erlaubt' }, { status: 400 })
    }

    const newPinned = !post.isPinned
    await prisma.communityPost.update({ where: { id: postId }, data: { isPinned: newPinned } })

    await logModAction({
      communityId: post.communityId,
      moderatorId: userId,
      action: newPinned ? 'PIN_POST' : 'UNPIN_POST',
      targetPostId: postId,
    })

    return NextResponse.json({ ok: true, isPinned: newPinned })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

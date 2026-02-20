import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isModerator, logModAction } from '@/lib/community'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** PATCH /api/communities/comments/[id] — Edit a comment */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth()
    const { id } = await params

    const comment = await prisma.communityComment.findUnique({ where: { id } })
    if (!comment) return NextResponse.json({ error: 'Kommentar nicht gefunden' }, { status: 404 })
    if (comment.authorId !== userId) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    if (comment.isDeleted || comment.isRemoved) return NextResponse.json({ error: 'Kommentar wurde gelöscht' }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const content = String(body?.content || '').trim().slice(0, 10000)
    if (!content) return NextResponse.json({ error: 'Kommentar darf nicht leer sein' }, { status: 400 })

    const updated = await prisma.communityComment.update({
      where: { id },
      data: { content, editedAt: new Date() },
    })

    return NextResponse.json({ ok: true, comment: updated })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

/** DELETE /api/communities/comments/[id] — Soft-delete a comment */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth()
    const { id } = await params

    const comment = await prisma.communityComment.findUnique({
      where: { id },
      select: { id: true, authorId: true, postId: true, post: { select: { communityId: true } } },
    })
    if (!comment) return NextResponse.json({ error: 'Kommentar nicht gefunden' }, { status: 404 })

    const isMod = await isModerator(comment.post.communityId, userId)

    if (comment.authorId === userId) {
      await prisma.communityComment.update({ where: { id }, data: { isDeleted: true } })
    } else if (isMod) {
      await prisma.communityComment.update({ where: { id }, data: { isRemoved: true } })
      await logModAction({
        communityId: comment.post.communityId,
        moderatorId: userId,
        action: 'REMOVE_COMMENT',
        targetCommentId: id,
        targetUserId: comment.authorId,
      })
    } else {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Update comment count
    await prisma.communityPost.update({ where: { id: comment.postId }, data: { commentCount: { decrement: 1 } } }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

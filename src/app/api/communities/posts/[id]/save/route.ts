import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/community'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** POST /api/communities/posts/[id]/save — Toggle save/unsave */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth()
    const { id: postId } = await params

    const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { id: true } })
    if (!post) return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })

    const existing = await prisma.savedPost.findUnique({ where: { userId_postId: { userId, postId } } })

    if (existing) {
      await prisma.savedPost.delete({ where: { id: existing.id } })
      return NextResponse.json({ ok: true, saved: false })
    } else {
      await prisma.savedPost.create({ data: { userId, postId } })
      return NextResponse.json({ ok: true, saved: true })
    }
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

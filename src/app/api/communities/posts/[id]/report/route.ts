import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/community'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** POST /api/communities/posts/[id]/report — Report a post */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth()
    const { id: postId } = await params

    const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { id: true, communityId: true } })
    if (!post) return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })

    const body = await req.json().catch(() => ({}))
    const reason = String(body?.reason || '').trim().slice(0, 500)
    if (!reason) return NextResponse.json({ error: 'Begründung erforderlich' }, { status: 400 })

    // Check if already reported
    const existing = await prisma.communityReport.findFirst({ where: { reporterId: userId, postId } })
    if (existing) return NextResponse.json({ error: 'Du hast diesen Post bereits gemeldet' }, { status: 400 })

    await prisma.communityReport.create({
      data: {
        communityId: post.communityId,
        reporterId: userId,
        postId,
        reason,
        ruleId: body?.ruleId || undefined,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

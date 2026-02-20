import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/community'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** POST /api/communities/posts/[id]/poll/vote — Vote on a poll */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth()
    const { id: postId } = await params

    const body = await req.json().catch(() => ({}))
    const optionId = body?.optionId
    if (!optionId) return NextResponse.json({ error: 'optionId erforderlich' }, { status: 400 })

    // Verify post is a poll and option belongs to it
    const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { id: true, type: true } })
    if (!post || post.type !== 'POLL') return NextResponse.json({ error: 'Kein Poll-Post' }, { status: 400 })

    const option = await prisma.pollOption.findUnique({ where: { id: optionId }, select: { id: true, postId: true } })
    if (!option || option.postId !== postId) return NextResponse.json({ error: 'Option gehört nicht zu diesem Poll' }, { status: 400 })

    // Check if user already voted on this poll (any option)
    const allOptions = await prisma.pollOption.findMany({ where: { postId }, select: { id: true } })
    const existingVote = await prisma.pollVote.findFirst({
      where: { userId, optionId: { in: allOptions.map(o => o.id) } },
    })
    if (existingVote) return NextResponse.json({ error: 'Du hast bereits abgestimmt' }, { status: 400 })

    await prisma.pollVote.create({ data: { optionId, userId } })

    // Return updated results
    const results = await prisma.pollOption.findMany({
      where: { postId },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { votes: true } } },
    })

    return NextResponse.json({ ok: true, results })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

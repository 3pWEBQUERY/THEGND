import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isModerator } from '@/lib/community'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/communities/[slug]/reports — List reports */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const userId = await requireAuth()
    const { slug } = await params
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'OPEN'

    const community = await prisma.community.findUnique({ where: { slug }, select: { id: true } })
    if (!community) return NextResponse.json({ error: 'Community nicht gefunden' }, { status: 404 })

    if (!await isModerator(community.id, userId)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const reports = await prisma.communityReport.findMany({
      where: { communityId: community.id, status },
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
        post: { select: { id: true, title: true, authorId: true } },
        comment: { select: { id: true, content: true, authorId: true } },
      },
    })

    return NextResponse.json({ reports })
  } catch (e: any) {
    const s = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: s })
  }
}

/** POST /api/communities/[slug]/reports — Resolve a report */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const userId = await requireAuth()
    const { slug } = await params

    const community = await prisma.community.findUnique({ where: { slug }, select: { id: true } })
    if (!community) return NextResponse.json({ error: 'Community nicht gefunden' }, { status: 404 })

    if (!await isModerator(community.id, userId)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const reportId = body?.reportId
    const action = body?.action // 'dismiss' or 'remove'
    if (!reportId || !action) return NextResponse.json({ error: 'reportId und action erforderlich' }, { status: 400 })

    const report = await prisma.communityReport.findUnique({ where: { id: reportId } })
    if (!report || report.communityId !== community.id) return NextResponse.json({ error: 'Report nicht gefunden' }, { status: 404 })

    await prisma.communityReport.update({
      where: { id: reportId },
      data: { status: action === 'remove' ? 'RESOLVED' : 'DISMISSED', resolvedById: userId, resolvedAt: new Date() },
    })

    // If action is 'remove', remove the reported content
    if (action === 'remove') {
      if (report.postId) {
        await prisma.communityPost.update({ where: { id: report.postId }, data: { isRemoved: true } })
      }
      if (report.commentId) {
        await prisma.communityComment.update({ where: { id: report.commentId }, data: { isRemoved: true } })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

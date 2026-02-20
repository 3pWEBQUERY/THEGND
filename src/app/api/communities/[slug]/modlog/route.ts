import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isModerator } from '@/lib/community'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/communities/[slug]/modlog — Moderation log */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const userId = await requireAuth()
    const { slug } = await params
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50', 10))
    const action = searchParams.get('action') || ''

    const community = await prisma.community.findUnique({ where: { slug }, select: { id: true } })
    if (!community) return NextResponse.json({ error: 'Community nicht gefunden' }, { status: 404 })

    if (!await isModerator(community.id, userId)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const where: any = { communityId: community.id }
    if (action) where.action = action

    const [total, logs] = await Promise.all([
      prisma.communityModLog.count({ where }),
      prisma.communityModLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          moderator: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
          targetUser: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
        },
      }),
    ])

    return NextResponse.json({ total, page, limit, logs })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

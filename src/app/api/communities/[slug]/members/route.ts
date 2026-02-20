import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isModerator, isOwner, logModAction } from '@/lib/community'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/communities/[slug]/members — List members */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20', 10))
    const q = (searchParams.get('q') || '').trim()

    const community = await prisma.community.findUnique({ where: { slug }, select: { id: true } })
    if (!community) return NextResponse.json({ error: 'Community nicht gefunden' }, { status: 404 })

    const where: any = { communityId: community.id }
    if (q) {
      where.user = { OR: [
        { email: { contains: q, mode: 'insensitive' } },
        { profile: { displayName: { contains: q, mode: 'insensitive' } } },
      ] }
    }

    const [total, members] = await Promise.all([
      prisma.communityMember.count({ where }),
      prisma.communityMember.findMany({
        where,
        orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, email: true, karma: true, profile: { select: { displayName: true, avatar: true } } } } },
      }),
    ])

    return NextResponse.json({ total, page, limit, members })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

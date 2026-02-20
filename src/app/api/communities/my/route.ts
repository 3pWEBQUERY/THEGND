import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/community'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/communities/my — List user's joined communities */
export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth()
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()

    const where: any = {
      userId,
      community: { isArchived: false },
    }
    if (q) {
      where.community = { ...where.community, name: { contains: q, mode: 'insensitive' } }
    }

    const memberships = await prisma.communityMember.findMany({
      where,
      orderBy: { joinedAt: 'desc' },
      include: {
        community: {
          select: { id: true, name: true, slug: true, icon: true, memberCount: true, type: true },
        },
      },
    })

    return NextResponse.json({
      communities: memberships.map(m => ({
        ...m.community,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

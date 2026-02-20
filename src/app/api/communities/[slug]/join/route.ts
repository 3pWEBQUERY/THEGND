import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isBanned } from '@/lib/community'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** POST /api/communities/[slug]/join */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const userId = await requireAuth()
    const { slug } = await params

    const community = await prisma.community.findUnique({ where: { slug } })
    if (!community || community.isArchived) return NextResponse.json({ error: 'Community nicht gefunden' }, { status: 404 })

    // Check ban
    if (await isBanned(community.id, userId)) {
      return NextResponse.json({ error: 'Du bist in dieser Community gebannt' }, { status: 403 })
    }

    // For PRIVATE communities, joining could require approval — for now, allow directly
    await prisma.communityMember.upsert({
      where: { communityId_userId: { communityId: community.id, userId } },
      update: {},
      create: { communityId: community.id, userId, role: 'MEMBER' },
    })

    // Update cached member count
    const count = await prisma.communityMember.count({ where: { communityId: community.id } })
    await prisma.community.update({ where: { id: community.id }, data: { memberCount: count } })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

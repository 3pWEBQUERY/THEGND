import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/community'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** POST /api/communities/[slug]/leave */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const userId = await requireAuth()
    const { slug } = await params

    const community = await prisma.community.findUnique({ where: { slug } })
    if (!community) return NextResponse.json({ error: 'Community nicht gefunden' }, { status: 404 })

    // Owner cannot leave
    const membership = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
    })
    if (membership?.role === 'OWNER') {
      return NextResponse.json({ error: 'Der Owner kann die Community nicht verlassen. Übertrage zuerst die Ownership.' }, { status: 400 })
    }

    await prisma.communityMember.delete({
      where: { communityId_userId: { communityId: community.id, userId } },
    }).catch(() => {})

    // Update cached member count
    const count = await prisma.communityMember.count({ where: { communityId: community.id } })
    await prisma.community.update({ where: { id: community.id }, data: { memberCount: count } })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

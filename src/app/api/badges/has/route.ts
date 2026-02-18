import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const badgeKey = String(searchParams.get('badge') || '')
    const idsParam = String(searchParams.get('ids') || '')
    if (!badgeKey || !idsParam) return NextResponse.json({ error: 'badge und ids erforderlich' }, { status: 400 })

    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean)
    if (ids.length === 0) return NextResponse.json({ has: [] })

    const badge = await (prisma as any).badge.findUnique({ where: { key: badgeKey } })
    if (!badge) return NextResponse.json({ has: [] })

    const rows: Array<{ userId: string }> = await (prisma as any).userBadge.findMany({
      where: { userId: { in: ids }, badgeId: badge.id },
      select: { userId: true },
    })
    return NextResponse.json({ has: rows.map(r => r.userId) })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

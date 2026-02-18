import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const idsParam = searchParams.get('ids')
  if (!idsParam) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 })
  }
  const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean)
  if (ids.length === 0) return NextResponse.json({})

  // Use raw SQL to avoid Prisma Client validation until types are regenerated
  const rows = await prisma.$queryRaw<Array<{ id: string; lastSeenAt: Date | null }>>`
    SELECT id, "lastSeenAt" FROM "users"
    WHERE id IN (${Prisma.join(ids)})
  `
  const now = Date.now()
  const map: Record<string, { online: boolean; lastSeenAt: string | null }> = {}
  for (const r of rows) {
    const ts = r.lastSeenAt ? new Date(r.lastSeenAt).getTime() : 0
    map[r.id] = { online: !!(ts && now - ts <= ONLINE_THRESHOLD_MS), lastSeenAt: r.lastSeenAt ? new Date(r.lastSeenAt).toISOString() : null }
  }
  return NextResponse.json(map)
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 })
  try {
    // Raw SQL update to avoid Prisma Client validation
    await prisma.$executeRaw`UPDATE "users" SET "lastSeenAt" = NOW() WHERE id = ${session.user.id}`
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

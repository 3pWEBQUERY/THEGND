import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const targetUserId = searchParams.get('targetUserId')
  const session = await getServerSession(authOptions)
  if (!targetUserId && !session?.user?.id) {
    return NextResponse.json({ error: 'targetUserId required' }, { status: 400 })
  }
  const userId = targetUserId || (session?.user?.id as string)

  try {
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') || 24)))
    const sinceDays = Math.max(1, Math.min(365, Number(searchParams.get('days') || 30)))
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)

    const rows = await prisma.$queryRaw<Array<{
      id: string | null
      email: string | null
      displayName: string | null
      avatar: string | null
      visitedAt: Date
    }>>`
      SELECT u.id, u.email, p."displayName", p."avatar", v."visitedAt"
      FROM "profile_visits" v
      LEFT JOIN "users" u ON u.id = v."visitorId"
      LEFT JOIN "profiles" p ON p."userId" = u.id
      WHERE v."profileUserId" = ${userId}
        AND v."visitedAt" >= ${since}
      ORDER BY v."visitedAt" DESC
      LIMIT ${limit}
    `

    const anonCountRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint as count
      FROM "profile_visits"
      WHERE "profileUserId" = ${userId}
        AND "visitedAt" >= ${since}
        AND "visitorId" IS NULL
    `
    const anonCount = Number(anonCountRows?.[0]?.count ?? 0)

    const visitors = (rows || [])
      .filter((r) => !!r.id)
      .map((r) => ({
        id: r.id as string,
        displayName: r.displayName || r.email || 'Besucher',
        avatar: r.avatar,
        visitedAt: r.visitedAt.toISOString(),
      }))

    return NextResponse.json({ visitors, anonCount })
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

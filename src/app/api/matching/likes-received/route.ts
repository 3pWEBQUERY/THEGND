import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session: any = await getServerSession(authOptions as any)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    if (session.user.userType !== 'ESCORT') return NextResponse.json({ error: 'Nur für Escorts' }, { status: 403 })

    // 1) Base likes from members -> escorts
    const baseLikes = await prisma.$queryRaw<any[]>`
      SELECT 
        mma."memberId" as id,
        u.email,
        p."displayName",
        p.avatar,
        p.gallery,
        p.city,
        p.country,
        mma."createdAt" as liked_at
      FROM "member_match_actions" mma
      JOIN "users" u ON u.id = mma."memberId"
      LEFT JOIN "profiles" p ON p."userId" = u.id
      WHERE mma."escortId" = ${session.user.id} AND mma.action = 'LIKE'
      ORDER BY mma."createdAt" DESC
    `

    // 2) Try to mark which ones were liked back by the escort
    let likedBackSet = new Set<string>()
    try {
      const likedBackRows = await prisma.$queryRaw<{ memberId: string }[]>`
        SELECT "memberId" FROM "escort_match_actions" 
        WHERE "escortId" = ${session.user.id} AND action = 'LIKE'
      `
      likedBackSet = new Set((likedBackRows || []).map(r => r.memberId))
    } catch {
      // Table may not exist yet — ignore
    }

    const rows = baseLikes.map((r: any) => ({
      ...r,
      liked_back: likedBackSet.has(r.id)
    }))

    return NextResponse.json({ likes: rows }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ error: 'Server Fehler beim Laden der Likes' }, { status: 500 })
  }
}

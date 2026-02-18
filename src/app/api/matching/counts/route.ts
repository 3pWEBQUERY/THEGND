import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session: any = await getServerSession(authOptions as any)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const userId = session.user.id
    const userType = session.user.userType

    if (userType === 'MEMBER') {
      // Mutual matches count (member liked escort AND escort liked back)
      let mutual = 0
      try {
        const rows = await prisma.$queryRaw<{ c: number }[]>`
          SELECT COUNT(*)::int AS c
          FROM "member_match_actions" mma
          JOIN "escort_match_actions" ema
            ON ema."memberId" = mma."memberId" AND ema."escortId" = mma."escortId" AND ema.action = 'LIKE'
          WHERE mma."memberId" = ${userId} AND mma.action = 'LIKE'
        `
        mutual = Array.isArray(rows) && rows[0] ? rows[0].c : 0
      } catch {
        mutual = 0
      }
      return NextResponse.json({ likes: 0, mutual }, { status: 200 })
    }

    if (userType === 'ESCORT' || userType === 'HOBBYHURE') {
      // Likes received count
      const likesRows = await prisma.$queryRaw<{ c: number }[]>`
        SELECT COUNT(*)::int AS c
        FROM "member_match_actions"
        WHERE "escortId" = ${userId} AND action = 'LIKE'
      `
      const likes = Array.isArray(likesRows) && likesRows[0] ? likesRows[0].c : 0

      // Mutual matches count (escort liked member AND member liked back)
      let mutual = 0
      try {
        const rows = await prisma.$queryRaw<{ c: number }[]>`
          SELECT COUNT(*)::int AS c
          FROM "escort_match_actions" ema
          JOIN "member_match_actions" mma
            ON mma."memberId" = ema."memberId" AND mma."escortId" = ema."escortId" AND mma.action = 'LIKE'
          WHERE ema."escortId" = ${userId} AND ema.action = 'LIKE'
        `
        mutual = Array.isArray(rows) && rows[0] ? rows[0].c : 0
      } catch {
        mutual = 0
      }

      return NextResponse.json({ likes, mutual }, { status: 200 })
    }

    return NextResponse.json({ likes: 0, mutual: 0 }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ error: 'Server Fehler' }, { status: 500 })
  }
}

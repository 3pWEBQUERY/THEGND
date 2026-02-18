import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    if (session.user.userType !== 'MEMBER') return NextResponse.json({ error: 'Nur für Mitglieder' }, { status: 403 })

    // Delete the most recent swipe from this member
    const rows = await prisma.$queryRaw<{ id: string; escortId: string }[]>`
      WITH last AS (
        SELECT id, "escortId"
        FROM "member_match_actions"
        WHERE "memberId" = ${session.user.id}
        ORDER BY "createdAt" DESC
        LIMIT 1
      )
      DELETE FROM "member_match_actions" mma
      USING last
      WHERE mma.id = last.id
      RETURNING last.id, last."escortId";
    `

    const undone = Array.isArray(rows) && rows[0] ? rows[0] : null
    if (!undone) return NextResponse.json({ ok: false, error: 'Nichts zum Rückgängig machen' }, { status: 200 })

    return NextResponse.json({ ok: true, escortId: undone.escortId }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ error: 'Server Fehler beim Rückgängig machen' }, { status: 500 })
  }
}

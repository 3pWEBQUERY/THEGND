import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const userId = session.user.id as string
    const userType = session.user.userType as any
    const body = await req.json().catch(() => ({} as any))
    const mode = String(body?.mode || 'hard').toLowerCase() as 'soft' | 'hard'
    const soft = mode === 'soft'

    if (userType === 'MEMBER') {
      try {
        const rows = soft
          ? await prisma.$queryRaw<{ id: string }[]>`
              DELETE FROM "member_match_actions"
              WHERE "memberId" = ${userId} AND action = 'PASS'
              RETURNING id;
            `
          : await prisma.$queryRaw<{ id: string }[]>`
              DELETE FROM "member_match_actions"
              WHERE "memberId" = ${userId}
              RETURNING id;
            `
        const count = Array.isArray(rows) ? rows.length : 0
        return NextResponse.json({ ok: true, cleared: count, scope: 'member', mode }, { status: 200 })
      } catch (e) {
        // If table does not exist yet, treat as cleared 0
        return NextResponse.json({ ok: true, cleared: 0, scope: 'member', mode }, { status: 200 })
      }
    } else if (userType === 'ESCORT' || userType === 'HOBBYHURE') {
      try {
        const rows = soft
          ? await prisma.$queryRaw<{ id: string }[]>`
              DELETE FROM "escort_match_actions"
              WHERE "escortId" = ${userId} AND action = 'PASS'
              RETURNING id;
            `
          : await prisma.$queryRaw<{ id: string }[]>`
              DELETE FROM "escort_match_actions"
              WHERE "escortId" = ${userId}
              RETURNING id;
            `
        const count = Array.isArray(rows) ? rows.length : 0
        return NextResponse.json({ ok: true, cleared: count, scope: 'escort', mode }, { status: 200 })
      } catch (e) {
        return NextResponse.json({ ok: true, cleared: 0, scope: 'escort', mode }, { status: 200 })
      }
    } else {
      return NextResponse.json({ error: 'Unbekannter Benutzertyp' }, { status: 400 })
    }
  } catch (e) {
    return NextResponse.json({ error: 'Server Fehler beim Zurücksetzen' }, { status: 500 })
  }
}

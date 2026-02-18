import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const url = new URL(req.url)
    const limit = Math.min(100, Math.max(5, Number(url.searchParams.get('limit') || 50)))

    if (session.user.userType === 'MEMBER') {
      // Mutual matches for members: member liked escort AND escort liked back
      let rows: any[] = []
      try {
        rows = await prisma.$queryRaw<any[]>`
          SELECT 
            u.id,
            u.email,
            p."displayName",
            p.avatar,
            p.city,
            p.country,
            p.gallery
          FROM "member_match_actions" mma
          JOIN "escort_match_actions" ema
            ON ema."memberId" = mma."memberId" AND ema."escortId" = mma."escortId" AND ema.action = 'LIKE'
          JOIN "users" u ON u.id = mma."escortId"
          LEFT JOIN "profiles" p ON p."userId" = u.id
          WHERE mma."memberId" = ${session.user.id} AND mma.action = 'LIKE'
          ORDER BY GREATEST(mma."createdAt", ema."createdAt") DESC
          LIMIT ${limit}
        `
      } catch {
        rows = []
      }
      const results = rows.map((r: any) => ({
        id: r.id,
        email: r.email,
        displayName: r.displayName ?? r.email?.split('@')[0] ?? 'Escort',
        avatar: r.avatar ?? null,
        city: r.city ?? null,
        country: r.country ?? null,
        image: (() => {
          try { const g = r.gallery ? JSON.parse(r.gallery) : []; return Array.isArray(g) ? (g[0] || null) : null } catch { return null }
        })()
      }))
      return NextResponse.json({ matches: results }, { status: 200 })
    }

    if (session.user.userType === 'ESCORT' || session.user.userType === 'HOBBYHURE') {
      // Mutual matches for escorts: escort liked member AND member liked back
      let rows: any[] = []
      try {
        rows = await prisma.$queryRaw<any[]>`
          SELECT 
            u.id,
            u.email,
            p."displayName",
            p.avatar,
            p.city,
            p.country
          FROM "escort_match_actions" ema
          JOIN "member_match_actions" mma
            ON mma."memberId" = ema."memberId" AND mma."escortId" = ema."escortId" AND mma.action = 'LIKE'
          JOIN "users" u ON u.id = ema."memberId"
          LEFT JOIN "profiles" p ON p."userId" = u.id
          WHERE ema."escortId" = ${session.user.id} AND ema.action = 'LIKE'
          ORDER BY GREATEST(mma."createdAt", ema."createdAt") DESC
          LIMIT ${limit}
        `
      } catch {
        rows = []
      }
      const results = rows.map((r: any) => ({
        id: r.id,
        email: r.email,
        displayName: r.displayName ?? r.email?.split('@')[0] ?? 'Mitglied',
        avatar: r.avatar ?? null,
        city: r.city ?? null,
        country: r.country ?? null,
      }))
      return NextResponse.json({ matches: results }, { status: 200 })
    }

    return NextResponse.json({ error: 'Nicht unterstützt' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: 'Server Fehler beim Laden der Matches' }, { status: 500 })
  }
}

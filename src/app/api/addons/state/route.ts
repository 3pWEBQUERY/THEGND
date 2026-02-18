import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session: any = await getServerSession(authOptions as any)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const states = await (prisma as any).userAddonState.findMany({ where: { userId: session.user.id } })
    return NextResponse.json(states)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions as any)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: any = {}
  try { body = await req.json() } catch {}
  const { key, enabled, settings } = body || {}
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })
  // Server-side gating: restrict certain add-ons by user type
  try {
    const userType: string | undefined = session?.user?.userType
    if (key === 'SEO') {
      const allowed = ['ESCORT','AGENCY','CLUB','STUDIO']
      if (!userType || !allowed.includes(userType)) {
        return NextResponse.json({ error: 'Forbidden for this user type' }, { status: 403 })
      }
    }
  } catch {}
  try {
    const s = settings ? JSON.stringify(settings) : null
    const rows = await (prisma as any).$queryRaw<any[]>`
      INSERT INTO "user_addon_states" ("id", "userId", "key", "enabled", "settings", "createdAt", "updatedAt")
      VALUES (
        ('c' || md5(random()::text || clock_timestamp()::text)),
        ${session.user.id},
        CAST(${key} AS "addon_key"),
        ${!!enabled},
        ${s},
        NOW(),
        NOW()
      )
      ON CONFLICT ("userId", "key") DO UPDATE
      SET "enabled" = EXCLUDED."enabled",
          "settings" = EXCLUDED."settings",
          "updatedAt" = NOW()
      RETURNING *;
    `
    const saved = Array.isArray(rows) ? rows[0] : rows
    return NextResponse.json(saved)
  } catch (e) {
    console.error('addons/state POST error (raw upsert):', e)
    const msg = (e as any)?.message || 'Failed to save'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

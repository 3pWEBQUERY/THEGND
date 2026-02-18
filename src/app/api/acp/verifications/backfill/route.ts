import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    // Set profile visibility to VERIFIED where an approved verification exists
    const updated = await prisma.$executeRaw`
      UPDATE "profiles" p
      SET "visibility" = 'VERIFIED'::"ProfileVisibility"
      WHERE EXISTS (
        SELECT 1 FROM "verification_requests" vr
        WHERE vr."userId" = p."userId" AND vr."status"::text = 'APPROVED'
      )
      AND (p."visibility" IS DISTINCT FROM 'VERIFIED'::"ProfileVisibility")
    `

    // Return a summary
    return NextResponse.json({ ok: true, updated })
  } catch (e) {
    console.error('verifications_backfill_error', e)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}

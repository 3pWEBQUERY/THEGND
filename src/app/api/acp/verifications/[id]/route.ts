import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin, session } = await requireAdmin()
  if (!isAdmin) return NextResponse.redirect(new URL('/', req.url))

  const { id } = await params
  const action = new URL(req.url).searchParams.get('action')
  if (!id || !action || !['approve', 'reject'].includes(action)) {
    return NextResponse.redirect(new URL('/acp/verifications', req.url))
  }

  const reviewerId = (session as any)?.user?.id as string | undefined
  const status = action === 'approve' ? 'APPROVED' : 'REJECTED'

  try {
    const hasDelegate = typeof (prisma as any).verificationRequest?.update === 'function'
    if (hasDelegate) {
      const updated = await (prisma as any).verificationRequest.update({
        where: { id },
        data: {
          status,
          reviewedAt: new Date(),
          reviewedById: reviewerId ?? null,
        },
        select: { userId: true, status: true },
      })
      if (updated?.userId && status === 'APPROVED') {
        try { await (prisma as any).profile.update({ where: { userId: updated.userId }, data: { visibility: 'VERIFIED' } }) } catch {}
      }
    } else {
      await prisma.$executeRaw`
        UPDATE "verification_requests"
        SET "status" = CAST(${status} AS "VerificationStatus"),
            "reviewedAt" = now(),
            "reviewedById" = ${reviewerId ?? null}
        WHERE id = ${id}
      `
      if (status === 'APPROVED') {
        const userRows = await prisma.$queryRaw<{ userId: string }[]>`
          SELECT "userId" FROM "verification_requests" WHERE id = ${id}
        `
        const u = userRows?.[0]?.userId
        if (u) {
          await prisma.$executeRaw`
            UPDATE "profiles" SET "visibility" = 'VERIFIED'::"ProfileVisibility" WHERE "userId" = ${u}
          `
        }
      }
    }
  } catch (e) {
    // ignore and still redirect
  }

  return NextResponse.redirect(new URL('/acp/verifications', req.url))
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin, session } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({})) as { action?: 'approve' | 'reject'; note?: string }
  const action = body?.action
  if (!id || !action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'INVALID_ACTION' }, { status: 400 })
  }

  const reviewerId = (session as any)?.user?.id as string | undefined
  const status = action === 'approve' ? 'APPROVED' : 'REJECTED'
  try {
    const hasDelegate = typeof (prisma as any).verificationRequest?.update === 'function'
    if (hasDelegate) {
      const updated = await (prisma as any).verificationRequest.update({
        where: { id },
        data: {
          status,
          reviewedAt: new Date(),
          reviewedById: reviewerId ?? null,
          note: body?.note ?? undefined,
        },
        select: { status: true, userId: true },
      })
      // Also mark profile as VERIFIED on approve
      if (updated?.userId && status === 'APPROVED') {
        try {
          await (prisma as any).profile.update({ where: { userId: updated.userId }, data: { visibility: 'VERIFIED' } })
        } catch {}
      }
      return NextResponse.json({ ok: true, status: updated.status })
    } else {
      // Fallback to raw SQL update when delegate isn't ready yet
      await prisma.$executeRaw`
        UPDATE "verification_requests"
        SET "status" = CAST(${status} AS "VerificationStatus"),
            "reviewedAt" = now(),
            "reviewedById" = ${reviewerId ?? null},
            "note" = ${body?.note ?? null}
        WHERE id = ${id}
      `
      if (status === 'APPROVED') {
        const userRows = await prisma.$queryRaw<{ userId: string }[]>`
          SELECT "userId" FROM "verification_requests" WHERE id = ${id}
        `
        const u = userRows?.[0]?.userId
        if (u) {
          await prisma.$executeRaw`
            UPDATE "profiles" SET "visibility" = 'VERIFIED'::"ProfileVisibility" WHERE "userId" = ${u}
          `
        }
      }
      return NextResponse.json({ ok: true, status })
    }
  } catch (e) {
    console.error('acp_verifications_patch_error', e)
    return NextResponse.json({ error: 'UPDATE_FAILED' }, { status: 500 })
  }
}

import { prisma } from '@/lib/prisma'
import VerificationsTable, { VerificationItem } from '@/components/admin/VerificationsTable'

export const dynamic = 'force-dynamic'

export default async function VerificationsACPPage({ searchParams }: { searchParams: Promise<{ status?: 'PENDING' | 'APPROVED' | 'REJECTED' }> }) {
  const sp = await searchParams
  const status = sp?.status
  const hasDelegate = typeof (prisma as any).verificationRequest?.findMany === 'function'
  let rows: any[] = []
  if (hasDelegate) {
    rows = await (prisma as any).verificationRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { email: true, userType: true } }, reviewedBy: { select: { email: true } } },
    } as any)
  } else {
    // Fallback using raw SQL (temporary until Prisma delegate is hot)
    const where = status ? `WHERE vr.status = '${status}'` : ''
    rows = await (prisma as any).$queryRawUnsafe(
      `SELECT vr.*, u.email AS "userEmail", u.userType AS "userType", r.email AS "reviewerEmail"\n       FROM "verification_requests" vr\n       LEFT JOIN "users" u ON u.id = vr."userId"\n       LEFT JOIN "users" r ON r.id = vr."reviewedById"\n       ${where}\n       ORDER BY vr."createdAt" DESC\n       LIMIT 100`
    )
    // Normalize to match delegate shape
    rows = rows.map((v: any) => ({
      ...v,
      user: { email: v.userEmail, userType: v.userType },
      reviewedBy: v.reviewerEmail ? { email: v.reviewerEmail } : null,
    }))
  }

  const items: VerificationItem[] = rows.map((v: any) => ({
    id: v.id,
    createdAt: new Date(v.createdAt).toISOString(),
    userEmail: v.user?.email ?? null,
    userType: v.user?.userType ?? null,
    firstName: v.firstName,
    lastName: v.lastName,
    birthDate: new Date(v.birthDate).toISOString(),
    status: v.status,
    idPhotoUrl: v.idPhotoUrl,
    selfiePhotoUrl: v.selfiePhotoUrl,
    idVideoUrl: v.idVideoUrl ?? null,
    reviewedAt: v.reviewedAt ? new Date(v.reviewedAt).toISOString() : null,
    reviewedByEmail: v.reviewedBy?.email ?? null,
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-light tracking-widest text-gray-900">Verifizierungen</h1>
      <div className="w-24 h-px bg-pink-500" />
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Keine Anträge gefunden.</p>
      ) : (
        <VerificationsTable items={items} />
      )}
    </div>
  )
}

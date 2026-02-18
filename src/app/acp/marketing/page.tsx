import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import MarketingAssetsGrid from '@/components/admin/MarketingAssetsGrid'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function statusLabel(s: string) {
  if (s === 'APPROVED') return 'Freigegeben'
  if (s === 'REJECTED') return 'Abgelehnt'
  return 'Ausstehend'
}

function statusClass(s: string) {
  if (s === 'APPROVED') return 'bg-green-100 text-green-700'
  if (s === 'REJECTED') return 'bg-red-100 text-red-700'
  return 'bg-amber-100 text-amber-800'
}

function placementLabel(k: string) {
  return k.replace(/_/g, ' ').toLowerCase()
}

function formatCHF(n: number) {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(n)
}

export default async function ACPMarketingPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return null

  const sp = await searchParams
  const status = (sp?.status || 'PENDING').toUpperCase()
  const where = status === 'ALL' ? {} : { status }

  const assets = await (prisma as any).marketingAsset.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      orderItem: {
        include: {
          order: { select: { id: true, userId: true, currency: true, createdAt: true } },
        },
      },
    },
  })

  const tabs = [
    { key: 'PENDING', label: 'Ausstehend' },
    { key: 'APPROVED', label: 'Freigegeben' },
    { key: 'REJECTED', label: 'Abgelehnt' },
    { key: 'ALL', label: 'Alle' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-widest text-gray-900">Marketing · Assets</h1>
          <div className="w-24 h-px bg-pink-500 mt-3" />
        </div>
        <div className="flex items-center gap-2">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/acp/marketing?status=${t.key}`}
              className={`px-3 py-1 text-xs uppercase tracking-widest border ${status === t.key ? 'bg-pink-500 border-pink-500 text-white' : 'border-gray-300 text-gray-700 hover:bg-pink-50'}`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      <MarketingAssetsGrid initialAssets={assets.map((a: any) => ({
        id: a.id,
        url: a.url,
        status: a.status,
        reviewNote: a.reviewNote,
        createdAt: a.createdAt,
        reviewedAt: a.reviewedAt ?? null,
        orderItem: {
          id: a.orderItem.id,
          placementKey: a.orderItem.placementKey,
          durationDays: a.orderItem.durationDays,
          priceCents: a.orderItem.priceCents,
          createdAt: a.orderItem.createdAt,
          order: { id: a.orderItem.order.id },
        },
      }))} statusFilter={status as any} />
    </div>
  )
}

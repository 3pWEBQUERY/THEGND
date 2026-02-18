import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function formatCHF(n: number) {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(n)
}

export default async function MarketingConfirmationPage({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const session = await getServerSession(authOptions as any)
  const userId = (session as any)?.user?.id as string | undefined

  const sp = await searchParams
  const orderId = sp?.orderId
  if (!orderId || !userId) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-light tracking-widest text-gray-900">BUCHUNG BESTÄTIGT</h1>
        <div className="w-24 h-px bg-pink-500 mt-3" />
        <p className="mt-6 text-sm text-gray-600">Keine Bestellnummer gefunden. Gehe zurück zur Übersicht.</p>
        <Link href="/bookings" className="inline-block mt-4 text-pink-600 hover:underline text-sm">Zu meinen Buchungen</Link>
      </div>
    )
  }

  const order = await (prisma as any).marketingOrder.findUnique({
    where: { id: orderId },
    include: { items: { include: { assets: true } } },
  })

  if (!order || order.userId !== userId) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-light tracking-widest text-gray-900">BUCHUNG</h1>
        <div className="w-24 h-px bg-pink-500 mt-3" />
        <p className="mt-6 text-sm text-gray-600">Diese Bestellung konnte nicht gefunden werden.</p>
        <Link href="/bookings" className="inline-block mt-4 text-pink-600 hover:underline text-sm">Zu meinen Buchungen</Link>
      </div>
    )
  }

  const totalCHF = order.totalCents / 100

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-light tracking-widest text-gray-900">BUCHUNG BESTÄTIGT</h1>
      <div className="w-24 h-px bg-pink-500 mt-3" />
      <p className="mt-4 text-sm text-gray-600">Deine Buchung wurde angelegt. Unsere Redaktion prüft deine hochgeladenen Motive und schaltet sie nach Freigabe.</p>

      <div className="mt-6 text-sm text-gray-700">Bestellnummer: <span className="font-medium">{order.id}</span></div>

      <div className="mt-6 border border-gray-200">
        <div className="px-4 py-3 bg-gray-50 text-xs uppercase tracking-widest text-gray-600">Übersicht</div>
        <div className="divide-y">
          {order.items.map((it: any) => (
            <div key={it.id} className="px-4 py-4 text-sm flex items-start justify-between gap-4">
              <div>
                <div className="font-medium text-gray-900">{it.placementKey.replace(/_/g, ' ')}</div>
                <div className="text-gray-600 text-xs">Dauer: {it.durationDays} Tage</div>
                {it.assets?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {it.assets.map((a: any) => (
                      <div key={a.id} className="border border-gray-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.url} alt="Asset" className="w-24 h-16 object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-gray-900">{formatCHF(it.priceCents / 100)}</div>
                <div className="text-[11px] uppercase tracking-widest text-gray-500">inkl. MwSt</div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-4 text-right">
          <div className="text-sm">Gesamt</div>
          <div className="text-xl font-semibold text-gray-900">{formatCHF(totalCHF)}</div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <Link href="/bookings" className="text-sm text-pink-600 hover:underline">Zu meinen Buchungen</Link>
        <Link href="/marketing" className="text-sm text-gray-700 hover:underline">Weitere Werbung buchen</Link>
      </div>
    </div>
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Pricing table (cents) mirrored from frontend
const PRICE_CENTS: Record<string, Record<number, number>> = {
  home_top: { 7: 11999, 14: 19999, 30: 34999 },
  home_mid: { 7: 9999, 14: 16999, 30: 29999 },
  home_bottom: { 7: 7999, 14: 13999, 30: 24999 },
  home_banner: { 7: 14999, 14: 25999, 30: 44999 },
  home_tile: { 7: 8999, 14: 14999, 30: 25999 },
  results_top: { 7: 11999, 14: 19999, 30: 34999 },
  sidebar: { 7: 6999, 14: 11999, 30: 19999 },
  sponsored_post: { 7: 9999, 14: 16999, 30: 29999 },
}

// Use plain string values for enum; ensure Prisma Client is regenerated after schema changes
const KEY_TO_ENUM: Record<string, any> = {
  home_top: 'HOME_TOP',
  home_mid: 'HOME_MID',
  home_bottom: 'HOME_BOTTOM',
  home_banner: 'HOME_BANNER',
  home_tile: 'HOME_TILE',
  results_top: 'RESULTS_TOP',
  sidebar: 'SIDEBAR',
  sponsored_post: 'SPONSORED_POST',
}

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige JSON-Daten' }, { status: 400 })
  }

  const items: Array<{ key: string; duration: number; assets?: string[]; targetUrl?: string }> = Array.isArray(body?.items) ? body.items : []
  if (items.length === 0) {
    return NextResponse.json({ error: 'Keine Artikel übergeben' }, { status: 400 })
  }

  // Validate
  for (const it of items) {
    if (!PRICE_CENTS[it.key] || !PRICE_CENTS[it.key][it.duration]) {
      return NextResponse.json({ error: `Ungültiges Paket oder Dauer: ${it.key}/${it.duration}` }, { status: 400 })
    }
  }

  // Create order draft
  const order = await (prisma as any).marketingOrder.create({
    data: {
      userId: session.user.id,
      status: 'SUBMITTED',
      currency: 'CHF',
      totalCents: 0,
    },
  })

  let total = 0

  for (const it of items) {
    const price = PRICE_CENTS[it.key][it.duration]
    total += price

    const orderItem = await (prisma as any).marketingOrderItem.create({
      data: {
        orderId: order.id,
        placementKey: KEY_TO_ENUM[it.key],
        durationDays: it.duration,
        priceCents: price,
      },
    })

    const urls = Array.isArray(it.assets) ? it.assets : []
    if (urls.length > 0) {
      await (prisma as any).marketingAsset.createMany({
        data: urls.map((url) => ({ orderItemId: orderItem.id, url, targetUrl: typeof it.targetUrl === 'string' ? it.targetUrl : undefined })),
      })
    }
  }

  await (prisma as any).marketingOrder.update({ where: { id: order.id }, data: { totalCents: total } })

  return NextResponse.json({ orderId: order.id, totalCents: total, currency: 'CHF' }, { status: 201 })
}

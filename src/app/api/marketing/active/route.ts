import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Helper to compute end date based on createdAt + durationDays
function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const placement = (searchParams.get('placement') || 'HOME_BANNER') as any
    const limit = Math.max(1, Math.min(10, Number(searchParams.get('limit') || '1')))
    const includeParam = (searchParams.get('include') || '').toLowerCase()
    const includePending = includeParam.includes('pending')

    const now = new Date()

    // Fetch candidate assets by placement and basic approval state.
    // Time-window filter is applied in JS because it depends on durationDays.
    const assets = await prisma.marketingAsset.findMany({
      where: {
        status: includePending ? { in: ['APPROVED', 'PENDING'] as any } : ('APPROVED' as any),
        orderItem: {
          placementKey: placement,
          // Do not strictly depend on the order status to avoid hiding approved assets
          createdAt: { lte: now },
        },
      },
      include: {
        orderItem: {
          include: { order: true },
        },
      },
      // Prefer most recently reviewed assets first, fallback to createdAt
      orderBy: [
        { reviewedAt: 'desc' as any },
        { createdAt: 'desc' },
      ],
      take: 100,
    })

    // Compute active window using orderItem.createdAt + durationDays
    const active = assets.filter((a) => {
      const start = (a as any).reviewedAt ? new Date((a as any).reviewedAt) : a.orderItem.createdAt
      const end = addDays(start, a.orderItem.durationDays)
      return start <= now && end > now
    })

    // Prefer the most recently approved assets, slice to limit
    const result = active.slice(0, limit).map((a) => ({
      id: a.id,
      url: a.url,
      targetUrl: (a as any).targetUrl ?? null,
      width: a.width,
      height: a.height,
      placementKey: a.orderItem.placementKey,
      orderId: a.orderItem.orderId,
      userId: a.orderItem.order.userId,
      startsAt: (a as any).reviewedAt ? new Date((a as any).reviewedAt) : a.orderItem.createdAt,
      endsAt: addDays(((a as any).reviewedAt ? new Date((a as any).reviewedAt) : a.orderItem.createdAt), a.orderItem.durationDays),
    }))

    return NextResponse.json({ assets: result })
  } catch (err) {
    console.error('GET /api/marketing/active failed:', err)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ assetId: string }> }) {
  const session = (await getServerSession(authOptions as any)) as any
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }
  const { assetId } = await params
  if (!assetId) return NextResponse.json({ error: 'Fehlende Asset-ID' }, { status: 400 })

  let body: any
  try { body = await req.json() } catch { body = {} }
  const url = (body?.url || '').trim()
  if (!url) return NextResponse.json({ error: 'Fehlende URL' }, { status: 400 })

  // Ensure ownership: asset -> orderItem -> order.userId must equal session.user.id
  const asset = await (prisma as any).marketingAsset.findUnique({
    where: { id: assetId },
    include: { orderItem: { include: { order: true } } },
  })
  if (!asset) return NextResponse.json({ error: 'Asset nicht gefunden' }, { status: 404 })
  if (asset.orderItem.order.userId !== session.user.id) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const updated = await (prisma as any).marketingAsset.update({
    where: { id: assetId },
    data: {
      url,
      status: 'PENDING',
      reviewNote: null,
      reviewedAt: null,
    },
  })

  return NextResponse.json({ ok: true, asset: updated })
}

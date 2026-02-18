import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export async function GET(req: Request) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const addonId = searchParams.get('addonId')
  if (!addonId) return NextResponse.json({ error: 'addonId required' }, { status: 400 })
  const options = await prisma.addonOption.findMany({ where: { addonId }, orderBy: { sortOrder: 'asc' } })
  return NextResponse.json(options)
}

export async function POST(req: Request) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json()
  const { id, addonId, durationDays, priceCents, active, sortOrder } = body || {}
  try {
    let result
    if (id) {
      result = await prisma.addonOption.update({
        where: { id },
        data: { durationDays, priceCents, active, sortOrder },
      })
    } else {
      result = await prisma.addonOption.create({
        data: { addonId, durationDays, priceCents, active: active ?? true, sortOrder: sortOrder ?? 0 },
      })
    }
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { id } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await prisma.addonOption.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

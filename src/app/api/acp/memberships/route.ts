import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export async function GET() {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const plans = await prisma.membershipPlan.findMany({ orderBy: { sortOrder: 'asc' } })
  return NextResponse.json(plans)
}

export async function POST(req: Request) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json()
  try {
    const { id, key, name, description, priceCents, active, features, sortOrder } = body || {}
    let result
    if (id) {
      result = await prisma.membershipPlan.update({
        where: { id },
        data: { key, name, description, priceCents, active, features, sortOrder },
      })
    } else {
      result = await prisma.membershipPlan.create({
        data: { key, name, description, priceCents, active: active ?? true, features, sortOrder: sortOrder ?? 0 },
      })
    }
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 400 })
  }
}

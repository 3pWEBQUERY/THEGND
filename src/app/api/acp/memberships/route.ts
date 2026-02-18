import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export async function GET(req: Request) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const userType = searchParams.get('userType')

  const where: any = {}
  if (userType) where.userType = userType

  const plans = await prisma.membershipPlan.findMany({ where, orderBy: [{ userType: 'asc' }, { sortOrder: 'asc' }] })
  return NextResponse.json(plans)
}

export async function POST(req: Request) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json()
  try {
    const { id, key, name, description, priceCents, active, features, sortOrder, userType } = body || {}
    let result
    if (id) {
      result = await prisma.membershipPlan.update({
        where: { id },
        data: { key, name, description, priceCents, active, features, sortOrder, userType: userType || null },
      })
    } else {
      result = await prisma.membershipPlan.create({
        data: { key, name, description, priceCents, active: active ?? true, features, sortOrder: sortOrder ?? 0, userType: userType || null },
      })
    }
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 400 })
  }
}

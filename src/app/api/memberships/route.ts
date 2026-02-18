import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const plans = await prisma.membershipPlan.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, key: true, name: true, description: true, priceCents: true, features: true }
  })
  return NextResponse.json(plans)
}

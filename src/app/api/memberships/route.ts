import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userType = searchParams.get('userType')

  const where: any = { active: true }
  if (userType) {
    where.userType = userType
  }

  const plans = await prisma.membershipPlan.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    select: { id: true, key: true, name: true, description: true, priceCents: true, features: true, userType: true }
  })
  return NextResponse.json(plans)
}

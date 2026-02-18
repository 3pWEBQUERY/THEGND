import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions as any)
  const userId = (session as any)?.user?.id as string | undefined
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const [memberships, addons] = await Promise.all([
    prisma.userMembership.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    }),
    prisma.userAddonBooking.findMany({
      where: { userId },
      orderBy: { startsAt: 'desc' },
      include: { addonOption: { include: { addon: true } } },
    }),
  ])

  return NextResponse.json({ memberships, addons })
}

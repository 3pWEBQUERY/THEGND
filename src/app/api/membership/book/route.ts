import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any)
  const userId = (session as any)?.user?.id as string | undefined
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const type = body?.type as 'membership' | 'addon' | undefined

  try {
    if (type === 'membership') {
      const planKey = body?.planKey as 'BASIS' | 'PLUS' | 'PREMIUM'
      if (!planKey) return NextResponse.json({ error: 'planKey required' }, { status: 400 })

      // Look up user's userType from DB
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { userType: true } })
      const userType = user?.userType ?? 'MEMBER'

      // Find plan matching key + userType, fall back to plan without userType
      const allPlans = await prisma.membershipPlan.findMany()
      let plan = allPlans.find((p) => String(p.key) === planKey && String(p.userType) === String(userType))
        || allPlans.find((p) => String(p.key) === planKey && !p.userType)
      // If no plan exists yet, create a minimal active plan so booking can proceed
      if (!plan) {
        const newId = randomUUID()
        // Create via raw SQL to avoid Prisma enum type mismatch issues
        await prisma.$executeRawUnsafe(
          'INSERT INTO membership_plans (id, key, name, description, "priceCents", active, features, "sortOrder", "createdAt", "updatedAt") VALUES ($1, $2::membership_plan_key, $3, $4, $5, $6, $7, $8, NOW(), NOW())',
          newId,
          planKey,
          planKey,
          null,
          0,
          true,
          '[]',
          0,
        )
        const refetched = await prisma.membershipPlan.findFirst({ where: { id: newId } })
        if (!refetched) {
          return NextResponse.json({ error: 'plan could not be created' }, { status: 400 })
        }
        plan = refetched
      }

      if (!plan) {
        return NextResponse.json({ error: 'plan not found' }, { status: 404 })
      }

      const created = await prisma.userMembership.create({
        data: {
          userId,
          planId: plan.id,
          status: 'ACTIVE',
          startedAt: new Date(),
        },
        include: { plan: true },
      })
      return NextResponse.json({ ok: true, membership: created })
    }

    if (type === 'addon') {
      const addonKey = body?.addonKey as 'ESCORT_OF_DAY' | 'ESCORT_OF_WEEK' | 'ESCORT_OF_MONTH' | 'CITY_BOOST'
      const durationDays = Number(body?.durationDays)
      if (!addonKey || !durationDays) return NextResponse.json({ error: 'addonKey and durationDays required' }, { status: 400 })

      // Avoid enum filter in where
      let addon = (await prisma.addon.findMany({ where: { active: true }, select: { id: true, key: true } }))
        .find((a) => String(a.key) === addonKey)
      if (!addon) {
        // Create addon via raw SQL to avoid enum mismatch
        const newAddonId = randomUUID()
        await prisma.$executeRawUnsafe(
          'INSERT INTO addons (id, key, name, description, active, "sortOrder", "createdAt", "updatedAt") VALUES ($1, $2::addon_key, $3, $4, $5, $6, NOW(), NOW())',
          newAddonId,
          addonKey,
          addonKey,
          null,
          true,
          0,
        )
        const refetchedAddon = await prisma.addon.findFirst({ where: { id: newAddonId }, select: { id: true, key: true } })
        if (!refetchedAddon) {
          return NextResponse.json({ error: 'addon could not be created' }, { status: 400 })
        }
        addon = refetchedAddon
      }

      let option = await prisma.addonOption.findFirst({
        where: { addonId: addon.id, durationDays, active: true },
        select: { id: true, durationDays: true, priceCents: true },
      })
      if (!option) {
        // Create a default option with 0 price to allow booking to proceed
        option = await prisma.addonOption.create({
          data: {
            addonId: addon.id,
            durationDays,
            priceCents: 0,
            active: true,
            sortOrder: 0,
          },
          select: { id: true, durationDays: true, priceCents: true },
        })
      }

      const now = new Date()
      const created = await prisma.userAddonBooking.create({
        data: {
          userId,
          addonOptionId: option.id,
          status: 'ACTIVE',
          startsAt: now,
          endsAt: addDays(now, option.durationDays),
          note: typeof option.priceCents === 'number' ? `Preis: ${option.priceCents}` : undefined,
        },
      })
      return NextResponse.json({ ok: true, booking: created })
    }

    return NextResponse.json({ error: 'invalid type' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 400 })
  }
}

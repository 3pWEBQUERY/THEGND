import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json()
    const perkId = String(body?.perkId || '')
    if (!perkId) {
      return NextResponse.json({ error: 'perkId fehlt' }, { status: 400 })
    }

    const userId = session.user.id

    // Ensure user has unlocked the perk
    const userPerk = await (prisma as any).userPerk.findFirst({
      where: { userId, perkId },
      include: { perk: true },
    })
    if (!userPerk) {
      return NextResponse.json({ error: 'Vorteil nicht freigeschaltet' }, { status: 400 })
    }

    if (userPerk.claimedAt) {
      return NextResponse.json({ message: 'Bereits eingelöst' }, { status: 200 })
    }

    // Perform perk-specific side effects (best-effort)
    const key = userPerk.perk?.key as string | undefined
    if (key === 'MONTH_MEMBERSHIP_1M') {
      try {
        const now = new Date()
        const plusPlan = await (prisma as any).membershipPlan.findFirst({ where: { key: 'PLUS' } })
        const basisPlan = await (prisma as any).membershipPlan.findFirst({ where: { key: 'BASIS' } })
        const plan = plusPlan || basisPlan || await (prisma as any).membershipPlan.findFirst({ where: { active: true }, orderBy: { sortOrder: 'asc' } })
        if (plan) {
          const activeMembership = await (prisma as any).userMembership.findFirst({ where: { userId, status: 'ACTIVE' } })
          if (!activeMembership) {
            const endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            await (prisma as any).userMembership.create({
              data: {
                userId,
                planId: plan.id,
                status: 'ACTIVE',
                startedAt: now,
                endedAt: endsAt,
                note: 'Reward: MONTH_MEMBERSHIP_1M',
              },
            })
          }
        }
      } catch {}
    }
    if (key === 'VIP_BADGE_30D') {
      try {
        const vip = await (prisma as any).badge.findUnique({ where: { key: 'VIP_BADGE' } })
        if (vip) {
          const has = await (prisma as any).userBadge.findFirst({ where: { userId, badgeId: vip.id } })
          if (!has) {
            await (prisma as any).userBadge.create({ data: { userId, badgeId: vip.id } })
          }
        }
      } catch {}
    }
    if (key === 'MARKETING_HOME_TILE_7D') {
      try {
        const now = new Date()
        const ends = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        // Create a zero-priced active marketing order and item for HOME_TILE
        const order = await (prisma as any).marketingOrder.create({
          data: {
            userId,
            status: 'ACTIVE',
            totalCents: 0,
            note: 'Reward: MARKETING_HOME_TILE_7D',
            items: {
              create: [{ placementKey: 'HOME_TILE', durationDays: 7, priceCents: 0 }],
            },
          },
          include: { items: true },
        })
        // Optionally could create a default asset later via UI; we just ensure the placement booking exists.
      } catch {}
    }

    await (prisma as any).userPerk.update({
      where: { id: userPerk.id },
      data: { claimedAt: new Date() },
    })

    return NextResponse.json({ message: 'Erfolgreich eingelöst' }, { status: 200 })
  } catch (error) {
    console.error('Gamification claim error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

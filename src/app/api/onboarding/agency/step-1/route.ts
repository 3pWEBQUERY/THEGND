import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { businessOnboardingStep1Schema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.userType !== 'AGENCY') {
      return NextResponse.json({ error: 'Nur Agenturen können dieses Onboarding verwenden' }, { status: 403 })
    }

    const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })

    let openingHours: any = undefined
    try {
      const oh = (profile as any)?.openingHours
      openingHours = oh ? JSON.parse(oh) : undefined
    } catch {}
    return NextResponse.json({
      companyName: profile?.companyName || '',
      businessType: profile?.businessType || '',
      openingHours: openingHours || undefined,
    })
  } catch (error) {
    console.error('Agency step 1 onboarding GET error:', error)
    return NextResponse.json({ error: 'Server Fehler beim Onboarding' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.userType !== 'AGENCY') {
      return NextResponse.json({ error: 'Nur Agenturen können dieses Onboarding verwenden' }, { status: 403 })
    }

    const body = await request.json()
    const validated = businessOnboardingStep1Schema.parse(body)

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        companyName: validated.companyName,
        businessType: validated.businessType,
        openingHours: validated.openingHours ? JSON.stringify(validated.openingHours) : undefined,
      } as any,
      create: {
        userId: session.user.id,
        companyName: validated.companyName,
        businessType: validated.businessType,
        openingHours: validated.openingHours ? JSON.stringify(validated.openingHours) : undefined,
      } as any,
    })

    await prisma.user.updateMany({
      where: { id: session.user.id, onboardingStatus: 'NOT_STARTED' },
      data: { onboardingStatus: 'IN_PROGRESS' },
    })

    return NextResponse.json({ message: 'Schritt 1 gespeichert', profile }, { status: 200 })
  } catch (error) {
    console.error('Agency step 1 onboarding error:', error)
    return NextResponse.json({ error: 'Server Fehler beim Onboarding' }, { status: 500 })
  }
}


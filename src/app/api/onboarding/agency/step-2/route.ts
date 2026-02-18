import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { businessOnboardingStep3Schema } from '@/lib/validations'

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

    return NextResponse.json({
      description: profile?.description || '',
    })
  } catch (error) {
    console.error('Agency step 2 onboarding GET error:', error)
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
    const validated = businessOnboardingStep3Schema.parse(body)

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        description: validated.description,
      },
      create: {
        userId: session.user.id,
        description: validated.description,
      },
    })

    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingStatus: 'IN_PROGRESS' },
    })

    return NextResponse.json({ message: 'Schritt 2 gespeichert', profile }, { status: 200 })
  } catch (error) {
    console.error('Agency step 2 onboarding error:', error)
    return NextResponse.json({ error: 'Server Fehler beim Onboarding' }, { status: 500 })
  }
}


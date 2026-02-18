import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { escortOnboardingStep5Schema } from '@/lib/validations'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.userType !== 'ESCORT') {
      return NextResponse.json(
        { error: 'Nur Escorts können dieses Onboarding verwenden' },
        { status: 403 }
      )
    }

    const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })

    let services: string[] = []
    if (profile?.services) {
      try { services = JSON.parse(profile.services) } catch { services = [] }
    }

    return NextResponse.json({ services }, { status: 200 })
  } catch (error) {
    console.error('Escort step 5 GET error:', error)
    return NextResponse.json(
      { error: 'Server Fehler beim Laden' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Check if user is an escort
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.userType !== 'ESCORT') {
      return NextResponse.json(
        { error: 'Nur Escorts können dieses Onboarding verwenden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = escortOnboardingStep5Schema.parse(body)

    const existingProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    })

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        services: JSON.stringify(validated.services)
      },
      create: {
        userId: session.user.id,
        services: JSON.stringify(validated.services)
      }
    })

    // Update onboarding status
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingStatus: 'IN_PROGRESS' }
    })

    return NextResponse.json(
      {
        message: 'Schritt 5 erfolgreich gespeichert',
        profile
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Escort step 5 onboarding error:', error)
    return NextResponse.json(
      { error: 'Server Fehler beim Onboarding' },
      { status: 500 }
    )
  }
}

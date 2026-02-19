import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { escortOnboardingStep3Schema } from '@/lib/validations'

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

    return NextResponse.json(
      { description: profile?.description ?? '' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Escort step 3 GET error:', error)
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
    const validated = escortOnboardingStep3Schema.parse(body)

    // Create or update profile with step 3 data (description + optional services)
    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        description: validated.description,
        services: validated.services ? JSON.stringify(validated.services) : undefined
      },
      create: {
        userId: session.user.id,
        description: validated.description,
        services: validated.services ? JSON.stringify(validated.services) : undefined
      }
    })

    // Only set IN_PROGRESS for fresh users (don't overwrite SKIPPED/COMPLETED)
    await prisma.user.updateMany({
      where: { id: session.user.id, onboardingStatus: 'NOT_STARTED' },
      data: { onboardingStatus: 'IN_PROGRESS' }
    })

    return NextResponse.json(
      {
        message: 'Schritt 3 erfolgreich gespeichert',
        profile
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Escort step 3 onboarding error:', error)
    return NextResponse.json(
      { error: 'Server Fehler beim Onboarding' },
      { status: 500 }
    )
  }
}

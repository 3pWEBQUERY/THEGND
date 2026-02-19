import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { escortOnboardingStep1Schema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Check if user is an escort (select minimal fields to avoid schema drift issues)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, userType: true }
    })

    if (!user || user.userType !== 'ESCORT') {
      return NextResponse.json(
        { error: 'Nur Escorts können dieses Onboarding verwenden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = escortOnboardingStep1Schema.parse(body)

    // Create or update profile with step 1 data
    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        displayName: validatedData.displayName,
        slogan: validatedData.slogan,
        age: validatedData.age,
        gender: validatedData.gender,
        nationality: JSON.stringify(validatedData.nationality),
        languages: JSON.stringify(validatedData.languages)
      },
      create: {
        userId: session.user.id,
        displayName: validatedData.displayName,
        slogan: validatedData.slogan,
        age: validatedData.age,
        gender: validatedData.gender,
        nationality: JSON.stringify(validatedData.nationality),
        languages: JSON.stringify(validatedData.languages)
      }
    })

    // Only set IN_PROGRESS for fresh users (don't overwrite SKIPPED/COMPLETED)
    await prisma.user.updateMany({
      where: { id: session.user.id, onboardingStatus: 'NOT_STARTED' },
      data: { onboardingStatus: 'IN_PROGRESS' }
    })

    return NextResponse.json(
      { 
        message: 'Schritt 1 erfolgreich gespeichert',
        profile 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Escort step 1 onboarding error:', error)
    return NextResponse.json(
      { error: 'Server Fehler beim Onboarding' },
      { status: 500 }
    )
  }
}

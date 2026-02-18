import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { memberOnboardingSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Check if user is a member
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.userType !== 'MEMBER') {
      return NextResponse.json(
        { error: 'Nur Mitglieder können dieses Onboarding verwenden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = memberOnboardingSchema.parse(body)

    // Create or update profile
    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        displayName: validatedData.displayName,
        age: validatedData.age,
        gender: validatedData.gender,
        location: validatedData.location,
        bio: validatedData.bio,
        preferences: validatedData.preferences
      },
      create: {
        userId: session.user.id,
        displayName: validatedData.displayName,
        age: validatedData.age,
        gender: validatedData.gender,
        location: validatedData.location,
        bio: validatedData.bio,
        preferences: validatedData.preferences
      }
    })

    // Update user's onboarding status
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingStatus: 'COMPLETED' }
    })

    return NextResponse.json(
      { 
        message: 'Mitglied-Profil erfolgreich erstellt',
        profile 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Member onboarding error:', error)
    return NextResponse.json(
      { error: 'Server Fehler beim Onboarding' },
      { status: 500 }
    )
  }
}

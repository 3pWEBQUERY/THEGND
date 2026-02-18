import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { escortOnboardingStep2Schema } from '@/lib/validations'

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

    let piercings: string[] = []
    let tattoos: string[] = []

    if ((profile as any)?.piercings) {
      try { piercings = JSON.parse((profile as any).piercings) } catch { piercings = [] }
    }
    if ((profile as any)?.tattoos) {
      try { tattoos = JSON.parse((profile as any).tattoos) } catch { tattoos = [] }
    }

    return NextResponse.json(
      {
        height: profile?.height ?? null,
        weight: profile?.weight ?? null,
        bodyType: profile?.bodyType ?? null,
        hairColor: profile?.hairColor ?? null,
        hairLength: (profile as any)?.hairLength ?? null,
        breastType: (profile as any)?.breastType ?? null,
        breastSize: (profile as any)?.breastSize ?? null,
        intimateArea: (profile as any)?.intimateArea ?? null,
        piercings,
        tattoos,
        clothingStyle: (profile as any)?.clothingStyle ?? null,
        clothingSize: (profile as any)?.clothingSize ?? null,
        shoeSize: (profile as any)?.shoeSize ?? null,
        eyeColor: profile?.eyeColor ?? null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Escort step 2 GET error:', error)
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
    const validatedData = escortOnboardingStep2Schema.parse(body)

    // Read existing profile to merge preferences
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    })

    let existingPreferences: any = {}
    if (existingProfile?.preferences) {
      try {
        existingPreferences = JSON.parse(existingProfile.preferences)
      } catch {
        existingPreferences = {}
      }
    }

    const escortAppearance = {
      hairLength: validatedData.hairLength ?? null,
      breastType: validatedData.breastType ?? null,
      breastSize: validatedData.breastSize ?? null,
      intimateArea: validatedData.intimateArea ?? null,
      piercings: validatedData.piercings ?? [],
      tattoos: validatedData.tattoos ?? [],
      clothingStyle: validatedData.clothingStyle ?? null,
      clothingSize: validatedData.clothingSize ?? null,
      shoeSize: validatedData.shoeSize ?? null,
    }

    const mergedPreferences = {
      ...existingPreferences,
      escortAppearance
    }

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        height: validatedData.height ?? existingProfile?.height ?? null,
        weight: validatedData.weight ?? existingProfile?.weight ?? null,
        bodyType: validatedData.bodyType ?? existingProfile?.bodyType ?? null,
        hairColor: validatedData.hairColor ?? existingProfile?.hairColor ?? null,
        eyeColor: validatedData.eyeColor ?? existingProfile?.eyeColor ?? null,
        // extended appearance fields (step-2)
        hairLength: validatedData.hairLength ?? (existingProfile as any)?.hairLength ?? null,
        breastType: validatedData.breastType ?? (existingProfile as any)?.breastType ?? null,
        breastSize: validatedData.breastSize ?? (existingProfile as any)?.breastSize ?? null,
        intimateArea: validatedData.intimateArea ?? (existingProfile as any)?.intimateArea ?? null,
        clothingStyle: validatedData.clothingStyle ?? (existingProfile as any)?.clothingStyle ?? null,
        clothingSize: validatedData.clothingSize ?? (existingProfile as any)?.clothingSize ?? null,
        shoeSize: validatedData.shoeSize ?? (existingProfile as any)?.shoeSize ?? null,
        piercings: validatedData.piercings
          ? JSON.stringify(validatedData.piercings)
          : (existingProfile as any)?.piercings ?? null,
        tattoos: validatedData.tattoos
          ? JSON.stringify(validatedData.tattoos)
          : (existingProfile as any)?.tattoos ?? null,
        // keep legacy preferences for compatibility
        preferences: JSON.stringify(mergedPreferences)
      },
      create: {
        userId: session.user.id,
        height: validatedData.height ?? null,
        weight: validatedData.weight ?? null,
        bodyType: validatedData.bodyType ?? null,
        hairColor: validatedData.hairColor ?? null,
        eyeColor: validatedData.eyeColor ?? null,
        // extended appearance fields (step-2)
        hairLength: validatedData.hairLength ?? null,
        breastType: validatedData.breastType ?? null,
        breastSize: validatedData.breastSize ?? null,
        intimateArea: validatedData.intimateArea ?? null,
        clothingStyle: validatedData.clothingStyle ?? null,
        clothingSize: validatedData.clothingSize ?? null,
        shoeSize: validatedData.shoeSize ?? null,
        piercings: JSON.stringify(validatedData.piercings ?? []),
        tattoos: JSON.stringify(validatedData.tattoos ?? []),
        // keep legacy preferences for compatibility
        preferences: JSON.stringify(mergedPreferences)
      }
    })

    // Update onboarding status
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingStatus: 'IN_PROGRESS' }
    })

    return NextResponse.json(
      {
        message: 'Schritt 2 erfolgreich gespeichert',
        profile
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Escort step 2 onboarding error:', error)
    return NextResponse.json(
      { error: 'Server Fehler beim Onboarding' },
      { status: 500 }
    )
  }
}

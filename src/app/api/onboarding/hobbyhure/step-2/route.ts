import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { escortOnboardingStep2Schema } from '@/lib/validations'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.userType !== 'HOBBYHURE') return NextResponse.json({ error: 'Nur Hobbyhuren können dieses Onboarding verwenden' }, { status: 403 })
    const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })

    let piercings: string[] = []
    let tattoos: string[] = []
    if ((profile as any)?.piercings) { try { piercings = JSON.parse((profile as any).piercings) } catch {} }
    if ((profile as any)?.tattoos) { try { tattoos = JSON.parse((profile as any).tattoos) } catch {} }

    return NextResponse.json({
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
    }, { status: 200 })
  } catch (error) {
    console.error('Hobbyhure step 2 GET error:', error)
    return NextResponse.json({ error: 'Server Fehler beim Laden' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.userType !== 'HOBBYHURE') return NextResponse.json({ error: 'Nur Hobbyhuren können dieses Onboarding verwenden' }, { status: 403 })

    const body = await request.json()
    const validated = escortOnboardingStep2Schema.parse(body)

    const existingProfile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
    let existingPreferences: any = {}
    if (existingProfile?.preferences) { try { existingPreferences = JSON.parse(existingProfile.preferences) } catch {} }

    const escortAppearance = {
      hairLength: validated.hairLength ?? null,
      breastType: validated.breastType ?? null,
      breastSize: validated.breastSize ?? null,
      intimateArea: validated.intimateArea ?? null,
      piercings: validated.piercings ?? [],
      tattoos: validated.tattoos ?? [],
      clothingStyle: validated.clothingStyle ?? null,
      clothingSize: validated.clothingSize ?? null,
      shoeSize: validated.shoeSize ?? null,
    }
    const mergedPreferences = { ...existingPreferences, escortAppearance }

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        height: validated.height ?? existingProfile?.height ?? null,
        weight: validated.weight ?? existingProfile?.weight ?? null,
        bodyType: validated.bodyType ?? existingProfile?.bodyType ?? null,
        hairColor: validated.hairColor ?? existingProfile?.hairColor ?? null,
        eyeColor: validated.eyeColor ?? existingProfile?.eyeColor ?? null,
        hairLength: validated.hairLength ?? (existingProfile as any)?.hairLength ?? null,
        breastType: validated.breastType ?? (existingProfile as any)?.breastType ?? null,
        breastSize: validated.breastSize ?? (existingProfile as any)?.breastSize ?? null,
        intimateArea: validated.intimateArea ?? (existingProfile as any)?.intimateArea ?? null,
        clothingStyle: validated.clothingStyle ?? (existingProfile as any)?.clothingStyle ?? null,
        clothingSize: validated.clothingSize ?? (existingProfile as any)?.clothingSize ?? null,
        shoeSize: validated.shoeSize ?? (existingProfile as any)?.shoeSize ?? null,
        piercings: validated.piercings ? JSON.stringify(validated.piercings) : (existingProfile as any)?.piercings ?? null,
        tattoos: validated.tattoos ? JSON.stringify(validated.tattoos) : (existingProfile as any)?.tattoos ?? null,
        preferences: JSON.stringify(mergedPreferences)
      },
      create: {
        userId: session.user.id,
        height: validated.height ?? null,
        weight: validated.weight ?? null,
        bodyType: validated.bodyType ?? null,
        hairColor: validated.hairColor ?? null,
        eyeColor: validated.eyeColor ?? null,
        hairLength: validated.hairLength ?? null,
        breastType: validated.breastType ?? null,
        breastSize: validated.breastSize ?? null,
        intimateArea: validated.intimateArea ?? null,
        clothingStyle: validated.clothingStyle ?? null,
        clothingSize: validated.clothingSize ?? null,
        shoeSize: validated.shoeSize ?? null,
        piercings: JSON.stringify(validated.piercings ?? []),
        tattoos: JSON.stringify(validated.tattoos ?? []),
        preferences: JSON.stringify(mergedPreferences)
      }
    })

    await prisma.user.updateMany({ where: { id: session.user.id, onboardingStatus: 'NOT_STARTED' }, data: { onboardingStatus: 'IN_PROGRESS' } })

    return NextResponse.json({ message: 'Schritt 2 erfolgreich gespeichert', profile }, { status: 200 })
  } catch (error) {
    console.error('Hobbyhure step 2 onboarding error:', error)
    return NextResponse.json({ error: 'Server Fehler beim Onboarding' }, { status: 500 })
  }
}

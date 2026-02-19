import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { escortOnboardingStep1Schema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Check if user is hobbyhure
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, userType: true } })
    if (!user || user.userType !== 'HOBBYHURE') {
      return NextResponse.json({ error: 'Nur Hobbyhuren können dieses Onboarding verwenden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = escortOnboardingStep1Schema.parse(body)

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

    await prisma.user.updateMany({ where: { id: session.user.id, onboardingStatus: 'NOT_STARTED' }, data: { onboardingStatus: 'IN_PROGRESS' } })

    return NextResponse.json({ message: 'Schritt 1 erfolgreich gespeichert', profile }, { status: 200 })
  } catch (error) {
    console.error('Hobbyhure step 1 onboarding error:', error)
    return NextResponse.json({ error: 'Server Fehler beim Onboarding' }, { status: 500 })
  }
}

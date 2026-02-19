import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { escortOnboardingStep6Schema } from '@/lib/validations'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, userType: true }
    })
    if (!user || user.userType !== 'HOBBYHURE') {
      return NextResponse.json(
        { error: 'Nur Hobbyhuren können dieses Onboarding verwenden' },
        { status: 403 }
      )
    }

    const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
    if (!profile) {
      return NextResponse.json({ phone: '', website: null, socialMedia: null }, { status: 200 })
    }

    let social: Record<string, string> | null = null
    if (profile.socialMedia) {
      try {
        social = JSON.parse(profile.socialMedia) as Record<string, string>
      } catch {
        social = null
      }
    }

    return NextResponse.json(
      {
        phone: profile.phone ?? '',
        website: profile.website ?? null,
        socialMedia: social
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Hobbyhure step 6 GET error:', error)
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, userType: true }
    })

    if (!user || user.userType !== 'HOBBYHURE') {
      return NextResponse.json(
        { error: 'Nur Hobbyhuren können dieses Onboarding verwenden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = escortOnboardingStep6Schema.parse(body)

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        phone: validated.phone,
        website: validated.website ?? null,
        socialMedia: validated.socialMedia ? JSON.stringify(validated.socialMedia) : null
      },
      create: {
        userId: session.user.id,
        phone: validated.phone,
        website: validated.website ?? null,
        socialMedia: validated.socialMedia ? JSON.stringify(validated.socialMedia) : null
      }
    })

    await prisma.user.updateMany({
      where: { id: session.user.id, onboardingStatus: 'NOT_STARTED' },
      data: { onboardingStatus: 'IN_PROGRESS' }
    })

    return NextResponse.json(
      {
        message: 'Schritt 6 erfolgreich gespeichert',
        profile
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Hobbyhure step 6 onboarding error:', error)
    return NextResponse.json(
      { error: 'Server Fehler beim Onboarding' },
      { status: 500 }
    )
  }
}

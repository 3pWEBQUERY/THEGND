import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { businessOnboardingStep5Schema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.userType !== 'CLUB') {
      return NextResponse.json(
        { error: 'Nur Clubs können dieses Onboarding verwenden' },
        { status: 403 }
      )
    }

    const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
    let services: string[] = []
    if (profile?.services) {
      try {
        const parsed = typeof profile.services === 'string' ? JSON.parse(profile.services) : profile.services
        if (Array.isArray(parsed)) {
          services = parsed.filter((v) => typeof v === 'string')
        }
      } catch {
        // ignore invalid JSON, fallback to []
      }
    }

    return NextResponse.json({ services })
  } catch (error) {
    console.error('Club step 5 onboarding GET error:', error)
    return NextResponse.json(
      { error: 'Server Fehler beim Onboarding' },
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

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.userType !== 'CLUB') {
      return NextResponse.json(
        { error: 'Nur Clubs können dieses Onboarding verwenden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = businessOnboardingStep5Schema.parse(body)

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: { services: JSON.stringify(validated.services) },
      create: { userId: session.user.id, services: JSON.stringify(validated.services) }
    })

    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingStatus: 'IN_PROGRESS' }
    })

    return NextResponse.json({ message: 'Schritt 5 erfolgreich gespeichert', profile }, { status: 200 })
  } catch (error) {
    console.error('Club step 5 onboarding error:', error)
    return NextResponse.json(
      { error: 'Server Fehler beim Onboarding' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { businessOnboardingStep2Schema } from '@/lib/validations'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.userType !== 'CLUB') {
      return NextResponse.json({ error: 'Nur Clubs können dieses Onboarding verwenden' }, { status: 403 })
    }

    const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
    return NextResponse.json({
      address: profile?.address ?? '',
      city: profile?.city ?? '',
      country: profile?.country ?? '',
      phone: profile?.phone ?? '',
      email: user.email
    }, { status: 200 })
  } catch (error) {
    console.error('Club step 2 GET error:', error)
    return NextResponse.json({ error: 'Server Fehler beim Laden' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.userType !== 'CLUB') {
      return NextResponse.json({ error: 'Nur Clubs können dieses Onboarding verwenden' }, { status: 403 })
    }

    const body = await request.json()
    const validated = businessOnboardingStep2Schema.parse(body)

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        address: validated.address,
        city: validated.city,
        country: validated.country,
        phone: validated.phone,
      },
      create: {
        userId: session.user.id,
        address: validated.address,
        city: validated.city,
        country: validated.country,
        phone: validated.phone,
      },
    })

    await prisma.user.updateMany({
      where: { id: session.user.id, onboardingStatus: 'NOT_STARTED' },
      data: { onboardingStatus: 'IN_PROGRESS' },
    })

    return NextResponse.json({ message: 'Schritt 2 gespeichert', profile }, { status: 200 })
  } catch (error) {
    console.error('Club step 2 onboarding error:', error)
    return NextResponse.json({ error: 'Server Fehler beim Onboarding' }, { status: 500 })
  }
}

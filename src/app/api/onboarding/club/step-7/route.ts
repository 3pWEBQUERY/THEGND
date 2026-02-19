import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { businessOnboardingStep7Schema } from '@/lib/validations'

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

    let location: any = null
    if (profile?.latitude != null && profile?.longitude != null) {
      location = {
        lat: profile.latitude,
        lng: profile.longitude,
        placeId: profile.locationPlaceId ?? undefined,
        formattedAddress: profile.locationFormatted ?? undefined,
      }
    } else if (profile?.location) {
      try { location = JSON.parse(profile.location) } catch { location = null }
    }

    return NextResponse.json(
      {
        address: profile?.address ?? '',
        city: profile?.city ?? '',
        state: profile?.state ?? '',
        country: profile?.country ?? '',
        zipCode: profile?.zipCode ?? '',
        location,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Club step 7 GET error:', error)
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
    const validated = businessOnboardingStep7Schema.parse(body)

    const loc = validated.location
    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        address: validated.address,
        city: validated.city,
        state: validated.state ?? null,
        country: validated.country,
        zipCode: validated.zipCode ?? null,
        latitude: loc?.lat ?? null,
        longitude: loc?.lng ?? null,
        locationPlaceId: loc?.placeId ?? null,
        locationFormatted: loc?.formattedAddress ?? validated.address ?? null,
        location: loc ? JSON.stringify(loc) : null,
      },
      create: {
        userId: session.user.id,
        address: validated.address,
        city: validated.city,
        state: validated.state ?? null,
        country: validated.country,
        zipCode: validated.zipCode ?? null,
        latitude: loc?.lat ?? null,
        longitude: loc?.lng ?? null,
        locationPlaceId: loc?.placeId ?? null,
        locationFormatted: loc?.formattedAddress ?? validated.address ?? null,
        location: loc ? JSON.stringify(loc) : null,
      },
    })

    await prisma.user.update({ where: { id: session.user.id }, data: { onboardingStatus: 'IN_PROGRESS' } })

    return NextResponse.json({ message: 'Schritt 7 erfolgreich gespeichert', profile }, { status: 200 })
  } catch (error) {
    console.error('Club step 7 POST error:', error)
    return NextResponse.json({ error: 'Server Fehler beim Onboarding' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { businessOnboardingStep1Schema } from '@/lib/validations'

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
    const result: Record<string, string> = {}
    if (typeof profile?.companyName === 'string') result.companyName = profile.companyName
    if (typeof profile?.businessType === 'string') result.businessType = profile.businessType

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Club step 1 GET error:', error)
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
    const validated = businessOnboardingStep1Schema.parse(body)

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        companyName: validated.companyName,
        businessType: validated.businessType,
      },
      create: {
        userId: session.user.id,
        companyName: validated.companyName,
        businessType: validated.businessType,
      },
    })

    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingStatus: 'IN_PROGRESS' },
    })

    return NextResponse.json({ message: 'Schritt 1 gespeichert', profile }, { status: 200 })
  } catch (error) {
    console.error('Club step 1 onboarding error:', error)
    return NextResponse.json({ error: 'Server Fehler beim Onboarding' }, { status: 500 })
  }
}

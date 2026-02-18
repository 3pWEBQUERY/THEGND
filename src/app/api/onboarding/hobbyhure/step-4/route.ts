import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { escortOnboardingStep4Schema } from '@/lib/validations'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.userType !== 'HOBBYHURE') {
      return NextResponse.json({ error: 'Nur Hobbyhuren können dieses Onboarding verwenden' }, { status: 403 })
    }

    const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })

    let gallery: string[] = []
    let media: any[] = []

    if (profile?.gallery) {
      try { gallery = JSON.parse(profile.gallery) } catch { gallery = [] }
    }
    if ((profile as any)?.media) {
      try { media = JSON.parse((profile as any).media) } catch { media = [] }
    }

    return NextResponse.json({ gallery, media }, { status: 200 })
  } catch (error) {
    console.error('Hobbyhure step 4 GET error:', error)
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
    if (!user || user.userType !== 'HOBBYHURE') {
      return NextResponse.json({ error: 'Nur Hobbyhuren können dieses Onboarding verwenden' }, { status: 403 })
    }

    const body = await request.json()
    const result = escortOnboardingStep4Schema.safeParse(body)
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
        code: i.code,
      }))
      return NextResponse.json({ error: 'Validierungsfehler', issues }, { status: 400 })
    }
    const validated = result.data

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        gallery: validated.gallery ? JSON.stringify(validated.gallery) : undefined,
        media: validated.media ? JSON.stringify(validated.media) : undefined,
      },
      create: {
        userId: session.user.id,
        gallery: validated.gallery ? JSON.stringify(validated.gallery) : null,
        media: validated.media ? JSON.stringify(validated.media) : null,
      }
    })

    await prisma.user.update({ where: { id: session.user.id }, data: { onboardingStatus: 'IN_PROGRESS' } })

    return NextResponse.json({ message: 'Schritt 4 erfolgreich gespeichert', profile }, { status: 200 })
  } catch (error) {
    console.error('Hobbyhure step 4 POST error:', error)
    return NextResponse.json({ error: 'Server Fehler beim Onboarding' }, { status: 500 })
  }
}

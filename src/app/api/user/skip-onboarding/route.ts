import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Update user's onboarding status to SKIPPED
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingStatus: 'SKIPPED' }
    })

    return NextResponse.json(
      { message: 'Onboarding erfolgreich übersprungen' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Skip onboarding error:', error)
    return NextResponse.json(
      { error: 'Server Fehler' },
      { status: 500 }
    )
  }
}
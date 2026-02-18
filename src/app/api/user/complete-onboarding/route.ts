import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update user's onboarding status to completed
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingStatus: 'COMPLETED' }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error completing onboarding:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
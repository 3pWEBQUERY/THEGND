import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { storyId } = await params

    // Check if story exists and is not expired
    const story = await prisma.story.findUnique({
      where: { 
        id: storyId,
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (!story) {
      return NextResponse.json({ error: 'Story nicht gefunden oder abgelaufen' }, { status: 404 })
    }

    // Check if user already viewed this story
    const existingView = await prisma.storyView.findUnique({
      where: {
        storyId_userId: {
          storyId,
          userId: session.user.id
        }
      }
    })

    if (existingView) {
      return NextResponse.json({ message: 'Story bereits angesehen' })
    }

    // Create story view
    await prisma.storyView.create({
      data: {
        storyId,
        userId: session.user.id
      }
    })

    return NextResponse.json({ message: 'Story-Ansicht registriert' })
  } catch (error) {
    console.error('Fehler beim Registrieren der Story-Ansicht:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
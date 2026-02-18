import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { messageId } = await params

    // Check if message exists and user is the receiver
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    })

    if (!message) {
      return NextResponse.json({ error: 'Nachricht nicht gefunden' }, { status: 404 })
    }

    if (message.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'Nicht autorisiert, diese Nachricht als gelesen zu markieren' }, { status: 403 })
    }

    // Mark message as read
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true }
    })

    return NextResponse.json(updatedMessage)
  } catch (error) {
    console.error('Fehler beim Markieren der Nachricht als gelesen:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
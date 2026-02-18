import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Update a notification (e.g., mark read/unread)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { isRead } = await request.json()
    if (typeof isRead !== 'boolean') {
      return NextResponse.json({ error: 'Ungültiger Payload' }, { status: 400 })
    }

    const { id } = await params
    const result = await prisma.notification.updateMany({
      where: { id, userId: session.user.id },
      data: { isRead },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Nicht gefunden oder nicht autorisiert' }, { status: 404 })
    }

    // Return the updated record
    const updated = await prisma.notification.findUnique({ where: { id } })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Benachrichtigung:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

// Delete a notification
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Ensure ownership before delete
    const { id } = await params
    const notif = await prisma.notification.findUnique({ where: { id } })
    if (!notif || notif.userId !== session.user.id) {
      return NextResponse.json({ error: 'Nicht gefunden oder nicht autorisiert' }, { status: 404 })
    }

    await prisma.notification.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Fehler beim Löschen der Benachrichtigung:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

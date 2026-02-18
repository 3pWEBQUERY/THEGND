import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { action, message } = body || {}

    const comment = await prisma.comment.findUnique({ where: { id } }) as any
    if (!comment) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

    const requesterId = session.user.id

    if (action === 'hide' || action === 'unhide') {
      // Only target owner can hide/unhide
      if (!comment.targetUserId || comment.targetUserId !== requesterId) {
        return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
      }
      const updated = await prisma.comment.update({
        where: { id },
        data: { isVisible: action === 'unhide', hiddenByOwner: action === 'hide' } as any,
      })
      return NextResponse.json(updated)
    }

    if (action === 'requestDeletion') {
      // Only author can request deletion
      if (comment.authorId !== requesterId) {
        return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
      }
      const updated = await prisma.comment.update({
        where: { id },
        data: { deletionRequested: true, deletionRequestMessage: message ? String(message) : null } as any,
      })
      return NextResponse.json(updated)
    }

    if (action === 'requestEdit') {
      // Only author can request edit
      if (comment.authorId !== requesterId) {
        return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
      }
      const updated = await prisma.comment.update({
        where: { id },
        data: { editRequested: true, editRequestMessage: message ? String(message) : null } as any,
      })
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Ungültige Aktion' }, { status: 400 })
  } catch (e) {
    console.error('Comments PATCH error', e)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}

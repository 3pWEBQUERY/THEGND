import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH - update a comment (author only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ postId: string, commentId: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { postId, commentId } = await params
    const body = await request.json()
    const content = (body?.content || '').trim()
    if (!content) {
      return NextResponse.json({ error: 'Inhalt erforderlich' }, { status: 400 })
    }

    const existing = await prisma.comment.findUnique({ where: { id: commentId } })
    if (!existing || existing.postId !== postId) {
      return NextResponse.json({ error: 'Kommentar nicht gefunden' }, { status: 404 })
    }
    if (existing.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: { select: { id: true, email: true, profile: { select: { displayName: true, avatar: true } } } }
      }
    })

    return NextResponse.json({ message: 'Kommentar aktualisiert', comment: updated }, { status: 200 })
  } catch (error) {
    console.error('Update comment error:', error)
    return NextResponse.json({ error: 'Server Fehler beim Aktualisieren des Kommentars' }, { status: 500 })
  }
}

// DELETE - delete a comment (author only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ postId: string, commentId: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { postId, commentId } = await params

    const existing = await prisma.comment.findUnique({ where: { id: commentId } })
    if (!existing || existing.postId !== postId) {
      return NextResponse.json({ error: 'Kommentar nicht gefunden' }, { status: 404 })
    }
    if (existing.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    await prisma.comment.delete({ where: { id: commentId } })

    const commentsCount = await prisma.comment.count({ where: { postId } })

    return NextResponse.json({ message: 'Kommentar gelöscht', commentsCount }, { status: 200 })
  } catch (error) {
    console.error('Delete comment error:', error)
    return NextResponse.json({ error: 'Server Fehler beim Löschen des Kommentars' }, { status: 500 })
  }
}

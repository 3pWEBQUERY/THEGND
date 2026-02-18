import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions as any)
    const userId = (session as any)?.user?.id as string | undefined
    if (!userId) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const content = typeof body?.content === 'string' ? body.content.trim() : ''
    if (!content) return NextResponse.json({ error: 'Inhalt erforderlich' }, { status: 400 })

    const post = await prisma.forumPost.findUnique({ where: { id }, select: { authorId: true, thread: { select: { forum: { select: { isLocked: true } }, isClosed: true } } } })
    if (!post) return NextResponse.json({ error: 'Beitrag nicht gefunden' }, { status: 404 })
    if (post.authorId !== userId) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    if (post.thread.forum.isLocked) return NextResponse.json({ error: 'Forum gesperrt' }, { status: 400 })
    if (post.thread.isClosed) return NextResponse.json({ error: 'Thread geschlossen' }, { status: 400 })

    await prisma.forumPost.update({ where: { id }, data: { content, editedAt: new Date() } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions as any)
    const userId = (session as any)?.user?.id as string | undefined
    if (!userId) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const { id } = await params
    const post = await prisma.forumPost.findUnique({ where: { id }, select: { authorId: true, thread: { select: { forum: { select: { isLocked: true } }, isClosed: true } } } })
    if (!post) return NextResponse.json({ error: 'Beitrag nicht gefunden' }, { status: 404 })
    if (post.authorId !== userId) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    if (post.thread.forum.isLocked) return NextResponse.json({ error: 'Forum gesperrt' }, { status: 400 })
    if (post.thread.isClosed) return NextResponse.json({ error: 'Thread geschlossen' }, { status: 400 })

    await prisma.forumPost.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const session = await getServerSession(authOptions as any)
    const userId = (session as any)?.user?.id as string | undefined
    if (!userId) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const { postId } = await params
    const body = await req.json().catch(() => ({})) as { content?: string; images?: string[] }
    const content = typeof body?.content === 'string' ? body.content.trim() : undefined
    const images = Array.isArray(body?.images) ? body.images.filter((x) => typeof x === 'string') : undefined

    const post: any = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, authorId: true } })
    if (!post) return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { isModerator: true } })
    const allowed = post.authorId === userId || !!user?.isModerator
    if (!allowed) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

    const data: any = {}
    if (typeof content === 'string') data.content = content
    if (images) data.images = JSON.stringify(images)
    if (!Object.keys(data).length) return NextResponse.json({ error: 'Keine Änderungen' }, { status: 400 })

    const updated = await prisma.post.update({
      where: { id: postId },
      data,
      include: {
        author: { select: { id: true, email: true, userType: true, profile: { select: { displayName: true, avatar: true } } } },
        _count: { select: { likes: true, comments: true } }
      }
    })

    return NextResponse.json({
      ok: true,
      post: {
        ...updated,
        images: updated.images ? JSON.parse(updated.images as any) : [],
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const session = await getServerSession(authOptions as any)
    const userId = (session as any)?.user?.id as string | undefined
    if (!userId) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const { postId } = await params
    const post: any = await (prisma as any).post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, groupId: true }
    })
    if (!post) return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })

    // Allow: post author, site moderator, or group admin/owner if in group
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { isModerator: true } })
    let allowed = post.authorId === userId || !!user?.isModerator

    if (!allowed && post.groupId) {
      const group = await (prisma as any).feedGroup.findUnique({ where: { id: post.groupId } })
      if (group) {
        const membership = await (prisma as any).feedGroupMember.findUnique({ where: { groupId_userId: { groupId: group.id, userId } } })
        if (group.ownerId === userId || membership?.role === 'ADMIN') {
          allowed = true
        }
      }
    }

    if (!allowed) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

    await prisma.post.delete({ where: { id: postId } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

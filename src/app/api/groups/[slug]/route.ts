import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getServerSession(authOptions as any)
    const userId = (session as any)?.user?.id as string | undefined
    const { slug } = await params
    const group = await (prisma as any).feedGroup.findUnique({
      where: { slug },
      include: { _count: { select: { members: true, posts: true } } }
    })
    if (!group) return NextResponse.json({ error: 'Gruppe nicht gefunden' }, { status: 404 })
    const membership = userId ? await (prisma as any).feedGroupMember.findUnique({ where: { groupId_userId: { groupId: group.id, userId } } }) : null
    return NextResponse.json({ group, membership })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getServerSession(authOptions as any)
    const userId = (session as any)?.user?.id as string | undefined
    if (!userId) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const { slug } = await params
    const group = await (prisma as any).feedGroup.findUnique({ where: { slug } })
    if (!group) return NextResponse.json({ error: 'Gruppe nicht gefunden' }, { status: 404 })

    // Only owner or ADMIN member can edit
    const isOwner = group.ownerId === userId
    const member = await (prisma as any).feedGroupMember.findUnique({ where: { groupId_userId: { groupId: group.id, userId } } })
    const isAdmin = member?.role === 'ADMIN'
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const data: any = {}
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim()
    if (typeof body.description === 'string') data.description = body.description.trim()
    if (typeof body.privacy === 'string' && ['PUBLIC','PRIVATE'].includes(body.privacy)) data.privacy = body.privacy
    if (typeof body.cover === 'string') data.cover = body.cover.trim() || null

    const updated = await (prisma as any).feedGroup.update({ where: { id: group.id }, data })
    return NextResponse.json({ ok: true, group: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

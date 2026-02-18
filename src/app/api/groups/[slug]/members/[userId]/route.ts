import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Update member role (ADMIN <-> MEMBER)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string; userId: string }> }) {
  try {
    const session = await getServerSession(authOptions as any)
    const currentUserId = (session as any)?.user?.id as string | undefined
    if (!currentUserId) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const { slug, userId } = await params
    const body = await req.json().catch(() => ({}))
    const role = String(body?.role || '').toUpperCase()
    if (!['ADMIN', 'MEMBER'].includes(role)) return NextResponse.json({ error: 'Ungültige Rolle' }, { status: 400 })

    const group = await (prisma as any).feedGroup.findUnique({ where: { slug } })
    if (!group) return NextResponse.json({ error: 'Gruppe nicht gefunden' }, { status: 404 })

    // Only owner or ADMIN may change roles
    const requester = await (prisma as any).feedGroupMember.findUnique({ where: { groupId_userId: { groupId: group.id, userId: currentUserId } } })
    const isOwner = group.ownerId === currentUserId
    const isAdmin = requester?.role === 'ADMIN'
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

    // Prevent removing owner's admin
    const targetMember = await (prisma as any).feedGroupMember.findUnique({ where: { groupId_userId: { groupId: group.id, userId } } })
    if (!targetMember) return NextResponse.json({ error: 'Mitglied nicht gefunden' }, { status: 404 })

    await (prisma as any).feedGroupMember.update({
      where: { groupId_userId: { groupId: group.id, userId } },
      data: { role },
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

// Remove member from group
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string; userId: string }> }) {
  try {
    const session = await getServerSession(authOptions as any)
    const currentUserId = (session as any)?.user?.id as string | undefined
    if (!currentUserId) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const { slug, userId } = await params
    const group = await (prisma as any).feedGroup.findUnique({ where: { slug } })
    if (!group) return NextResponse.json({ error: 'Gruppe nicht gefunden' }, { status: 404 })

    const requester = await (prisma as any).feedGroupMember.findUnique({ where: { groupId_userId: { groupId: group.id, userId: currentUserId } } })
    const isOwner = group.ownerId === currentUserId
    const isAdmin = requester?.role === 'ADMIN'
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

    // Owner cannot be removed
    if (userId === group.ownerId) return NextResponse.json({ error: 'Besitzer kann nicht entfernt werden' }, { status: 400 })

    await (prisma as any).feedGroupMember.delete({ where: { groupId_userId: { groupId: group.id, userId } } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

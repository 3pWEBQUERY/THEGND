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
    if (!userId) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const { slug } = await params
    const group = await (prisma as any).feedGroup.findUnique({ where: { slug } })
    if (!group) return NextResponse.json({ error: 'Gruppe nicht gefunden' }, { status: 404 })

    // Only admins/owner may list for admin UI; but allow members to view list
    const member = await (prisma as any).feedGroupMember.findUnique({ where: { groupId_userId: { groupId: group.id, userId } } })
    if (!member) return NextResponse.json({ error: 'Nur Mitglieder' }, { status: 403 })

    const members = await (prisma as any).feedGroupMember.findMany({
      where: { groupId: group.id },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, email: true, profile: { select: { displayName: true, avatar: true } } } } }
    })

    return NextResponse.json({ members })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getServerSession(authOptions as any)
    const currentUserId = (session as any)?.user?.id as string | undefined
    if (!currentUserId) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const { slug } = await params
    const body = await req.json().catch(() => ({}))
    const targetUserId = String(body?.userId || '').trim()
    const role = String(body?.role || 'MEMBER').toUpperCase()
    if (!targetUserId) return NextResponse.json({ error: 'userId erforderlich' }, { status: 400 })
    if (!['ADMIN','MEMBER'].includes(role)) return NextResponse.json({ error: 'Ungültige Rolle' }, { status: 400 })

    const group = await (prisma as any).feedGroup.findUnique({ where: { slug } })
    if (!group) return NextResponse.json({ error: 'Gruppe nicht gefunden' }, { status: 404 })

    const requester = await (prisma as any).feedGroupMember.findUnique({ where: { groupId_userId: { groupId: group.id, userId: currentUserId } } })
    const isOwner = group.ownerId === currentUserId
    const isAdmin = requester?.role === 'ADMIN'
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

    const exists = await (prisma as any).feedGroupMember.findUnique({ where: { groupId_userId: { groupId: group.id, userId: targetUserId } } })
    if (exists) return NextResponse.json({ error: 'Benutzer ist bereits Mitglied' }, { status: 400 })

    await (prisma as any).feedGroupMember.create({ data: { groupId: group.id, userId: targetUserId, role } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

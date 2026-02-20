import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isModerator, isOwner, logModAction } from '@/lib/community'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** PATCH /api/communities/[slug]/members/[userId] — Change role */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string; userId: string }> }) {
  try {
    const currentUserId = await requireAuth()
    const { slug, userId: targetUserId } = await params

    const community = await prisma.community.findUnique({ where: { slug }, select: { id: true } })
    if (!community) return NextResponse.json({ error: 'Community nicht gefunden' }, { status: 404 })

    const isOwnerUser = await isOwner(community.id, currentUserId)
    if (!isOwnerUser) return NextResponse.json({ error: 'Nur der Owner kann Rollen ändern' }, { status: 403 })

    if (currentUserId === targetUserId) return NextResponse.json({ error: 'Du kannst deine eigene Rolle nicht ändern' }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const role = body?.role
    if (!['MODERATOR', 'MEMBER'].includes(role)) return NextResponse.json({ error: 'Ungültige Rolle' }, { status: 400 })

    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId: targetUserId } },
    })
    if (!member) return NextResponse.json({ error: 'Benutzer ist kein Mitglied' }, { status: 404 })

    await prisma.communityMember.update({
      where: { id: member.id },
      data: { role: role as any },
    })

    await logModAction({
      communityId: community.id,
      moderatorId: currentUserId,
      action: 'CHANGE_ROLE',
      targetUserId,
      metadata: { newRole: role },
    })

    // Notify the user
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'community_role_change',
        title: role === 'MODERATOR' ? 'Moderator-Ernennung' : 'Rollenänderung',
        message: `Deine Rolle wurde geändert zu: ${role}`,
      },
    }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

/** DELETE /api/communities/[slug]/members/[userId] — Remove member */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string; userId: string }> }) {
  try {
    const currentUserId = await requireAuth()
    const { slug, userId: targetUserId } = await params

    const community = await prisma.community.findUnique({ where: { slug }, select: { id: true } })
    if (!community) return NextResponse.json({ error: 'Community nicht gefunden' }, { status: 404 })

    const isMod = await isModerator(community.id, currentUserId)
    if (!isMod) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

    // Cannot remove owner
    const targetMember = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId: targetUserId } },
    })
    if (!targetMember) return NextResponse.json({ error: 'Benutzer ist kein Mitglied' }, { status: 404 })
    if (targetMember.role === 'OWNER') return NextResponse.json({ error: 'Owner kann nicht entfernt werden' }, { status: 400 })

    await prisma.communityMember.delete({ where: { id: targetMember.id } })

    // Update member count
    const count = await prisma.communityMember.count({ where: { communityId: community.id } })
    await prisma.community.update({ where: { id: community.id }, data: { memberCount: count } })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

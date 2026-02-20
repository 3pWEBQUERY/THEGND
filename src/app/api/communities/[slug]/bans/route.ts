import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isModerator, logModAction } from '@/lib/community'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/communities/[slug]/bans — List banned users */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const userId = await requireAuth()
    const { slug } = await params

    const community = await prisma.community.findUnique({ where: { slug }, select: { id: true } })
    if (!community) return NextResponse.json({ error: 'Community nicht gefunden' }, { status: 404 })

    if (!await isModerator(community.id, userId)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const bans = await prisma.communityBan.findMany({
      where: { communityId: community.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, profile: { select: { displayName: true, avatar: true } } } },
        bannedBy: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
      },
    })

    return NextResponse.json({ bans })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

/** POST /api/communities/[slug]/bans — Ban a user */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const currentUserId = await requireAuth()
    const { slug } = await params

    const community = await prisma.community.findUnique({ where: { slug }, select: { id: true } })
    if (!community) return NextResponse.json({ error: 'Community nicht gefunden' }, { status: 404 })

    if (!await isModerator(community.id, currentUserId)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const targetUserId = body?.userId
    if (!targetUserId) return NextResponse.json({ error: 'userId erforderlich' }, { status: 400 })

    // Cannot ban owner or self
    const targetMember = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId: targetUserId } },
    })
    if (targetMember?.role === 'OWNER') return NextResponse.json({ error: 'Owner kann nicht gebannt werden' }, { status: 400 })
    if (targetUserId === currentUserId) return NextResponse.json({ error: 'Du kannst dich nicht selbst bannen' }, { status: 400 })

    const reason = String(body?.reason || '').trim().slice(0, 500)
    const status = body?.status === 'TEMPORARY' ? 'TEMPORARY' : 'PERMANENT'
    const expiresAt = status === 'TEMPORARY' && body?.days ? new Date(Date.now() + parseInt(body.days, 10) * 86400000) : null

    await prisma.communityBan.upsert({
      where: { communityId_userId: { communityId: community.id, userId: targetUserId } },
      update: { reason, status: status as any, expiresAt, bannedById: currentUserId },
      create: {
        communityId: community.id,
        userId: targetUserId,
        bannedById: currentUserId,
        reason,
        status: status as any,
        expiresAt,
      },
    })

    // Remove membership
    await prisma.communityMember.deleteMany({ where: { communityId: community.id, userId: targetUserId } })

    // Update member count
    const count = await prisma.communityMember.count({ where: { communityId: community.id } })
    await prisma.community.update({ where: { id: community.id }, data: { memberCount: count } })

    await logModAction({ communityId: community.id, moderatorId: currentUserId, action: 'BAN_USER', targetUserId, reason })

    // Notify banned user
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'community_ban',
        title: 'Community-Ban',
        message: `Du wurdest aus der Community gebannt. ${reason ? `Grund: ${reason}` : ''}`,
      },
    }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    const s = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: s })
  }
}

/** DELETE /api/communities/[slug]/bans — Unban a user */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const currentUserId = await requireAuth()
    const { slug } = await params

    const community = await prisma.community.findUnique({ where: { slug }, select: { id: true } })
    if (!community) return NextResponse.json({ error: 'Community nicht gefunden' }, { status: 404 })

    if (!await isModerator(community.id, currentUserId)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const targetUserId = searchParams.get('userId')
    if (!targetUserId) return NextResponse.json({ error: 'userId erforderlich' }, { status: 400 })

    await prisma.communityBan.delete({
      where: { communityId_userId: { communityId: community.id, userId: targetUserId } },
    }).catch(() => {})

    await logModAction({ communityId: community.id, moderatorId: currentUserId, action: 'UNBAN_USER', targetUserId })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId, requireAuth, isModerator, isOwner, isGlobalAdmin, logModAction } from '@/lib/community'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/communities/[slug] — Community detail */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const userId = await getSessionUserId()

    const community = await prisma.community.findUnique({
      where: { slug },
      include: {
        _count: { select: { posts: true, members: true } },
        rules: { orderBy: { sortOrder: 'asc' } },
        flairs: { orderBy: { name: 'asc' } },
        creator: { select: { id: true, email: true, profile: { select: { displayName: true, avatar: true } } } },
      },
    })
    if (!community || community.isArchived) {
      return NextResponse.json({ error: 'Community nicht gefunden' }, { status: 404 })
    }

    // Privacy check
    if (community.type === 'PRIVATE') {
      if (!userId) return NextResponse.json({ error: 'Private Community' }, { status: 403 })
      const member = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: community.id, userId } },
      })
      if (!member) return NextResponse.json({ error: 'Private Community' }, { status: 403 })
    }

    // Get membership & mods
    const membership = userId
      ? await prisma.communityMember.findUnique({
          where: { communityId_userId: { communityId: community.id, userId } },
        })
      : null

    const moderators = await prisma.communityMember.findMany({
      where: { communityId: community.id, role: { in: ['OWNER', 'MODERATOR'] } },
      include: { user: { select: { id: true, email: true, profile: { select: { displayName: true, avatar: true } } } } },
    })

    return NextResponse.json({ community, membership, moderators })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

/** PATCH /api/communities/[slug] — Update community settings */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const userId = await requireAuth()
    const { slug } = await params

    const community = await prisma.community.findUnique({ where: { slug } })
    if (!community) return NextResponse.json({ error: 'Community nicht gefunden' }, { status: 404 })

    const canEdit = await isModerator(community.id, userId) || await isGlobalAdmin(userId)
    if (!canEdit) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const data: any = {}
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim().slice(0, 100)
    if (typeof body.description === 'string') data.description = body.description.trim().slice(0, 500)
    if (typeof body.sidebar === 'string') data.sidebar = body.sidebar.slice(0, 5000)
    if (typeof body.icon === 'string') data.icon = body.icon.trim() || null
    if (typeof body.banner === 'string') data.banner = body.banner.trim() || null
    if (typeof body.color === 'string') data.color = body.color.trim().slice(0, 7) || null
    if (['PUBLIC', 'RESTRICTED', 'PRIVATE'].includes(body.type)) data.type = body.type
    if (typeof body.isNSFW === 'boolean') data.isNSFW = body.isNSFW

    const updated = await prisma.community.update({ where: { id: community.id }, data })

    await logModAction({ communityId: community.id, moderatorId: userId, action: 'EDIT_SETTINGS', metadata: data })

    return NextResponse.json({ ok: true, community: updated })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

/** DELETE /api/communities/[slug] — Archive community */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const userId = await requireAuth()
    const { slug } = await params

    const community = await prisma.community.findUnique({ where: { slug } })
    if (!community) return NextResponse.json({ error: 'Community nicht gefunden' }, { status: 404 })

    const canDelete = await isOwner(community.id, userId) || await isGlobalAdmin(userId)
    if (!canDelete) return NextResponse.json({ error: 'Nur der Owner kann die Community archivieren' }, { status: 403 })

    await prisma.community.update({ where: { id: community.id }, data: { isArchived: true } })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

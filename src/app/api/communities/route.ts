import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { slugify, getSessionUserId, requireAuth } from '@/lib/community'
import { awardEvent } from '@/lib/gamification'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/communities — List communities */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    const sort = searchParams.get('sort') || 'popular' // popular, new, name
    const type = searchParams.get('type') || '' // PUBLIC, RESTRICTED, PRIVATE
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))
    const skip = (page - 1) * limit

    const where: any = { isArchived: false }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (type && ['PUBLIC', 'RESTRICTED', 'PRIVATE'].includes(type)) {
      where.type = type
    }

    const orderBy: any =
      sort === 'new' ? { createdAt: 'desc' } :
      sort === 'name' ? { name: 'asc' } :
      { memberCount: 'desc' }

    const [total, communities] = await Promise.all([
      prisma.community.count({ where }),
      prisma.community.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: { select: { posts: true } },
          creator: { select: { id: true, email: true, profile: { select: { displayName: true, avatar: true } } } },
        },
      }),
    ])

    return NextResponse.json({ total, page, limit, communities })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

/** POST /api/communities — Create a community */
export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth()

    const body = await req.json().catch(() => ({}))
    const name = String(body?.name || '').trim()
    if (!name || name.length < 3) return NextResponse.json({ error: 'Name muss mindestens 3 Zeichen haben' }, { status: 400 })
    if (name.length > 100) return NextResponse.json({ error: 'Name darf maximal 100 Zeichen haben' }, { status: 400 })

    const description = typeof body?.description === 'string' ? body.description.trim().slice(0, 500) : null
    const type = ['PUBLIC', 'RESTRICTED', 'PRIVATE'].includes(body?.type) ? body.type : 'PUBLIC'
    const isNSFW = body?.isNSFW === true
    const icon = typeof body?.icon === 'string' && body.icon.trim() ? body.icon.trim() : null
    const banner = typeof body?.banner === 'string' && body.banner.trim() ? body.banner.trim() : null

    // Generate unique slug
    let base = slugify(name)
    if (!base) base = `community-${Date.now()}`
    let slug = base
    let i = 1
    while (await prisma.community.findUnique({ where: { slug } })) {
      slug = `${base}-${i++}`
    }

    // Create community + owner membership in transaction
    const community = await prisma.$transaction(async (tx) => {
      const c = await tx.community.create({
        data: {
          name,
          slug,
          description: description || undefined,
          type: type as any,
          isNSFW,
          icon: icon || undefined,
          banner: banner || undefined,
          creatorId: userId,
          memberCount: 1,
        },
      })
      await tx.communityMember.create({
        data: { communityId: c.id, userId, role: 'OWNER' },
      })
      return c
    })

    // Award gamification points
    try { await awardEvent(userId, 'COMMUNITY_CREATE' as any, 50, { communitySlug: slug }) } catch {}

    return NextResponse.json({ ok: true, community }, { status: 201 })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

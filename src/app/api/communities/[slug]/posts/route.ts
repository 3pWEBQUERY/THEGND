import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, getMembership, isBanned, getSessionUserId, hotScore } from '@/lib/community'
import { awardEvent } from '@/lib/gamification'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/communities/[slug]/posts — List posts in community */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(req.url)
    const sort = searchParams.get('sort') || 'hot' // hot, new, top
    const timeRange = searchParams.get('t') || 'all' // today, week, month, year, all
    const flairId = searchParams.get('flair') || ''
    const cursor = searchParams.get('cursor') || ''
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '25', 10) || 25))
    const userId = await getSessionUserId()

    const community = await prisma.community.findUnique({ where: { slug } })
    if (!community || community.isArchived) return NextResponse.json({ error: 'Community nicht gefunden' }, { status: 404 })

    // Privacy check
    if (community.type === 'PRIVATE') {
      if (!userId) return NextResponse.json({ error: 'Private Community' }, { status: 403 })
      const member = await getMembership(community.id, userId)
      if (!member) return NextResponse.json({ error: 'Private Community' }, { status: 403 })
    }

    const where: any = {
      communityId: community.id,
      isRemoved: false,
      isDeleted: false,
    }

    if (flairId) where.flairId = flairId

    // Time filter for "top" sort
    if (sort === 'top' && timeRange !== 'all') {
      const now = new Date()
      const offsets: Record<string, number> = { today: 1, week: 7, month: 30, year: 365 }
      const days = offsets[timeRange] || 0
      if (days) where.createdAt = { gte: new Date(now.getTime() - days * 86400000) }
    }

    if (cursor) where.id = { lt: cursor }

    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'top') orderBy = [{ score: 'desc' }, { createdAt: 'desc' }]
    if (sort === 'hot') orderBy = [{ score: 'desc' }, { createdAt: 'desc' }]

    const posts = await prisma.communityPost.findMany({
      where,
      orderBy,
      take: limit + 1,
      include: {
        author: { select: { id: true, email: true, profile: { select: { displayName: true, avatar: true } } } },
        flair: true,
        _count: { select: { comments: true } },
        ...(userId ? { votes: { where: { userId }, select: { type: true } } } : {}),
      },
    })

    const hasMore = posts.length > limit
    const items = hasMore ? posts.slice(0, limit) : posts
    const nextCursor = hasMore ? items[items.length - 1].id : null

    // For "hot" sort, re-sort by hot score in memory
    if (sort === 'hot') {
      items.sort((a: any, b: any) => hotScore(b.score, b.createdAt) - hotScore(a.score, a.createdAt))
    }

    return NextResponse.json({ posts: items, nextCursor, community: { id: community.id, name: community.name, slug: community.slug } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

/** POST /api/communities/[slug]/posts — Create a post */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const userId = await requireAuth()
    const { slug } = await params

    const community = await prisma.community.findUnique({ where: { slug } })
    if (!community || community.isArchived) return NextResponse.json({ error: 'Community nicht gefunden' }, { status: 404 })

    // Check membership for RESTRICTED/PRIVATE
    if (community.type !== 'PUBLIC') {
      const member = await getMembership(community.id, userId)
      if (!member) return NextResponse.json({ error: 'Du musst Mitglied sein, um hier zu posten' }, { status: 403 })
    }

    // Check ban
    if (await isBanned(community.id, userId)) {
      return NextResponse.json({ error: 'Du bist in dieser Community gebannt' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const title = String(body?.title || '').trim().slice(0, 300)
    if (!title) return NextResponse.json({ error: 'Titel erforderlich' }, { status: 400 })

    const type = ['TEXT', 'LINK', 'IMAGE', 'POLL', 'VIDEO'].includes(body?.type) ? body.type : 'TEXT'

    const data: any = {
      communityId: community.id,
      authorId: userId,
      title,
      type,
    }

    // Type-specific fields
    if (type === 'TEXT' && body.content) data.content = String(body.content).slice(0, 40000)
    if (type === 'LINK' && body.linkUrl) {
      data.linkUrl = String(body.linkUrl).slice(0, 2000)
      if (body.linkPreviewTitle) data.linkPreviewTitle = String(body.linkPreviewTitle).slice(0, 200)
      if (body.linkPreviewImage) data.linkPreviewImage = String(body.linkPreviewImage).slice(0, 2000)
      if (body.content) data.content = String(body.content).slice(0, 40000)
    }
    if (type === 'IMAGE' && body.images) {
      const imgs = Array.isArray(body.images) ? body.images.slice(0, 10) : []
      data.images = JSON.stringify(imgs)
      if (body.content) data.content = String(body.content).slice(0, 40000)
    }
    if (type === 'VIDEO' && body.videoUrl) {
      data.videoUrl = String(body.videoUrl).slice(0, 2000)
      if (body.content) data.content = String(body.content).slice(0, 40000)
    }
    if (body.flairId) data.flairId = body.flairId

    const post = await prisma.communityPost.create({ data })

    // Create poll options if POLL type
    if (type === 'POLL' && Array.isArray(body.pollOptions) && body.pollOptions.length >= 2) {
      const options = body.pollOptions.slice(0, 6).map((text: string, idx: number) => ({
        postId: post.id,
        text: String(text).trim().slice(0, 200),
        sortOrder: idx,
      }))
      await prisma.pollOption.createMany({ data: options })
    }

    // Auto-upvote own post
    await prisma.vote.create({ data: { userId, postId: post.id, type: 'UP' } })
    await prisma.communityPost.update({ where: { id: post.id }, data: { score: 1 } })

    // Award gamification
    try { await awardEvent(userId, 'COMMUNITY_POST' as any, 15, { communitySlug: slug, postId: post.id }) } catch {}

    return NextResponse.json({ ok: true, post }, { status: 201 })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId, hotScore } from '@/lib/community'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/communities/feed — Aggregated home feed from joined communities */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sort = searchParams.get('sort') || 'hot'
    const timeRange = searchParams.get('t') || 'all'
    const cursor = searchParams.get('cursor') || ''
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '25', 10) || 25))
    const feed = searchParams.get('feed') || 'home' // home, popular, all
    const userId = await getSessionUserId()

    const where: any = { isRemoved: false, isDeleted: false }

    if (feed === 'home' && userId) {
      // Posts from joined communities only
      const memberships = await prisma.communityMember.findMany({
        where: { userId },
        select: { communityId: true },
      })
      const communityIds = memberships.map(m => m.communityId)
      if (communityIds.length === 0) {
        return NextResponse.json({ posts: [], nextCursor: null })
      }
      where.communityId = { in: communityIds }
    } else {
      // Popular / all — public communities only, not archived
      where.community = { type: { in: ['PUBLIC', 'RESTRICTED'] }, isArchived: false }
    }

    if (sort === 'top' && timeRange !== 'all') {
      const days: Record<string, number> = { today: 1, week: 7, month: 30, year: 365 }
      const d = days[timeRange] || 0
      if (d) where.createdAt = { gte: new Date(Date.now() - d * 86400000) }
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
        community: { select: { id: true, name: true, slug: true, icon: true } },
        author: { select: { id: true, email: true, profile: { select: { displayName: true, avatar: true } } } },
        flair: true,
        _count: { select: { comments: true } },
        ...(userId ? { votes: { where: { userId }, select: { type: true } } } : {}),
      },
    })

    const hasMore = posts.length > limit
    const items = hasMore ? posts.slice(0, limit) : posts
    const nextCursor = hasMore ? items[items.length - 1].id : null

    if (sort === 'hot') {
      items.sort((a: any, b: any) => hotScore(b.score, b.createdAt) - hotScore(a.score, a.createdAt))
    }

    return NextResponse.json({ posts: items, nextCursor })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

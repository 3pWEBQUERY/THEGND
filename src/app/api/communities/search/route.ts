import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId } from '@/lib/community'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/communities/search?q=...&type=communities|posts|comments */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    const type = searchParams.get('type') || 'communities'
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20', 10))
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const userId = await getSessionUserId()

    if (!q || q.length < 2) return NextResponse.json({ results: [], total: 0 })

    if (type === 'communities') {
      const where = {
        isArchived: false,
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { description: { contains: q, mode: 'insensitive' as const } },
        ],
      }
      const [total, results] = await Promise.all([
        prisma.community.count({ where }),
        prisma.community.findMany({
          where,
          orderBy: { memberCount: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          select: { id: true, name: true, slug: true, description: true, icon: true, memberCount: true, type: true },
        }),
      ])
      return NextResponse.json({ results, total })
    }

    if (type === 'posts') {
      const where = {
        isRemoved: false,
        isDeleted: false,
        community: { isArchived: false, type: { in: ['PUBLIC' as const, 'RESTRICTED' as const] } },
        OR: [
          { title: { contains: q, mode: 'insensitive' as const } },
          { content: { contains: q, mode: 'insensitive' as const } },
        ],
      }
      const [total, results] = await Promise.all([
        prisma.communityPost.count({ where }),
        prisma.communityPost.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            community: { select: { name: true, slug: true, icon: true } },
            author: { select: { id: true, email: true, profile: { select: { displayName: true, avatar: true } } } },
            _count: { select: { comments: true } },
          },
        }),
      ])
      return NextResponse.json({ results, total })
    }

    if (type === 'comments') {
      const where = {
        isRemoved: false,
        isDeleted: false,
        content: { contains: q, mode: 'insensitive' as const },
        post: { isRemoved: false, isDeleted: false, community: { isArchived: false } },
      }
      const [total, results] = await Promise.all([
        prisma.communityComment.count({ where }),
        prisma.communityComment.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            author: { select: { id: true, email: true, profile: { select: { displayName: true, avatar: true } } } },
            post: { select: { id: true, title: true, community: { select: { name: true, slug: true } } } },
          },
        }),
      ])
      return NextResponse.json({ results, total })
    }

    return NextResponse.json({ results: [], total: 0 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/community'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/communities/saved — List user's saved posts */
export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth()
    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor') || ''
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '25', 10))

    const where: any = { userId }
    if (cursor) where.id = { lt: cursor }

    const saved = await prisma.savedPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        post: {
          include: {
            community: { select: { name: true, slug: true, icon: true } },
            author: { select: { id: true, email: true, profile: { select: { displayName: true, avatar: true } } } },
            flair: true,
            _count: { select: { comments: true } },
          },
        },
      },
    })

    const hasMore = saved.length > limit
    const items = hasMore ? saved.slice(0, limit) : saved
    const nextCursor = hasMore ? items[items.length - 1].id : null

    return NextResponse.json({
      posts: items.map(s => ({ ...s.post, savedAt: s.createdAt })),
      nextCursor,
    })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

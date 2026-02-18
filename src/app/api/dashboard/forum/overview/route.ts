import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    const userId = (session as any)?.user?.id as string | undefined
    if (!userId) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const [threads, posts, subscriptions] = await Promise.all([
      prisma.forumThread.findMany({
        where: { authorId: userId },
        orderBy: [{ createdAt: 'desc' }],
        take: 20,
        include: {
          forum: { select: { slug: true, name: true } },
          _count: { select: { posts: true } },
        },
      }),
      prisma.forumPost.findMany({
        where: { authorId: userId },
        orderBy: [{ createdAt: 'desc' }],
        take: 20,
        include: {
          thread: { select: { id: true, title: true, views: true, _count: { select: { posts: true } }, forum: { select: { slug: true, name: true } } } },
        },
      }),
      prisma.threadSubscription.findMany({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }],
        take: 20,
        include: {
          thread: { select: { id: true, title: true, views: true, lastPostAt: true, _count: { select: { posts: true } }, forum: { select: { slug: true, name: true } } } },
        },
      }),
    ])

    const threadsCount = threads.length
    const postsCount = posts.length
    const threadViewsSum = threads.reduce((sum, t: any) => sum + (t?.views ?? 0), 0)
    const threadRepliesSum = threads.reduce((sum, t: any) => sum + Math.max(0, ((t?._count?.posts ?? 0) - 1)), 0)

    return NextResponse.json({
      threads,
      posts,
      subscriptions,
      totals: {
        threadsCount,
        postsCount,
        threadViewsSum,
        threadRepliesSum,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

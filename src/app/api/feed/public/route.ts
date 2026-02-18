import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    const userId = (session as any)?.user?.id as string | undefined
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '10', 10) || 10))
    const skip = (page - 1) * limit

    const posts = await prisma.post.findMany({
      where: { isActive: true, groupId: null },
      include: {
        author: {
          select: {
            email: true,
            userType: true,
            profile: { select: { displayName: true, avatar: true } }
          }
        },
        ...(userId ? { likes: { where: { userId }, select: { id: true } } } : {}),
        _count: { select: { likes: true, comments: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    const formatted = posts.map((p: any) => ({
      id: p.id,
      content: p.content,
      images: p.images ? JSON.parse(p.images) : [],
      createdAt: p.createdAt,
      _count: p._count,
      isLikedByUser: Array.isArray(p.likes) ? p.likes.length > 0 : false,
      author: {
        email: p.author?.email,
        userType: p.author?.userType,
        profile: { displayName: p.author?.profile?.displayName, avatar: p.author?.profile?.avatar }
      }
    }))

    return NextResponse.json({ posts: formatted }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

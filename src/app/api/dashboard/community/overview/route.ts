import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/community'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/dashboard/community/overview — Dashboard community overview */
export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth()

    const [
      user,
      memberships,
      postCount,
      commentCount,
      recentPosts,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { karma: true } }),
      prisma.communityMember.findMany({
        where: { userId, community: { isArchived: false } },
        include: {
          community: {
            select: { id: true, name: true, slug: true, icon: true, memberCount: true },
          },
        },
      }),
      prisma.communityPost.count({ where: { authorId: userId, isDeleted: false } }),
      prisma.communityComment.count({ where: { authorId: userId, isDeleted: false } }),
      prisma.communityPost.findMany({
        where: { authorId: userId, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          community: { select: { name: true, slug: true } },
          _count: { select: { comments: true } },
        },
      }),
    ])

    // Separate moderated communities
    const moderatedCommunities = memberships
      .filter(m => m.role === 'OWNER' || m.role === 'MODERATOR')
      .map(m => ({ ...m.community, role: m.role }))

    // Get pending reports for moderated communities
    const modCommunityIds = moderatedCommunities.map(c => c.id)
    const pendingReports = modCommunityIds.length
      ? await prisma.communityReport.count({
          where: { communityId: { in: modCommunityIds }, status: 'OPEN' },
        })
      : 0

    return NextResponse.json({
      karma: user?.karma ?? 0,
      postCount,
      commentCount,
      communities: memberships.map(m => ({ ...m.community, role: m.role })),
      moderatedCommunities,
      pendingReports,
      recentPosts,
    })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

import AcpSidebar from '@/components/admin/AcpSidebar'
import CommunitiesAdminClient from './CommunitiesAdminClient'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AcpCommunitiesPage() {
  const session = await getServerSession(authOptions as any)
  const email = (session as any)?.user?.email
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  if (!email || !adminEmails.includes(email.toLowerCase())) redirect('/auth/signin')

  const communities = await (prisma as any).community.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      creator: { select: { id: true, name: true, displayName: true, email: true } },
      _count: { select: { members: true, posts: true } },
    },
    take: 100,
  })

  // Stats
  const totalCommunities = await (prisma as any).community.count()
  const totalPosts = await (prisma as any).communityPost.count()
  const totalComments = await (prisma as any).communityComment.count()
  const openReports = await (prisma as any).communityReport.count({ where: { status: 'OPEN' } })

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AcpSidebar />
      <main className="flex-1 p-4 md:p-6 overflow-x-auto">
        <CommunitiesAdminClient
          communities={communities.map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            type: c.type,
            isArchived: c.isArchived,
            isNSFW: c.isNSFW,
            memberCount: c._count.members,
            postCount: c._count.posts,
            creatorName: c.creator.displayName || c.creator.name || c.creator.email,
            createdAt: c.createdAt.toISOString(),
          }))}
          stats={{ totalCommunities, totalPosts, totalComments, openReports }}
        />
      </main>
    </div>
  )
}

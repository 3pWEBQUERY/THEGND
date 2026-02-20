import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import ModDashboardClient from './ModDashboardClient'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ModDashboardPage({ params }: Props) {
  const { slug } = await params
  const session = await getServerSession(authOptions as any)
  const userId = (session as any)?.user?.id
  if (!userId) redirect(`/auth/signin?callbackUrl=/community/${slug}/mod`)

  const community = await (prisma as any).community.findUnique({
    where: { slug },
    include: {
      rules: { orderBy: { sortOrder: 'asc' } },
      flairs: true,
      _count: { select: { posts: true, members: true } },
    },
  })
  if (!community) notFound()

  const membership = await (prisma as any).communityMember.findUnique({
    where: { communityId_userId: { communityId: community.id, userId } },
  })

  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'MODERATOR')) {
    return (
      <>
        <MinimalistNavigation />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-xl font-thin tracking-wider text-gray-900 mb-4">Zugriff verweigert</h1>
          <p className="text-sm text-gray-500 font-light">
            Nur Moderatoren und Eigentümer haben Zugriff auf diesen Bereich.
          </p>
        </div>
        <Footer />
      </>
    )
  }

  // Get open reports count
  const openReports = await (prisma as any).communityReport.count({
    where: { communityId: community.id, status: 'OPEN' },
  })

  // Recent modlog
  const recentModLog = await (prisma as any).communityModLog.findMany({
    where: { communityId: community.id },
    include: {
      moderator: { select: { id: true, name: true, displayName: true } },
      targetUser: { select: { id: true, name: true, displayName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  // Members
  const members = await (prisma as any).communityMember.findMany({
    where: { communityId: community.id },
    include: {
      user: { select: { id: true, name: true, displayName: true, email: true } },
    },
    orderBy: { joinedAt: 'desc' },
    take: 50,
  })

  // Bans
  const bans = await (prisma as any).communityBan.findMany({
    where: { communityId: community.id },
    include: {
      user: { select: { id: true, name: true, displayName: true } },
      bannedBy: { select: { id: true, name: true, displayName: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Reports
  const reports = await (prisma as any).communityReport.findMany({
    where: { communityId: community.id },
    include: {
      reporter: { select: { id: true, name: true, displayName: true } },
      post: { select: { id: true, title: true } },
      comment: { select: { id: true, content: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <>
      <MinimalistNavigation />
      <ModDashboardClient
        community={{
          id: community.id,
          name: community.name,
          slug: community.slug,
          description: community.description || '',
          sidebar: community.sidebar || '',
          type: community.type,
          isNSFW: community.isNSFW,
          memberCount: community._count.members,
          postCount: community._count.posts,
        }}
        rules={community.rules}
        flairs={community.flairs}
        members={members.map((m: any) => ({
          id: m.id,
          userId: m.user.id,
          name: m.user.displayName || m.user.name || 'Anonym',
          email: m.user.email,
          role: m.role,
          joinedAt: m.joinedAt.toISOString(),
        }))}
        bans={bans.map((b: any) => ({
          id: b.id,
          userId: b.user.id,
          name: b.user.displayName || b.user.name || 'Anonym',
          reason: b.reason,
          status: b.status,
          expiresAt: b.expiresAt?.toISOString() || null,
          bannedByName: b.bannedBy.displayName || b.bannedBy.name || 'Mod',
          createdAt: b.createdAt.toISOString(),
        }))}
        reports={reports.map((r: any) => ({
          id: r.id,
          reason: r.reason,
          status: r.status,
          reporterName: r.reporter.displayName || r.reporter.name || 'Anonym',
          postTitle: r.post?.title || null,
          postId: r.post?.id || null,
          commentContent: r.comment?.content?.slice(0, 100) || null,
          commentId: r.comment?.id || null,
          createdAt: r.createdAt.toISOString(),
        }))}
        modLog={recentModLog.map((l: any) => ({
          id: l.id,
          action: l.action,
          reason: l.reason,
          modName: l.moderator.displayName || l.moderator.name || 'Mod',
          targetName: l.targetUser?.displayName || l.targetUser?.name || null,
          createdAt: l.createdAt.toISOString(),
        }))}
        openReports={openReports}
        isOwner={membership.role === 'OWNER'}
      />
      <Footer />
    </>
  )
}

import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import CommunityHeader from '@/components/community/CommunityHeader'
import CommunitySidebar from '@/components/community/CommunitySidebar'
import PostFeed from '@/components/community/PostFeed'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CommunityDetailPage({ params }: Props) {
  const { slug } = await params
  const session = await getServerSession(authOptions as any)
  const userId = (session as any)?.user?.id

  const community = await (prisma as any).community.findUnique({
    where: { slug },
    include: {
      rules: { orderBy: { sortOrder: 'asc' } },
      flairs: true,
      members: {
        where: {
          OR: [{ role: 'OWNER' }, { role: 'MODERATOR' }],
        },
        include: {
          user: { select: { id: true, email: true, userType: true, profile: { select: { displayName: true, avatar: true } } } },
        },
      },
    },
  })

  if (!community || community.isArchived) notFound()

  // Check membership
  let membership = null
  if (userId) {
    membership = await (prisma as any).communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
    })
  }

  // Private community check
  if (community.type === 'PRIVATE' && !membership) {
    return (
      <>
        <MinimalistNavigation />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-thin tracking-wider text-gray-900 mb-4">
            Private Community
          </h1>
          <p className="text-sm text-gray-500 font-light">
            Diese Community ist privat. Du brauchst eine Einladung um beizutreten.
          </p>
        </div>
        <Footer />
      </>
    )
  }

  const moderators = community.members.filter(
    (m: any) => m.role === 'OWNER' || m.role === 'MODERATOR',
  )

  // Fetch recent members with avatars for sidebar display
  const recentMembers = await (prisma as any).communityMember.findMany({
    where: { communityId: community.id },
    take: 5,
    orderBy: { joinedAt: 'desc' },
    include: {
      user: { select: { id: true, profile: { select: { avatar: true, displayName: true } } } },
    },
  })

  return (
    <>
      <MinimalistNavigation />
      <CommunityHeader
        community={{
          id: community.id,
          name: community.name,
          slug: community.slug,
          description: community.description,
          icon: community.icon,
          banner: community.banner,
          type: community.type,
          memberCount: community.memberCount,
          createdAt: community.createdAt.toISOString(),
          isNSFW: community.isNSFW,
        }}
        membership={membership ? { role: membership.role } : null}
        isAuthenticated={!!userId}
      />

      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          {/* Sidebar – on mobile shown first, on desktop in right column */}
          <div className="order-first lg:order-last">
            <CommunitySidebar
              community={{
                ...community,
                createdAt: community.createdAt.toISOString(),
              }}
              rules={community.rules}
              moderators={moderators}
              recentMembers={recentMembers.map((m: any) => ({
                id: m.user.id,
                avatar: m.user.profile?.avatar || null,
                displayName: m.user.profile?.displayName || null,
              }))}
              isMember={!!membership}
            />
          </div>

          {/* Main feed */}
          <div className="order-last lg:order-first">
            {membership && (
              <Link
                href={`/community/${slug}/submit`}
                className="flex items-center gap-2 border border-gray-200 bg-white p-3 mb-3 hover:border-pink-400 transition-colors"
              >
                <div className="h-8 w-8 bg-gray-100 border border-gray-200 flex items-center justify-center">
                  <Plus className="h-4 w-4 text-gray-400" />
                </div>
                <span className="text-sm text-gray-400 flex-1">Beitrag erstellen...</span>
              </Link>
            )}
            <PostFeed communitySlug={slug} showCommunity={false} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

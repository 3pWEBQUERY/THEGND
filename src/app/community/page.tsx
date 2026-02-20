import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import CommunityHero from '@/components/community/CommunityHero'
import CommunityIndexClient from './CommunityIndexClient'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function CommunityIndexPage() {
  const session = await getServerSession(authOptions as any)
  const userId = (session as any)?.user?.id

  // Top communities
  const topCommunities = await (prisma as any).community.findMany({
    where: { isArchived: false },
    orderBy: { memberCount: 'desc' },
    take: 10,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
      memberCount: true,
      type: true,
    },
  })

  // User's communities
  let myCommunities: any[] = []
  if (userId) {
    const memberships = await (prisma as any).communityMember.findMany({
      where: { userId },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            icon: true,
            memberCount: true,
            type: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
      take: 20,
    })
    myCommunities = memberships.map((m: any) => m.community)
  }

  return (
    <>
      <MinimalistNavigation />
      <CommunityHero />
      <CommunityIndexClient
        topCommunities={topCommunities}
        myCommunities={myCommunities}
        isAuthenticated={!!userId}
      />
      <Footer />
    </>
  )
}

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { type ProfileFeedPost } from '@/components/ProfileFeed'
import GroupFeedClient from '@/components/groups/GroupFeedClient'
import GroupJoinLeaveButton from '@/components/groups/GroupJoinLeaveButton'
import GroupComposer from '@/components/groups/GroupComposer'
import GroupSettingsForm from '@/components/groups/GroupSettingsForm'
import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import GroupHero from '@/components/groups/GroupHero'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function GroupDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions as any)
  const userId = (session as any)?.user?.id as string | undefined
  const { slug } = await params

  const group = await (prisma as any).feedGroup.findUnique({
    where: { slug },
    include: {
      _count: { select: { members: true, posts: true } },
    }
  })
  if (!group) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">Gruppe nicht gefunden.</div>
      </div>
    )
  }

  const membership = userId ? await (prisma as any).feedGroupMember.findUnique({ where: { groupId_userId: { groupId: group.id, userId } } }) : null
  const isMember = !!membership
  const isAdminInGroup = membership?.role === 'ADMIN'
  const canSeePosts = isMember

  const postsRaw = canSeePosts ? await (prisma as any).post.findMany({
    where: { groupId: group.id, isActive: true } as any,
    include: {
      author: { select: { email: true, userType: true, profile: { select: { displayName: true, avatar: true } } } },
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  }) : []

  const posts: ProfileFeedPost[] = postsRaw.map((p: any) => ({
    id: p.id,
    content: p.content,
    images: p.images ? JSON.parse(p.images) : [],
    createdAt: p.createdAt,
    _count: p._count,
    isLikedByUser: false,
    author: {
      email: p.author?.email,
      userType: p.author?.userType,
      profile: { displayName: p.author?.profile?.displayName, avatar: p.author?.profile?.avatar }
    }
  }))

  return (
    <div className="min-h-screen bg-white">
      <MinimalistNavigation />
      <GroupHero title={group.name} subtitle={group.description || undefined} privacy={group.privacy} members={group._count?.members ?? 0} posts={group._count?.posts ?? 0} cover={group.cover || undefined} />
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="border border-gray-200 bg-white p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-light tracking-wider text-gray-900">Über diese Gruppe</h2>
            {group.description && <p className="text-sm text-gray-600 mt-2">{group.description}</p>}
            <div className="text-xs text-gray-500 mt-2">{group._count?.members ?? 0} Mitglieder · {group._count?.posts ?? 0} Beiträge · {group.privacy === 'PRIVATE' ? 'Privat' : 'Öffentlich'}</div>
          </div>
          <div className="shrink-0">
            <GroupJoinLeaveButton slug={group.slug} isMember={!!isMember} />
          </div>
        </div>
      </div>

      {canSeePosts ? (
        <>
          {userId && (
            <GroupComposer groupId={group.id} />
          )}
          <GroupFeedClient posts={posts} canAdminDelete={!!isAdminInGroup} />
        </>
      ) : (
        <div className="border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">Diese Gruppe ist privat. Trete der Gruppe bei, um Beiträge zu sehen.</div>
      )}

      {isAdminInGroup && (
        <div className="border border-gray-200 bg-white p-4">
          <h2 className="text-lg font-light tracking-wider text-gray-900 mb-2">GRUPPENEINSTELLUNGEN</h2>
          <GroupSettingsForm group={{ id: group.id, slug: group.slug, name: group.name, description: group.description || '', privacy: group.privacy, cover: group.cover || null }} />
        </div>
      )}
      </div>
      <Footer />
    </div>
  )
}

import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import CommunityHeader from '@/components/community/CommunityHeader'
import PostDetailClient from './PostDetailClient'
import CommunitySidebar from '@/components/community/CommunitySidebar'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface Props {
  params: Promise<{ slug: string; id: string }>
}

export default async function PostDetailPage({ params }: Props) {
  const { slug, id } = await params
  const session = await getServerSession(authOptions as any)
  const userId = (session as any)?.user?.id

  const post = await (prisma as any).communityPost.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, email: true, userType: true, profile: { select: { displayName: true, avatar: true } } },
      },
      community: {
        include: {
          rules: { orderBy: { sortOrder: 'asc' } },
          members: {
            where: { OR: [{ role: 'OWNER' }, { role: 'MODERATOR' }] },
            include: { user: { select: { id: true, email: true, userType: true, profile: { select: { displayName: true, avatar: true } } } } },
          },
        },
      },
      flair: true,
      pollOptions: {
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { votes: true } } },
      },
    },
  })

  if (!post || post.community.slug !== slug) notFound()
  if (post.isDeleted || post.isRemoved) notFound()

  // Normalize author from profile-based select
  const normalizeAuthor = (a: any) => ({
    id: a.id,
    displayName: a.profile?.displayName || null,
    avatarUrl: a.profile?.avatar || null,
    userType: a.userType || null,
  })
  post.author = normalizeAuthor(post.author)

  // Get user's vote on post
  let userVote: 'UP' | 'DOWN' | null = null
  let isSaved = false
  let userPollVoteOptionId: string | null = null
  if (userId) {
    const vote = await (prisma as any).vote.findUnique({
      where: { userId_postId: { userId, postId: id } },
    })
    userVote = vote?.type ?? null

    const saved = await (prisma as any).savedPost.findUnique({
      where: { userId_postId: { userId, postId: id } },
    })
    isSaved = !!saved

    if (post.type === 'POLL' && post.pollOptions.length > 0) {
      const pollVote = await (prisma as any).pollVote.findFirst({
        where: { userId, optionId: { in: post.pollOptions.map((o: any) => o.id) } },
      })
      userPollVoteOptionId = pollVote?.optionId ?? null
    }
  }

  // Get comments with user votes
  const comments = await (prisma as any).communityComment.findMany({
    where: { postId: id },
    include: {
      author: {
        select: { id: true, email: true, userType: true, profile: { select: { displayName: true, avatar: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Get user's comment votes
  let commentVotes: Record<string, 'UP' | 'DOWN'> = {}
  if (userId && comments.length > 0) {
    const votes = await (prisma as any).vote.findMany({
      where: { userId, commentId: { in: comments.map((c: any) => c.id) } },
    })
    for (const v of votes) {
      if (v.commentId) commentVotes[v.commentId] = v.type
    }
  }

  // Build comment tree
  const commentMap = new Map<string, any>()
  const rootComments: any[] = []
  for (const c of comments) {
    commentMap.set(c.id, {
      ...c,
      author: normalizeAuthor(c.author),
      createdAt: c.createdAt.toISOString(),
      editedAt: c.editedAt?.toISOString() ?? null,
      userVote: commentVotes[c.id] ?? null,
      children: [],
    })
  }
  for (const c of comments) {
    const node = commentMap.get(c.id)
    if (c.parentId && commentMap.has(c.parentId)) {
      commentMap.get(c.parentId).children.push(node)
    } else {
      rootComments.push(node)
    }
  }
  // Show newest root comments first
  rootComments.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Membership check
  let membership = null
  if (userId) {
    membership = await (prisma as any).communityMember.findUnique({
      where: { communityId_userId: { communityId: post.communityId, userId } },
    })
  }

  const moderators = post.community.members.filter(
    (m: any) => m.role === 'OWNER' || m.role === 'MODERATOR',
  )

  // Fetch recent members with avatars for sidebar display
  const recentMembers = await (prisma as any).communityMember.findMany({
    where: { communityId: post.communityId },
    take: 5,
    orderBy: { joinedAt: 'desc' },
    include: {
      user: { select: { id: true, profile: { select: { avatar: true, displayName: true } } } },
    },
  })

  // Increment view count
  await (prisma as any).communityPost.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  })

  const parsedImages: string[] = (() => {
    if (!post.images) return []
    try { return JSON.parse(post.images) } catch { return [] }
  })()

  const pollTotalVotes = post.pollOptions.reduce(
    (sum: number, o: any) => sum + (o._count?.votes ?? 0),
    0,
  )

  return (
    <>
      <MinimalistNavigation />
      <CommunityHeader
        community={{
          id: post.community.id,
          name: post.community.name,
          slug: post.community.slug,
          description: post.community.description,
          icon: post.community.icon,
          banner: post.community.banner,
          type: post.community.type,
          memberCount: post.community.memberCount,
          createdAt: post.community.createdAt?.toISOString?.() ?? new Date().toISOString(),
          isNSFW: post.community.isNSFW,
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
                ...post.community,
                createdAt: post.community.createdAt?.toISOString?.() ?? new Date().toISOString(),
              }}
              rules={post.community.rules}
              moderators={moderators}
              recentMembers={recentMembers.map((m: any) => ({
                id: m.user.id,
                avatar: m.user.profile?.avatar || null,
                displayName: m.user.profile?.displayName || null,
              }))}
              isMember={!!membership}
            />
          </div>

          <div className="order-last lg:order-first">
          <PostDetailClient
            post={{
              id: post.id,
              title: post.title,
              content: post.content,
              linkUrl: post.linkUrl,
              images: parsedImages,
              videoUrl: post.videoUrl,
              type: post.type,
              score: post.score,
              commentCount: post.commentCount,
              viewCount: post.viewCount,
              isPinned: post.isPinned,
              isLocked: post.isLocked,
              createdAt: post.createdAt.toISOString(),
              userVote,
              isSaved,
              flair: post.flair,
              author: post.author,
              community: {
                slug: post.community.slug,
                name: post.community.name,
                icon: post.community.icon,
              },
              pollOptions: post.pollOptions.map((o: any) => ({
                id: o.id,
                text: o.text,
                _count: o._count,
              })),
              pollTotalVotes,
              userPollVoteOptionId,
            }}
            comments={rootComments}
            isMember={!!membership}
            isAuthenticated={!!userId}
            currentUserId={userId}
          />
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

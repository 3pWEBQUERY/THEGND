import { prisma } from '@/lib/prisma'
import ProfileFeed, { type ProfileFeedPost } from '@/components/ProfileFeed'
import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import FeedHero from '@/components/feed/FeedHero'
import Footer from '@/components/homepage/Footer'
import CreateGroupForm from '@/components/groups/CreateGroupForm'
import GroupJoinLeaveButton from '@/components/groups/GroupJoinLeaveButton'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import PublicFeedClient from '@/components/feed/PublicFeedClient'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function PublicFeedPage() {
  const session = await getServerSession(authOptions as any)
  const userId = (session as any)?.user?.id as string | undefined

  // Load all active posts from all users (global public feed)
  const posts = await prisma.post.findMany({
    where: { isActive: true },
    include: {
      author: {
        select: {
          email: true,
          userType: true,
          profile: { select: { displayName: true, avatar: true } }
        }
      },
      _count: { select: { likes: true, comments: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
  })

  // Sidebar data
  const [myGroups, suggestions] = await Promise.all([
    userId
      ? (prisma as any).feedGroup.findMany({
          where: { members: { some: { userId } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { _count: { select: { members: true, posts: true } } },
        })
      : Promise.resolve([]),
    (prisma as any).feedGroup.findMany({
      where: userId
        ? { privacy: 'PUBLIC', members: { none: { userId } } }
        : { privacy: 'PUBLIC' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { _count: { select: { members: true, posts: true } } },
    }),
  ])

  const mapped: ProfileFeedPost[] = posts.map((p: any) => ({
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
      <FeedHero />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <main className="lg:col-span-8">
            <PublicFeedClient initialPosts={mapped} pageSize={12} />
          </main>
          <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-24 self-start">
            {/* Create Group */}
            <section className="border border-gray-200 bg-white shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-sm font-light tracking-widest text-gray-800">GRUPPE ERSTELLEN</h2>
              </div>
              <div className={userId ? "p-4" : "px-0 pt-0 pb-4"}>
                {userId ? (
                  <CreateGroupForm />
                ) : (
                  <div className="text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/circle.jpg" alt="Anmelden erforderlich" className="w-full h-auto mb-3 object-contain" />
                    <div className="text-sm text-gray-600">
                      Bitte <Link href="/auth/signin" className="underline">anmelden</Link>, um eine Gruppe zu erstellen.
                    </div>
                  </div>
                )}
              </div>
            </section>

            {userId && (
              <>
                {/* My Groups */}
                <section className="border border-gray-200 bg-white shadow-sm">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-sm font-light tracking-widest text-gray-800">MEINE GRUPPEN</h2>
                    <Link href="/groups">
                      <Button variant="outline" className="h-8 rounded-none text-xs uppercase tracking-widest px-3 py-1">
                        ALLE
                      </Button>
                    </Link>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {Array.isArray(myGroups) && myGroups.length > 0 ? (
                      myGroups.map((g: any) => (
                        <div key={g.id} className="p-4 hover:bg-gray-50 flex items-start gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={g.cover || '/1.jpg'} alt="Cover" className="w-12 h-12 object-cover" />
                          <div className="flex-1 min-w-0">
                            <Link href={`/groups/${g.slug}`} className="text-gray-900 font-medium line-clamp-1 block">{g.name}</Link>
                            {g.description && (
                              <div className="text-sm text-gray-600 mt-1 line-clamp-2">{g.description}</div>
                            )}
                            <div className="text-xs text-gray-500 mt-2">{g._count?.members ?? 0} Mitglieder · {g._count?.posts ?? 0} Beiträge</div>
                          </div>
                          <GroupJoinLeaveButton slug={g.slug} isMember={true} isAuthenticated={true} />
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-sm text-gray-600">
                        Du bist noch kein Mitglied einer Gruppe.
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}

            {/* Suggestions */}
            <section className="border border-gray-200 bg-white shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-sm font-light tracking-widest text-gray-800">GRUPPEN-VORSCHLÄGE</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {Array.isArray(suggestions) && suggestions.length > 0 ? (
                  suggestions.map((g: any) => (
                    <div key={g.id} className="p-4 hover:bg-gray-50 flex items-start gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g.cover || '/2.jpg'} alt="Cover" className="w-12 h-12 object-cover" />
                      <div className="flex-1 min-w-0">
                        <Link href={`/groups/${g.slug}`} className="text-gray-900 font-medium line-clamp-1 block">{g.name}</Link>
                        {g.description && (
                          <div className="text-sm text-gray-600 mt-1 line-clamp-2">{g.description}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-2">{g._count?.members ?? 0} Mitglieder · {g._count?.posts ?? 0} Beiträge</div>
                      </div>
                      <GroupJoinLeaveButton slug={g.slug} isMember={false} isAuthenticated={!!userId} />
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-sm text-gray-600">Keine Vorschläge vorhanden.</div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  )
}

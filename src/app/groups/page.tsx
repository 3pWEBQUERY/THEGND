import { prisma } from '@/lib/prisma'
import CreateGroupForm from '@/components/groups/CreateGroupForm'
import GroupJoinLeaveButton from '@/components/groups/GroupJoinLeaveButton'
import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import GroupHero from '@/components/groups/GroupHero'
import Footer from '@/components/homepage/Footer'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function GroupsIndexPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const session = await getServerSession(authOptions as any)
  const userId = (session as any)?.user?.id as string | undefined
  const sp = (await searchParams) || {}
  const q = typeof sp.q === 'string' ? sp.q.trim() : ''
  const page = Math.max(1, parseInt((sp.page as string) || '1', 10) || 1)
  const limit = 20
  const skip = (page - 1) * limit

  const where: any = q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] } : {}

  const [total, groups, myGroups, suggestions] = await Promise.all([
    (prisma as any).feedGroup.count({ where }),
    (prisma as any).feedGroup.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { members: true, posts: true } } }
    }),
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

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const makeHref = (n: number) => {
    const qs = new URLSearchParams()
    if (q) qs.set('q', q)
    if (n > 1) qs.set('page', String(n))
    const query = qs.toString()
    return `/groups${query ? `?${query}` : ''}`
  }

  return (
    <div className="min-h-screen bg-white">
      <MinimalistNavigation />
      <GroupHero title="GRUPPEN" subtitle="Finde und erstelle Communities" privacy={'PUBLIC'} members={total} posts={0} />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main list */}
          <main className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-light tracking-wider text-gray-900">Gruppen</h1>
            </div>

            <form method="get" action="/groups" className="flex gap-3">
              <input name="q" defaultValue={q} className="flex-1 border border-gray-300 px-3 py-2 text-sm" placeholder="Gruppen suchen..." />
              <button className="px-3 py-2 text-sm border border-gray-300 hover:bg-gray-50">Suchen</button>
            </form>

            <div className="grid grid-cols-1 gap-4">
              {groups.map((g: any) => (
                <Link key={g.id} href={`/groups/${g.slug}`} className="block border border-gray-200 bg-white p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.cover || '/2.jpg'} alt="Cover" className="w-14 h-14 object-cover border" />
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-900 font-medium line-clamp-1">{g.name}</div>
                      {g.description && <div className="text-sm text-gray-600 mt-1 line-clamp-2">{g.description}</div>}
                      <div className="text-xs text-gray-500 mt-2">{g._count?.members ?? 0} Mitglieder · {g._count?.posts ?? 0} Beiträge</div>
                    </div>
                  </div>
                </Link>
              ))}
              {groups.length === 0 && (
                <div className="border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">Keine Gruppen gefunden.</div>
              )}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                Seite {page} von {totalPages} · {total} Gruppen
              </div>
              <div className="space-x-2">
                {page > 1 && (
                  <a href={makeHref(page - 1)} className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50">Zurück</a>
                )}
                {page < totalPages && (
                  <a href={makeHref(page + 1)} className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50">Weiter</a>
                )}
              </div>
            </div>
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-24 self-start">
            {/* Create Group */}
            <section className="border border-gray-200 bg-white shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-sm font-light tracking-widest text-gray-800">GRUPPE ERSTELLEN</h2>
              </div>
              <div className="p-4">
                <CreateGroupForm />
              </div>
            </section>

            {/* My Groups */}
            <section className="border border-gray-200 bg-white shadow-sm">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-light tracking-widest text-gray-800">MEINE GRUPPEN</h2>
                <Link href="/groups" className="text-xs uppercase tracking-widest underline">ALLE</Link>
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
                      <GroupJoinLeaveButton slug={g.slug} isMember={true} />
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-sm text-gray-600">
                    {userId ? 'Du bist noch kein Mitglied einer Gruppe.' : 'Melde dich an, um deine Gruppen zu sehen.'}
                  </div>
                )}
              </div>
            </section>

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
                      <GroupJoinLeaveButton slug={g.slug} isMember={false} />
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

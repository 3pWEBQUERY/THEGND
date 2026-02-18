import Link from 'next/link'
import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import NewThreadForm from '@/components/forum/NewThreadForm'
import NewThreadActions from '@/components/forum/NewThreadActions'
import Appear from '@/components/motion/Appear'
import ForumHero from '@/components/homepage/ForumHero'

export const dynamic = 'force-dynamic'

export default async function ForumBySlugPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { slug } = await params
  const forum = await prisma.forum.findUnique({
    where: { slug },
    include: {
      category: true,
    },
  })

  if (!forum || forum.isHidden) {
    return (
      <div className="min-h-screen bg-white">
        <MinimalistNavigation />
        <ForumHero />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="text-2xl font-light tracking-widest text-gray-900">Forum nicht gefunden</h1>
          <div className="mt-4">
            <Link href="/forum" className="text-pink-600 hover:underline">Zurück zur Forenübersicht</Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const sp = (searchParams ? await searchParams : {}) as { [key: string]: string | string[] | undefined }
  const sort = typeof sp.sort === 'string' ? sp.sort : 'latest' // latest | views
  const showNew = typeof sp.new === 'string' && sp.new === '1'
  const page = Math.max(1, parseInt((typeof sp.page === 'string' ? sp.page : '1') || '1', 10))
  const take = 20
  const skip = (page - 1) * take
  const orderBy: Prisma.ForumThreadOrderByWithRelationInput[] =
    sort === 'views'
      ? [{ isPinned: Prisma.SortOrder.desc }, { views: Prisma.SortOrder.desc }, { lastPostAt: Prisma.SortOrder.desc }]
      : [{ isPinned: Prisma.SortOrder.desc }, { createdAt: Prisma.SortOrder.desc }]

  const [total, threads] = await Promise.all([
    prisma.forumThread.count({ where: { forumId: forum.id } }),
    prisma.forumThread.findMany({
      where: { forumId: forum.id },
      orderBy,
      select: { id: true, title: true, isPinned: true, lastPostAt: true, views: true, _count: { select: { posts: true } } },
      take,
      skip,
    }),
  ])
  const totalPages = Math.max(1, Math.ceil(total / take))

  return (
    <div className="min-h-screen bg-white">
      <MinimalistNavigation />
      <ForumHero title={forum.name} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-light tracking-widest text-gray-900">{forum.name}</h1>
            <div className="w-24 h-px bg-pink-500 mt-3" />
            {forum.description && (
              <p className="mt-3 text-sm text-gray-600">{forum.description}</p>
            )}
          </div>
          <NewThreadActions forumSlug={forum.slug} isLocked={forum.isLocked} />
        </div>

        <div className={`mt-8 grid grid-cols-1 ${showNew ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8`}>
          <div className={showNew ? 'lg:col-span-2' : ''}>
            <div className="mb-3 flex items-center justify-between text-sm text-gray-700">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-widest text-gray-500">Sortieren:</span>
                <div className="flex items-center gap-2">
                  <Link
                    href={{ pathname: `/forum/${forum.slug}`, query: { sort: 'latest', page: 1 } }}
                    className={
                      sort === 'latest'
                        ? 'px-3 py-1.5 border border-pink-500 bg-pink-500 text-white hover:bg-pink-600 uppercase tracking-widest text-[11px]'
                        : 'px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 uppercase tracking-widest text-[11px]'
                    }
                  >
                    Neueste
                  </Link>
                  <Link
                    href={{ pathname: `/forum/${forum.slug}`, query: { sort: 'views', page: 1 } }}
                    className={
                      sort === 'views'
                        ? 'px-3 py-1.5 border border-pink-500 bg-pink-500 text-white hover:bg-pink-600 uppercase tracking-widest text-[11px]'
                        : 'px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 uppercase tracking-widest text-[11px]'
                    }
                  >
                    Meistgelesen
                  </Link>
                </div>
              </div>
              <div className="text-xs text-gray-500">Seite {page} von {totalPages} · {total} Themen</div>
            </div>
            <div className="border border-gray-200 divide-y">
              {threads.length === 0 && (
                <div className="p-4 text-sm text-gray-500">Noch keine Themen.</div>
              )}
              {threads.map((t) => (
                <Link
                  key={t.id}
                  href={`/forum/thread/${t.id}`}
                  className="group block p-4 transition-colors duration-200 hover:bg-pink-50/40 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2 focus:ring-offset-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-gray-900 group-hover:text-pink-600 font-medium tracking-widest uppercase transition-colors">
                        {t.title}
                      </span>
                      {t.isPinned && (
                        <span className="ml-2 text-[10px] uppercase tracking-widest text-pink-600">Angepinnt</span>
                      )}
                      <div className="text-xs text-gray-500 mt-1">Letzter Beitrag: {new Date(t.lastPostAt).toLocaleString('de-DE')} · Aufrufe: {t.views}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-widest text-gray-500">Beiträge</div>
                      <div className="text-sm text-gray-900">{t._count.posts}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm text-gray-700">
                <div>
                  {page > 1 && (
                    <Link href={{ pathname: `/forum/${forum.slug}`, query: { sort, page: page - 1 } }} className="px-3 py-1 border border-gray-300 hover:bg-gray-50">Zurück</Link>
                  )}
                </div>
                <div>
                  {page < totalPages && (
                    <Link href={{ pathname: `/forum/${forum.slug}`, query: { sort, page: page + 1 } }} className="px-3 py-1 border border-gray-300 hover:bg-gray-50">Weiter</Link>
                  )}
                </div>
              </div>
            )}
          </div>
          {showNew && !forum.isLocked && (
            <div className="lg:col-span-1">
              <Appear>
                <NewThreadForm forumSlug={forum.slug} />
              </Appear>
            </div>
          )}
        </div>
        {forum.isLocked && (
          <div className="mt-4 border border-gray-200 p-4 bg-pink-50/40 text-sm text-gray-700">Dieses Forum ist gesperrt.</div>
        )}
      </main>
      <Footer />
    </div>
  )
}

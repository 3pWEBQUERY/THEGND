import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import CategorySelect from '@/components/blog/CategorySelect'

export const dynamic = 'force-dynamic'

export default async function BlogIndexPage({ searchParams }: { searchParams?: Promise<{ q?: string; page?: string; category?: string }> }) {
  const sp = (await searchParams) || {}
  const q = (sp.q || '').toString().trim()
  const page = Math.max(1, Number(sp.page || '1') || 1)
  const take = 12
  const skip = (page - 1) * take
  const catRaw = ((sp as any).category || '').toString().trim().toUpperCase()
  const allowedCategories = ['AKTUELLES', 'INTERESSANT_HEISSES', 'VON_USER_FUER_USER']
  const category = allowedCategories.includes(catRaw) ? catRaw : ''

  const where: any = { published: true, blocked: false }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { excerpt: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (category) {
    where.category = category
  }

  const [posts, total] = await Promise.all([
    (prisma as any).blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, publishedAt: true, category: true },
      skip,
      take,
    }),
    (prisma as any).blogPost.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / take))

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MinimalistNavigation />

      {/* Hero Section (styled like /info) */}
      <section className="relative overflow-hidden mb-12 md:mb-16">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/blog.jpg"
            alt="Hero Background"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/0 to-white/0 md:to-white/0" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-40 pb-24 md:pt-48 md:pb-40">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-light tracking-[0.25em] text-white">BLOG</h1>
            <div className="mt-4 h-[2px] w-24 bg-gradient-to-r from-pink-600/0 via-pink-500/80 to-pink-600/0" />
            <p className="mt-6 text-neutral-200 text-base md:text-lg leading-relaxed">
              Insights, Updates und Stories von THEGND. Neuigkeiten, Produkt-Updates und Tipps.
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <form className="mb-3 flex items-center gap-3" action="/blog" method="get">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Suche im Blog…"
                className="flex-1 border-0 border-b-2 border-gray-200 py-2 text-sm bg-transparent outline-none focus:border-pink-500"
              />
              <CategorySelect
                name="category"
                defaultValue={category || ''}
                options={[
                  { value: '', label: 'Alle Kategorien' },
                  { value: 'AKTUELLES', label: 'AKTUELLES' },
                  { value: 'INTERESSANT_HEISSES', label: 'INTERESSANT & HEISSES' },
                  { value: 'VON_USER_FUER_USER', label: 'VON USER FÜR USER' },
                ]}
              />
              <button type="submit" className="px-3 py-2 text-xs uppercase tracking-widest border border-gray-300 hover:bg-pink-50/40">Suchen</button>
            </form>

            {/* Quick category filter buttons */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {[
                { key: '', label: 'ALLE' },
                { key: 'AKTUELLES', label: 'AKTUELLES' },
                { key: 'INTERESSANT_HEISSES', label: 'INTERESSANT & HEISSES' },
                { key: 'VON_USER_FUER_USER', label: 'VON USER FÜR USER' },
              ].map((c) => {
                const params = new URLSearchParams()
                if (q) params.set('q', q)
                if (c.key) params.set('category', c.key)
                params.set('page', '1')
                const isActive = category === c.key || (!category && c.key === '')
                return (
                  <Link
                    key={c.key || 'ALL'}
                    href={`/blog?${params.toString()}`}
                    className={`px-3 py-1.5 text-[11px] uppercase tracking-widest border ${isActive ? 'border-pink-500 text-pink-600 bg-pink-50/40' : 'border-gray-300 text-gray-700 hover:bg-pink-50/40'}`}
                  >
                    {c.label}
                  </Link>
                )
              })}
            </div>

          {posts.length === 0 ? (
            <p className="text-sm text-gray-500">Noch keine Beiträge veröffentlicht.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {posts.map((p: any) => (
                <article
                  key={p.id}
                  className="relative group border border-gray-200 bg-white flex flex-col transition-all duration-200 hover:shadow-lg hover:border-pink-200 cursor-pointer"
                >
                  {p.coverImage && (
                    <div className="relative">
                      {/* Category badge */}
                      {p.category && (
                        <span className="absolute top-2 left-2 z-10 bg-pink-600 text-white text-[10px] font-medium uppercase tracking-widest px-2 py-1">
                          {p.category === 'INTERESSANT_HEISSES' ? 'INTERESSANT & HEISSES' : (p.category === 'VON_USER_FUER_USER' ? 'VON USER FÜR USER' : 'AKTUELLES')}
                        </span>
                      )}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.coverImage}
                        alt={p.title}
                        className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col">
                    <h2 className="text-lg font-medium tracking-widest text-gray-900 uppercase">{p.title}</h2>
                    {p.publishedAt && (
                      <div className="mt-1 text-[11px] uppercase tracking-widest text-gray-500">
                        {new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(p.publishedAt))}
                      </div>
                    )}
                    {p.excerpt && <p className="mt-3 text-sm text-gray-600 line-clamp-3">{p.excerpt}</p>}
                    <div className="mt-5">
                      <span className="text-xs uppercase tracking-widest text-pink-600 group-hover:underline">Weiterlesen</span>
                    </div>
                  </div>
                  {/* Full-card overlay link to make the entire card clickable */}
                  <Link
                    href={`/blog/${p.slug}`}
                    aria-label={`Beitrag lesen: ${p.title}`}
                    className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60 rounded"
                  >
                    <span aria-hidden="true" className="absolute inset-0" />
                  </Link>
                </article>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4 text-sm">
              {page > 1 && (
                <Link href={`/blog?${(() => { const ps = new URLSearchParams({ q, page: String(page - 1) }); if (category) ps.set('category', category); return ps.toString() })()}`} className="px-3 py-2 border border-gray-300 hover:bg-pink-50/40">Zurück</Link>
              )}
              <span className="text-gray-600">Seite {page} / {totalPages}</span>
              {page < totalPages && (
                <Link href={`/blog?${(() => { const ps = new URLSearchParams({ q, page: String(page + 1) }); if (category) ps.set('category', category); return ps.toString() })()}`} className="px-3 py-2 border border-gray-300 hover:bg-pink-50/40">Weiter</Link>
              )}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}

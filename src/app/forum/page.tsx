import Link from 'next/link'
import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import ForumHero from '@/components/homepage/ForumHero'
import { prisma } from '@/lib/prisma'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarUrl } from '@/utils/avatar'
import * as Icons from 'lucide-react'
import { Info } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function ForumHomePage() {
  const toKebab = (s: string) => s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase()

  const resolveIcon = (key?: string) => {
    if (!key) return null
    const direct: any = (Icons as any)[key]
    if (typeof direct === 'function' || typeof direct === 'object') return direct
    const map: any = (Icons as any).icons
    const make: any = (Icons as any).createLucideIcon
    if (map && make) {
      const node = map[key] || map[toKebab(key)]
      if (node) return make(key, node)
    }
    return null
  }
  const categories = await prisma.forumCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      forums: {
        where: { parentId: null },
        orderBy: { sortOrder: 'asc' },
        include: {
          children: { orderBy: { sortOrder: 'asc' } },
          threads: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              author: { select: { id: true, email: true, userType: true, profile: { select: { displayName: true, avatar: true } } } },
              posts: { orderBy: { createdAt: 'asc' }, take: 1, select: { content: true } },
            }
          },
          _count: { select: { threads: true } },
        },
      },
    },
  })

  const extractFirstImageUrl = (content?: string | null): string | null => {
    if (!content) return null
    // Markdown image ![alt](url)
    const md = /!\[[^\]]*\]\(([^)]+)\)/.exec(content)
    if (md && md[1]) return md[1]
    // HTML <img src="...">
    const html = /<img[^>]*src=["']([^"']+)["'][^>]*>/i.exec(content)
    if (html && html[1]) return html[1]
    // Plain URL ending with image extension
    const url = /(https?:[^\s)]+\.(?:png|jpe?g|webp|gif)|\/uploads\/[^\s)]+)/i.exec(content)
    if (url && url[0]) return url[0]
    return null
  }

  function relativeFromNow(date: Date) {
    const diffMs = Date.now() - date.getTime()
    const sec = Math.floor(diffMs / 1000)
    const min = Math.floor(sec / 60)
    const hr = Math.floor(min / 60)
    const day = Math.floor(hr / 24)
    if (day > 0) return `Vor ${day} Tag${day === 1 ? '' : 'en'}`
    if (hr > 0) return `Vor ${hr} Stunde${hr === 1 ? '' : 'n'}`
    if (min > 0) return `Vor ${min} Minute${min === 1 ? '' : 'n'}`
    return 'Gerade eben'
  }

  return (
    <div className="min-h-screen bg-white">
      <MinimalistNavigation />
      <ForumHero />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        <div className="mt-8 space-y-10">
          {categories.map((cat) => (
            <section key={cat.id}>
              <h2 className="text-sm font-light tracking-widest text-gray-800 uppercase">{cat.name}</h2>
              {cat.description && (
                <p className="mt-1 text-sm text-gray-600">{cat.description}</p>
              )}
              <div className="mt-4 divide-y border border-gray-200">
                {cat.forums.length === 0 && (
                  <div className="p-4 text-sm text-gray-500">Keine Foren in dieser Kategorie.</div>
                )}
                {cat.forums.map((f: any) => (
                  <div
                    key={f.id}
                    className="group block p-3 sm:pr-5 transition-colors duration-200 hover:bg-pink-50/40 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2 focus:ring-offset-white"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto_auto] gap-3 sm:gap-0 items-start sm:items-stretch overflow-hidden">
                      {/* Image column (latest thread image if available, else forum image) */}
                      <div className="hidden sm:block overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {(() => {
                          const thread = f.threads?.[0]
                          const fromPost = extractFirstImageUrl(thread?.posts?.[0]?.content)
                          const src = fromPost || (f.image as string | undefined)
                          if (src) {
                            return (
                              <img
                                src={src}
                                alt="Forum Bild"
                                className="w-28 h-full object-cover block"
                                style={{ clipPath: 'polygon(0% 0%, 92% 0%, 100% 50%, 92% 100%, 0% 100%)' }}
                              />
                            )
                          }
                          return (
                            <div
                              className="w-28 h-full bg-gray-100"
                              style={{ clipPath: 'polygon(0% 0%, 92% 0%, 100% 50%, 92% 100%, 0% 100%)' }}
                            />
                          )
                        })()}
                      </div>
                      <div className="min-w-0 sm:pl-3 flex flex-col justify-center">
                        <Link href={`/forum/${f.slug}`} className="text-gray-900 group-hover:text-pink-600 font-medium tracking-widest uppercase transition-colors inline-flex items-center gap-2">
                          {(() => {
                            const key = (f as any).icon as string | undefined
                            const Ico = resolveIcon(key) || Info
                            return <Ico className="h-4 w-4 shrink-0 text-gray-500 group-hover:text-pink-600" aria-hidden="true" />
                          })()}
                          {f.name}
                        </Link>
                        {f.description && (
                          <p className="mt-1 text-sm text-gray-600">{f.description}</p>
                        )}
                        {Array.isArray(f.children) && f.children.length > 0 && (
                          <div className="mt-2 text-xs text-gray-600">
                            Unterforen:{' '}
                            {f.children?.map((c: any, i: number) => (
                              <span key={c.id}>
                                <Link href={`/forum/${c.slug}`} className="text-pink-600 hover:underline">{c.name}</Link>
                                {i < (f.children?.length ?? 0) - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Latest thread column (vertically centered) */}
                      <div className="min-w-0 mt-2 sm:mt-0 sm:flex sm:items-center sm:px-5">
                        {f.threads?.[0] && (
                          <div className="flex items-center gap-3">
                            <Avatar className="h-6 w-6 bg-gray-200">
                              <AvatarImage src={getAvatarUrl(f.threads[0].author?.profile?.avatar, f.threads[0].author?.userType)} alt="avatar" />
                              <AvatarFallback className="text-[10px] font-light tracking-widest text-gray-700">
                                {(f.threads[0].author?.profile?.displayName || f.threads[0].author?.email || '?')
                                  .split(/\s+/)
                                  .map((s: string) => s.charAt(0).toUpperCase())
                                  .slice(0, 2)
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="text-sm text-gray-900 truncate group-hover:text-pink-600">{f.threads[0].title}</div>
                              <div className="text-[11px] text-gray-500">
                                {f.threads[0].author ? (() => {
                                  const name = f.threads[0].author?.profile?.displayName || f.threads[0].author?.email || 'Unbekannt'
                                  const slug = name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                                  return (
                                    <Link href={`/user/${f.threads[0].author.id}/${slug}`} className="hover:underline">{name}</Link>
                                  )
                                })() : 'Unbekannt'}
                                {' · '}
                                {relativeFromNow(new Date(f.threads[0].createdAt))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Right stats column (restore right padding, vertically centered) */}
                      <div className="text-right sm:pr-5 flex items-center justify-end gap-2 mt-2 sm:mt-0">
                        <div className="text-xs uppercase tracking-widest text-gray-500">Themen</div>
                        <div className="text-sm text-gray-900">{f._count.threads}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}

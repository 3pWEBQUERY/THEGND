import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getSeoOverride, mergeMetadata } from '@/lib/seo'
import { renderMarkdownToSafeHtml } from '@/lib/markdown'
import Link from 'next/link'
import { getProfileUrl } from '@/lib/validations'
import { getAvatarUrl } from '@/utils/avatar'

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  // Keep empty to make it fully dynamic; optional pre-render could be added
  return []
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  try {
    const post = await (prisma as any).blogPost.findUnique({ where: { slug }, select: { title: true, excerpt: true, coverImage: true, published: true, blocked: true } })
    if (!post || !post.published || post.blocked) return { title: 'Blog – THEGND' }
    let meta: Metadata = {
      title: post.title,
      description: post.excerpt || undefined,
      openGraph: {
        title: post.title,
        description: post.excerpt || undefined,
        images: post.coverImage ? [post.coverImage] : undefined,
      },
      twitter: {
        card: post.coverImage ? 'summary_large_image' : 'summary',
        title: post.title,
        description: post.excerpt || undefined,
        images: post.coverImage ? [post.coverImage] : undefined,
      },
    }
    // Apply admin SEO page override
    const override = await getSeoOverride(`/blog/${slug}`)
    meta = mergeMetadata(meta, override)
    return meta
  } catch {
    return { title: 'Blog – THEGND' }
  }
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await (prisma as any).blogPost.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true,
          userType: true,
          profile: { select: { displayName: true, avatar: true, bio: true } },
        },
      },
    },
  })
  if (!post || !post.published || post.blocked) return notFound()

  // Fetch related posts: same category first, then recent, excluding current
  const relatedPosts = await (prisma as any).blogPost.findMany({
    where: {
      published: true,
      blocked: false,
      slug: { not: slug },
    },
    orderBy: [{ publishedAt: 'desc' }],
    take: 20,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      category: true,
      publishedAt: true,
    },
  })

  // Prioritise same-category posts, fill up with others – max 3
  const sameCategory = relatedPosts.filter((p: any) => p.category === post.category)
  const otherCategory = relatedPosts.filter((p: any) => p.category !== post.category)
  const related = [...sameCategory, ...otherCategory].slice(0, 3)

  // Compute reading time from raw markdown content (approx. 200 wpm)
  const raw = (post.content || '').toString()
  const wordCount = raw.trim().length > 0 ? raw.trim().split(/\s+/).length : 0
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200))
  // Placeholder for clicks (views) until tracking is implemented
  const clicks = 0

  return (
    <div className="min-h-screen bg-white">
      <MinimalistNavigation />

      {/* Hero Section (matching /blog) */}
      <section className="relative overflow-hidden mb-12 md:mb-16">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImage || '/blog.jpg'}
            alt="Hero Background"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/0 to-white/0 md:to-white/0" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-40 pb-24 md:pt-48 md:pb-40">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-light tracking-[0.25em] text-white">{post.title}</h1>
            <div className="mt-4 h-[2px] w-24 bg-gradient-to-r from-pink-600/0 via-pink-500/80 to-pink-600/0" />
            <div className="mt-3 text-[11px] uppercase tracking-widest text-neutral-200 flex flex-wrap items-center gap-x-4 gap-y-2">
              {post.publishedAt && (
                <span>
                  Veröffentlicht: {new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(post.publishedAt))}
                </span>
              )}
              <span>Lesedauer: {readingTimeMin} Min</span>
              <span>Klicks: {clicks}</span>
            </div>
            {post.excerpt && (
              <p className="mt-6 text-neutral-200 text-base md:text-lg leading-relaxed">{post.excerpt}</p>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage} alt={post.title} className="w-full h-80 object-cover border border-gray-200" />
        )}
        {post.content && (
          <div className="prose max-w-none mt-8 prose-p:text-gray-700 prose-headings:tracking-widest prose-a:text-pink-600">
            <div dangerouslySetInnerHTML={{ __html: renderMarkdownToSafeHtml(post.content) }} />
          </div>
        )}

        {/* Author info */}
        <div className="mt-14">
          <div className="h-[2px] w-64 sm:w-80 md:w-96 lg:w-[32rem] mx-auto bg-gradient-to-r from-pink-600/0 via-pink-500/80 to-pink-600/0" />
          <Link
            href={getProfileUrl({
              id: post.author?.id ?? '',
              userType: post.author?.userType ?? 'MEMBER',
              displayName: post.author?.profile?.displayName,
            })}
            className="mt-6 flex items-center gap-4 group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getAvatarUrl(post.author?.profile?.avatar, post.author?.userType)}
              alt={post.author?.profile?.displayName || 'Autor'}
              className="h-16 w-16 object-cover border border-gray-200 group-hover:border-pink-400 transition-colors"
            />
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Autor</div>
              <div className="text-base font-medium text-gray-900 group-hover:text-pink-600 transition-colors">
                {post.author?.profile?.displayName || 'Unbekannter Autor'}
              </div>
              {post.author?.profile?.bio && (
                <p className="mt-1 text-sm text-gray-600 max-w-2xl">{post.author.profile.bio}</p>
              )}
            </div>
          </Link>
        </div>
      </section>

      {/* Related Posts */}
      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-light tracking-[0.2em] text-gray-800">ÄHNLICHE BEITRÄGE</h2>
            <div className="mt-3 h-[2px] w-20 mx-auto bg-gradient-to-r from-pink-600/0 via-pink-500/80 to-pink-600/0" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {related.map((rp: any) => (
              <Link
                key={rp.id}
                href={`/blog/${rp.slug}`}
                className="group block border border-gray-100 hover:border-pink-200 transition-colors"
              >
                {rp.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={rp.coverImage}
                    alt={rp.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                    <span className="text-xs font-light tracking-widest text-gray-400 uppercase">Kein Bild</span>
                  </div>
                )}
                <div className="p-5">
                  <div className="text-[10px] font-light tracking-widest text-gray-400 uppercase mb-2">
                    {rp.publishedAt
                      ? new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(rp.publishedAt))
                      : ''}
                  </div>
                  <h3 className="text-base font-medium tracking-wide text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-2">
                    {rp.title}
                  </h3>
                  {rp.excerpt && (
                    <p className="mt-2 text-sm font-light text-gray-600 line-clamp-2">{rp.excerpt}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}

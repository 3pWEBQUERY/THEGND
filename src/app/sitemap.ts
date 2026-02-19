import type { MetadataRoute } from 'next'
import { getPublicSettings } from '@/lib/settings'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const STATIC_PATHS = [
  '/',
  '/escorts',
  '/hobbyhuren',
  '/agency',
  '/club-studio',
  '/stories',
  '/feed',
  '/forum',
  '/jobs',
  '/mieten',
  '/blog',
  '/search',
  '/preise',
  '/info',
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const s = await getPublicSettings()
  if (!s.seo.sitemapEnabled) return []

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')

  // Static routes
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: siteUrl ? `${siteUrl}${p}` : p,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: p === '/' ? 1 : 0.6,
  }))

  // ─── Dynamic routes ─────────────────────────────────────────────────
  try {
    // Load page overrides for priority/changeFrequency customization
    const overrides = await prisma.seoPageOverride.findMany({
      where: { enabled: true },
      select: { urlPath: true, priority: true, changeFrequency: true },
    })
    const overrideMap = new Map(overrides.map((o) => [o.urlPath, o]))

    // Escort profiles
    const escorts = await prisma.user.findMany({
      where: { userType: { in: ['ESCORT', 'HOBBYHURE'] }, isActive: true },
      select: { id: true, profile: { select: { displayName: true, updatedAt: true } } },
    })
    for (const e of escorts) {
      const slug = slugify(e.profile?.displayName || 'escort')
      const path = `/escorts/${e.id}/${slug}`
      const ov = overrideMap.get(path)
      entries.push({
        url: siteUrl ? `${siteUrl}${path}` : path,
        lastModified: e.profile?.updatedAt || new Date(),
        changeFrequency: (ov?.changeFrequency as any) || 'weekly',
        priority: ov?.priority ?? 0.7,
      })
    }

    // Agency profiles
    const agencies = await prisma.user.findMany({
      where: { userType: 'AGENCY', isActive: true },
      select: { id: true, profile: { select: { displayName: true, updatedAt: true } } },
    })
    for (const a of agencies) {
      const slug = slugify(a.profile?.displayName || 'agency')
      const path = `/agency/${a.id}/${slug}`
      const ov = overrideMap.get(path)
      entries.push({
        url: siteUrl ? `${siteUrl}${path}` : path,
        lastModified: a.profile?.updatedAt || new Date(),
        changeFrequency: (ov?.changeFrequency as any) || 'weekly',
        priority: ov?.priority ?? 0.6,
      })
    }

    // Club & Studio profiles
    const clubStudios = await prisma.user.findMany({
      where: { userType: { in: ['CLUB', 'STUDIO'] }, isActive: true },
      select: { id: true, profile: { select: { displayName: true, updatedAt: true } } },
    })
    for (const cs of clubStudios) {
      const slug = slugify(cs.profile?.displayName || 'club')
      const path = `/club-studio/${cs.id}/${slug}`
      const ov = overrideMap.get(path)
      entries.push({
        url: siteUrl ? `${siteUrl}${path}` : path,
        lastModified: cs.profile?.updatedAt || new Date(),
        changeFrequency: (ov?.changeFrequency as any) || 'weekly',
        priority: ov?.priority ?? 0.5,
      })
    }

    // Blog posts
    const blogPosts = await prisma.blogPost.findMany({
      where: { published: true, blocked: false },
      select: { slug: true, updatedAt: true },
    })
    for (const bp of blogPosts) {
      const path = `/blog/${bp.slug}`
      const ov = overrideMap.get(path)
      entries.push({
        url: siteUrl ? `${siteUrl}${path}` : path,
        lastModified: bp.updatedAt,
        changeFrequency: (ov?.changeFrequency as any) || 'monthly',
        priority: ov?.priority ?? 0.5,
      })
    }

    // Forum threads
    const threads = await prisma.forumThread.findMany({
      where: { isClosed: false },
      select: { id: true, forum: { select: { slug: true } }, updatedAt: true },
      take: 5000,
      orderBy: { lastPostAt: 'desc' },
    })
    for (const t of threads) {
      const path = `/forum/${t.forum.slug}/${t.id}`
      const ov = overrideMap.get(path)
      entries.push({
        url: siteUrl ? `${siteUrl}${path}` : path,
        lastModified: t.updatedAt,
        changeFrequency: (ov?.changeFrequency as any) || 'weekly',
        priority: ov?.priority ?? 0.4,
      })
    }
  } catch (err) {
    console.warn('[sitemap] Failed to load dynamic entries:', err)
  }

  return entries
}

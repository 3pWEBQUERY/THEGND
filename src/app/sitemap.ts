import type { MetadataRoute } from 'next'
import { getPublicSettings } from '@/lib/settings'

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const s = await getPublicSettings()
  if (!s.seo.sitemapEnabled) return []

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
  if (!siteUrl) {
    // If base URL is missing, return relative paths (Next will still render XML)
    return STATIC_PATHS.map((p) => ({ url: p })) as MetadataRoute.Sitemap
  }

  return STATIC_PATHS.map((p) => ({
    url: `${siteUrl}${p}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: p === '/' ? 1 : 0.6,
  }))
}

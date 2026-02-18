import type { MetadataRoute } from 'next'
import { getPublicSettings } from '@/lib/settings'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const s = await getPublicSettings()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  return {
    rules: [
      {
        userAgent: '*',
        allow: s.seo.robotsIndex ? '/' : '',
        disallow: s.seo.robotsIndex ? [] : ['/'],
      },
    ],
    sitemap: s.seo.sitemapEnabled && siteUrl ? [`${siteUrl}/sitemap.xml`] : undefined,
  }
}

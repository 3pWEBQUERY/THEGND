import type { MetadataRoute } from 'next'
import { getPublicSettings } from '@/lib/settings'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const s = await getPublicSettings()
  const name = s.name || 'THEGND'
  const short_name = name.length > 12 ? name.slice(0, 12).toUpperCase() : name.toUpperCase()
  const theme_color = '#ffffff'
  const background_color = '#ffffff'
  const icons: MetadataRoute.Manifest['icons'] = s.faviconUrl
    ? [
        { src: s.faviconUrl, sizes: 'any', type: 'image/png' },
      ]
    : [
        { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        { src: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { src: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      ]

  return {
    name,
    short_name,
    description: s.seo.metaDescription || 'Das Innovative Escort Portal in der digitalen Welt',
    start_url: '/',
    display: 'standalone',
    background_color,
    theme_color,
    icons,
  }
}

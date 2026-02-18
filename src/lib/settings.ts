import { prisma } from '@/lib/prisma'

const PUBLIC_KEYS = [
  'site.name',
  'site.tagline',
  'site.titleSeparator',
  'site.logo.kind',
  'site.logo.text',
  'site.logo.imageUrl',
  'site.faviconUrl',
  'site.primaryLocale',
  'site.timezone',
  'site.dateFormat',
  'seo.titleTemplate',
  'seo.metaDescription',
  'seo.keywords',
  'seo.ogImageUrl',
  'seo.robotsIndex',
  'seo.sitemapEnabled',
] as const

type PublicKey = typeof PUBLIC_KEYS[number]

export type PublicSettings = {
  name: string
  tagline: string
  titleSeparator: string
  logo: { kind: 'text' | 'image'; text: string; imageUrl: string }
  faviconUrl: string
  primaryLocale: string
  timezone: string
  dateFormat: string
  seo: {
    titleTemplate: string
    metaDescription: string
    keywords: string
    ogImageUrl: string
    robotsIndex: boolean
    sitemapEnabled: boolean
  }
}

const DEFAULTS: PublicSettings = {
  name: 'THEGND',
  tagline: '',
  titleSeparator: ' | ',
  logo: { kind: 'text', text: 'THEGND', imageUrl: '' },
  faviconUrl: '',
  primaryLocale: 'de',
  timezone: 'UTC',
  dateFormat: 'DD.MM.YYYY',
  seo: {
    titleTemplate: '',
    metaDescription: '',
    keywords: '',
    ogImageUrl: '',
    robotsIndex: true,
    sitemapEnabled: true,
  },
}

export async function getPublicSettings(): Promise<PublicSettings> {
  // During build time DATABASE_URL may not be available (e.g. on Railway)
  if (!process.env.DATABASE_URL) {
    return DEFAULTS
  }
  try {
    const rows = await prisma.appSetting.findMany({ where: { key: { in: PUBLIC_KEYS as unknown as string[] } } })
    const map = new Map<string, string>()
    for (const r of rows) map.set(r.key, r.value)
    return {
    name: map.get('site.name') || 'THEGND',
    tagline: map.get('site.tagline') || '',
    titleSeparator: map.get('site.titleSeparator') || ' | ',
    logo: {
      kind: ((map.get('site.logo.kind') || 'text') === 'image' ? 'image' : 'text'),
      text: map.get('site.logo.text') || 'THEGND',
      imageUrl: map.get('site.logo.imageUrl') || '',
    },
    faviconUrl: map.get('site.faviconUrl') || '',
    primaryLocale: map.get('site.primaryLocale') || 'de',
    timezone: map.get('site.timezone') || 'UTC',
    dateFormat: map.get('site.dateFormat') || 'DD.MM.YYYY',
    seo: {
      titleTemplate: map.get('seo.titleTemplate') || '',
      metaDescription: map.get('seo.metaDescription') || '',
      keywords: map.get('seo.keywords') || '',
      ogImageUrl: map.get('seo.ogImageUrl') || '',
      robotsIndex: (map.get('seo.robotsIndex') || 'true') === 'true',
      sitemapEnabled: (map.get('seo.sitemapEnabled') || 'true') === 'true',
    },
  }
  } catch (error) {
    console.warn('[settings] Failed to load settings from DB, using defaults:', error instanceof Error ? error.message : error)
    return DEFAULTS
  }
}

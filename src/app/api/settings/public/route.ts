import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const KEYS = [
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
]

export async function GET() {
  try {
    const rows = await prisma.appSetting.findMany({ where: { key: { in: KEYS } } })
    const map: Record<string, string> = {}
    for (const r of rows) map[r.key] = r.value
    const payload = {
      name: map['site.name'] || 'THEGND',
      tagline: map['site.tagline'] || '',
      titleSeparator: map['site.titleSeparator'] || ' | ',
      logo: {
        kind: (map['site.logo.kind'] || 'text') as 'text' | 'image',
        text: map['site.logo.text'] || 'THEGND',
        imageUrl: map['site.logo.imageUrl'] || '',
      },
      faviconUrl: map['site.faviconUrl'] || '',
      primaryLocale: map['site.primaryLocale'] || 'de',
      timezone: map['site.timezone'] || 'UTC',
      dateFormat: map['site.dateFormat'] || 'DD.MM.YYYY',
      seo: {
        titleTemplate: map['seo.titleTemplate'] || '',
        metaDescription: map['seo.metaDescription'] || '',
        keywords: map['seo.keywords'] || '',
        ogImageUrl: map['seo.ogImageUrl'] || '',
        robotsIndex: (map['seo.robotsIndex'] || 'true') === 'true',
        sitemapEnabled: (map['seo.sitemapEnabled'] || 'true') === 'true',
      },
    }
    return NextResponse.json(payload)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}

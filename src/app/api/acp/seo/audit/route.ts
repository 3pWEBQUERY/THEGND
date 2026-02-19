import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

interface AuditResult {
  url: string
  title: string | null
  titleLength: number
  description: string | null
  descriptionLength: number
  keywords: string | null
  robots: string | null
  canonical: string | null
  ogTitle: string | null
  ogDescription: string | null
  ogImage: string | null
  ogType: string | null
  hreflang: Record<string, string>
  structuredData: any[]
  warnings: string[]
  checks: { label: string; ok: boolean; detail?: string }[]
}

function extractMeta(html: string, nameOrProp: string): string | null {
  // Match name="..." or property="..."
  const re = new RegExp(
    `<meta\\s+(?:[^>]*?(?:name|property)\\s*=\\s*["']${nameOrProp}["'][^>]*?content\\s*=\\s*["']([^"']*)["']|[^>]*?content\\s*=\\s*["']([^"']*)["'][^>]*?(?:name|property)\\s*=\\s*["']${nameOrProp}["'])`,
    'i'
  )
  const m = html.match(re)
  return m ? (m[1] || m[2] || null) : null
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  return m ? m[1].trim() : null
}

function extractCanonical(html: string): string | null {
  const m = html.match(/<link\s+[^>]*rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']*)["']/i)
  return m ? m[1] : null
}

function extractHreflang(html: string): Record<string, string> {
  const result: Record<string, string> = {}
  const re = /<link\s+[^>]*rel\s*=\s*["']alternate["'][^>]*hreflang\s*=\s*["']([^"']*)["'][^>]*href\s*=\s*["']([^"']*)["']/gi
  let m
  while ((m = re.exec(html)) !== null) {
    result[m[1]] = m[2]
  }
  return result
}

function extractJsonLd(html: string): any[] {
  const result: any[] = []
  const re = /<script\s+[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    try {
      result.push(JSON.parse(m[1]))
    } catch {}
  }
  return result
}

export async function POST(req: Request) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { url } = body
    if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

    // Fetch page HTML
    let html: string
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'TheGND-SEO-Audit/1.0' },
        redirect: 'follow',
      })
      html = await res.text()
    } catch (e: any) {
      return NextResponse.json({ error: `Failed to fetch URL: ${e?.message}` }, { status: 400 })
    }

    // Extract only <head> section for faster regex processing
    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
    const head = headMatch ? headMatch[1] : html

    const title = extractTitle(head)
    const description = extractMeta(head, 'description')
    const keywords = extractMeta(head, 'keywords')
    const robots = extractMeta(head, 'robots')
    const canonical = extractCanonical(head)
    const ogTitle = extractMeta(head, 'og:title')
    const ogDescription = extractMeta(head, 'og:description')
    const ogImage = extractMeta(head, 'og:image')
    const ogType = extractMeta(head, 'og:type')
    const hreflang = extractHreflang(head)
    const structuredData = extractJsonLd(html) // JSON-LD can be in body too

    // Warnings
    const warnings: string[] = []
    const checks: AuditResult['checks'] = []

    // Title checks
    checks.push({
      label: 'Title vorhanden',
      ok: !!title,
      detail: title || 'Kein Title-Tag gefunden',
    })
    if (title) {
      const tLen = title.length
      checks.push({
        label: 'Title Länge (30-60 Zeichen)',
        ok: tLen >= 30 && tLen <= 60,
        detail: `${tLen} Zeichen`,
      })
      if (tLen > 60) warnings.push(`Title ist zu lang (${tLen} Zeichen, max. 60)`)
      if (tLen < 30) warnings.push(`Title ist zu kurz (${tLen} Zeichen, min. 30)`)
    }

    // Description checks
    checks.push({
      label: 'Meta Description vorhanden',
      ok: !!description,
      detail: description || 'Keine Meta Description gefunden',
    })
    if (description) {
      const dLen = description.length
      checks.push({
        label: 'Description Länge (50-160 Zeichen)',
        ok: dLen >= 50 && dLen <= 160,
        detail: `${dLen} Zeichen`,
      })
      if (dLen > 160) warnings.push(`Meta Description ist zu lang (${dLen} Zeichen, max. 160)`)
      if (dLen < 50) warnings.push(`Meta Description ist zu kurz (${dLen} Zeichen, min. 50)`)
    }

    // OG checks
    checks.push({ label: 'Open Graph Title', ok: !!ogTitle })
    checks.push({ label: 'Open Graph Description', ok: !!ogDescription })
    checks.push({ label: 'Open Graph Image', ok: !!ogImage })

    // Canonical
    checks.push({ label: 'Canonical URL', ok: !!canonical, detail: canonical || undefined })

    // Robots
    const robotsLower = (robots || '').toLowerCase()
    checks.push({
      label: 'Indexierung erlaubt',
      ok: !robotsLower.includes('noindex'),
      detail: robots || 'Kein robots meta tag (= erlaubt)',
    })

    // Structured Data
    checks.push({
      label: 'Structured Data (JSON-LD)',
      ok: structuredData.length > 0,
      detail: structuredData.length > 0 ? `${structuredData.length} Snippet(s) gefunden` : 'Kein JSON-LD gefunden',
    })

    // Hreflang
    checks.push({
      label: 'Hreflang Tags',
      ok: Object.keys(hreflang).length > 0,
      detail: Object.keys(hreflang).length > 0 ? `${Object.keys(hreflang).length} Sprache(n)` : 'Keine hreflang Tags',
    })

    const result: AuditResult = {
      url,
      title,
      titleLength: title?.length || 0,
      description,
      descriptionLength: description?.length || 0,
      keywords,
      robots,
      canonical,
      ogTitle,
      ogDescription,
      ogImage,
      ogType,
      hreflang,
      structuredData,
      warnings,
      checks,
    }

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'audit failed' }, { status: 500 })
  }
}

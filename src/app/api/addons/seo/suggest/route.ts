import { NextResponse } from 'next/server'
import { callGemini } from '@/lib/gemini'

export const dynamic = 'force-dynamic'

// Very lightweight heuristic SEO suggester (no external API):
// - Builds a meta title using userType + city + 1-2 top keywords
// - Builds a concise meta description
// - Generates keyword ideas from the text and seed keywords

function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[\n\r]+/g, ' ')
    .replace(/[^a-zA-ZäöüÄÖÜß0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

const STOPWORDS_DE = new Set<string>([
  'und','oder','aber','der','die','das','ein','eine','einer','einem','einen','den','im','in','mit','auf','für','von','zu','an','am','als','auch','wir','ich','du','sie','er','es','man','sind','ist','sein','bin','bist','seid','nicht','kein','keine','mehr','sehr','auch','wie','dass','so','bei','aus','dem','des','durch','bis','nur','noch','schon'
])

const STOPWORDS_EN = new Set<string>([
  'and','or','but','the','a','an','in','on','with','for','of','to','at','as','we','i','you','he','she','it','they','are','is','be','was','were','not','no','very','also','how','that','so','by','from','through','until','only','already','just','this','these','those','there','here'
])

function topKeywords(text: string, seed: string[] = [], limit = 8, lang: 'de' | 'en' = 'de'): string[] {
  const counts = new Map<string, number>()
  const stop = lang === 'en' ? STOPWORDS_EN : STOPWORDS_DE
  for (const t of tokenize(text)) {
    if (t.length < 3) continue
    if (stop.has(t)) continue
    counts.set(t, (counts.get(t) || 0) + 1)
  }
  for (const s of seed) {
    const k = s.trim().toLowerCase()
    if (!k) continue
    counts.set(k, (counts.get(k) || 0) + 2) // slight boost to seed keywords
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k)
}

function buildMetaTitle(userType: string, city?: string, kws: string[] = [], lang: 'de' | 'en' = 'de'): string {
  const role = (lang === 'en'
    ? ({ ESCORT: 'Escort', AGENCY: 'Agency', CLUB: 'Club', STUDIO: 'Studio' } as Record<string, string>)
    : ({ ESCORT: 'Escort', AGENCY: 'Agentur', CLUB: 'Club', STUDIO: 'Studio' } as Record<string, string>)
  )[userType] || (lang === 'en' ? 'Profile' : 'Profil')
  const parts: string[] = []
  parts.push(role)
  if (city) parts.push(city)
  if (kws.length > 0) parts.push(kws[0])
  const title = parts.filter(Boolean).join(' · ')
  return title.slice(0, 60)
}

function buildMetaDescription(city?: string, kws: string[] = [], lang: 'de' | 'en' = 'de'): string {
  const base = lang === 'en'
    ? `Exclusive services${city ? ' in ' + city : ''}. ${kws.slice(0,3).join(', ')}. Contact now.`
    : `Exklusive Services${city ? ' in ' + city : ''}. ${kws.slice(0,3).join(', ')}. Jetzt Kontakt aufnehmen.`
  return base.slice(0, 155)
}

// Localized outline suggestions (H2/H3)
function outlineFor(userType: string, city?: string, top: string[] = [], lang: 'de' | 'en' = 'de') {
  const role = (lang === 'en'
    ? ({ ESCORT: 'Escort', AGENCY: 'Agency', CLUB: 'Club', STUDIO: 'Studio' } as Record<string, string>)
    : ({ ESCORT: 'Escort', AGENCY: 'Agentur', CLUB: 'Club', STUDIO: 'Studio' } as Record<string, string>)
  )[userType] || (lang === 'en' ? 'Profile' : 'Profil')
  const cityStr = city ? ` in ${city}` : ''
  const primary = top[0] ? ` – ${top[0]}` : ''
  return (lang === 'en'
    ? [
        { level: 'h2', text: `${role}${cityStr}${primary}`.trim() },
        { level: 'h3', text: 'Services & Offers' },
        { level: 'h3', text: 'About me / About us' },
        { level: 'h3', text: `Service area${city ? `: ${city}` : ''}`.trim() },
        { level: 'h3', text: 'Booking & Contact' },
        { level: 'h2', text: 'Frequently Asked Questions (FAQ)' },
      ]
    : [
        { level: 'h2', text: `${role}${cityStr}${primary}`.trim() },
        { level: 'h3', text: 'Leistungen & Angebote' },
        { level: 'h3', text: 'Über mich / Über uns' },
        { level: 'h3', text: `Einsatzgebiet${city ? `: ${city}` : ''}`.trim() },
        { level: 'h3', text: 'Buchung & Kontakt' },
        { level: 'h2', text: 'Häufige Fragen (FAQ)' },
      ])
}

// Localized LSI suggestions (semantically related terms)
function lsiFor(userType: string, city?: string, base: string[] = [], lang: 'de' | 'en' = 'de') {
  const generic = lang === 'en'
    ? ['booking','appointment','discreet','luxury','vip','hotel','mobile','contact','service']
    : ['buchung','termin','diskret','seriös','luxus','vip','hotel','mobil','kontakt','service']
  const byType: Record<string, string[]> = {
    ESCORT: lang === 'en' ? ['companionship','date','premium','massage'] : ['begleitung','date','premium','massage'],
    AGENCY: lang === 'en' ? ['agency','management','models','placement'] : ['agentur','management','models','vermittlung'],
    CLUB: lang === 'en' ? ['club','events','lounge','nightlife'] : ['club','events','lounge','nachtleben'],
    STUDIO: lang === 'en' ? ['studio','appointment','treatment','service'] : ['studio','termin','behandlung','service'],
  }
  const set = new Set<string>([...base.map(s => s.toLowerCase()), ...generic])
  for (const t of (byType[userType] || [])) set.add(t)
  if (city) {
    for (const b of base.slice(0, 5)) {
      set.add(`${b} ${city}`.toLowerCase())
      set.add(`${city} ${b}`.toLowerCase())
    }
  }
  return Array.from(set).slice(0, 20)
}

export async function POST(req: Request) {
  try {
    let body: any = {}
    try { body = await req.json() } catch {}
    const text = String(body?.text || '')
    const city = typeof body?.city === 'string' ? body.city : ''
    const userType = typeof body?.userType === 'string' ? body.userType : 'MEMBER'
    const seedKeywords: string[] = (String(body?.seedKeywords || '')).split(',').map((s: string) => s.trim()).filter(Boolean)
    const lang: 'de' | 'en' = body?.lang === 'en' ? 'en' : 'de'
    // Try Gemini first
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      // Fall back to heuristic if no API key configured
      const kws = topKeywords(text, seedKeywords, 8, lang)
      const metaTitle = buildMetaTitle(userType, city, kws, lang)
      const metaDescription = buildMetaDescription(city, kws, lang)
      const outline = outlineFor(userType, city, kws, lang)
      const lsi = lsiFor(userType, city, [...kws, ...seedKeywords], lang)
      return NextResponse.json({ metaTitle, metaDescription, keywords: kws, outline, lsi })
    }

    const system = lang === 'en'
      ? 'You are an expert SEO assistant. Generate concise SEO suggestions in English. Always respond with STRICT JSON only and nothing else.'
      : 'Du bist ein SEO‑Assistent. Erzeuge prägnante SEO‑Vorschläge auf Deutsch. Antworte AUSSCHLIESSLICH mit STRIKTEM JSON und sonst nichts.'

    const schemaHint = `Return JSON with keys: {"metaTitle": string (<=60 chars), "metaDescription": string (<=155 chars), "keywords": string[], "outline": Array<{"level":"h2"|"h3","text":string}>, "lsi": string[]}. Do not include markdown or code fences.`

    const userPrompt = [
      lang === 'en' ? `Language: English` : `Sprache: Deutsch`,
      `UserType: ${userType}`,
      city ? (lang === 'en' ? `City: ${city}` : `Stadt: ${city}`) : (lang === 'en' ? 'City: (none)' : 'Stadt: (keine)'),
      (lang === 'en' ? 'Profile text:' : 'Profiltext:') + `\n` + (text || '(empty)'),
      (lang === 'en' ? 'Seed keywords:' : 'Seed-Keywords:') + ` ` + (seedKeywords.join(', ') || '(none)'),
      schemaHint,
      (lang === 'en'
        ? 'Keep the output short, relevant, and localized. Use the selected language for all fields.'
        : 'Halte die Ausgabe kurz, relevant und lokalisiert. Verwende die ausgewählte Sprache für alle Felder.'),
    ].join('\n\n')

    const resp = await callGemini(userPrompt, { system, temperature: 0.3 })
      .then(text => ({ ok: true as const, text }))
      .catch(() => ({ ok: false as const, text: '' }))

    let geminiOk = resp.ok
    let content: string = resp.text

    if (geminiOk && content) {
      // Try to parse JSON safely (strip fences if present)
      const raw = content.trim()
      const fenced = raw.startsWith('```') ? raw.replace(/^```[a-zA-Z]*\n?|```$/g, '') : raw
      const jsonCandidate = (() => {
        try { return JSON.parse(fenced) } catch {}
        const m = fenced.match(/\{[\s\S]*\}/)
        if (m) {
          try { return JSON.parse(m[0]) } catch {}
        }
        return null
      })()

      if (jsonCandidate && typeof jsonCandidate === 'object') {
        const metaTitle = String(jsonCandidate.metaTitle || '')
        const metaDescription = String(jsonCandidate.metaDescription || '')
        const keywords: string[] = Array.isArray(jsonCandidate.keywords) ? jsonCandidate.keywords.map((s: any) => String(s)).filter(Boolean) : []
        const outlineRaw: any[] = Array.isArray(jsonCandidate.outline) ? jsonCandidate.outline : []
        const outline = outlineRaw
          .map((o: any) => ({ level: o?.level === 'h3' ? 'h3' : 'h2', text: String(o?.text || '').trim() }))
          .filter((o: any) => o.text)
        const lsi: string[] = Array.isArray(jsonCandidate.lsi) ? jsonCandidate.lsi.map((s: any) => String(s)).filter(Boolean) : []

        return NextResponse.json({ metaTitle, metaDescription, keywords, outline, lsi })
      }
    }

    // Fallback to heuristic on any failure
    const kws = topKeywords(text, seedKeywords, 8, lang)
    const metaTitle = buildMetaTitle(userType, city, kws, lang)
    const metaDescription = buildMetaDescription(city, kws, lang)
    const outline = outlineFor(userType, city, kws, lang)
    const lsi = lsiFor(userType, city, [...kws, ...seedKeywords], lang)

    return NextResponse.json({ metaTitle, metaDescription, keywords: kws, outline, lsi })
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 400 })
  }
}

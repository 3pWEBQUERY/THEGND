import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Mock SERP insights (no external requests). Returns plausible competitor entries
// based on userType, city and keywords.
export async function POST(req: Request) {
  try {
    let body: any = {}
    try { body = await req.json() } catch {}
    const city = typeof body?.city === 'string' ? body.city : ''
    const userType = typeof body?.userType === 'string' ? body.userType : 'MEMBER'
    const keywords = String(body?.keywords || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)

    const role = ({
      ESCORT: 'Escort',
      AGENCY: 'Agency',
      CLUB: 'Club',
      STUDIO: 'Studio',
    } as Record<string, string>)[userType] || 'Profil'

    const primary = keywords[0] || 'Diskret'
    const cityStr = city ? ` in ${city}` : ''

    const results = [
      {
        title: `${role}${cityStr} – ${primary} & VIP Service`,
        description: `Exklusive ${role.toLowerCase()}${cityStr}. ${keywords.slice(0,3).join(', ')}. Jetzt Termin sichern!`,
        url: `https://example.com/${encodeURIComponent((city || 'city').toLowerCase())}/${encodeURIComponent(role.toLowerCase())}`,
      },
      {
        title: `${role}${cityStr} – Luxus Begleitung & Hotel Dates`,
        description: `Premium Begleitung${cityStr}. Seriös, diskret, flexibel. Online anfragen – schnelle Rückmeldung.`,
        url: `https://example.com/${encodeURIComponent(role.toLowerCase())}/luxus`,
      },
      {
        title: `${role}${cityStr} – ${keywords[1] || 'Premium Service'}`,
        description: `Top Bewertungen, diskrete Treffen${cityStr}. ${keywords.slice(1,4).join(', ')}. Verfügbarkeit prüfen.`,
        url: `https://example.com/${encodeURIComponent((city || 'city').toLowerCase())}/angebote`,
      },
    ]

    return NextResponse.json({ results })
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 400 })
  }
}

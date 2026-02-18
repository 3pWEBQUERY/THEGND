import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function parseUA(ua: string | null | undefined) {
  const s = (ua || '').toLowerCase()
  let browser: string | null = null
  if (s.includes('edg/')) browser = 'Edge'
  else if (s.includes('chrome/')) browser = 'Chrome'
  else if (s.includes('safari/') && !s.includes('chrome/')) browser = 'Safari'
  else if (s.includes('firefox/')) browser = 'Firefox'
  else if (s.includes('msie') || s.includes('trident/')) browser = 'IE'
  let os: string | null = null
  if (s.includes('windows')) os = 'Windows'
  else if (s.includes('mac os x')) os = 'macOS'
  else if (s.includes('android')) os = 'Android'
  else if (s.includes('iphone') || s.includes('ipad') || s.includes('ios')) os = 'iOS'
  let device: string | null = null
  if (s.includes('mobile')) device = 'Mobile'
  else if (s.includes('tablet')) device = 'Tablet'
  else device = 'Desktop'
  return { browser, os, device }
}

export async function POST(req: Request) {
  let body: any = {}
  try { body = await req.json() } catch {}
  const { profileUserId, sessionId, type, durationMs, meta, path, referrer } = body || {}
  if (!profileUserId || !sessionId || !type) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  // Check if analytics add-on is globally active (admin toggle)
  try {
    const addon = await (prisma as any).addon.findFirst({
      where: { key: 'PROFILE_ANALYTICS', active: true },
      select: { key: true },
    })
    if (!addon) {
      return NextResponse.json({ ok: true, ignored: true, reason: 'globally_disabled' })
    }
  } catch (_) {
    // If schema not available yet, proceed without blocking (will be gated by user state below)
  }

  // Check if target profile owner has analytics enabled
  try {
    const st = await (prisma as any).userAddonState.findUnique({
      where: { userId_key: { userId: profileUserId, key: 'PROFILE_ANALYTICS' } },
      select: { enabled: true },
    })
    if (!st?.enabled) {
      // Silently ignore when disabled
      return NextResponse.json({ ok: true, ignored: true })
    }
  } catch (e) {
    // If schema not migrated yet, avoid crashing
  }

  const session: any = await getServerSession(authOptions as any)
  const visitorId: string | null = session?.user?.id && session.user.id !== profileUserId ? session.user.id : null

  function mapNameToISO2(name: string | null): string | null {
    if (!name) return null
    const raw = name.trim()
    if (raw.length === 2) return raw.toUpperCase()
    const m: Record<string, string> = {
      germany: 'DE', deutschland: 'DE', austria: 'AT', österreich: 'AT', switzerland: 'CH', schweiz: 'CH',
      france: 'FR', spain: 'ES', italy: 'IT', poland: 'PL', netherlands: 'NL', belgium: 'BE',
      usa: 'US', 'united states': 'US', 'united states of america': 'US', uk: 'GB', 'united kingdom': 'GB',
    }
    const key = raw.toLowerCase()
    return m[key] || null
  }

  function countryFromAcceptLanguage(h: string | null): string | null {
    if (!h) return null
    const first = h.split(',')[0]?.trim() || ''
    if (!first) return null
    const [lang, region] = first.split(/[-_]/)
    if (region && region.length === 2) return region.toUpperCase()
    // rough fallback from language to a representative country code
    const fallback: Record<string, string> = { de: 'DE', en: 'US', es: 'ES', fr: 'FR', it: 'IT', nl: 'NL', pl: 'PL', tr: 'TR', ru: 'RU' }
    return fallback[lang?.toLowerCase() || ''] || null
  }

  let country = req.headers.get('x-vercel-ip-country') || req.headers.get('x-geo-country') || null
  if (!country) {
    country = countryFromAcceptLanguage(req.headers.get('accept-language'))
  }
  const userAgent = req.headers.get('user-agent') || null
  const { browser, os, device } = parseUA(userAgent)

  // Pre-flight: ensure target user exists to avoid FK violations
  try {
    const exists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (SELECT 1 FROM "users" WHERE id = ${profileUserId} LIMIT 1) AS "exists";
    `
    if (!exists?.[0]?.exists) {
      return NextResponse.json({ ok: true, ignored: true, reason: 'target_not_found' })
    }
  } catch (_) {
    // ignore preflight errors and continue
  }

  try {
    if ((prisma as any).profileAnalyticsEvent?.create) {
      await (prisma as any).profileAnalyticsEvent.create({
        data: {
          profileUserId,
          visitorId,
          sessionId,
          type,
          path: path || null,
          referrer: referrer || null,
          // If still null, try to fetch visitor profile country as last resort
          country: country ? String(country).toUpperCase() : null,
          userAgent,
          browser,
          os,
          device,
          durationMs: typeof durationMs === 'number' ? Math.max(0, Math.floor(durationMs)) : null,
          meta: meta ? JSON.stringify(meta) : null,
        } as any,
      })
    } else {
      // Fallback to raw SQL insert if Prisma Client is out of date with the schema
      await prisma.$executeRaw`
        INSERT INTO "profile_analytics_events"
          ("profileUserId","visitorId","sessionId","type","path","referrer","country","userAgent","browser","os","device","durationMs","meta","createdAt")
        VALUES
          (${profileUserId}, ${visitorId}, ${sessionId}, ${type}, ${path || null}, ${referrer || null}, ${country ? String(country).toUpperCase() : null}, ${userAgent}, ${browser}, ${os}, ${device}, ${typeof durationMs === 'number' ? Math.max(0, Math.floor(durationMs)) : null}, ${meta ? JSON.stringify(meta) : null}, NOW())
      `
    }
  } catch (e: any) {
    // Don't fail the request – log and soft-ignore
    try {
      console.error('Profile analytics record failed:', e?.message || e, { profileUserId, type, visitorId })
    } catch {}
    return NextResponse.json({ ok: true, ignored: true, reason: 'db_error' })
  }

  return NextResponse.json({ ok: true })
}

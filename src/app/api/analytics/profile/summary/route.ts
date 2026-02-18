import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session: any = await getServerSession(authOptions as any)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id as string

  try {
    // Enforce global availability
    try {
      const addon = await (prisma as any).addon.findFirst({
        where: { key: 'PROFILE_ANALYTICS', active: true },
        select: { key: true },
      })
      if (!addon) return NextResponse.json({ error: 'Analytics disabled' }, { status: 403 })
    } catch {}

    // Enforce user-level enablement
    try {
      const st = await (prisma as any).userAddonState.findUnique({
        where: { userId_key: { userId, key: 'PROFILE_ANALYTICS' } },
        select: { enabled: true },
      })
      if (!st?.enabled) return NextResponse.json({ error: 'Analytics disabled' }, { status: 403 })
    } catch {}

    // Pull last 90 days of events for the owner to compute a summary
    const events: any[] = await (prisma as any).profileAnalyticsEvent.findMany({
      where: { profileUserId: userId, createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
      select: { type: true, sessionId: true, durationMs: true, country: true, browser: true, meta: true, referrer: true, path: true, visitorId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })

    const totalEvents = events.length
    const sessions = new Set(events.map(e => e.sessionId)).size
    const totalViews = events.filter(e => e.type === 'view_start').length
    const totalClicks = events.filter(e => e.type === 'click').length
    const durations = events.filter(e => e.type === 'view_end' && typeof e.durationMs === 'number').map(e => e.durationMs as number)
    const avgDurationMs = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0

    const mapCount = (arr: any[], key: string) => {
      const counts: Record<string, number> = {}
      for (const e of arr) {
        const k = (e as any)[key] ?? null
        const kk = k === null ? 'null' : String(k)
        counts[kk] = (counts[kk] || 0) + 1
      }
      return Object.entries(counts).map(([k, v]) => ({ [key]: k === 'null' ? null : k, count: v }))
    }

    const topBrowsers = mapCount(events, 'browser').sort((a, b) => b.count - a.count)
    const topReferrers = mapCount(events, 'referrer').sort((a, b) => b.count - a.count)

    // Build detailed referrer groups including whether a registered visitor exists and sample visitor profile
    const referrerGroups: Record<string, { count: number; visitorId?: string | null }> = {}
    for (const e of events) {
      const ref = (e as any).referrer ?? null
      const key = ref === null ? 'null' : String(ref)
      const group = (referrerGroups[key] = referrerGroups[key] || { count: 0, visitorId: undefined })
      group.count += 1
      if (!group.visitorId && (e as any).visitorId) {
        group.visitorId = String((e as any).visitorId)
      }
    }
    const topPaths = mapCount(events, 'path').sort((a, b) => b.count - a.count)

    // Click labels/hrefs from meta
    const clickEvents = events.filter(e => e.type === 'click')
    const clickMap: Record<string, number> = {}
    for (const e of clickEvents) {
      try {
        const meta = e.meta ? JSON.parse(e.meta) : {}
        const label = meta?.label || null
        const href = meta?.href || null
        const key = `${label || ''}|${href || ''}`
        clickMap[key] = (clickMap[key] || 0) + 1
      } catch {}
    }
    const topClicks = Object.entries(clickMap)
      .map(([k, v]) => {
        const [label, href] = k.split('|')
        return { label: label || null, href: href || null, count: v }
      })
      .sort((a, b) => b.count - a.count)

    // Identified visitors (logged-in)
    const withVisitors = events.filter(e => e.visitorId)
    const seen: Record<string, { count: number; last: Date }> = {}
    for (const e of withVisitors) {
      const vid = String(e.visitorId)
      seen[vid] = seen[vid] || { count: 0, last: e.createdAt }
      seen[vid].count += 1
      if (e.createdAt > seen[vid].last) seen[vid].last = e.createdAt
    }
    const visitorIds = Object.keys(seen)
    let visitorProfiles: Array<{ id: string; displayName: string | null; avatar: string | null; country: string | null }> = []
    if (visitorIds.length) {
      const users = await (prisma as any).user.findMany({
        where: { id: { in: visitorIds } },
        select: { id: true, profile: { select: { displayName: true, avatar: true, country: true } } },
      })
      visitorProfiles = users.map((u: any) => ({ id: u.id, displayName: u.profile?.displayName ?? null, avatar: u.profile?.avatar ?? null, country: u.profile?.country ?? null }))
    }
    const identifiedVisitors = visitorIds
      .map((id) => {
        const prof = visitorProfiles.find((p) => p.id === id)
        return { id, count: seen[id].count, lastVisitedAt: seen[id].last, displayName: prof?.displayName ?? null, avatar: prof?.avatar ?? null }
      })
      .sort((a, b) => b.lastVisitedAt.getTime() - a.lastVisitedAt.getTime())
      .slice(0, 20)

    // Enhanced Top Countries: use event country; if missing, fallback to visitor profile country
    const visitorCountryById: Record<string, string | null> = {}
    for (const vp of visitorProfiles) {
      visitorCountryById[vp.id] = vp.country ? String(vp.country).toUpperCase() : null
    }
    const topCountries = (async () => {
      const counts: Record<string, number> = {}
      for (const e of events) {
        let c: string | null = (e as any).country ? String((e as any).country).toUpperCase() : null
        if (!c && (e as any).visitorId) {
          const vid = String((e as any).visitorId)
          c = visitorCountryById[vid] || null
        }
        const key = c ?? 'null'
        counts[key] = (counts[key] || 0) + 1
      }
      // If everything is unknown or we have very few signals, merge recent ProfileVisit countries as a fallback
      const nonNull = Object.entries(counts).filter(([k]) => k !== 'null').length
      if (nonNull === 0) {
        try {
          const visits = await (prisma as any).profileVisit.findMany({
            where: { profileUserId: userId, visitedAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, visitorId: { not: null } },
            select: { visitorId: true, visitor: { select: { profile: { select: { country: true } } } } },
            take: 500,
          })
          for (const v of visits) {
            const c = v?.visitor?.profile?.country ? String(v.visitor.profile.country).toUpperCase() : null
            const key = c ?? 'null'
            counts[key] = (counts[key] || 0) + 1
          }
        } catch {}
      }
      return Object.entries(counts).map(([k, v]) => ({ country: k === 'null' ? null : k, count: v })).sort((a, b) => b.count - a.count)
    })()

    // Create detailed referrers array, attach sample visitor profile if available
    const topReferrersDetailed = Object.entries(referrerGroups)
      .map(([ref, grp]) => {
        const visitor = grp.visitorId ? visitorProfiles.find((p) => p.id === grp.visitorId) ?? null : null
        return {
          referrer: ref === 'null' ? null : ref,
          count: grp.count,
          registered: !!grp.visitorId,
          visitor,
        }
      })
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      totalEvents,
      sessions,
      totalViews,
      totalClicks,
      avgDurationMs,
      topCountries: await topCountries,
      topBrowsers,
      topClicks,
      topReferrers,
      topReferrersDetailed,
      topPaths,
      identifiedVisitors,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 })
  }
}

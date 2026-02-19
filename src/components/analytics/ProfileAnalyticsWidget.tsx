'use client'

import { useEffect, useMemo, useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { getAvatarUrl } from '@/utils/avatar'
import { SiGooglechrome, SiFirefoxbrowser, SiSafari, SiOpera, SiBrave } from 'react-icons/si'

type Summary = {
  totalEvents: number
  sessions: number
  totalViews: number
  totalClicks: number
  avgDurationMs: number
  topCountries: Array<{ country: string | null; count: number }>
  topBrowsers: Array<{ browser: string | null; count: number }>
  topReferrers: Array<{ referrer: string | null; count: number }>
  topPaths: Array<{ path: string | null; count: number }>
  topClicks: Array<{ label: string | null; href: string | null; count: number }>
  identifiedVisitors: Array<{ id: string; displayName: string | null; avatar: string | null; lastVisitedAt: string }>
  topReferrersDetailed?: Array<{
    referrer: string | null
    count: number
    registered: boolean
    visitor: { id: string; displayName: string | null; avatar: string | null } | null
  }>
}

export default function ProfileAnalyticsWidget() {
  const [globallyActive, setGloballyActive] = useState<boolean | null>(null)
  const [userEnabled, setUserEnabled] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Summary | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        // Check global availability (admin ACP toggle)
        try {
          const g = await fetch('/api/addons/available', { cache: 'no-store' })
          const gj = await g.json().catch(() => ({}))
          const keys: string[] = Array.isArray(gj?.activeKeys) ? gj.activeKeys : []
          const isGloballyActive = keys.includes('PROFILE_ANALYTICS')
          setGloballyActive(isGloballyActive)
          if (!isGloballyActive) {
            setUserEnabled(false)
            return
          }
        } catch {
          // If the global toggle endpoint fails, mark unknown
          setGloballyActive(null)
        }

        // Check per-user enabled state
        try {
          const s = await fetch('/api/addons/state', { cache: 'no-store' })
          if (s.ok) {
            const arr = await s.json()
            const enabled = Array.isArray(arr) && !!arr.find((x: any) => x?.key === 'PROFILE_ANALYTICS' && x?.enabled === true)
            setUserEnabled(enabled)
            if (!enabled) return
          } else {
            // If cannot load user state, default to not showing
            setUserEnabled(false)
            return
          }
        } catch {
          setUserEnabled(false)
          return
        }

        setLoading(true)
        const res = await fetch('/api/analytics/profile/summary', { cache: 'no-store' })
        if (!res.ok) throw new Error('SUMMARY_HTTP_' + res.status)
        const summary = (await res.json()) as Summary
        setData(summary)
      } catch (e: any) {
        setError('Analytics konnten nicht geladen werden')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const avgDuration = useMemo(() => {
    if (!data) return '0s'
    const sec = Math.round((data.avgDurationMs || 0) / 1000)
    if (sec < 60) return `${sec}s`
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}m ${s}s`
  }, [data])

  function formatReferrer(ref: string | null): string {
    if (!ref) return 'Direkt'
    try {
      const u = new URL(ref)
      const host = u.hostname.replace(/^www\./, '')
      const path = (u.pathname || '/').replace(/\/+$/, '/')
      const segs = path.split('/').filter(Boolean)
      if (segs.length === 0) return host
      const first = `/${segs[0]}`
      return host + first + (segs.length > 1 ? '/…' : '')
    } catch {
      // Not a full URL; show shortened plain text
      const t = String(ref)
      return t.length > 40 ? t.slice(0, 37) + '…' : t
    }
  }

  function titleFromSlug(slug: string) {
    const s = slug.replace(/[-_]+/g, ' ').trim()
    return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  // More human-friendly label for referrers: show profile names when possible
  function formatReferrerBadge(ref: string | null): string {
    if (!ref) return 'Direkt'
    try {
      const u = new URL(ref)
      const segs = (u.pathname || '/').split('/').filter(Boolean)
      // Try to detect profile URLs like /escorts/:id/:slug or /members/:id/:slug
      if ((segs[0] === 'escorts' || segs[0] === 'members') && segs.length >= 3) {
        const name = titleFromSlug(segs[2])
        return `Profil von ${name}`
      }
      // Fallback: compact host/path
      return formatReferrer(ref)
    } catch {
      return formatReferrer(ref)
    }
  }

  function shortHost(href: string | null): string {
    if (!href) return '—'
    try {
      const u = new URL(href)
      return u.hostname.replace(/^www\./, '')
    } catch {
      return href.length > 40 ? href.slice(0, 37) + '…' : href
    }
  }

  // Human-friendly label for click entries
  function formatClickBadge(c: { label: string | null; href: string | null }): string {
    const label = c.label || ''
    const href = c.href || ''
    // Try to infer tab name from query ?tab=
    try {
      const u = new URL(href, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
      const tab = u.searchParams.get('tab')
      if (tab) {
        const map: Record<string, string> = {
          dashboard: 'Dashboard',
          feed: 'Feed',
          profile: 'Profil',
          messages: 'Nachrichten',
          network: 'Netzwerk',
          stories: 'Stories',
          matching: 'Matching',
          forum: 'Forum',
        }
        const tabName = map[tab] || titleFromSlug(tab)
        return `Tab: ${tabName}`
      }
      const p = u.pathname || ''
      if (/\.(jpg|jpeg|png|webp|gif)$/i.test(p)) return 'Bild'
      if (p.includes('/feed') || label.toLowerCase().includes('feed')) return 'Feed'
      if (p.startsWith('/escorts') || p.startsWith('/members')) {
        const segs = p.split('/').filter(Boolean)
        if (segs.length >= 3) return `Profil: ${titleFromSlug(segs[2])}`
        return 'Profil'
      }
    } catch {}
    if (label) return label.length > 40 ? label.slice(0, 37) + '…' : label
    return shortHost(href)
  }

  // Convert country name/code to ISO2 for flagcdn
  function countryToISO2(country: string | null): string | null {
    if (!country) return null
    const raw = country.trim()
    if (raw.length === 2) return raw.toLowerCase()
    const m: Record<string, string> = {
      germany: 'de', deutschland: 'de', austria: 'at', österreich: 'at', switzerland: 'ch', schweiz: 'ch', france: 'fr', spain: 'es', italy: 'it',
      usa: 'us', 'united states': 'us', 'united states of america': 'us', uk: 'gb', 'united kingdom': 'gb', poland: 'pl', netherlands: 'nl', belgium: 'be'
    }
    const key = raw.toLowerCase()
    return m[key] || null
  }

  // Human-readable German country names from ISO2 or common English/German names
  function countryDisplay(country: string | null): string {
    if (!country) return '—'
    const c = country.trim()
    const iso = c.length === 2 ? c.toUpperCase() : (countryToISO2(c) || '').toUpperCase()
    const byIso: Record<string, string> = {
      DE: 'Deutschland', AT: 'Österreich', CH: 'Schweiz', FR: 'Frankreich', ES: 'Spanien', IT: 'Italien',
      US: 'USA', GB: 'Vereinigtes Königreich', NL: 'Niederlande', BE: 'Belgien', PL: 'Polen', TR: 'Türkei', RU: 'Russland',
    }
    if (iso && byIso[iso]) return byIso[iso]
    const byName: Record<string, string> = {
      germany: 'Deutschland', deutschland: 'Deutschland', austria: 'Österreich', österreich: 'Österreich', switzerland: 'Schweiz', schweiz: 'Schweiz',
      france: 'Frankreich', spain: 'Spanien', italy: 'Italien', usa: 'USA', 'united states': 'USA', 'united kingdom': 'Vereinigtes Königreich', uk: 'Vereinigtes Königreich'
    }
    const key = c.toLowerCase()
    return byName[key] || c
  }

  // Official-like browser icons via react-icons/si
  function BrowserIcon({ name, size = 16 }: { name?: string | null; size?: number }) {
    const n = (name || '').toLowerCase()
    if (n.includes('chrome')) return <SiGooglechrome size={size} color="#4285F4" aria-hidden />
    if (n.includes('firefox')) return <SiFirefoxbrowser size={size} color="#FF7139" aria-hidden />
    if (n.includes('safari')) return <SiSafari size={size} color="#0FB3FF" aria-hidden />
    if (n.includes('edge')) return <span style={{ width: size, height: size, background: 'radial-gradient(circle at 30% 30%, #0cc1c8, #2bc3ff 60%, #0b7bc1)', borderRadius: '50%', display: 'inline-block' }} />
    if (n.includes('opera')) return <SiOpera size={size} color="#FF1B2D" aria-hidden />
    if (n.includes('brave')) return <SiBrave size={size} color="#FB542B" aria-hidden />
    return <span style={{ width: size, height: size, background: '#9ca3af', borderRadius: 4, display: 'inline-block' }} />
  }

  // Hide widget unless globally active and user has explicitly enabled it
  if (globallyActive === false) return null
  if (userEnabled !== true) return null

  return (
    <div className="bg-white border border-gray-100">
      <div className="p-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-thin tracking-wider text-gray-800">PROFIL-ANALYTICS</h3>
          <p className="text-xs text-gray-600 mt-1">Überblick der letzten 90 Tage</p>
        </div>
      </div>

      {loading ? (
        <div className="px-6 pb-6 text-sm text-gray-500">Wird geladen…</div>
      ) : error ? (
        <div className="px-6 pb-6 text-sm text-red-600">{error}</div>
      ) : !data ? (
        <div className="px-6 pb-6 text-sm text-gray-500">Keine Daten</div>
      ) : (
        <div className="px-6 pb-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50">
              <div className="text-xl font-thin tracking-wider text-gray-800">{data.sessions}</div>
              <div className="text-[11px] font-light tracking-widest text-gray-500 uppercase">SITZUNGEN</div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-xl font-thin tracking-wider text-gray-800">{data.totalViews}</div>
              <div className="text-[11px] font-light tracking-widest text-gray-500 uppercase">AUFRUFE</div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-xl font-thin tracking-wider text-gray-800">{data.totalClicks}</div>
              <div className="text-[11px] font-light tracking-widest text-gray-500 uppercase">KLICKS</div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-xl font-thin tracking-wider text-gray-800">{avgDuration}</div>
              <div className="text-[11px] font-light tracking-widest text-gray-500 uppercase">Ø-DAUER</div>
            </div>
          </div>

          {/* Top lists */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-xs font-light tracking-widest text-gray-800 uppercase mb-2">Top Länder</div>
              <ul className="text-sm text-gray-700 space-y-1">
                {(data.topCountries || []).slice(0, 5).map((c, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {(() => {
                        const code = countryToISO2((c as any).country ?? null)
                        return code ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`https://flagcdn.com/w20/${code}.png`} alt={(c as any).country || code.toUpperCase()} width={20} height={14} style={{ width: 20, height: 14, objectFit: 'cover', border: '1px solid #e5e7eb', display: 'block' }} />
                        ) : (
                          <span style={{ width: 20, height: 14, border: '1px solid #e5e7eb', background: '#f3f4f6', display: 'inline-block' }} />
                        )
                      })()}
                      <span className="truncate max-w-[140px]">{countryDisplay((c as any).country ?? null)}</span>
                    </div>
                    <span className="text-gray-500">{(c as any).count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-light tracking-widest text-gray-800 uppercase mb-2">Top Browser</div>
              <ul className="text-sm text-gray-700 space-y-1">
                {(data.topBrowsers || []).slice(0, 5).map((b, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <BrowserIcon name={b.browser} />
                      <span className="truncate max-w-[140px]">{b.browser || '—'}</span>
                    </div>
                    <span className="text-gray-500">{b.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-light tracking-widest text-gray-800 uppercase mb-2">Top Referrer</div>
              <Tooltip.Provider delayDuration={100}>
                <div className="flex flex-wrap gap-2">
                  {(data.topReferrersDetailed ?? data.topReferrers?.map(r => ({ referrer: r.referrer, count: r.count, registered: false, visitor: null })) ?? [])
                    .slice(0, 8)
                    .map((r, idx) => (
                      <Tooltip.Root key={idx}>
                        <Tooltip.Trigger asChild>
                          <span className="inline-flex items-center gap-2 px-2.5 py-1 text-xs rounded-none bg-gray-50 text-gray-800 border border-gray-200 cursor-default" title={r.referrer || '—'}>
                            <span className="truncate max-w-[200px]">{formatReferrerBadge(r.referrer)}</span>
                            <span className="px-1.5 py-0.5 rounded-none bg-pink-100 text-pink-700 text-[10px] leading-none">{r.count}</span>
                          </span>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content sideOffset={8} className="rounded bg-white border border-gray-200 shadow-md p-2 text-xs text-gray-800 flex items-center gap-2 max-w-[260px]">
                            {r.registered && r.visitor ? (
                              <>
                                <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={getAvatarUrl(r.visitor.avatar)} alt={r.visitor.displayName || 'Avatar'} className="h-full w-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-medium truncate max-w-[200px]">{r.visitor.displayName || 'Registrierter Besucher'}</div>
                                  <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{formatReferrer(r.referrer)}</div>
                                </div>
                              </>
                            ) : (
                              <div className="text-gray-700">Nicht Registrierter Besucher</div>
                            )}
                            <Tooltip.Arrow className="fill-white" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                  ))}
                </div>
              </Tooltip.Provider>
            </div>
          </div>

          {/* Top clicks */}
          {Array.isArray(data.topClicks) && data.topClicks.length > 0 && (
            <div className="mt-6">
              <div className="text-xs font-light tracking-widest text-gray-800 uppercase mb-2">Top Klicks</div>
              <div className="flex flex-wrap gap-2">
                {data.topClicks.slice(0, 10).map((c, idx) => (
                  <span key={idx} className="inline-flex items-center gap-2 px-2.5 py-1 text-xs rounded-none bg-gray-50 text-gray-800 border border-gray-200" title={c.href || c.label || '—'}>
                    <span className="truncate max-w-[200px]">{formatClickBadge(c)}</span>
                    <span className="px-1.5 py-0.5 rounded-none bg-pink-100 text-pink-700 text-[10px] leading-none">{c.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

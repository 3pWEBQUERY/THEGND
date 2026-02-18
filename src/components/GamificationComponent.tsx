"use client"

import { useEffect, useMemo, useState } from 'react'
import { Info } from 'lucide-react'

type Overview = {
  profile: {
    points: number
    level: number
    streakDays: number
    totalLogins: number
  }
  events: Array<{ id: string; type: string; points: number; metadata?: string | null; createdAt: string }>
  badges: Array<{ id: string; awardedAt: string; badge: { id: string; key: string; name: string; description?: string | null; icon?: string | null } }>
  perks: Array<{ id: string; unlockedAt: string; claimedAt?: string | null; perk: { id: string; key: string; name: string; description?: string | null; thresholdPts: number } }>
  perksAll: Array<{ id: string; key: string; name: string; description?: string | null; thresholdPts: number; unlocked: boolean; unlockedAt?: string | null; claimedAt?: string | null }>
  progress: { currentLevel: number; nextLevel: number; toNextPoints: number; levelProgressPct: number }
}

export default function GamificationComponent() {
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(false)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/gamification', { cache: 'no-store' })
      if (!res.ok) throw new Error('Laden fehlgeschlagen')
      const json = await res.json()
      setData(json)
    } catch (e: any) {
      setError(e?.message || 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onClaim = async (perkId: string) => {
    try {
      setClaiming(perkId)
      const res = await fetch('/api/gamification/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perkId })
      })
      if (!res.ok) throw new Error('Einlösen fehlgeschlagen')
      await load()
    } catch (e: any) {
      setError(e?.message || 'Einlösen fehlgeschlagen')
    } finally {
      setClaiming(null)
    }
  }

  const hero = useMemo(() => {
    if (!data) return null
    const p = data.profile
    const pr = data.progress
    return (
      <div className="bg-white border border-gray-100">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-stretch md:items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-thin tracking-wider text-gray-900">GAMIFIKATION</h2>
              <div className="w-16 h-px bg-pink-500 mt-3" />
              <p className="mt-4 text-sm font-light tracking-wide text-gray-600">
                Sammle Punkte, steigere dein Level, sichere dir Abzeichen und schalte Vorteile frei – durch tägliche Aktivität, Beiträge, Forum & mehr.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 md:w-auto">
              <div className="text-center p-4 bg-gray-50">
                <div className="text-2xl font-thin tracking-wider text-gray-900">{p.points}</div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500">PUNKTE</div>
              </div>
              <div className="text-center p-4 bg-gray-50">
                <div className="text-2xl font-thin tracking-wider text-gray-900">{p.level}</div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500">LEVEL</div>
              </div>
              <div className="text-center p-4 bg-gray-50">
                <div className="text-2xl font-thin tracking-wider text-gray-900">{p.streakDays}</div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500">STREAK</div>
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <div className="text-sm font-light tracking-wider text-gray-800">Fortschritt zu Level {data.progress.nextLevel}</div>
              <div className="text-xs font-light tracking-wide text-gray-500">Noch {data.progress.toNextPoints} Punkte</div>
            </div>
            <div className="mt-2 h-2 w-full bg-gray-100">
              <div className="h-2 bg-pink-500" style={{ width: `${Math.min(100, Math.max(0, data.progress.levelProgressPct)).toFixed(0)}%` }} />
            </div>
          </div>
        </div>
      </div>
    )
  }, [data])

  if (loading && !data) {
    return <div className="p-8 text-sm text-gray-500">Wird geladen...</div>
  }
  if (error && !data) {
    return <div className="p-8 text-sm text-red-600">{error}</div>
  }
  if (!data) return null

  return (
    <div className="space-y-8">
      {hero}

      {/* ABZEICHEN */}
      <div className="bg-white border border-gray-100">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-thin tracking-widest text-gray-900 uppercase">ABZEICHEN</h3>
            <div className="text-xs text-gray-500">{data.badges.length} erhalten</div>
          </div>
          {data.badges.length === 0 ? (
            <div className="text-sm text-gray-500">Noch keine Abzeichen – bleib aktiv und sammle deine ersten!</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.badges.map((b) => (
                <div key={b.id} className="border border-gray-100 bg-gray-50 p-4">
                  <div className="text-2xl">{b.badge.icon || '🎖️'}</div>
                  <div className="mt-2 text-sm font-light tracking-wider text-gray-900">{b.badge.name}</div>
                  {b.badge.description && (
                    <div className="mt-1 text-xs text-gray-600">{b.badge.description}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* VORTEILE */}
      <div className="bg-white border border-gray-100">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-thin tracking-widest text-gray-900 uppercase">VORTEILE</h3>
            <div className="text-xs text-gray-500">Schalte Vorteile durch Punkte frei</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.perksAll.map((p) => {
              const unlocked = !!p.unlocked
              const claimed = !!p.claimedAt
              const remaining = Math.max(0, p.thresholdPts - data.profile.points)
              const unlockedAt = p.unlockedAt ? new Date(p.unlockedAt) : null
              const recent = unlocked && !claimed && unlockedAt ? (Date.now() - unlockedAt.getTime()) < 24 * 60 * 60 * 1000 : false
              const pctRaw = Math.max(0, Math.min(100, Math.floor((data.profile.points / Math.max(1, p.thresholdPts)) * 100)))
              const pct = claimed ? 100 : pctRaw
              // Remaining time for time-limited perks
              const D: Record<string, number> = {
                PROFILE_BOOST_7D: 7,
                STORY_SPOTLIGHT_7D: 7,
                VIP_BADGE_30D: 30,
                AD_FREE_30D: 30,
                MARKETING_HOME_TILE_7D: 7,
              }
              let remainingLabel: string | null = null
              if (claimed && p.claimedAt && D[p.key]) {
                const endsAt = new Date(new Date(p.claimedAt).getTime() + D[p.key] * 24 * 60 * 60 * 1000)
                const diffMs = endsAt.getTime() - Date.now()
                if (diffMs > 0) {
                  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
                  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
                  if (days > 0) remainingLabel = `noch ${days} Tag${days === 1 ? '' : 'e'} ${hours} Std`
                  else remainingLabel = `noch ${hours} Std`
                } else {
                  remainingLabel = 'abgelaufen'
                }
              }
              return (
                <div
                  key={p.id}
                  className={`p-4 flex flex-col justify-between border ${unlocked ? 'border-pink-200 bg-pink-50' : 'border-gray-100 bg-gray-50'}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`text-sm font-light tracking-wider ${unlocked ? 'text-gray-900' : 'text-gray-600'}`}>{p.name}</div>
                      {recent && (
                        <span className="text-[10px] font-medium uppercase tracking-widest text-white bg-pink-600 px-1.5 py-0.5">NEU</span>
                      )}
                      <div className="relative group">
                        <Info className={`h-4 w-4 ${unlocked ? 'text-pink-600' : 'text-gray-400'}`} />
                        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-10 mt-2 hidden w-60 whitespace-normal rounded border border-gray-200 bg-white p-3 text-xs leading-relaxed text-gray-700 shadow-lg group-hover:block">
                          <div className="font-medium tracking-wider text-gray-900 mb-1">{p.name}</div>
                          {p.description ? <div>{p.description}</div> : <div>Schalte diesen Vorteil durch Sammeln von Punkten frei.</div>}
                          <div className="mt-2 text-[10px] uppercase tracking-widest text-gray-500">Schwelle: {p.thresholdPts} Punkte</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] uppercase tracking-widest text-gray-500">Schwelle: {p.thresholdPts} Punkte</div>
                    {!unlocked && (
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-gray-400">Noch {remaining} Punkte</div>
                    )}
                    {/* Fortschrittsindikator */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] uppercase tracking-widest text-gray-500">Fortschritt</div>
                        <div className="text-[10px] tracking-widest text-gray-500">{pct}%{claimed && ' • eingelöst'}</div>
                      </div>
                      <div className={`mt-1 h-2 w-full rounded-full overflow-hidden ${claimed ? 'bg-emerald-100' : unlocked ? 'bg-gradient-to-r from-pink-100 to-rose-100' : 'bg-gradient-to-r from-gray-200 to-gray-100'}`}>
                        <div
                          className={`${claimed ? 'bg-gradient-to-r from-emerald-600 to-emerald-500' : unlocked ? 'bg-gradient-to-r from-pink-600 to-rose-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'} h-2 transition-[width] duration-500 ease-out`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    {claimed && remainingLabel && (
                      <div className="mt-2 text-[10px] uppercase tracking-widest text-amber-600">{remainingLabel}</div>
                    )}
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => unlocked && !claimed && onClaim(p.id)}
                      disabled={!unlocked || claimed || claiming === p.id}
                      className={`text-xs uppercase tracking-widest px-3 py-2 border transition-colors ${
                        !unlocked
                          ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                          : claimed
                            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'border-pink-500 text-pink-600 hover:bg-pink-100'
                      }`}
                    >
                      {!unlocked ? 'NICHT FREIGESCHALTET' : claimed ? 'Bereits eingelöst' : claiming === p.id ? 'Wird eingelöst...' : 'JETZT EINLÖSEN'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* AKTIVITÄT */}
      <div className="bg-white border border-gray-100">
        <div className="p-6 md:p-8">
          <h3 className="text-lg font-thin tracking-widest text-gray-900 uppercase mb-6">AKTIVITÄT</h3>
          {data.events.length === 0 ? (
            <div className="text-sm text-gray-500">Noch keine Aktivitäten.</div>
          ) : (
            <ul className="space-y-3">
              {data.events.map((e) => (
                <li key={e.id} className="flex items-center justify-between border border-gray-100 p-3 bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 text-base">
                      {renderEventIcon(e)}
                    </div>
                    <div className="text-sm font-light tracking-wide text-gray-800 truncate">
                      {renderEventTitle(e)}
                    </div>
                  </div>
                  <div className="text-xs font-light tracking-widest text-pink-600">+{e.points} P</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function renderEventTitle(e: { type: string; createdAt: string; metadata?: string | null }) {
  const when = new Date(e.createdAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  switch (e.type) {
    case 'DAILY_LOGIN':
      return `Tägliches Anmelden • ${when}`
    case 'FORUM_POST':
      return `Forum Beitrag • ${when}`
    case 'FORUM_REPLY':
      return `Forum Antwort • ${when}`
    case 'FORUM_THREAD':
      return `Forum Thema erstellt • ${when}`
    case 'FEED_POST':
      return `Feed Beitrag • ${when}`
    case 'BLOG_POST':
      return `Blog Beitrag erstellt • ${when}`
    case 'BLOG_PUBLISH':
      return `Blog Beitrag veröffentlicht • ${when}`
    case 'BLOG_UPDATE_MAJOR':
      return `Blog Beitrag aktualisiert (große Änderung) • ${when}`
    case 'FORUM_THREAD_CLOSE':
      return `Forum Thema geschlossen • ${when}`
    case 'FORUM_THREAD_OPEN':
      return `Forum Thema geöffnet • ${when}`
    case 'BADGE_AWARDED': {
      let name = 'Abzeichen erhalten'
      try {
        const m = e.metadata ? JSON.parse(e.metadata) : null
        if (m?.badgeName) name = `Abzeichen: ${m.badgeName}`
      } catch {}
      return `${name} • ${when}`
    }
    case 'PERK_CLAIMED': {
      let name = 'Vorteil eingelöst'
      try {
        const m = e.metadata ? JSON.parse(e.metadata) : null
        if (m?.perkName) name = `Vorteil eingelöst: ${m.perkName}`
      } catch {}
      return `${name} • ${when}`
    }
    case 'COMMENT_VERIFIED':
      return `Verifizierte Bewertung • ${when}`
    case 'REGULAR_USE':
      return `Regelmäßige Nutzung • ${when}`
    default:
      return `${e.type} • ${when}`
  }
}

function renderEventIcon(e: { type: string; metadata?: string | null }) {
  // Try to parse metadata once
  let meta: any = null
  try { meta = e.metadata ? JSON.parse(e.metadata) : null } catch {}
  switch (e.type) {
    case 'DAILY_LOGIN':
      return <span aria-hidden>✅</span>
    case 'FORUM_POST':
      return <span aria-hidden>💬</span>
    case 'FORUM_REPLY':
      return <span aria-hidden>↩️</span>
    case 'FORUM_THREAD':
      return <span aria-hidden>🧵</span>
    case 'FORUM_THREAD_CLOSE':
      return <span aria-hidden>🔒</span>
    case 'FORUM_THREAD_OPEN':
      return <span aria-hidden>🔓</span>
    case 'FEED_POST':
      return <span aria-hidden>📰</span>
    case 'BLOG_POST':
      return <span aria-hidden>✍️</span>
    case 'BLOG_PUBLISH':
      return <span aria-hidden>🚀</span>
    case 'BLOG_UPDATE_MAJOR':
      return <span aria-hidden>🛠️</span>
    case 'BADGE_AWARDED':
      return <span aria-hidden>{meta?.badgeIcon || '🎖️'}</span>
    case 'PERK_CLAIMED':
      return <span aria-hidden>🏅</span>
    default:
      return <span aria-hidden>⭐</span>
  }
}

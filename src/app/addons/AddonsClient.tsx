'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'

type AddonKey = 'PROFILE_ANALYTICS' | 'COUNTRY_BLOCK' | 'SEO'

type AddonState = {
  id: string
  userId: string
  key: AddonKey
  enabled: boolean
  settings?: string | null
}

// Note: Analytics summary rendering has been removed from the Add-ons page. View analytics in the dashboard.

export default function AddonsClient() {
  const { data: session } = useSession()
  const [states, setStates] = useState<AddonState[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<AddonKey | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [availableKeys, setAvailableKeys] = useState<string[] | null>(null)
  // Removed summary state; analytics are shown only on the dashboard

  const items = useMemo(() => [
    {
      key: 'PROFILE_ANALYTICS' as const,
      title: 'Profil-Analytics',
      description: 'Umfassende Statistiken zu deinem Profil: Besucherzahlen, Länder, Browser/Devices, Verweildauer, Klickziele – inkl. identifizierbarer Besucher (Avatar & Anzeigename) sofern eingeloggt.'
    },
    {
      key: 'COUNTRY_BLOCK' as const,
      title: 'Ländersperre (ESCORTS)',
      description: 'Sperre dein Profil für ausgewählte Länder der Welt. Verwaltung unter LÄNDERSPERRE im Profil-Menü.'
    },
    {
      key: 'SEO' as const,
      title: 'SEO (Suchmaschinen-Optimierung)',
      description: 'Erhalte SEO- & Keyword-Vorschläge, um deine Profiltexte für lokale Suchanfragen in Google zu optimieren. Enthält Meta‑Title/-Description, Keyword-Ideen, Strukturvorschläge und Local‑SEO Tipps. Verwaltung unter PROFIL → SEO.'
    },
  ], [])

  const fetchStates = async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, a] = await Promise.all([
        fetch('/api/addons/state', { cache: 'no-store' }),
        fetch('/api/addons/available', { cache: 'no-store' }),
      ])
      if (!s.ok) throw new Error('fail')
      const data = await s.json()
      setStates(Array.isArray(data) ? data : [])
      if (a.ok) {
        const aj = await a.json()
        setAvailableKeys(Array.isArray(aj?.activeKeys) ? aj.activeKeys : [])
      }
    } catch {
      setError('Konnte Add-ons nicht laden')
    } finally {
      setLoading(false)
    }
  }

  // Removed summary fetching; analytics are shown only on the dashboard

  useEffect(() => { fetchStates() }, [])

  const toggle = async (key: AddonKey, enabled: boolean) => {
    try {
      setSavingKey(key)
      setError(null)
      const res = await fetch('/api/addons/state', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, enabled })
      })
      if (!res.ok) throw new Error('fail')
      await fetchStates()
    } catch {
      setError('Speichern fehlgeschlagen')
    } finally {
      setSavingKey(null)
    }
  }

  const stateFor = (key: AddonKey) => states?.find(s => s.key === key)

  return (
    <div className="space-y-8">
      {error && <div className="text-sm text-amber-700">{error}</div>}
      {loading ? (
        <div className="text-sm text-gray-500">Lade…</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {items.filter((it) => {
            // Gate SEO by user type
            if (it.key === 'SEO') {
              const ut = (session?.user as any)?.userType as string | undefined
              const allowed = ['ESCORT','AGENCY','CLUB','STUDIO']
              if (!ut || !allowed.includes(ut)) return false
            }
            return true
          }).map((it) => {
            const st = stateFor(it.key)
            const enabled = !!st?.enabled
            const globallyAvailable = availableKeys ? availableKeys.includes(it.key) : true
            return (
              <div key={it.key} className="border border-gray-200 p-6">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h2 className="text-lg font-light tracking-widest text-gray-900">{it.title.toUpperCase()}</h2>
                    <p className="mt-2 text-sm text-gray-600 max-w-3xl">{it.description}</p>
                    {!globallyAvailable && (
                      <p className="mt-2 text-xs text-gray-500">Dieses Add-on ist derzeit global deaktiviert.</p>
                    )}
                  </div>
                  <label className="inline-flex items-center gap-2 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={enabled}
                      onChange={(e) => toggle(it.key, e.target.checked)}
                      disabled={savingKey === it.key || !globallyAvailable}
                    />
                    <span className="text-xs uppercase tracking-widest text-gray-700">{enabled ? 'AKTIV' : 'INAKTIV'}</span>
                  </label>
                </div>
                {/* Analytics summary has been removed from the Add-ons page. View details in the Dashboard (tab=dashboard). */}
                {it.key === 'SEO' && enabled && (
                  <div className="mt-4">
                    <a href="/addons/seo" className="text-xs uppercase tracking-widest text-pink-600 hover:underline">Zu den SEO-Tools</a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

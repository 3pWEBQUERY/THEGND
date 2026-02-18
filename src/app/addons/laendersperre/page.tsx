'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardHeader from '@/components/DashboardHeader'
import Footer from '@/components/homepage/Footer'
import { MultiSelect } from '@/components/ui/multi-select'
import { CONTINENT_ORDER, allCountryOptionsByContinent } from '@/data/countries-by-continent.de'

export const dynamic = 'force-dynamic'

type AddonState = {
  key: string
  enabled: boolean
  settings?: string | null
}

type PersistPayload = {
  key: 'COUNTRY_BLOCK'
  enabled: boolean
  settings?: { blocked: string[] } | null
}

export default function CountryBlockPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [enabled, setEnabled] = useState<boolean>(true)
  const [blocked, setBlocked] = useState<string[]>([])

  const byContinent = useMemo(() => allCountryOptionsByContinent(), [])

  // Auth guard (mirror pattern of addons page)
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin?callbackUrl=/addons/laendersperre')
    }
  }, [status, router])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/addons/state', { cache: 'no-store' })
        if (!res.ok) throw new Error('failed')
        const data: AddonState[] = await res.json()
        const st = Array.isArray(data) ? data.find(s => s.key === 'COUNTRY_BLOCK') : undefined
        if (st) {
          setEnabled(!!st.enabled)
          try {
            const parsed = st.settings ? JSON.parse(st.settings) : null
            if (parsed && Array.isArray(parsed.blocked)) {
              setBlocked(parsed.blocked)
            }
          } catch {}
        }
      } catch {
        setError('Konnte aktuellen Status nicht laden')
      } finally {
        setLoading(false)
      }
    }
    if (session?.user?.id) load()
  }, [session?.user?.id])

  const updateContinentSelection = (continent: string, selection: string[]) => {
    const options = byContinent[continent] || []
    const codes = new Set(options.map(o => o.value))
    const rest = blocked.filter(code => !codes.has(code))
    setBlocked([...rest, ...selection])
  }

  const selectAllContinent = (continent: string) => {
    const options = byContinent[continent] || []
    updateContinentSelection(continent, options.map(o => o.value))
  }

  const clearContinent = (continent: string) => {
    updateContinentSelection(continent, [])
  }

  const selectAllWorld = () => {
    const all = CONTINENT_ORDER.flatMap(k => (byContinent[k] || []).map(o => o.value))
    setBlocked(Array.from(new Set(all)))
  }

  const clearAll = () => setBlocked([])

  const save = async () => {
    try {
      setSaving(true)
      setSaved(false)
      setError(null)
      const payload: PersistPayload = { key: 'COUNTRY_BLOCK', enabled: true, settings: { blocked } }
      const res = await fetch('/api/addons/state', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('failed')
      setSaved(true)
    } catch {
      setError('Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader session={session} activeTab="addons" setActiveTab={() => {}} />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-light tracking-widest text-gray-900">LÄNDERSPERRE</h1>
          <Link href="/addons" className="text-xs uppercase tracking-widest text-gray-600 hover:text-pink-600">Zurück zu Add-ons</Link>
        </div>
        <p className="mt-2 text-sm text-gray-600 max-w-3xl">
          Sperre dein Profil für ausgewählte Länder. Besucher aus gesperrten Ländern sehen dein Profil nicht.
        </p>

        {error && <div className="mt-4 text-sm text-amber-700">{error}</div>}
        {loading ? (
          <div className="mt-6 text-sm text-gray-500">Lade…</div>
        ) : (
          <div className="mt-6 space-y-8">
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 select-none cursor-pointer">
                <input type="checkbox" className="h-4 w-4" checked={enabled} onChange={e => setEnabled(e.target.checked)} disabled />
                <span className="text-xs uppercase tracking-widest text-gray-700">AKTIV</span>
              </label>
              <button onClick={selectAllWorld} className="text-xs uppercase tracking-widest text-gray-700 hover:text-pink-600">Alle Länder weltweit sperren</button>
              <button onClick={clearAll} className="text-xs uppercase tracking-widest text-gray-700 hover:text-pink-600">Alle löschen</button>
              <span className="text-xs text-gray-500">{blocked.length} Länder ausgewählt</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {CONTINENT_ORDER.map((continent) => {
                const opts = byContinent[continent] || []
                const selected = blocked.filter(v => opts.some(o => o.value === v))
                return (
                  <div key={continent} className="border border-gray-200 p-6">
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="text-lg font-light tracking-widest text-gray-900">{continent.toUpperCase()}</h2>
                      <div className="flex items-center gap-3">
                        <button className="text-xs uppercase tracking-widest text-gray-700 hover:text-pink-600" onClick={() => selectAllContinent(continent)}>Alle</button>
                        <button className="text-xs uppercase tracking-widest text-gray-700 hover:text-pink-600" onClick={() => clearContinent(continent)}>Leeren</button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <MultiSelect
                        options={opts}
                        value={selected}
                        onChange={(vals) => updateContinentSelection(continent, vals)}
                        placeholder={`Länder aus ${continent} wählen…`}
                        searchPlaceholder="Suchen…"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={save}
                disabled={saving}
                className="px-6 py-3 bg-pink-600 text-white text-xs uppercase tracking-widest hover:bg-pink-700 disabled:opacity-60"
              >
                Speichern
              </button>
              {saved && <span className="text-sm text-green-600">Gespeichert</span>}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

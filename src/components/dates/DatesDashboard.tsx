"use client"

import { useEffect, useMemo, useState } from 'react'
import DashboardHeader from '@/components/DashboardHeader'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import DatesCalendarWidget from '@/components/dates/DatesCalendarWidget'

export default function DatesDashboard() {
  const { data: session, status } = useSession()
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/dates/settings', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        setSettings(data?.settings || { currency: 'EUR', durations: [], extras: [], places: [] })
      } finally {
        setLoading(false)
      }
    }
    if (status === 'authenticated') load()
  }, [status])

  const currencyFmt = (cents?: number) => typeof cents === 'number' ? (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: settings?.currency || 'EUR' }) : '-'

  const addDuration = () => setSettings((s: any) => ({ ...s, durations: [...(s.durations||[]), { minutes: 60, priceCents: 6500, label: '1 Std.' }] }))
  const addExtra = () => setSettings((s: any) => ({ ...s, extras: [...(s.extras||[]), { key: `EXTRA_${Date.now()}`, label: 'Extra', priceCents: 2500 }] }))
  const addPlace = () => setSettings((s: any) => ({ ...s, places: [...(s.places||[]), { key: `PLACE_${Date.now()}`, label: 'Ort' }] }))

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/dates/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings }) })
      if (!res.ok) throw new Error('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') return null
  if (!session) return null

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader session={session} activeTab="dates" setActiveTab={() => {}} />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-light tracking-widest text-gray-900">DATE ANFRAGEN</h1>
            <div className="w-24 h-px bg-pink-500 mt-3" />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={save} disabled={saving} className="bg-pink-500 hover:bg-pink-600 text-white rounded-none px-4 py-2 h-auto text-xs uppercase tracking-widest">{saving ? 'Speichere…' : 'Speichern'}</Button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-gray-200 p-6">
            <h2 className="text-sm font-light tracking-widest text-gray-800 uppercase">Einstellungen</h2>
            {loading ? (
              <p className="mt-3 text-sm text-gray-500">Lade…</p>
            ) : (
              <div className="mt-4 space-y-6">
                <div>
                  <label className="block text-[11px] text-gray-600 uppercase tracking-widest">Währung</label>
                  <select value={settings?.currency || 'EUR'} onChange={(e) => setSettings((s: any) => ({ ...s, currency: e.target.value }))} className="mt-2 w-full border border-gray-200 px-4 py-3">
                    <option value="EUR">EUR</option>
                    <option value="CHF">CHF</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] text-gray-600 uppercase tracking-widest">Dauern & Preise</label>
                    <button onClick={addDuration} className="text-xs uppercase tracking-widest text-pink-600">Hinzufügen</button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {(settings?.durations || []).map((d: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <input type="text" value={d.label || ''} onChange={e => setSettings((s: any) => { const next = { ...s }; next.durations[idx].label = e.target.value; return next })} placeholder="Label" className="col-span-5 border border-gray-200 px-3 py-2" />
                        <input type="number" value={d.minutes} onChange={e => setSettings((s: any) => { const next = { ...s }; next.durations[idx].minutes = Number(e.target.value||0); return next })} className="col-span-3 border border-gray-200 px-3 py-2" />
                        <input type="number" value={d.priceCents} onChange={e => setSettings((s: any) => { const next = { ...s }; next.durations[idx].priceCents = Number(e.target.value||0); return next })} className="col-span-3 border border-gray-200 px-3 py-2" />
                        <button onClick={() => setSettings((s: any) => ({ ...s, durations: s.durations.filter((_: any, i: number) => i !== idx) }))} className="col-span-1 text-xs text-rose-600">Entf.</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] text-gray-600 uppercase tracking-widest">Extras</label>
                    <button onClick={addExtra} className="text-xs uppercase tracking-widest text-pink-600">Hinzufügen</button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {(settings?.extras || []).map((ex: any, idx: number) => (
                      <div key={ex.key} className="grid grid-cols-12 gap-2 items-center">
                        <input type="text" value={ex.label} onChange={e => setSettings((s: any) => { const next = { ...s }; next.extras[idx].label = e.target.value; return next })} className="col-span-6 border border-gray-200 px-3 py-2" />
                        <input type="number" value={ex.priceCents} onChange={e => setSettings((s: any) => { const next = { ...s }; next.extras[idx].priceCents = Number(e.target.value||0); return next })} className="col-span-5 border border-gray-200 px-3 py-2" />
                        <button onClick={() => setSettings((s: any) => ({ ...s, extras: s.extras.filter((_: any, i: number) => i !== idx) }))} className="col-span-1 text-xs text-rose-600">Entf.</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] text-gray-600 uppercase tracking-widest">Ort(e)</label>
                    <button onClick={addPlace} className="text-xs uppercase tracking-widest text-pink-600">Hinzufügen</button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {(settings?.places || []).map((p: any, idx: number) => (
                      <div key={p.key} className="grid grid-cols-12 gap-2 items-center">
                        <input type="text" value={p.label} onChange={e => setSettings((s: any) => { const next = { ...s }; next.places[idx].label = e.target.value; return next })} className="col-span-10 border border-gray-200 px-3 py-2" />
                        <button onClick={() => setSettings((s: any) => ({ ...s, places: s.places.filter((_: any, i: number) => i !== idx) }))} className="col-span-2 text-xs text-rose-600">Entf.</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border border-gray-200 p-6">
            <h2 className="text-sm font-light tracking-widest text-gray-800 uppercase">Kalender</h2>
            <DatesCalendarWidget scope="ESCORT" />
          </div>
        </div>
      </div>
    </div>
  )
}

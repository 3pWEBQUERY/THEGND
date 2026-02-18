'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

// Types mirroring Prisma models
type Addon = {
  id?: string
  key?: 'ESCORT_OF_DAY' | 'ESCORT_OF_WEEK' | 'ESCORT_OF_MONTH' | 'CITY_BOOST' | 'PROFILE_ANALYTICS' | 'COUNTRY_BLOCK' | 'SEO'
  name: string
  description?: string | null
  active: boolean
  sortOrder?: number
  options?: AddonOption[]
}

type AddonOption = {
  id?: string
  addonId?: string
  durationDays: number
  priceCents: number
  active: boolean
  sortOrder?: number
}

export default function AdminAddonsPage() {
  const [addons, setAddons] = useState<Addon[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  const addonKeys = useMemo(() => ['ESCORT_OF_DAY', 'ESCORT_OF_WEEK', 'ESCORT_OF_MONTH', 'CITY_BOOST', 'PROFILE_ANALYTICS', 'COUNTRY_BLOCK', 'SEO'] as const, [])

  const fetchAddons = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/acp/addons', { cache: 'no-store' })
      const data = await res.json()
      setAddons(Array.isArray(data) ? data : [])
    } catch {
      setMessage('Konnte Add-ons nicht laden')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAddons() }, [])

  const upsertAddon = async (addon: Addon, markId: string | 'new') => {
    try {
      // Basic client-side validation
      if (!addon.key) {
        setMessage('Bitte wähle einen gültigen Add-on Key (z. B. SEO).')
        return
      }
      setSaving(markId)
      setMessage(null)
      const payload = { ...addon, sortOrder: addon.sortOrder ?? 0 }
      const res = await fetch('/api/acp/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        let msg = 'Speichern fehlgeschlagen'
        try {
          const j = await res.json()
          if (j?.error) msg = j.error
        } catch {}
        throw new Error(msg)
      }
      await fetchAddons()
      setMessage('Add-on gespeichert')
    } catch (e: any) {
      setMessage(e?.message || 'Speichern fehlgeschlagen')
    } finally {
      setSaving(null)
    }
  }

  const addEmptyAddon = () => {
    setAddons((a) => ([
      ...a,
      { id: undefined, key: undefined, name: '', description: '', active: true, sortOrder: (a?.[a.length-1]?.sortOrder ?? 0) + 1, options: [] },
    ]))
  }

  const addOption = async (addonIndex: number) => {
    const addon = addons[addonIndex]
    if (!addon?.id) {
      setMessage('Bitte Add-on zuerst speichern, bevor Optionen angelegt werden.')
      return
    }
    try {
      setSaving(`opt-${addon.id}`)
      const res = await fetch('/api/acp/addon-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addonId: addon.id, durationDays: 7, priceCents: 2999, active: true, sortOrder: (addon.options?.[addon.options.length-1]?.sortOrder ?? 0) + 1 }),
      })
      if (!res.ok) throw new Error('failed')
      await fetchAddons()
    } catch {
      setMessage('Option konnte nicht angelegt werden')
    } finally {
      setSaving(null)
    }
  }

  const saveOption = async (opt: AddonOption) => {
    try {
      setSaving(`opt-${opt.id ?? 'new'}`)
      const res = await fetch('/api/acp/addon-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opt),
      })
      if (!res.ok) throw new Error('failed')
      await fetchAddons()
      setMessage('Option gespeichert')
    } catch {
      setMessage('Option speichern fehlgeschlagen')
    } finally {
      setSaving(null)
    }
  }

  const deleteOption = async (id?: string) => {
    if (!id) return
    try {
      setSaving(`opt-${id}`)
      const res = await fetch('/api/acp/addon-options', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('failed')
      await fetchAddons()
      setMessage('Option gelöscht')
    } catch {
      setMessage('Option löschen fehlgeschlagen')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-light tracking-widest text-gray-900">Add-ons verwalten</h1>
        <Button onClick={addEmptyAddon} className="bg-pink-500 hover:bg-pink-600 text-white rounded-none">Neues Add-on</Button>
      </div>
      {message && <p className="text-xs text-gray-600">{message}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Lade…</p>
      ) : (
        <div className="space-y-6">
          {addons.map((addon, i) => (
            <div key={addon.id ?? `new-${i}`} className="border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-xs uppercase tracking-widest text-gray-800">Key</Label>
                  <select
                    value={addon.key ?? ''}
                    onChange={(e) => {
                      const v = e.target.value as Addon['key']
                      setAddons((arr) => arr.map((a, idx) => idx === i ? { ...a, key: v } : a))
                    }}
                    className="mt-2 w-full border-0 border-b-2 border-gray-200 bg-transparent py-3 text-sm"
                  >
                    <option value="">— auswählen —</option>
                    {addonKeys.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-widest text-gray-800">Name</Label>
                  <Input className="mt-2 border-0 border-b-2 border-gray-200 rounded-none"
                    value={addon.name}
                    onChange={(e) => setAddons((arr) => arr.map((a, idx) => idx === i ? { ...a, name: e.target.value } : a))}
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-widest text-gray-800">Aktiv</Label>
                  <div className="mt-3">
                    <input type="checkbox" checked={!!addon.active} onChange={(e) => setAddons((arr) => arr.map((a, idx) => idx === i ? { ...a, active: e.target.checked } : a))} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-widest text-gray-800">Sortierung</Label>
                  <Input type="number" className="mt-2 border-0 border-b-2 border-gray-200 rounded-none"
                    value={addon.sortOrder ?? 0}
                    onChange={(e) => setAddons((arr) => arr.map((a, idx) => idx === i ? { ...a, sortOrder: Number(e.target.value || 0) } : a))}
                  />
                </div>
                <div className="md:col-span-3">
                  <Label className="text-xs uppercase tracking-widest text-gray-800">Beschreibung</Label>
                  <textarea className="mt-2 w-full border-0 border-b-2 border-gray-200 bg-transparent py-3 text-sm"
                    rows={3}
                    value={addon.description ?? ''}
                    onChange={(e) => setAddons((arr) => arr.map((a, idx) => idx === i ? { ...a, description: e.target.value } : a))}
                  />
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <Button disabled={saving !== null} onClick={() => upsertAddon(addon, addon.id ?? 'new')} className="bg-pink-500 hover:bg-pink-600 text-white rounded-none">
                  {saving === (addon.id ?? 'new') ? 'Speichere…' : (addon.id ? 'Add-on speichern' : 'Add-on anlegen')}
                </Button>
              </div>

              {/* Options */}
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-light tracking-widest text-gray-800 uppercase">Optionen</h3>
                  <Button disabled={!addon.id} onClick={() => addOption(i)} className="bg-transparent text-gray-700 border border-gray-300 hover:bg-pink-50/40 rounded-none px-3 py-2 h-auto text-xs uppercase tracking-widest">Neue Option</Button>
                </div>
                {!addon.options || addon.options.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">Keine Optionen vorhanden.</p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {addon.options.map((opt) => (
                      <div key={opt.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div>
                          <Label className="text-xs uppercase tracking-widest text-gray-800">Dauer (Tage)</Label>
                          <Input type="number" className="mt-2 border-0 border-b-2 border-gray-200 rounded-none"
                            value={opt.durationDays}
                            onChange={(e) => setAddons((arr) => arr.map((a) => a.id === addon.id ? { ...a, options: a.options?.map(o => o.id === opt.id ? { ...o, durationDays: Number(e.target.value || 0) } : o) } : a))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs uppercase tracking-widest text-gray-800">Preis (Cent)</Label>
                          <Input type="number" className="mt-2 border-0 border-b-2 border-gray-200 rounded-none"
                            value={opt.priceCents}
                            onChange={(e) => setAddons((arr) => arr.map((a) => a.id === addon.id ? { ...a, options: a.options?.map(o => o.id === opt.id ? { ...o, priceCents: Number(e.target.value || 0) } : o) } : a))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs uppercase tracking-widest text-gray-800">Aktiv</Label>
                          <div className="mt-3">
                            <input type="checkbox" checked={!!opt.active} onChange={(e) => setAddons((arr) => arr.map((a) => a.id === addon.id ? { ...a, options: a.options?.map(o => o.id === opt.id ? { ...o, active: e.target.checked } : o) } : a))} />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs uppercase tracking-widest text-gray-800">Sortierung</Label>
                          <Input type="number" className="mt-2 border-0 border-b-2 border-gray-200 rounded-none"
                            value={opt.sortOrder ?? 0}
                            onChange={(e) => setAddons((arr) => arr.map((a) => a.id === addon.id ? { ...a, options: a.options?.map(o => o.id === opt.id ? { ...o, sortOrder: Number(e.target.value || 0) } : o) } : a))}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button onClick={() => saveOption({ ...opt, addonId: addon.id! })} className="bg-pink-500 hover:bg-pink-600 text-white rounded-none px-3 py-2 h-auto text-xs uppercase tracking-widest">Speichern</Button>
                          <Button onClick={() => deleteOption(opt.id)} className="bg-transparent text-gray-700 border border-gray-300 hover:bg-pink-50/40 rounded-none px-3 py-2 h-auto text-xs uppercase tracking-widest">Löschen</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import DatesCalendarWidget from '@/components/dates/DatesCalendarWidget'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export default function DatesPanel() {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [incoming, setIncoming] = useState<any[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [selectedMember, setSelectedMember] = useState<any | null>(null)
  const [tab, setTab] = useState<'anfragen' | 'kalender' | 'einstellungen'>('anfragen')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/dates/settings', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        setSettings(data?.settings || { availabilityNote: '', currency: 'EUR', durations: [], extras: [], places: [], outfits: [] })
        // Load incoming requests for me as ESCORT
        const req = await fetch('/api/dates/my?scope=ESCORT&status=PENDING', { cache: 'no-store' })
        const rd = await req.json().catch(() => ({}))
        setIncoming(Array.isArray(rd?.requests) ? rd.requests : [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Auto-seed Outfitwunsch with predefined options if empty (not saved until user clicks Speichern)
  useEffect(() => {
    if (!settings) return
    const hasOutfits = Array.isArray(settings.outfits) && settings.outfits.length > 0
    if (!hasOutfits) {
      const labels = ['CASUAL','ELEGANT','BUSINESS','SEXY','SPORTLICH','DAME ENTSCHEIDET']
      setSettings((s: any) => ({ ...s, outfits: labels.map((l) => ({ key: `OUTFIT_${l}`, label: l })) }))
    }
  }, [settings?.outfits])

  const addDuration = () => setSettings((s: any) => ({ ...s, durations: [...(s.durations||[]), { minutes: 60, priceCents: 6500, label: '1 Std.' }] }))
  const addExtra = () => setSettings((s: any) => ({ ...s, extras: [...(s.extras||[]), { key: `EXTRA_${Date.now()}`, label: 'Extra', priceCents: 2500 }] }))
  const addPlace = () => setSettings((s: any) => ({ ...s, places: [...(s.places||[]), { key: `PLACE_${Date.now()}`, label: 'Ort' }] }))
  const addOutfit = () => setSettings((s: any) => ({ ...s, outfits: [...(s.outfits||[]), { key: `OUTFIT_${Date.now()}`, label: 'Outfit' }] }))
  const seedOutfits = () => setSettings((s: any) => {
    const base = (s.outfits || [])
    const labels = ['CASUAL','ELEGANT','BUSINESS','SEXY','SPORTLICH','DAME ENTSCHEIDET']
    const existing = new Set(base.map((o: any) => (o.label || '').toUpperCase()))
    const toAdd = labels.filter(l => !existing.has(l)).map(l => ({ key: `OUTFIT_${l}_${Date.now()}`, label: l }))
    return { ...s, outfits: [...base, ...toAdd] }
  })

  const save = async () => {
    setSaving(true)
    try {
      await fetch('/api/dates/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings }) })
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (id: string, status: 'ACCEPTED' | 'DECLINED') => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/dates/${id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      if (res.ok) {
        setIncoming(prev => prev.filter((r) => r.id !== id))
        if (selected?.id === id) { setSelected(null); setOpen(false) }
      }
    } finally {
      setBusyId(null)
    }
  }

  const openDetails = async (item: any) => {
    setSelected(item)
    setOpen(true)
    setSelectedMember(null)
    try {
      const r = await fetch(`/api/users/minimal?ids=${encodeURIComponent(item.memberId)}`, { cache: 'no-store' })
      const d = await r.json().catch(() => ({}))
      const u = Array.isArray(d?.users) ? d.users[0] : null
      setSelectedMember(u || null)
    } catch {}
  }

  const fmtCurrency = (amount?: number, currency: string = settings?.currency || 'EUR') =>
    typeof amount === 'number' ? amount.toLocaleString('de-DE', { style: 'currency', currency }) : '-'

  const extrasLabels = (it: any) => {
    try {
      const arr = Array.isArray(it?.extras) ? it.extras : JSON.parse(it?.extras || '[]')
      if (!Array.isArray(arr) || arr.length === 0) return 'Keine'
      return arr.map((e: any) => e?.label || e?.key).filter(Boolean).join(', ')
    } catch { return 'Keine' }
  }

  const extrasArray = (it: any) => {
    try {
      const arr = Array.isArray(it?.extras) ? it.extras : JSON.parse(it?.extras || '[]')
      return Array.isArray(arr) ? arr : []
    } catch { return [] }
  }

  const formatDuration = (mins?: number) => {
    const m = Math.max(0, Number(mins || 0))
    const h = Math.floor(m / 60)
    const r = m % 60
    const parts: string[] = []
    if (h > 0) parts.push(`${h} Std.`)
    if (r > 0) parts.push(`${r} Min.`)
    return parts.length ? parts.join(' ') : '0 Min.'
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6 border-b border-gray-200">
        <button
          onClick={() => setTab('anfragen')}
          className={`text-xs md:text-sm font-light tracking-widest uppercase py-3 border-b-2 transition-colors ${
            tab === 'anfragen' ? 'text-pink-500 border-pink-500' : 'text-gray-600 border-transparent hover:text-pink-500'
          }`}
        >
          ANFRAGEN
        </button>
        <button
          onClick={() => setTab('kalender')}
          className={`text-xs md:text-sm font-light tracking-widest uppercase py-3 border-b-2 transition-colors ${
            tab === 'kalender' ? 'text-pink-500 border-pink-500' : 'text-gray-600 border-transparent hover:text-pink-500'
          }`}
        >
          KALENDER
        </button>
        <button
          onClick={() => setTab('einstellungen')}
          className={`text-xs md:text-sm font-light tracking-widest uppercase py-3 border-b-2 transition-colors ${
            tab === 'einstellungen' ? 'text-pink-500 border-pink-500' : 'text-gray-600 border-transparent hover:text-pink-500'
          }`}
        >
          EINSTELLUNGEN
        </button>
      </div>

      {tab === 'anfragen' && (
        <div className="border border-gray-200 p-6">
          <h2 className="text-sm font-light tracking-widest text-gray-800 uppercase">Eingehende Anfragen</h2>
          {incoming.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Keine offenen Anfragen.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {incoming.map((it) => {
                const s = new Date(it.startsAt)
                const e = new Date(it.endsAt)
                const addressText = it.location || [it.placeLabel, it.city].filter(Boolean).join(', ')
                return (
                  <li key={it.id} className="flex items-center justify-between border border-gray-200 px-3 py-2 text-sm">
                    <div>
                      <div className="text-gray-800">{s.toLocaleDateString('de-DE')} • {s.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})} – {e.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}</div>
                      <div className="text-gray-600 text-xs">{addressText}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openDetails(it)} className="text-[11px] uppercase tracking-widest border px-2 py-1">Details</button>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`} target="_blank" className="text-[11px] uppercase tracking-widest border px-2 py-1">Maps</a>
                      {it.status === 'PENDING' && (
                        <>
                          <button onClick={() => updateStatus(it.id, 'DECLINED')} disabled={busyId===it.id} className="text-[11px] uppercase tracking-widest border border-gray-300 px-2 py-1">Ablehnen</button>
                          <button onClick={() => updateStatus(it.id, 'ACCEPTED')} disabled={busyId===it.id} className="text-[11px] uppercase tracking-widest bg-pink-500 text-white px-2 py-1">Annehmen</button>
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {tab === 'kalender' && (
        <div className="border border-gray-200 p-6">
          <h2 className="text-sm font-light tracking-widest text-gray-800 uppercase">Kalender</h2>
          <DatesCalendarWidget
            scope="ESCORT"
            onSelect={(it: any) => {
              setSelected(it)
              setOpen(true)
            }}
          />
        </div>
      )}

      {tab === 'einstellungen' && (
        <div className="border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-light tracking-widest text-gray-800 uppercase">Einstellungen</h2>
            <Button onClick={save} disabled={saving} className="bg-pink-500 hover:bg-pink-600 text-white rounded-none px-4 py-2 h-auto text-xs uppercase tracking-widest">{saving ? 'Speichere…' : 'Speichern'}</Button>
          </div>
          {loading ? (
            <p className="mt-3 text-sm text-gray-500">Lade…</p>
          ) : (
            <div className="mt-4 space-y-6">
              <div>
                <label className="block text-[11px] text-gray-600 uppercase tracking-widest">Hinweis (Date-Anfrage)</label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Select value={settings?.availabilityNote || ''} onValueChange={(v) => setSettings((s: any) => ({ ...s, availabilityNote: v }))}>
                    <SelectTrigger className="w-full h-10 rounded-none">
                      <SelectValue placeholder="Vorlage wählen…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hinweis: USERNAME bevorzugt Barzahlung">Hinweis: USERNAME bevorzugt Barzahlung</SelectItem>
                      <SelectItem value="Hinweis: Bitte pünktlich erscheinen">Hinweis: Bitte pünktlich erscheinen</SelectItem>
                      <SelectItem value="Hinweis: Nur diskrete Treffpunkte">Hinweis: Nur diskrete Treffpunkte</SelectItem>
                      <SelectItem value="Hinweis: Outcall nur in Hotels">Hinweis: Outcall nur in Hotels</SelectItem>
                    </SelectContent>
                  </Select>
                  <input type="text" value={settings?.availabilityNote || ''} onChange={e => setSettings((s: any) => ({ ...s, availabilityNote: e.target.value }))} placeholder="Eigenen Hinweis eingeben…" className="sm:col-span-2 border border-gray-200 px-3 h-10 w-full" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-gray-600 uppercase tracking-widest">Währung</label>
                <Select value={settings?.currency || 'EUR'} onValueChange={(v) => setSettings((s: any) => ({ ...s, currency: v }))}>
                  <SelectTrigger className="mt-2 w-full rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="CHF">CHF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] text-gray-600 uppercase tracking-widest">Dauern & Preise</label>
                  <button onClick={addDuration} className="px-3 py-2 bg-pink-500 hover:bg-pink-600 text-white text-[11px] uppercase tracking-widest rounded-none">Hinzufügen</button>
                </div>
                <div className="mt-2 space-y-2">
                  {(settings?.durations || []).map((d: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-11 grid grid-cols-3 gap-2 items-start">
                        <div>
                          <div className="text-[11px] uppercase tracking-widest text-gray-600">Label</div>
                          <input type="text" value={d.label || ''} onChange={e => setSettings((s: any) => { const next = { ...s }; next.durations[idx].label = e.target.value; return next })} placeholder="Label" className="mt-1 border border-gray-200 px-3 h-10 w-full" />
                        </div>
                        <div>
                          <div className="text-[11px] uppercase tracking-widest text-gray-600">Minuten</div>
                          <input type="number" value={d.minutes} onChange={e => setSettings((s: any) => { const next = { ...s }; next.durations[idx].minutes = Number(e.target.value||0); return next })} className="mt-1 border border-gray-200 px-3 h-10 w-full" />
                        </div>
                        <div>
                          <div className="text-[11px] uppercase tracking-widest text-gray-600">Preis</div>
                          <div className="relative mt-1">
                            <input type="number" value={d.priceCents} onChange={e => setSettings((s: any) => { const next = { ...s }; next.durations[idx].priceCents = Number(e.target.value||0); return next })} className="border border-gray-200 pl-3 pr-14 h-10 w-full" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-widest text-gray-600">{settings?.currency || 'EUR'}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        aria-label="Entfernen"
                        title="Entfernen"
                        onClick={() => setSettings((s: any) => ({ ...s, durations: s.durations.filter((_: any, i: number) => i !== idx) }))}
                        className="col-span-1 flex items-center justify-center border border-gray-300 text-gray-700 hover:text-rose-600 hover:border-rose-400 transition-colors h-10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] text-gray-600 uppercase tracking-widest">Extras</label>
                  <button onClick={addExtra} className="px-3 py-2 bg-pink-500 hover:bg-pink-600 text-white text-[11px] uppercase tracking-widest rounded-none">Hinzufügen</button>
                </div>
                <div className="mt-2 space-y-2">
                  {(settings?.extras || []).map((ex: any, idx: number) => (
                    <div key={ex.key} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-11 grid grid-cols-2 gap-2 items-center">
                        <input type="text" value={ex.label} onChange={e => setSettings((s: any) => { const next = { ...s }; next.extras[idx].label = e.target.value; return next })} className="border border-gray-200 px-3 h-10" />
                        <div className="relative">
                          <input type="number" value={ex.priceCents} onChange={e => setSettings((s: any) => { const next = { ...s }; next.extras[idx].priceCents = Number(e.target.value||0); return next })} className="border border-gray-200 pl-3 pr-14 h-10 w-full" />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-widest text-gray-600">{settings?.currency || 'EUR'}</span>
                        </div>
                      </div>
                      <button
                        aria-label="Entfernen"
                        title="Entfernen"
                        onClick={() => setSettings((s: any) => ({ ...s, extras: s.extras.filter((_: any, i: number) => i !== idx) }))}
                        className="col-span-1 flex items-center justify-center border border-gray-300 text-gray-700 hover:text-rose-600 hover:border-rose-400 transition-colors h-10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] text-gray-600 uppercase tracking-widest">Ort(e)</label>
                  <button onClick={addPlace} className="px-3 py-2 bg-pink-500 hover:bg-pink-600 text-white text-[11px] uppercase tracking-widest rounded-none">Hinzufügen</button>
                </div>
                <div className="mt-2 space-y-2">
                  {(settings?.places || []).map((p: any, idx: number) => (
                    <div key={p.key} className="grid grid-cols-12 gap-2 items-center">
                      <input type="text" value={p.label} onChange={e => setSettings((s: any) => { const next = { ...s }; next.places[idx].label = e.target.value; return next })} className="col-span-11 border border-gray-200 px-3 h-10" />
                      <button
                        aria-label="Entfernen"
                        title="Entfernen"
                        onClick={() => setSettings((s: any) => ({ ...s, places: s.places.filter((_: any, i: number) => i !== idx) }))}
                        className="col-span-1 flex items-center justify-center border border-gray-300 text-gray-700 hover:text-rose-600 hover:border-rose-400 transition-colors h-10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] text-gray-600 uppercase tracking-widest">Outfitwunsch</label>
                  <div className="flex items-center gap-2">
                    <button onClick={seedOutfits} className="px-3 py-2 border border-gray-300 text-[11px] uppercase tracking-widest rounded-none">Vorgaben</button>
                    <button onClick={addOutfit} className="px-3 py-2 bg-pink-500 hover:bg-pink-600 text-white text-[11px] uppercase tracking-widest rounded-none">Hinzufügen</button>
                  </div>
                </div>
                <div className="mt-2 space-y-2">
                  {(settings?.outfits || []).map((o: any, idx: number) => (
                    <div key={o.key} className="grid grid-cols-12 gap-2 items-center">
                      <input type="text" value={o.label} onChange={e => setSettings((s: any) => { const next = { ...s }; next.outfits[idx].label = e.target.value; return next })} className="col-span-11 border border-gray-200 px-3 h-10" />
                      <button
                        aria-label="Entfernen"
                        title="Entfernen"
                        onClick={() => setSettings((s: any) => ({ ...s, outfits: s.outfits.filter((_: any, i: number) => i !== idx) }))}
                        className="col-span-1 flex items-center justify-center border border-gray-300 text-gray-700 hover:text-rose-600 hover:border-rose-400 transition-colors h-10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="rounded-none bg-white border-l border-gray-200">
          <SheetHeader className="border-b border-gray-200">
            <SheetTitle className="text-sm font-light tracking-widest text-gray-800 uppercase">ANFRAGE-DETAILS</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="p-4 space-y-4">
              <Link href={`/members/${selected.memberId}/${(selectedMember?.displayName || 'member').toLowerCase().replace(/[^a-z0-9]+/g,'-')}`} className="flex items-center gap-3 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedMember?.avatar || selectedMember?.galleryFirst || '/1.jpg'} alt="Avatar" className="w-12 h-12 object-cover" />
                <div>
                  <div className="text-sm font-medium tracking-widest text-gray-800 group-hover:underline">{selectedMember?.displayName || 'Mitglied'}</div>
                  <div className="text-xs text-gray-600">ID: {selected.memberId}</div>
                </div>
              </Link>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-gray-500">Wann</div>
                    <div className="mt-1 border border-gray-200 p-2 text-sm text-gray-900">
                      {new Date(selected.startsAt).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                      {' '}
                      • {new Date(selected.startsAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      {' '}
                      – {new Date(selected.endsAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-gray-500">Wie lange</div>
                    <div className="mt-1 border border-gray-200 p-2 text-sm text-gray-900">{formatDuration(selected.durationMinutes)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-gray-500">Preis</div>
                    <div className="mt-1 border border-gray-200 p-2 text-sm text-gray-900">{fmtCurrency(selected.priceCents, selected.currency)}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-gray-500">Ort</div>
                    <div className="mt-1 border border-gray-200 p-2 text-sm text-gray-900">{selected.placeLabel || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-gray-500">Outfitwunsch</div>
                    <div className="mt-1 border border-gray-200 p-2 text-sm text-gray-900">{selected.outfitLabel || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-gray-500">Adresse</div>
                    <div className="mt-1 border border-gray-200 p-2 text-sm text-gray-900 break-words">{selected.location || selected.city || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-gray-500">Extras</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {extrasArray(selected).length === 0 ? (
                        <span className="text-xs text-gray-500">Keine</span>
                      ) : (
                        extrasArray(selected).map((ex: any) => (
                          <span
                            key={ex.key || ex.label}
                            className="inline-flex items-center h-10 border border-gray-200 px-3 text-[10px] uppercase tracking-widest text-gray-700"
                          >
                            {ex.label || ex.key}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {selected.note ? (
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-gray-500">Nachricht</div>
                  <div className="mt-1 border border-gray-200 p-3 text-sm text-gray-900 whitespace-pre-wrap">{selected.note}</div>
                </div>
              ) : null}
            </div>
          )}
          {selected && (
            <SheetFooter className="border-t border-gray-200">
              <div className="flex items-center justify-between w-full">
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.location || [selected.placeLabel, selected.city].filter(Boolean).join(', '))}`} target="_blank" className="text-[11px] uppercase tracking-widest border px-3 py-2">Maps</a>
                {selected.status === 'PENDING' ? (
                  <div className="flex items-center gap-2">
                    <Button onClick={() => updateStatus(selected.id, 'DECLINED')} disabled={busyId===selected.id} variant="outline" className="rounded-none text-[11px] uppercase tracking-widest">Ablehnen</Button>
                    <Button onClick={() => updateStatus(selected.id, 'ACCEPTED')} disabled={busyId===selected.id} className="bg-pink-500 hover:bg-pink-600 text-white rounded-none px-4 py-2 h-auto text-xs uppercase tracking-widest">Annehmen</Button>
                  </div>
                ) : (
                  <div />
                )}
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

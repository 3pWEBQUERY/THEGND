"use client"

import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import Script from 'next/script'
import { useRef } from 'react'

type Settings = {
  currency: string
  durations: { minutes: number; priceCents: number; label?: string }[]
  extras: { key: string; label: string; priceCents: number }[]
  places: { key: string; label: string }[]
  availabilityNote?: string
  outfits?: { key: string; label: string }[]
}

type Props = {
  escortId: string
  escortName?: string | null
  defaultCity?: string | null
  triggerClassName?: string
  escortAvatar?: string | null
}

export default function DateRequestDialog({ escortId, escortName, defaultCity, triggerClassName, escortAvatar }: Props) {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState<number | null>(null)
  const [extras, setExtras] = useState<string[]>([])
  const [place, setPlace] = useState<string>('')
  const [address, setAddress] = useState<string>('')
  const [city, setCity] = useState<string>('')
  const [note, setNote] = useState('')
  const [outfit, setOutfit] = useState<string>('')
  const [sending, setSending] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mapsReady, setMapsReady] = useState(false)
  const autocompleteRef = useRef<any>(null)
  const addressInputRef = useRef<HTMLInputElement | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [placeId, setPlaceId] = useState<string | null>(null)

  // Ensure Google Places Autocomplete is attached to the address input
  const ensureAutocomplete = () => {
    const g = (typeof window !== 'undefined' ? (window as any).google : null)
    if (!g?.maps?.places) return
    if (!addressInputRef.current) return
    if (autocompleteRef.current) return
    const ac = new g.maps.places.Autocomplete(addressInputRef.current as HTMLInputElement, {
      fields: ['formatted_address', 'geometry', 'place_id', 'address_components'],
      types: ['geocode']
    })
    autocompleteRef.current = ac
    ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      if (!place || !place.geometry || !place.geometry.location) return
      const comps = place.address_components || []
      let parsedCity = ''
      for (const c of comps) {
        if (c.types.includes('locality')) parsedCity = c.long_name
        else if (c.types.includes('postal_town')) parsedCity = c.long_name
        else if (c.types.includes('administrative_area_level_2') && !parsedCity) parsedCity = c.long_name
      }

      const formatted = place.formatted_address || addressInputRef.current?.value || ''
      if (addressInputRef.current) addressInputRef.current.value = formatted
      setAddress(formatted)
      setCity(parsedCity)
      setPlaceId(place.place_id || null)
      try {
        const loc = place.geometry.location
        const lat = typeof loc.lat === 'function' ? loc.lat() : (loc as any).lat
        const lng = typeof loc.lng === 'function' ? loc.lng() : (loc as any).lng
        setLat(lat)
        setLng(lng)
        initMap(lat, lng)
      } catch {}
    })
  }

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/dates/settings/${escortId}`, { cache: 'no-store' })
        const data = await res.json()
        if (!cancelled) setSettings(data?.settings || null)
        if (!cancelled && data?.settings?.durations?.[0]) setDuration(Number(data.settings.durations[0].minutes))
        if (!cancelled && data?.settings?.places?.[0]) setPlace(String(data.settings.places[0].key))
        if (!cancelled && data?.settings?.outfits?.[0]) setOutfit(String(data.settings.outfits[0].key))
        if (!cancelled && defaultCity) setCity(defaultCity)
      } catch {
        if (!cancelled) setSettings({ currency: 'EUR', durations: [], extras: [], places: [], outfits: [] })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [open, escortId])

  useEffect(() => {
    if (!open) return
    // Try now and on next tick to ensure ref is mounted
    ensureAutocomplete()
    const id = setTimeout(ensureAutocomplete, 0)
    return () => { clearTimeout(id) }
  }, [open, mapsReady])

  function initMap(lat: number, lng: number) {
    if (!mapContainerRef.current) return
    const g = (window as any).google
    const center = { lat, lng }
    const usesAdvancedMarker = !!g?.maps?.marker?.AdvancedMarkerElement
    if (!mapRef.current) {
      mapRef.current = new g.maps.Map(mapContainerRef.current, {
        center,
        zoom: 14,
        mapId: 'dates-dialog-map',
        disableDefaultUI: true
      })
    } else {
      mapRef.current.setCenter(center)
    }
    if (usesAdvancedMarker) {
      if (markerRef.current) markerRef.current.map = null as any
      markerRef.current = new g.maps.marker.AdvancedMarkerElement({ map: mapRef.current, position: center })
    } else {
      // @ts-ignore classic marker fallback
      new g.maps.Marker({ position: center, map: mapRef.current })
    }
  }

  // Component-scope geocode fallback: resolves formatted address, city and lat/lng when no suggestion was clicked
  async function geocodeAddressFallback() {
    try {
      const q = (address || '').trim()
      if (!q) return
      const g = (typeof window !== 'undefined' ? (window as any).google : null)
      if (!g?.maps?.Geocoder) return
      await new Promise<void>((resolve) => {
        try {
          const geocoder = new g.maps.Geocoder()
          geocoder.geocode({ address: q }, (results: any, status: any) => {
            if (status === 'OK' && results && results[0]) {
              const r = results[0]
              const loc = r.geometry?.location
              const newLat = typeof loc?.lat === 'function' ? loc.lat() : (loc?.lat || null)
              const newLng = typeof loc?.lng === 'function' ? loc.lng() : (loc?.lng || null)
              // parse city
              const comps = r.address_components || []
              let parsedCity = ''
              for (const c of comps) {
                if (c.types?.includes?.('locality')) parsedCity = c.long_name
                else if (c.types?.includes?.('postal_town')) parsedCity = c.long_name
                else if (c.types?.includes?.('administrative_area_level_2') && !parsedCity) parsedCity = c.long_name
              }
              if (r.formatted_address) setAddress(r.formatted_address)
              if (parsedCity) setCity(parsedCity)
              if (newLat && newLng) {
                setLat(newLat)
                setLng(newLng)
                initMap(newLat, newLng)
              }
            }
            resolve()
          })
        } catch { resolve() }
      })
    } catch {}
  }

  const currency = (amount?: number) => typeof amount === 'number' ? amount.toLocaleString('de-DE', { style: 'currency', currency: settings?.currency || 'EUR' }) : '-'

  const basePrice = useMemo(() => {
    if (!settings || duration == null) return 0
    const d = settings.durations.find(d => Number(d.minutes) === Number(duration))
    return Number(d?.priceCents || 0)
  }, [settings, duration])

  const extrasSum = useMemo(() => {
    if (!settings || !extras) return 0
    let s = 0
    for (const k of extras) {
      const ex = settings.extras.find(e => e.key === k)
      if (ex) s += Number(ex.priceCents || 0)
    }
    return s
  }, [settings, extras])

  const total = basePrice + extrasSum

  const placeObj = settings?.places.find(p => p.key === place) || null
  const outfitObj = settings?.outfits?.find?.((o: any) => o.key === outfit) || null

  const submit = async () => {
    if (!date || !time || !duration) {
      setError('Bitte Datum, Uhrzeit und Dauer wählen.')
      return
    }
    // Ensure we have a geocoded address if user pressed Enter or didn't click a suggestion
    if (!lat || !lng) {
      await geocodeAddressFallback()
    }
    if (!address.trim()) {
      setError('Bitte eine Adresse eingeben oder aus Vorschlag wählen.')
      return
    }
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/dates/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escortId, date, time, durationMinutes: duration, extras, place: placeObj, outfit: outfitObj, address, city, lat, lng, placeId, note })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setCreatedId(data?.id || null)
      } else if (res.status === 401) {
        const cb = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.href = `/auth/signin?callbackUrl=${cb}`
        return
      } else {
        setError(data?.error || 'Fehler beim Senden')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={triggerClassName || 'px-4 py-2 border border-gray-300 rounded-none text-sm tracking-widest hover:border-pink-500'}>
          DATE VEREINBAREN
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl rounded-none p-0">
        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,marker&language=de`}
            strategy="afterInteractive"
            onLoad={() => setMapsReady(true)}
          />
        )}
        <div className="p-6">
          <DialogHeader className="border-b border-gray-200">
            <DialogTitle className="text-sm font-light tracking-widest text-gray-800 uppercase">DATE-ANFRAGE</DialogTitle>
          </DialogHeader>
          {/* Header With Escort name + city + availability note */}
          <div className="mt-2 border border-gray-200 bg-white">
            <div className="flex items-stretch">
              {escortAvatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={escortAvatar} alt="Avatar" className="object-cover h-24 w-20 sm:w-28 md:w-32 rounded-none" />
              )}
              <div className="flex-1 p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium tracking-widest text-gray-800">{escortName || 'ESCORT'}</div>
                  {defaultCity && <div className="text-xs text-gray-600">{defaultCity}</div>}
                </div>
                {settings?.availabilityNote && (
                  <div className="max-w-[60%] text-right">
                    <div className="inline-flex items-center gap-2 border border-pink-200 bg-pink-50/60 text-pink-700 text-[11px] uppercase tracking-widest px-2 py-1 rounded-none">
                      <span className="h-1.5 w-1.5 bg-pink-500" />
                      <span>{(settings.availabilityNote || '').replace(/USERNAME/g, escortName || 'USERNAME')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {createdId ? (
            <div className="mt-4 text-sm text-gray-700">
              <div className="text-gray-900 font-medium tracking-widest">Deine Anfrage wurde gesendet.</div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-gray-500">Wann</div>
                    <div className="text-gray-800">
                      {(() => { try { const dt = new Date(`${date}T${time}`); return dt.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' }) } catch { return `${date} ${time}` } })()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-gray-500">Wie lange</div>
                    <div className="text-gray-800">{(() => { const d = (settings?.durations||[]).find(x=>Number(x.minutes)===Number(duration)); return d?.label || `${duration} Min.` })()}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-gray-500">Ort</div>
                    <div className="text-gray-800">{placeObj?.label || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-gray-500">Outfitwunsch</div>
                    <div className="text-gray-800">{outfitObj?.label || '-'}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-gray-500">Adresse</div>
                    <div className="text-gray-800 break-words">{address || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-gray-500">Extras</div>
                    <div className="text-gray-800">{extras.length ? extras.map(k => (settings?.extras||[]).find(e=>e.key===k)?.label || k).join(', ') : 'Keine'}</div>
                  </div>
                  {note?.trim() ? (
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-gray-500">Nachricht</div>
                      <div className="text-gray-800 whitespace-pre-wrap">{note}</div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-gray-900">Gesamt: <span className="font-medium">{currency(total)}</span></div>
                <div className="flex items-center gap-2">
                  <DialogClose asChild>
                    <Button className="bg-pink-500 hover:bg-pink-600 text-white rounded-none px-4 py-2 h-auto text-xs uppercase tracking-widest">SCHLIESSEN</Button>
                  </DialogClose>
                </div>
              </div>
            </div>
          ) : (
          <div className="mt-4 space-y-4">
            {error && <div className="text-sm text-rose-600">{error}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-600 uppercase tracking-widest">Wann?</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-2 w-full border border-gray-200 px-3 py-2" />
              </div>
              <div>
                <label className="block text-[11px] text-gray-600 uppercase tracking-widest">Uhrzeit</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} className="mt-2 w-full border border-gray-200 px-3 py-2" />
              </div>
            </div>

            {/* Duration section below date/time */}
            <div>
              <label className="block text-[11px] text-gray-600 uppercase tracking-widest">Wie lange?</label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(settings?.durations || []).map((d) => {
                  const active = Number(duration) === Number(d.minutes)
                  return (
                    <button
                      type="button"
                      key={d.minutes}
                      onClick={() => setDuration(Number(d.minutes))}
                      className={`px-3 py-2 text-sm border ${active ? 'border-pink-500 bg-pink-50/40 text-pink-700' : 'border-gray-200 text-gray-800'}`}
                    >
                      {(d.label || `${d.minutes} Min.`)}
                      <div className="text-[11px] text-gray-600">{currency(d.priceCents)}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-gray-600 uppercase tracking-widest">Extras gewünscht?</label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(settings?.extras || []).map((ex) => {
                  const checked = extras.includes(ex.key)
                  return (
                    <label key={ex.key} className={`flex items-center justify-between border px-3 py-2 ${checked ? 'border-pink-500 bg-pink-50/40' : 'border-gray-200'}`}>
                      <span className="text-sm text-gray-800">{ex.label}</span>
                      <input type="checkbox" checked={checked} onChange={() => setExtras((s) => checked ? s.filter(k => k !== ex.key) : [...s, ex.key])} />
                      <span className="ml-2 text-sm text-gray-700">{currency(ex.priceCents)}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Outfitwunsch */}
            {(settings?.outfits && settings.outfits.length > 0) && (
              <div>
                <label className="block text-[11px] text-gray-600 uppercase tracking-widest">Outfitwunsch</label>
                <div className="mt-2">
                  <Select value={outfit} onValueChange={(v) => setOutfit(v)}>
                    <SelectTrigger className="w-full h-10 rounded-none">
                      <SelectValue placeholder="Outfit wählen…" />
                    </SelectTrigger>
                    <SelectContent>
                      {settings.outfits.map((o) => (
                        <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] text-gray-600 uppercase tracking-widest">Wo?</label>
              <div className="mt-2">
                <Select value={place} onValueChange={(v) => setPlace(v)}>
                  <SelectTrigger className="w-full h-10 rounded-none">
                    <SelectValue placeholder="Ort wählen…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(settings?.places || []).map((p) => (
                      <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-gray-600 uppercase tracking-widest">Adresse</label>
              <input
                ref={addressInputRef}
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onFocus={ensureAutocomplete}
                onBlur={geocodeAddressFallback}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="Straße, Hausnummer, Ort"
                className="mt-2 w-full border border-gray-200 px-3 py-2"
              />
              {address && (
                <div className="mt-2 inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" /> Adresse gesetzt
                </div>
              )}
              {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
                <div className="mt-1 text-xs text-amber-600">Hinweis: Setze NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, um Google Autocomplete zu aktivieren.</div>
              )}
              {/* Map preview */}
              <div ref={mapContainerRef} className="mt-3 h-40 w-full border bg-white" />
            </div>

            <div>
              <label className="block text-[11px] text-gray-600 uppercase tracking-widest">Nachricht</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={4} placeholder="Schreibe ein paar Zeilen..." className="mt-2 w-full border border-gray-200 px-3 py-2"></textarea>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">Gesamt: <span className="font-medium">{currency(total)}</span></div>
              <Button onClick={submit} disabled={sending || !date || !time || !duration} className="bg-pink-500 hover:bg-pink-600 text-white rounded-none px-4 py-2 h-auto text-xs uppercase tracking-widest">
                {sending ? 'Sende…' : 'Anfrage senden'}
              </Button>
            </div>
          </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import MultiSelect from '@/components/ui/multi-select'
import { LANGUAGES_DE } from '@/data/languages.de'
import Script from 'next/script'
// removed router, no navigation from inside the form

export default function PreferencesForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const [services, setServices] = useState<string[]>([])
  const [city, setCity] = useState<string>('')
  const [country, setCountry] = useState<string>('')
  const [radiusKm, setRadiusKm] = useState<string>('')
  const [mapsReady, setMapsReady] = useState(false)
  const [memberLocation, setMemberLocation] = useState<{ lat: number; lng: number; placeId?: string; formattedAddress?: string } | null>(null)
  const addressInputRef = useRef<HTMLInputElement | null>(null)
  const autocompleteRef = useRef<any>(null)
  const [radiusError, setRadiusError] = useState<string>('')
  const [appearance, setAppearance] = useState<Record<string, any>>({
    bodyType: [] as string[],
    hairColor: [] as string[],
    eyeColor: [] as string[],
    hairLength: [] as string[],
    breastType: [] as string[],
    breastSize: [] as string[],
    intimateArea: [] as string[],
    clothingStyle: [] as string[],
    clothingSize: [] as string[],
    shoeSize: [] as string[],
    height: '',
    weight: '',
  })
  const [languagesSel, setLanguagesSel] = useState<string[]>([])
  const [piercings, setPiercings] = useState<string[]>([])
  const [tattoos, setTattoos] = useState<string[]>([])

  // Options for richer appearance filters
  const bodyTypeOptions = [
    { value: 'SLIM', label: 'Schlank' },
    { value: 'ATHLETIC', label: 'Sportlich' },
    { value: 'CURVY', label: 'Kurvig' },
    { value: 'FIT', label: 'Durchtrainiert' },
    { value: 'AVERAGE', label: 'Durchschnittlich' },
  ]

  const languageOptions = LANGUAGES_DE
  const hairColorOptions = [
    { value: 'BLOND', label: 'Blond' },
    { value: 'BROWN', label: 'Braun' },
    { value: 'BLACK', label: 'Schwarz' },
    { value: 'RED', label: 'Rot' },
    { value: 'GREY', label: 'Grau' },
    { value: 'DYED', label: 'Gefärbt' },
  ]
  const eyeColorOptions = [
    { value: 'BLUE', label: 'Blau' },
    { value: 'GREEN', label: 'Grün' },
    { value: 'BROWN', label: 'Braun' },
    { value: 'HAZEL', label: 'Haselnuss' },
    { value: 'GREY', label: 'Grau' },
    { value: 'BLACK', label: 'Schwarz' },
  ]

  const hairLengthOptions = [
    { value: 'SHORT', label: 'Kurz' },
    { value: 'MEDIUM', label: 'Mittel' },
    { value: 'LONG', label: 'Lang' },
  ]
  const breastTypeOptions = [
    { value: 'NATURAL', label: 'Natürlich' },
    { value: 'IMPLANTS', label: 'Silikon' },
  ]
  const breastSizeOptions = [
    { value: 'A', label: 'A' },
    { value: 'B', label: 'B' },
    { value: 'C', label: 'C' },
    { value: 'D', label: 'D' },
    { value: 'E', label: 'E' },
    { value: 'F', label: 'F' },
    { value: 'G', label: 'G' },
  ]
  const intimateAreaOptions = [
    { value: 'SHAVED', label: 'Rasiert' },
    { value: 'TRIMMED', label: 'Teilrasiert' },
    { value: 'NATURAL', label: 'Natürlich' },
  ]
  const clothingStyleOptions = [
    { value: 'ELEGANT', label: 'Elegant' },
    { value: 'CASUAL', label: 'Casual' },
    { value: 'SEXY', label: 'Sexy' },
    { value: 'BUSINESS', label: 'Business' },
    { value: 'SPORTY', label: 'Sportlich' },
  ]
  const clothingSizeOptions = [
    { value: 'XS', label: 'XS' },
    { value: 'S', label: 'S' },
    { value: 'M', label: 'M' },
    { value: 'L', label: 'L' },
    { value: 'XL', label: 'XL' },
  ]
  const shoeSizeOptions = Array.from({ length: 12 }).map((_, i) => ({ value: String(34 + i), label: String(34 + i) }))
  const piercingOptions = [
    { value: 'EARS', label: 'Ohren' },
    { value: 'NOSE', label: 'Nase' },
    { value: 'NAVEL', label: 'Bauchnabel' },
    { value: 'BREAST', label: 'Brust' },
    { value: 'INTIMATE', label: 'Intim' },
  ]
  const tattooOptions = [
    { value: 'ARM', label: 'Arm' },
    { value: 'LEG', label: 'Bein' },
    { value: 'BACK', label: 'Rücken' },
    { value: 'CHEST', label: 'Brust' },
    { value: 'SHOULDER', label: 'Schulter' },
    { value: 'HAND', label: 'Hand' },
    { value: 'FOOT', label: 'Fuß' },
    { value: 'NECK', label: 'Nacken' },
  ]

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/matching/preferences', { cache: 'no-store' })
        const data = await res.json()
        if (res.ok) {
          const p = data?.preferences || {}
          setServices(Array.isArray(p.services) ? p.services : [])
          setRadiusKm(typeof p.radiusKm === 'number' ? String(p.radiusKm) : (typeof p.radiusKm === 'string' ? p.radiusKm : ''))
          const a = p?.appearance || {}
          const toArr = (v: any) => Array.isArray(v) ? v : (v ? [String(v)] : [])
          setAppearance({
            bodyType: toArr(a.bodyType),
            hairColor: toArr(a.hairColor),
            eyeColor: toArr(a.eyeColor),
            hairLength: toArr(a.hairLength),
            breastType: toArr(a.breastType),
            breastSize: toArr(a.breastSize),
            intimateArea: toArr(a.intimateArea),
            clothingStyle: toArr(a.clothingStyle),
            clothingSize: toArr(a.clothingSize),
            shoeSize: toArr(a.shoeSize),
            height: a?.height || '',
            weight: a?.weight || '',
          })
          const langs = Array.isArray(p.languages) ? p.languages : (typeof p.languages === 'string' ? p.languages.split(',').map((s:string)=>s.trim()).filter(Boolean) : [])
          setLanguagesSel(langs)
          setPiercings(Array.isArray(p.piercings) ? p.piercings : (typeof p.piercings === 'string' ? p.piercings.split(',').map((s: string) => s.trim()).filter(Boolean) : []))
          setTattoos(Array.isArray(p.tattoos) ? p.tattoos : (typeof p.tattoos === 'string' ? p.tattoos.split(',').map((s: string) => s.trim()).filter(Boolean) : []))
        } else {
          setError(data?.error || 'Fehler beim Laden')
        }
      } catch {
        setError('Fehler beim Laden')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const onMapsLoaded = () => {
    setMapsReady(true)
    initAutocomplete()
  }

  function initAutocomplete() {
    try {
      // already initialized
      if (autocompleteRef.current) return
      const g = (window as any).google
      if (!g?.maps?.places || !addressInputRef.current) return
      const ac = new g.maps.places.Autocomplete(addressInputRef.current as HTMLInputElement, {
        fields: ['formatted_address', 'geometry', 'place_id', 'address_components']
      })
      autocompleteRef.current = ac
      ac.addListener('place_changed', () => {
        const place = ac.getPlace()
        if (!place || !place.geometry || !place.geometry.location) return
        const loc = place.geometry.location
        const lat = typeof loc.lat === 'function' ? loc.lat() : (loc as any).lat
        const lng = typeof loc.lng === 'function' ? loc.lng() : (loc as any).lng
        // parse city/country
        const comps = place.address_components || []
        let cityLocal = ''
        let countryLocal = ''
        for (const c of comps) {
          if (c.types.includes('locality')) cityLocal = c.long_name
          else if (c.types.includes('postal_town')) cityLocal = c.long_name
          if (c.types.includes('country')) countryLocal = c.long_name
        }
        if (cityLocal) setCity(cityLocal)
        if (countryLocal) setCountry(countryLocal)
        setMemberLocation({
          lat,
          lng,
          placeId: place.place_id,
          formattedAddress: place.formatted_address || undefined
        })
      })
    } catch {
      // ignore
    }
  }

  const toggleService = (key: string) => {
    setServices((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])
  }

  const handleReset = () => {
    setServices([])
    setCity('')
    setCountry('')
    setRadiusKm('')
    setMemberLocation(null)
    setRadiusError('')
    setAppearance({
      bodyType: [],
      hairColor: [],
      eyeColor: [],
      hairLength: [],
      breastType: [],
      breastSize: [],
      intimateArea: [],
      clothingStyle: [],
      clothingSize: [],
      shoeSize: [],
      height: '',
      weight: '',
    })
    setLanguagesSel([])
    setPiercings([])
    setTattoos([])
    setError(null)
  }

  const submit = async () => {
    setSaving(true)
    setError(null)
    try {
      // Save member center location if available (for radius filtering)
      if (memberLocation) {
        try {
          const resProf = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              profileData: {
                latitude: memberLocation.lat,
                longitude: memberLocation.lng,
                locationPlaceId: memberLocation.placeId,
                locationFormatted: memberLocation.formattedAddress,
              }
            })
          })
          // ignore response; location is persisted for radius filtering
        } catch {
          // non-fatal
        }
      }
      const languagesArr = languagesSel
      const piercingsArr = piercings
      const tattoosArr = tattoos
      // Validate radius (5–300 km)
      let radiusForPayload: number | undefined = undefined
      if (radiusKm) {
        const r = Number(radiusKm)
        if (Number.isFinite(r) && r >= 5 && r <= 300) {
          radiusForPayload = r
          setRadiusError('')
        } else {
          setRadiusError('Bitte 5–300 km eingeben')
          throw new Error('Bitte 5–300 km eingeben')
        }
      } else {
        setRadiusError('')
      }
      const res = await fetch('/api/matching/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services, city, country, radiusKm: radiusForPayload, appearance, languages: languagesArr, piercings: piercingsArr, tattoos: tattoosArr })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      setOk('Gespeichert')
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const serviceOptions = [
    'GFE', 'Dinner Date', 'Overnight', 'Duo', 'Massage', 'Strip', 'Fetish'
  ]

  if (loading) return <div className="text-sm text-gray-500">Lade…</div>

  return (
    <div className="w-full">
      {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=de`}
          strategy="afterInteractive"
          onLoad={onMapsLoaded}
        />
      )}
      {/* Heading and nav removed; outer dashboard header handles titles/tabs */}

      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-medium tracking-widest text-gray-800 uppercase">Services</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {serviceOptions.map((key) => (
              <button key={key} onClick={() => toggleService(key)} className={`px-3 py-1 text-xs uppercase tracking-widest border ${services.includes(key) ? 'bg-pink-500 text-white border-pink-500' : 'border-gray-300 text-gray-700'}`}>{key}</button>
            ))}
          </div>
        </div>

        {/* Standortfilter */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium tracking-widest text-gray-800 uppercase">Standortfilter</h3>
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-600">Standort suchen (für Umkreis)</label>
            <input ref={addressInputRef} placeholder="Adresse oder Ort suchen" className="mt-1 w-full border border-gray-300 px-3 py-2" />
            {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
              <p className="text-[11px] text-amber-600 mt-1">Hinweis: Setze NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local, um Autocomplete zu aktivieren.</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-600">Stadt</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-600">Land</label>
              <input value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-600">Umkreis (km)</label>
              <input
                value={radiusKm}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g,'')
                  setRadiusKm(v)
                  if (!v) { setRadiusError(''); return }
                  const n = Number(v)
                  if (Number.isFinite(n) && n >= 5 && n <= 300) setRadiusError('')
                  else setRadiusError('Bitte 5–300 km eingeben')
                }}
                placeholder="z. B. 50"
                className={`mt-1 w-full border px-3 py-2 ${radiusError ? 'border-red-500' : 'border-gray-300'}`}
              />
              <div className="mt-1 flex items-center gap-3">
                <p className="text-[11px] text-gray-500">Gültiger Bereich: 5–300 km</p>
                {radiusError && <p className="text-[11px] text-red-600">{radiusError}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Weitere Merkmale */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium tracking-widest text-gray-800 uppercase">Weitere Merkmale</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-600 mb-1">KÖRPERBAU{appearance.bodyType.length ? ` (${appearance.bodyType.length})` : ''}</label>
              <MultiSelect
                value={appearance.bodyType}
                onChange={(v) => setAppearance({ ...appearance, bodyType: v })}
                options={bodyTypeOptions}
                placeholder="Wähle Körpertyp(e)"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-600 mb-1">HAARFARBE{appearance.hairColor.length ? ` (${appearance.hairColor.length})` : ''}</label>
              <MultiSelect
                value={appearance.hairColor}
                onChange={(v) => setAppearance({ ...appearance, hairColor: v })}
                options={hairColorOptions}
                placeholder="Wähle Haarfarbe(n)"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-600 mb-1">AUGENFARBE{appearance.eyeColor.length ? ` (${appearance.eyeColor.length})` : ''}</label>
              <MultiSelect
                value={appearance.eyeColor}
                onChange={(v) => setAppearance({ ...appearance, eyeColor: v })}
                options={eyeColorOptions}
                placeholder="Wähle Augenfarbe(n)"
              />
            </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-600 mb-1">SPRACHEN{languagesSel.length ? ` (${languagesSel.length})` : ''}</label>
            <MultiSelect
              value={languagesSel}
              onChange={setLanguagesSel}
              options={languageOptions}
              placeholder="Wähle Sprache(n)"
            />
            
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-600 mb-1">HAARLÄNGE{appearance.hairLength.length ? ` (${appearance.hairLength.length})` : ''}</label>
            <MultiSelect
              value={appearance.hairLength}
              onChange={(v) => setAppearance({ ...appearance, hairLength: v })}
              options={hairLengthOptions}
              placeholder="Wähle Haarlänge(n)"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-600 mb-1">BRUSTTYP{appearance.breastType.length ? ` (${appearance.breastType.length})` : ''}</label>
            <MultiSelect
              value={appearance.breastType}
              onChange={(v) => setAppearance({ ...appearance, breastType: v })}
              options={breastTypeOptions}
              placeholder="Wähle Typ(en)"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-600 mb-1">KÖRBCHENGRÖSSE{appearance.breastSize.length ? ` (${appearance.breastSize.length})` : ''}</label>
            <MultiSelect
              value={appearance.breastSize}
              onChange={(v) => setAppearance({ ...appearance, breastSize: v })}
              options={breastSizeOptions}
              placeholder="Wähle Größe(n)"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-600 mb-1">INTIMBEREICH{appearance.intimateArea.length ? ` (${appearance.intimateArea.length})` : ''}</label>
            <MultiSelect
              value={appearance.intimateArea}
              onChange={(v) => setAppearance({ ...appearance, intimateArea: v })}
              options={intimateAreaOptions}
              placeholder="Wähle Intimstil(e)"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-600 mb-1">KLEIDUNGSSTIL{appearance.clothingStyle.length ? ` (${appearance.clothingStyle.length})` : ''}</label>
            <MultiSelect
              value={appearance.clothingStyle}
              onChange={(v) => setAppearance({ ...appearance, clothingStyle: v })}
              options={clothingStyleOptions}
              placeholder="Wähle Stil(e)"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-600 mb-1">KLEIDERGRÖSSE{appearance.clothingSize.length ? ` (${appearance.clothingSize.length})` : ''}</label>
            <MultiSelect
              value={appearance.clothingSize}
              onChange={(v) => setAppearance({ ...appearance, clothingSize: v })}
              options={clothingSizeOptions}
              placeholder="Wähle Größe(n)"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-600 mb-1">SCHUHGRÖSSE{appearance.shoeSize.length ? ` (${appearance.shoeSize.length})` : ''}</label>
            <MultiSelect
              value={appearance.shoeSize}
              onChange={(v) => setAppearance({ ...appearance, shoeSize: v })}
              options={shoeSizeOptions}
              placeholder="Wähle Größe(n)"
            />
          </div>
          </div>
        </div>

        {/* Körpermaße & Körperschmuck */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium tracking-widest text-gray-800 uppercase">Körpermaße & Körperschmuck</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-600 mb-1">Größe (cm)</label>
            <input value={appearance.height} onChange={(e) => setAppearance({ ...appearance, height: e.target.value })} className="mt-1 w-full border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-600 mb-1">Gewicht (kg)</label>
            <input value={appearance.weight} onChange={(e) => setAppearance({ ...appearance, weight: e.target.value })} className="mt-1 w-full border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-600 mb-1">PIERCINGS{piercings.length ? ` (${piercings.length})` : ''}</label>
            <MultiSelect
              value={piercings}
              onChange={setPiercings}
              options={piercingOptions}
              placeholder="Wähle Piercing-Orte"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-600 mb-1">TÄTOWIERUNGEN{tattoos.length ? ` (${tattoos.length})` : ''}</label>
            <MultiSelect
              value={tattoos}
              onChange={setTattoos}
              options={tattooOptions}
              placeholder="Wähle Tattoo-Orte"
            />
          </div>
          </div>
        </div>

        

        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={saving || (!!radiusError && !!radiusKm)} className="rounded-none bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest px-6 py-3 text-sm uppercase">{saving ? 'SPEICHERN…' : 'SPEICHERN'}</Button>
          <Button type="button" variant="outline" onClick={handleReset} className="rounded-none border border-gray-300 text-gray-600 font-light tracking-widest px-6 py-3 text-sm uppercase hover:border-pink-500 hover:text-pink-500">ZURÜCKSETZEN</Button>
          {ok && <span className="text-xs text-emerald-600">{ok}</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </div>
    </div>
  )
}

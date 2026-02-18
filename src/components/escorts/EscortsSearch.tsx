import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MapPin, Search, SlidersHorizontal } from 'lucide-react'
import React from 'react'
import type { EscortFilters } from '@/types/escort'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import MultiSelect from '@/components/ui/multi-select'
import { COUNTRIES_DE } from '@/data/countries.de'
import { LANGUAGES_DE } from '@/data/languages.de'
import { SERVICES_DE } from '@/data/services.de'

type Props = {
  q: string
  setQ: (v: string) => void
  location: string
  setLocation: (v: string) => void
  onSubmit: () => void
  loading?: boolean
  error?: string | null
  filters: EscortFilters
  onFiltersChange?: (filters: EscortFilters) => void
  verifiedOnly?: boolean
  setVerifiedOnly?: (v: boolean) => void
  ageVerifiedOnly?: boolean
  setAgeVerifiedOnly?: (v: boolean) => void
  hasVideoOnly?: boolean
  setHasVideoOnly?: (v: boolean) => void
  sort?: 'newest' | 'name'
  setSort?: (v: 'newest' | 'name') => void
}

// Options analog zur Onboarding-Seite (Werte in EN/UPPERCASE, Labels DE)
const hairColorOptions = [
  { value: 'BLOND', label: 'Blond' },
  { value: 'BROWN', label: 'Braun' },
  { value: 'BLACK', label: 'Schwarz' },
  { value: 'RED', label: 'Rot' },
  { value: 'GREY', label: 'Grau' },
  { value: 'DYED', label: 'Gefärbt' },
]

const hairLengthOptions = [
  { value: 'SHORT', label: 'Kurz' },
  { value: 'MEDIUM', label: 'Mittel' },
  { value: 'LONG', label: 'Lang' },
]

const eyeColorOptions = [
  { value: 'BLUE', label: 'Blau' },
  { value: 'GREEN', label: 'Grün' },
  { value: 'BROWN', label: 'Braun' },
  { value: 'HAZEL', label: 'Haselnuss' },
  { value: 'GREY', label: 'Grau' },
  { value: 'BLACK', label: 'Schwarz' },
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

const clothingStyleOptions = [
  { value: 'ELEGANT', label: 'Elegant' },
  { value: 'CASUAL', label: 'Casual' },
  { value: 'SEXY', label: 'Sexy' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'SPORTY', label: 'Sportlich' },
]

// Zusätzliche Auswahl für Kleidergrößen (gemischt EU & Buchstaben)
const clothingSizeOptions = [
  { value: 'XS', label: 'XS' },
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' },
  { value: '32', label: '32' },
  { value: '34', label: '34' },
  { value: '36', label: '36' },
  { value: '38', label: '38' },
  { value: '40', label: '40' },
  { value: '42', label: '42' },
  { value: '44', label: '44' },
  { value: '46', label: '46' },
]

export default function EscortsSearch({ q, setQ, location, setLocation, onSubmit, loading, error, filters, onFiltersChange, verifiedOnly = false, setVerifiedOnly, ageVerifiedOnly = false, setAgeVerifiedOnly, hasVideoOnly = false, setHasVideoOnly, sort = 'newest', setSort }: Props) {
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  // Key to force remount of Selects to clear internal state reliably on reset
  const [resetKey, setResetKey] = React.useState(0)
  const [showAllServices, setShowAllServices] = React.useState(false)

  function handleFilterChange<K extends keyof EscortFilters>(key: K, value: string) {
    const next = { ...filters, [key]: value }
    onFiltersChange?.(next)
  }

  function handleFilterChangeArray<K extends keyof EscortFilters>(key: K, value: string[]) {
    const next = { ...filters, [key]: value }
    onFiltersChange?.(next)
  }

  function toggleService(value: string) {
    const current = (filters.services || []) as string[]
    const exists = current.includes(value)
    const next = exists ? current.filter((v) => v !== value) : [...current, value]
    handleFilterChangeArray('services', next)
  }

  function removeChip(key: keyof EscortFilters | 'verifiedOnly' | 'ageVerifiedOnly' | 'hasVideoOnly', value?: string) {
    if (key === 'verifiedOnly') { setVerifiedOnly?.(false); return }
    if (key === 'ageVerifiedOnly') { setAgeVerifiedOnly?.(false); return }
    if (key === 'hasVideoOnly') { setHasVideoOnly?.(false); return }
    if (Array.isArray((filters as any)[key])) {
      const arr = [ ...((filters as any)[key] as string[]) ]
      const next = value ? arr.filter((v) => v !== value) : []
      handleFilterChangeArray(key as any, next)
    } else {
      handleFilterChange(key as any, '')
    }
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white border border-gray-200 p-4 md:p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onSubmit()
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              <div className="md:col-span-3">
                <label className="block text-xs tracking-widest text-gray-600 mb-2">SUCHBEGRIFF</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Name, Beschreibung, Services…"
                    className="pl-9 rounded-none border-gray-300 focus-visible:ring-pink-500/30"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs tracking-widest text-gray-600 mb-2">ORT</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Stadt, Land…"
                    className="pl-9 rounded-none border-gray-300 focus-visible:ring-pink-500/30"
                  />
                </div>
              </div>
              <div className="md:col-span-1">
                <Button
                  type="submit"
                  className="w-full text-sm font-light tracking-widest rounded-none bg-pink-600 hover:bg-pink-700 text-white"
                  disabled={loading}
                >
                  {loading ? 'LADEN…' : 'SUCHEN'}
                </Button>
              </div>
            </div>
            {/* Services Checkbox Grid */}
            <div className="mt-6">
              <h4 className="text-xs tracking-widest text-gray-800 mb-2">SERVICES</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {(showAllServices ? SERVICES_DE : SERVICES_DE.slice(0, 12)).map((s) => (
                  <label key={s.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={((filters.services || []) as string[]).includes(s.value)}
                      onChange={() => toggleService(s.value)}
                      className="h-4 w-4 accent-pink-600"
                    />
                    <span>{s.label}</span>
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowAllServices((v) => !v)}
                className="mt-2 text-[13px] text-pink-600 hover:text-pink-700"
              >
                {showAllServices ? 'Weniger anzeigen' : 'Alle Dienste anzeigen'}
              </button>
            </div>
            {/* Beliebte Schlagwörter */}
            <div className="mt-6">
              <h4 className="text-xs tracking-widest text-gray-800 mb-2">BELIEBTE SCHLAGWÖRTER</h4>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Left: three quick toggles */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant={verifiedOnly ? 'default' : 'outline'}
                  className={verifiedOnly ? 'bg-emerald-600 hover:bg-emerald-700 text-white rounded-none' : 'text-sm font-light tracking-widest border-gray-300 hover:border-emerald-500 rounded-none'}
                  onClick={() => setVerifiedOnly?.(!verifiedOnly)}
                >
                  VERIFIZIERT
                </Button>
                <Button
                  type="button"
                  variant={ageVerifiedOnly ? 'default' : 'outline'}
                  className={ageVerifiedOnly ? 'bg-rose-600 hover:bg-rose-700 text-white rounded-none' : 'text-sm font-light tracking-widest border-gray-300 hover:border-rose-500 rounded-none'}
                  onClick={() => setAgeVerifiedOnly?.(!ageVerifiedOnly)}
                >
                  18+
                </Button>
                <Button
                  type="button"
                  variant={hasVideoOnly ? 'default' : 'outline'}
                  className={hasVideoOnly ? 'bg-indigo-600 hover:bg-indigo-700 text-white rounded-none' : 'text-sm font-light tracking-widest border-gray-300 hover:border-indigo-500 rounded-none'}
                  onClick={() => setHasVideoOnly?.(!hasVideoOnly)}
                >
                  MIT VIDEOS
                </Button>
              </div>
              {/* Right: reset + filter */}
              <div className="ml-auto flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="text-sm font-light tracking-widest border-gray-300 hover:border-pink-500 rounded-none"
                  onClick={() => {
                    // Clear search text and location as well
                    setQ('')
                    setLocation('')
                    onFiltersChange?.({
                      height: '',
                      weight: '',
                      breastType: '',
                      breastSize: '',
                      eyeColor: '',
                      hairColor: '',
                      hairLength: '',
                      clothingStyle: '',
                      clothingSize: '',
                      ageMin: '',
                      ageMax: '',
                      gender: '',
                      nationality: [],
                      languages: [],
                      services: [],
                    })
                    setVerifiedOnly?.(false)
                    setAgeVerifiedOnly?.(false)
                    setHasVideoOnly?.(false)
                    // Optional: Filterbereich schließen
                    setFiltersOpen(false)
                    // Force remount of selects to ensure visual reset
                    setResetKey((k) => k + 1)
                  }}
                >
                  ZURÜCKSETZEN
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-sm font-light tracking-widest border-gray-300 hover:border-pink-500 rounded-none"
                  onClick={() => setFiltersOpen((v) => !v)}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  FILTER
                </Button>
              </div>
            </div>

            {/* Aktive Filter-Chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              {/* Chips for toggles */}
              {verifiedOnly && (
                <button type="button" onClick={() => removeChip('verifiedOnly')} className="px-3 py-1 text-xs tracking-widest bg-gray-900 text-white rounded-none">
                  VERIFIZIERT ×
                </button>
              )}
              {ageVerifiedOnly && (
                <button type="button" onClick={() => removeChip('ageVerifiedOnly')} className="px-3 py-1 text-xs tracking-widest bg-gray-900 text-white rounded-none">
                  18+ ×
                </button>
              )}
              {hasVideoOnly && (
                <button type="button" onClick={() => removeChip('hasVideoOnly')} className="px-3 py-1 text-xs tracking-widest bg-gray-900 text-white rounded-none">
                  MIT VIDEOS ×
                </button>
              )}
              {/* Chips for filter fields */}
              {(filters.services || []).map((v) => (
                <button key={`svc-${v}`} type="button" onClick={() => removeChip('services', v)} className="px-3 py-1 text-xs tracking-widest border border-gray-300 rounded-none hover:border-pink-500">
                  {v} ×
                </button>
              ))}
              {filters.gender && (
                <button type="button" onClick={() => removeChip('gender')} className="px-3 py-1 text-xs tracking-widest border border-gray-300 rounded-none hover:border-pink-500">
                  {filters.gender} ×
                </button>
              )}
              {(filters.nationality || []).map((v) => (
                <button key={`nat-${v}`} type="button" onClick={() => removeChip('nationality', v)} className="px-3 py-1 text-xs tracking-widest border border-gray-300 rounded-none hover:border-pink-500">
                  {v} ×
                </button>
              ))}
              {(filters.languages || []).map((v) => (
                <button key={`lang-${v}`} type="button" onClick={() => removeChip('languages', v)} className="px-3 py-1 text-xs tracking-widest border border-gray-300 rounded-none hover:border-pink-500">
                  {v} ×
                </button>
              ))}
              {filters.ageMin && (
                <button type="button" onClick={() => removeChip('ageMin')} className="px-3 py-1 text-xs tracking-widest border border-gray-300 rounded-none hover:border-pink-500">
                  Alter ≥ {filters.ageMin} ×
                </button>
              )}
              {filters.ageMax && (
                <button type="button" onClick={() => removeChip('ageMax')} className="px-3 py-1 text-xs tracking-widest border border-gray-300 rounded-none hover:border-pink-500">
                  Alter ≤ {filters.ageMax} ×
                </button>
              )}
            </div>

            {/* Collapsible Advanced Filters */}
            <div className={`transition-all duration-300 overflow-hidden ${filtersOpen ? 'max-h-[2800px] mt-6' : 'max-h-0'}`}>
              <h4 className="text-xs tracking-widest text-gray-800 mb-4">FILTER</h4>
              {/* Step 1: Basisinformationen */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs tracking-widest text-gray-600 mb-2">ALTER (MIN)</label>
                  <Input
                    value={filters.ageMin || ''}
                    onChange={(e) => handleFilterChange('ageMin', e.target.value)}
                    placeholder="z. B. 18"
                    className="rounded-none border-gray-300 focus-visible:ring-pink-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-widest text-gray-600 mb-2">ALTER (MAX)</label>
                  <Input
                    value={filters.ageMax || ''}
                    onChange={(e) => handleFilterChange('ageMax', e.target.value)}
                    placeholder="z. B. 40"
                    className="rounded-none border-gray-300 focus-visible:ring-pink-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-widest text-gray-600 mb-2">GESCHLECHT</label>
                  <Select key={resetKey} value={filters.gender || undefined} onValueChange={(v) => handleFilterChange('gender', v)}>
                    <SelectTrigger className="w-full border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 bg-transparent">
                      <SelectValue placeholder="Wählen" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {[
                        { value: 'MALE', label: 'Männlich' },
                        { value: 'FEMALE', label: 'Weiblich' },
                        { value: 'NON_BINARY', label: 'Non-Binary' },
                        { value: 'OTHER', label: 'Andere' },
                      ].map((o) => (
                        <SelectItem className="rounded-none" key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs tracking-widest text-gray-600 mb-2">NATIONALITÄT(EN)</label>
                  <MultiSelect
                    options={COUNTRIES_DE}
                    value={(filters.nationality || []) as string[]}
                    onChange={(vals) => handleFilterChangeArray('nationality', vals)}
                    placeholder="Wähle Nationalität(en)"
                    searchPlaceholder="Nach Ländern suchen..."
                    className="w-full"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs tracking-widest text-gray-600 mb-2">SPRACHEN</label>
                  <MultiSelect
                    options={LANGUAGES_DE}
                    value={(filters.languages || []) as string[]}
                    onChange={(vals) => handleFilterChangeArray('languages', vals)}
                    placeholder="Wähle Sprache(n)"
                    searchPlaceholder="Nach Sprachen suchen..."
                    className="w-full"
                  />
                </div>
              </div>

              {/* Step 2: Optik & Merkmale (bestehend) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs tracking-widest text-gray-600 mb-2">GRÖSSE</label>
                  <Input
                    value={filters.height}
                    onChange={(e) => handleFilterChange('height', e.target.value)}
                    placeholder="z. B. 170 cm"
                    className="rounded-none border-gray-300 focus-visible:ring-pink-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-widest text-gray-600 mb-2">GEWICHT</label>
                  <Input
                    value={filters.weight}
                    onChange={(e) => handleFilterChange('weight', e.target.value)}
                    placeholder="z. B. 55 kg"
                    className="rounded-none border-gray-300 focus-visible:ring-pink-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-widest text-gray-600 mb-2">BRUSTTYP</label>
                  <Select key={resetKey} value={filters.breastType || undefined} onValueChange={(v) => handleFilterChange('breastType', v)}>
                    <SelectTrigger className="w-full border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 bg-transparent">
                      <SelectValue placeholder="Wählen" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {breastTypeOptions.map((o) => (
                        <SelectItem className="rounded-none" key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs tracking-widest text-gray-600 mb-2">BRUSTGRÖSSE</label>
                  <Select key={resetKey} value={filters.breastSize || undefined} onValueChange={(v) => handleFilterChange('breastSize', v)}>
                    <SelectTrigger className="w-full border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 bg-transparent">
                      <SelectValue placeholder="Wählen" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {breastSizeOptions.map((o) => (
                        <SelectItem className="rounded-none" key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs tracking-widest text-gray-600 mb-2">AUGENFARBE</label>
                  <Select key={resetKey} value={filters.eyeColor || undefined} onValueChange={(v) => handleFilterChange('eyeColor', v)}>
                    <SelectTrigger className="w-full border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 bg-transparent">
                      <SelectValue placeholder="Wählen" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {eyeColorOptions.map((o) => (
                        <SelectItem className="rounded-none" key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs tracking-widest text-gray-600 mb-2">HAARFARBE</label>
                  <Select key={resetKey} value={filters.hairColor || undefined} onValueChange={(v) => handleFilterChange('hairColor', v)}>
                    <SelectTrigger className="w-full border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 bg-transparent">
                      <SelectValue placeholder="Wählen" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {hairColorOptions.map((o) => (
                        <SelectItem className="rounded-none" key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs tracking-widest text-gray-600 mb-2">HAARLÄNGE</label>
                  <Select key={resetKey} value={filters.hairLength || undefined} onValueChange={(v) => handleFilterChange('hairLength', v)}>
                    <SelectTrigger className="w-full border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 bg-transparent">
                      <SelectValue placeholder="Wählen" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {hairLengthOptions.map((o) => (
                        <SelectItem className="rounded-none" key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs tracking-widest text-gray-600 mb-2">KLEIDUNGSSTIL</label>
                  <Select key={resetKey} value={filters.clothingStyle || undefined} onValueChange={(v) => handleFilterChange('clothingStyle', v)}>
                    <SelectTrigger className="w-full border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 bg-transparent">
                      <SelectValue placeholder="Wählen" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {clothingStyleOptions.map((o) => (
                        <SelectItem className="rounded-none" key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs tracking-widest text-gray-600 mb-2">KLEIDERGRÖSSE</label>
                  <Select key={resetKey} value={filters.clothingSize || undefined} onValueChange={(v) => handleFilterChange('clothingSize', v)}>
                    <SelectTrigger className="w-full border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 bg-transparent">
                      <SelectValue placeholder="Wählen" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {clothingSizeOptions.map((o) => (
                        <SelectItem className="rounded-none" key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Step 5: Services */}
                <div className="md:col-span-3">
                  <label className="block text-xs tracking-widest text-gray-600 mb-2">SERVICES</label>
                  <MultiSelect
                    options={SERVICES_DE}
                    value={(filters.services || []) as string[]}
                    onChange={(vals) => handleFilterChangeArray('services', vals)}
                    placeholder="Wähle Services"
                    searchPlaceholder="Nach Services suchen..."
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-600 mt-3">{error}</p>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MapPin, Search } from 'lucide-react'
import MultiSelect from '@/components/ui/multi-select'
import { SERVICES_DE } from '@/data/services.de'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Props = {
  q: string
  setQ: (v: string) => void
  location: string
  setLocation: (v: string) => void
  sort: string
  setSort: (v: string) => void
  onSubmit: () => void
  loading?: boolean
  error?: string | null
  // Optional: additional business filters
  businessType?: string
  setBusinessType?: (v: string) => void
  businessServices?: string[]
  setBusinessServices?: (v: string[]) => void
}

export default function AgencySearch({ q, setQ, location, setLocation, sort, setSort, onSubmit, loading, error, businessType = '', setBusinessType, businessServices = [], setBusinessServices }: Props) {
  // Avoid SSR hydration mismatches with Radix Select by mounting it on client only
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
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
            <div className="grid grid-cols-1 md:grid-cols-8 gap-3 items-end">
              <div className="md:col-span-3">
                <label className="block text-xs tracking-widest text-gray-600 mb-2">SUCHBEGRIFF</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Name, Beschreibung…"
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
                <label className="block text-xs tracking-widest text-gray-600 mb-2">SORTIEREN</label>
                {mounted ? (
                  <Select value={sort} onValueChange={(v) => setSort(v)}>
                    <SelectTrigger className="w-full rounded-none border-gray-300">
                      <SelectValue aria-label="Sortieren" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Neueste zuerst</SelectItem>
                      <SelectItem value="name">Name A–Z</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <select
                    value={sort}
                    onChange={() => {}}
                    aria-hidden
                    className="w-full border border-gray-300 bg-white px-3 py-2 text-sm rounded-none"
                  >
                    <option value="newest">Neueste zuerst</option>
                    <option value="name">Name A–Z</option>
                  </select>
                )}
              </div>
              {setBusinessType && (
                <div className="md:col-span-2">
                  <label className="block text-xs tracking-widest text-gray-600 mb-2">GESCHÄFTSTYP</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full border border-gray-300 bg-white px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-pink-500/30"
                  >
                    <option value="">Alle</option>
                    <option value="Agentur">Agentur</option>
                    <option value="Club">Club</option>
                    <option value="Studio">Studio</option>
                  </select>
                </div>
              )}
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

            {/* Optional additional filters */}
            {(setBusinessServices) && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {setBusinessServices && (
                  <div className="md:col-span-2">
                    <label className="block text-xs tracking-widest text-gray-600 mb-2">SERVICES/FEATURES</label>
                    <MultiSelect
                      options={SERVICES_DE}
                      value={businessServices}
                      onChange={(vals) => setBusinessServices?.(vals)}
                      placeholder="Wähle Services/Features"
                      searchPlaceholder="Suchen..."
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            )}
            <div className="mt-3 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="text-sm font-light tracking-widest border-gray-300 hover:border-pink-500 rounded-none"
                onClick={() => {
                  setQ('')
                  setLocation('')
                  setBusinessType?.('')
                  setBusinessServices?.([])
                }}
              >
                ZURÜCKSETZEN
              </Button>
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

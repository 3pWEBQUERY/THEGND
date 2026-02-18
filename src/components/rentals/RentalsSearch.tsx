"use client"

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const CATEGORIES = [
  { value: 'ALL', label: 'Alle Kategorien' },
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'ROOM', label: 'Zimmer' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'EVENT_SPACE', label: 'Eventfläche' },
] as const

export default function RentalsSearch({ q, setQ, category, setCategory, city, setCity, country, setCountry, onSubmit }: {
  q: string; setQ: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  city: string; setCity: (v: string) => void;
  country: string; setCountry: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit() }}
          className="bg-white border border-gray-200 p-4 md:p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-8 gap-3 items-end">
            <div className="md:col-span-4">
              <label className="block text-xs tracking-widest text-gray-600 mb-2">SUCHBEGRIFF</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Titel, Beschreibung…" className="pl-9 rounded-none border-gray-300 focus-visible:ring-pink-500/30" />
              </div>
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs tracking-widest text-gray-600 mb-2">KATEGORIEN</label>
              <Select value={category && category.length ? category : 'ALL'} onValueChange={(v) => setCategory(v === 'ALL' ? '' : v)}>
                <SelectTrigger className="w-full rounded-none border-gray-300">
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs tracking-widest text-gray-600 mb-2">STADT</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Stadt" className="rounded-none border-gray-300" />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs tracking-widest text-gray-600 mb-2">LAND</label>
              <Select value={country || undefined} onValueChange={(v) => setCountry(v)}>
                <SelectTrigger className="w-full rounded-none border-gray-300">
                  <SelectValue placeholder="Land wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Schweiz">SCHWEIZ</SelectItem>
                  <SelectItem value="Österreich">ÖSTERREICH</SelectItem>
                  <SelectItem value="Deutschland">DEUTSCHLAND</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1">
              <Button type="submit" className="w-full text-sm font-light tracking-widest rounded-none bg-pink-600 hover:bg-pink-700 text-white">Suchen</Button>
            </div>
          </div>
        </form>
      </div>
    </section>
  )
}

'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

type Props = {
  q: string
  setQ: (v: string) => void
  onSubmit: () => void
}

export default function StoriesSearch({ q, setQ, onSubmit }: Props) {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
          className="bg-white border border-gray-200 p-4 md:p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div className="md:col-span-5">
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
            <div className="md:col-span-1">
              <Button
                type="submit"
                className="w-full text-sm font-light tracking-widest rounded-none bg-pink-600 hover:bg-pink-700 text-white"
              >
                SUCHEN
              </Button>
            </div>
          </div>
        </form>
      </div>
    </section>
  )
}

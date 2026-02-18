'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BadgeCheck } from 'lucide-react'
import type { AgencyItem } from '@/types/agency'

export default function AgencyGridSection() {
  const [items, setItems] = useState<AgencyItem[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/agency/search?take=12', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setItems(Array.isArray(data.items) ? data.items : [])
        } else {
          setItems([])
        }
      } catch {
        setItems([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  function slugify(input: string): string {
    return input
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }

  return (
    <section id="agencies" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-thin tracking-wider text-gray-800 mb-4">AGENTUREN</h2>
          <div className="w-24 h-px bg-pink-500 mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {loading && !items &&
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="group cursor-pointer rounded-none">
                <div className="h-48 sm:h-56 md:h-64 lg:h-72 bg-gray-200 relative overflow-hidden animate-pulse border border-gray-200" />
                <div className="px-3 py-3">
                  <div className="h-3 w-3/4 bg-gray-200 animate-pulse" />
                  <div className="h-2 w-1/2 bg-gray-100 mt-2 animate-pulse" />
                </div>
              </div>
            ))}

          {items?.map((e) => {
            const label = e.name || 'Agentur'
            const href = `/agency/${e.id}/${slugify(label)}`
            return (
              <div key={e.id} className="group cursor-pointer rounded-none">
                <Link href={href} className="block">
                  <div className="h-44 sm:h-48 md:h-56 lg:h-64 bg-gray-200 relative overflow-hidden border border-gray-200 group-hover:border-pink-500 transition-colors">
                    {e.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.image} alt={label} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gray-300" />
                    )}
                    {e.isVerified && (
                      <div className="absolute top-2 right-2 z-10">
                        <span title="Verifiziert" className="inline-flex items-center justify-center h-6 w-6 bg-white/90 border border-emerald-200 text-emerald-700">
                          <BadgeCheck className="h-4 w-4" />
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Link href={href} className="block truncate">
                        <h3 className="text-base font-medium tracking-widest text-gray-900 truncate">{(e.name?.toUpperCase?.() ?? e.name) || '—'}</h3>
                      </Link>
                      {e.isVerified && <BadgeCheck className="h-4 w-4 text-pink-500 flex-shrink-0" />}
                    </div>
                  </div>
                  {(e.city || e.country) && (
                    <div className="mt-1 text-sm text-gray-700">{e.city || e.country}</div>
                  )}
                </div>
              </div>
            )
          })}

          {!loading && items?.length === 0 && (
            <div className="col-span-full text-center text-sm text-gray-500 py-10">
              Keine Agenturen verfügbar.
            </div>
          )}
        </div>

        <div className="text-center">
          <Button asChild variant="outline" className="text-sm font-light tracking-widest px-8 py-3 border-gray-300 hover:border-pink-500">
            <Link href="/agency">ALLE AGENTUREN ANSEHEN</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

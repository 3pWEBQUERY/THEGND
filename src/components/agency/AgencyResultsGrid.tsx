import type { AgencyItem } from '@/types/agency'
import { BadgeCheck } from 'lucide-react'
import Link from 'next/link'

type Props = {
  items: AgencyItem[] | null
  loading: boolean
  total: number | null
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export default function AgencyResultsGrid({ items, loading, total }: Props) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-lg font-light tracking-widest text-gray-800">ERGEBNISSE</h2>
          {typeof total === 'number' && (
            <span className="text-xs text-gray-500">{total} Treffer</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && !items &&
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="group">
                <div className="h-48 sm:h-56 md:h-64 lg:h-72 bg-gray-200 animate-pulse" />
                <div className="h-3 w-3/4 bg-gray-200 mt-2 animate-pulse" />
                <div className="h-2 w-1/2 bg-gray-100 mt-1 animate-pulse" />
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
                      <img src={e.image} alt={label} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-300" />
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
              Keine Ergebnisse gefunden. Passe deine Suche an.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

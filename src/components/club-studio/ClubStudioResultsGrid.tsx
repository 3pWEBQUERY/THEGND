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

export default function ClubStudioResultsGrid({ items, loading, total }: Props) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-lg font-light tracking-widest text-gray-800">ERGEBNISSE</h2>
          {typeof total === 'number' && (
            <span className="text-xs text-gray-500">{total} Treffer</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading && !items &&
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="group">
                <div className="h-48 sm:h-56 md:h-64 lg:h-72 bg-gray-200 animate-pulse" />
                <div className="h-3 w-3/4 bg-gray-200 mt-2 animate-pulse" />
                <div className="h-2 w-1/2 bg-gray-100 mt-1 animate-pulse" />
              </div>
            ))}

          {items?.map((e) => {
            const label = e.name || 'Club/Studio'
            const href = `/club-studio/${e.id}/${slugify(label)}`
            return (
              <Link href={href} key={e.id} className="group cursor-pointer block">
                <div className="h-44 sm:h-48 md:h-56 lg:h-64 bg-gray-200 relative overflow-hidden mb-2">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
                <div className="text-center">
                  {e.name && (
                    <h3 className="text-sm font-light tracking-widest text-gray-800">{e.name.toUpperCase?.() ?? e.name}</h3>
                  )}
                  {(e.city || e.country) && (
                    <p className="text-xs text-gray-500 mt-1">{e.city || e.country}</p>
                  )}
                </div>
              </Link>
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

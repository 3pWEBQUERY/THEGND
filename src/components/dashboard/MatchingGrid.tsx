"use client"

import Image from 'next/image'
import Link from 'next/link'
import { Heart, X } from 'lucide-react'
import ServicesChips from '@/components/matching/ServicesChips'

export type MatchingGridProps = {
  matchLoading: boolean
  matchError: string | null
  suggestions: any[]
  gridAnim: Record<string, 'LEFT' | 'RIGHT'>
  onSwipe: (id: string, action: 'LIKE' | 'PASS') => void
  onReload: () => void
  onShowPrefs: () => void
}

export default function MatchingGrid({ matchLoading, matchError, suggestions, gridAnim, onSwipe, onReload, onShowPrefs }: MatchingGridProps) {
  return (
    <div>
      {matchLoading ? (
        <div className="text-sm text-gray-500">Lade Vorschläge…</div>
      ) : matchError ? (
        <div className="text-sm text-red-600">{matchError}</div>
      ) : suggestions.length === 0 ? (
        <div className="text-sm text-gray-500">
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <div>Keine Vorschläge verfügbar</div>
            <div className="flex items-center gap-3">
              <button onClick={onReload} className="px-3 py-1.5 text-xs uppercase tracking-widest border border-gray-300 hover:border-pink-500 hover:text-pink-600">Neu laden</button>
              <button onClick={onShowPrefs} className="px-3 py-1.5 text-xs uppercase tracking-widest border border-gray-300 hover:border-pink-500 hover:text-pink-600">Präferenzen anpassen</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {suggestions.map((s: any) => {
            const href = `/escorts/${s.id}/${(s.displayName || 'escort').toLowerCase().replace(/[^a-z0-9]+/g,'-')}`
            return (
              <Link key={s.id} href={href} className="group block relative">
                <div
                  className="aspect-[2/3] bg-gray-100 border border-gray-200 relative overflow-hidden"
                  style={gridAnim[s.id]
                    ? {
                        transform: gridAnim[s.id] === 'RIGHT' ? 'translateX(1000px) rotate(10deg)' : 'translateX(-1000px) rotate(-10deg)',
                        transition: 'transform 260ms ease-out, opacity 260ms ease-out',
                        opacity: 0,
                        pointerEvents: 'none'
                      }
                    : undefined}
                >
                  {s.image || s.avatar ? (
                    <Image src={(s.image || s.avatar)!} alt={s.displayName} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">Kein Bild</div>
                  )}
                  {/* Overlay Controls */}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/40 to-transparent opacity-100 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSwipe(s.id, 'PASS') }}
                        aria-label="Ablehnen"
                        className="h-9 w-9 rounded-full bg-white/90 hover:bg-white text-gray-700 flex items-center justify-center shadow"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSwipe(s.id, 'LIKE') }}
                        aria-label="Like"
                        className="h-10 w-10 rounded-full bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center shadow"
                      >
                        <Heart className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="px-2 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium tracking-widest text-gray-900 truncate">{(s.displayName || '').toUpperCase()}</h3>
                    <div className="text-xs text-gray-500 whitespace-nowrap">{s.city || ''}{s.city && s.country ? ', ' : ''}{s.country || ''}</div>
                  </div>
                  {Array.isArray(s.services) && s.services.length > 0 && (
                    <ServicesChips services={s.services} maxVisible={4} />
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

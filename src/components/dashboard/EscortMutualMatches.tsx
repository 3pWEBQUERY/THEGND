"use client"

import Image from 'next/image'
import Link from 'next/link'

export type EscortMutualMatchesProps = {
  loading: boolean
  mutual: any[]
  onMessage: (id: string) => void
}

export default function EscortMutualMatches({ loading, mutual, onMessage }: EscortMutualMatchesProps) {
  return (
    <div className="mt-12">
      <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-4">MATCHES</h3>
      {loading ? (
        <div className="text-sm text-gray-500">Lade…</div>
      ) : mutual.length === 0 ? (
        <div className="text-sm text-gray-500">Keine Matches</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {mutual.map((m: any) => {
            const slug = (m.displayName || 'member').toLowerCase().replace(/[^a-z0-9]+/g,'-')
            const targetHref = `/members/${m.id}/${slug}`
            return (
              <Link key={m.id} href={targetHref} className="group block relative">
                <div className="aspect-[2/3] bg-gray-100 border border-gray-200 relative overflow-hidden transition shadow-sm group-hover:shadow-lg">
                  {m.avatar ? (
                    <Image src={m.avatar} alt={m.displayName || m.email} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">Kein Bild</div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                  <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMessage(m.id) }}
                        className="px-2.5 py-1.5 text-xs uppercase tracking-widest bg-white/90 hover:bg-white text-gray-800"
                      >
                        Nachricht
                      </button>
                    </div>
                  </div>
                </div>
                <div className="px-2 py-2">
                  <div className="text-sm font-medium tracking-wider text-gray-900 truncate">{m.displayName || m.email}</div>
                  <div className="text-xs text-gray-500">{m.city || ''}{m.city && m.country ? ', ' : ''}{m.country || ''}</div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

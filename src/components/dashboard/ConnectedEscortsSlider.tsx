'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAvatarUrl } from '@/utils/avatar'

type ConnectedEscort = {
  id: string
  email?: string | null
  profile?: {
    displayName?: string | null
    avatar?: string | null
    city?: string | null
    country?: string | null
  } | null
}

type Props = {
  heading?: string
  items?: ConnectedEscort[] | null
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export default function ConnectedEscortsSlider({ heading = 'VERKNÜPFTE ESCORTS', items: incoming }: Props) {
  const [items, setItems] = useState<ConnectedEscort[] | null>(incoming ?? null)
  const [loading, setLoading] = useState<boolean>(!incoming)
  const [availability, setAvailability] = useState<Record<string, boolean>>({})
  const [pending, setPending] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (incoming) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/girls/list', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!cancelled) setItems(Array.isArray(data?.items) ? data.items : [])
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [incoming])

  // Load availability map for current slide items
  useEffect(() => {
    const ids = (items || []).map(i => i.id).filter(Boolean)
    if (!ids || ids.length === 0) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/girls/presence?ids=${encodeURIComponent(ids.join(','))}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json().catch(() => ({}))
        if (!cancelled && data && typeof data === 'object') {
          setAvailability(data as Record<string, boolean>)
        }
      } catch {}
    })()
    return () => { cancelled = true }
  }, [items])

  const setAvailable = async (id: string, val: boolean) => {
    setPending(prev => ({ ...prev, [id]: true }))
    try {
      await fetch('/api/girls/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, available: val })
      })
      setAvailability(prev => ({ ...prev, [id]: val }))
    } catch {}
    finally {
      setPending(prev => { const { [id]: _, ...rest } = prev; return rest })
    }
  }

  const cards = (items || []).map((g) => {
    const name = g.profile?.displayName || g.email || '—'
    const slug = slugify(name)
    const href = `/escorts/${g.id}/${slug}`
    const loc = [g.profile?.city, g.profile?.country].filter(Boolean).join(', ')
    return (
      <div key={g.id} className="group cursor-pointer rounded-none">
        <Link href={href} className="block">
          <div className="aspect-[2/3] sm:aspect-[3/4] bg-gray-200 relative overflow-hidden border border-gray-200 group-hover:border-pink-500 transition-colors">
            <span
              className={`absolute top-2 left-2 h-3 w-3 rounded-full border-2 border-white ${availability[g.id] ? 'bg-emerald-500' : 'bg-gray-300'}`}
              title={availability[g.id] ? 'Anwesend' : 'Abwesend'}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getAvatarUrl(g.profile?.avatar, 'ESCORT')} alt={name} className="h-full w-full object-cover" />
          </div>
        </Link>
        <div className="px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Link href={href} className="block truncate">
                <h3 className="text-base font-medium tracking-widest text-gray-900 truncate">{(name as string).toUpperCase?.() || name}</h3>
              </Link>
            </div>
          </div>
          {loc && <div className="mt-1 text-sm text-gray-700">{loc}</div>}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => setAvailable(g.id, true)}
              disabled={pending[g.id]}
              className={`px-2 py-1 text-[10px] uppercase tracking-widest border ${availability[g.id] ? 'border-emerald-600 text-emerald-700' : 'border-gray-300 text-gray-700'} hover:border-pink-500 hover:text-pink-600 disabled:opacity-50`}
            >
              ANWESEND
            </button>
            <button
              onClick={() => setAvailable(g.id, false)}
              disabled={pending[g.id]}
              className={`px-2 py-1 text-[10px] uppercase tracking-widest border ${availability[g.id] === false ? 'border-gray-600 text-gray-700' : 'border-gray-300 text-gray-600'} hover:border-pink-500 hover:text-pink-600 disabled:opacity-50`}
            >
              ABWESEND
            </button>
          </div>
        </div>
      </div>
    )
  })

  const skeleton = (
    <div className="flex gap-4 overflow-x-auto overflow-y-hidden no-scrollbar snap-x snap-mandatory">
      {Array.from({ length: 2 }).map((_, si) => (
        <div key={si} className="flex-none w-full snap-start">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-6 sm:gap-6">
            {Array.from({ length: 8 }).map((__, i) => (
              <div key={i} className="group cursor-pointer rounded-none">
                <div className="aspect-[2/3] sm:aspect-[3/4] bg-gray-200 relative overflow-hidden animate-pulse border border-gray-200" />
                <div className="px-3 py-3">
                  <div className="h-3 w-3/4 bg-gray-200 animate-pulse" />
                  <div className="h-2 w-1/2 bg-gray-100 mt-2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-4">{heading}</h3>
        {skeleton}
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-4">{heading}</h3>
        <div className="text-sm text-gray-500">Noch keine Escorts verbunden.</div>
      </div>
    )
  }

  const slides = chunk(cards, 8)

  return (
    <div className="bg-white border border-gray-200 p-6">
      <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-4">{heading}</h3>
      <div className="flex gap-4 overflow-x-auto overflow-y-hidden no-scrollbar snap-x snap-mandatory">
        {slides.map((slide, si) => (
          <div key={si} className="flex-none w-full snap-start">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-6 sm:gap-6">
              {slide}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

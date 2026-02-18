'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

 type EscortItem = {
  id: string
  name: string | null
  city: string | null
  country: string | null
  image: string | null
}

 type Props = {
  heading?: string
  items?: EscortItem[] | null
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

export default function NewestEscortsSlider({ heading = 'NEUE ESCORTS', items: incoming }: Props) {
  const [items, setItems] = useState<EscortItem[] | null>(incoming ?? null)
  const [loading, setLoading] = useState<boolean>(!incoming)
  const [perSlide, setPerSlide] = useState<number>(2)

  useEffect(() => {
    if (incoming) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/escorts/search?take=16&sort=newest', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        const arr = Array.isArray(data?.items) ? data.items : []
        if (!cancelled) setItems(arr)
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [incoming])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setPerSlide(mq.matches ? 4 : 2)
    update()
    try { mq.addEventListener('change', update) } catch { mq.addListener(update) }
    return () => { try { mq.removeEventListener('change', update) } catch { mq.removeListener(update) } }
  }, [])

  const cards = (items || []).map((e) => {
    const name = e.name || '—'
    const slug = slugify(name)
    const href = `/escorts/${e.id}/${slug}`
    const loc = [e.city, e.country].filter(Boolean).join(', ')
    return (
      <div key={e.id} className="group cursor-pointer rounded-none">
        <Link href={href} className="block">
          <div className="aspect-[2/3] sm:aspect-[3/4] bg-gray-200 relative overflow-hidden border border-gray-200 group-hover:border-pink-500 transition-colors">
            {e.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.image} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-500 text-sm">PHOTO</span>
              </div>
            )}
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
        </div>
      </div>
    )
  })

  const skeleton = (
    <div className="flex gap-4 overflow-x-auto overflow-y-hidden no-scrollbar snap-x snap-mandatory">
      {Array.from({ length: 2 }).map((_, si) => (
        <div key={si} className="flex-none w-full snap-start">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-2 gap-y-6 sm:gap-6">
            {Array.from({ length: perSlide }).map((__, i) => (
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
        <div className="text-sm text-gray-500">Keine Einträge vorhanden.</div>
      </div>
    )
  }

  const slides = chunk(cards, perSlide)

  return (
    <div className="bg-white border border-gray-200 p-6">
      <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-4">{heading}</h3>
      <div className="flex gap-4 overflow-x-auto overflow-y-hidden no-scrollbar snap-x snap-mandatory">
        {slides.map((slide, si) => (
          <div key={si} className="flex-none w-full snap-start">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-2 gap-y-6 sm:gap-6">
              {slide}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

 'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Star, ShieldCheck, BadgeCheck } from 'lucide-react'
import type { EscortItem } from '@/types/escort'
import RatingDonut from '@/components/RatingDonut'

export default function EscortsGridSection() {
  const [items, setItems] = useState<EscortItem[] | null>(null)
  const [ratingsMap, setRatingsMap] = useState<Record<string, { avg: number; count: number }>>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [presenceMap, setPresenceMap] = useState<Record<string, { online: boolean; lastSeenAt?: string | null }>>({})

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/escorts/search?take=12', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setItems(data.items)
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

  // Presence map for items
  useEffect(() => {
    if (!items || items.length === 0) return
    const ids = items.map((e) => e.id).filter(Boolean)
    const unique = Array.from(new Set(ids))
    if (unique.length === 0) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/presence?ids=${encodeURIComponent(unique.join(','))}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        setPresenceMap(data || {})
      } catch {}
    })()
    return () => { cancelled = true }
  }, [items])

  // Enrich ratings from comments API if not provided by search endpoint
  useEffect(() => {
    if (!items || items.length === 0) return
    const missing = items.filter((e: any) => {
      const hasInline = typeof e?.ratingAverage === 'number' || typeof e?.avgRating === 'number' || typeof e?.rating === 'number'
      const hasCount = typeof e?.ratingCount === 'number' || typeof e?.commentsCount === 'number' || typeof e?._count?.comments === 'number'
      return !(hasInline && hasCount) && !ratingsMap[e.id]
    })
    if (missing.length === 0) return
    let cancelled = false
    ;(async () => {
      try {
        const results = await Promise.all(
          missing.map(async (e) => {
            try {
              const res = await fetch(`/api/comments?targetUserId=${encodeURIComponent(e.id)}`, { cache: 'no-store' })
              if (!res.ok) return [e.id, { avg: 0, count: 0 }] as const
              const comments = await res.json()
              const rated = (Array.isArray(comments) ? comments : []).filter((c: any) => typeof c?.rating === 'number' && c.rating > 0)
              const count = rated.length
              const avg = count > 0 ? rated.reduce((a: number, c: any) => a + (Number(c.rating) || 0), 0) / count : 0
              return [e.id, { avg, count }] as const
            } catch {
              return [e.id, { avg: 0, count: 0 }] as const
            }
          })
        )
        if (cancelled) return
        setRatingsMap((prev) => {
          const next = { ...prev }
          for (const [id, val] of results) {
            next[id] = val
          }
          return next
        })
      } catch {
        // no-op
      }
    })()
    return () => {
      cancelled = true
    }
  }, [items, ratingsMap])

  function slugify(input: string): string {
    return input
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }

  const mobileSlides = useMemo(() => {
    if (!items || items.length === 0) return [] as EscortItem[][]
    const slides: EscortItem[][] = []
    for (let i = 0; i < items.length; i += 2) {
      slides.push(items.slice(i, i + 2))
    }
    return slides
  }, [items])

  return (
    <section id="escorts" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-thin tracking-wider text-gray-800 mb-4">ESCORTS</h2>
          <div className="w-24 h-px bg-pink-500 mx-auto"></div>
        </div>
        
        {/* Escort Grid - live data */}
        <div className="sm:hidden mb-4 overflow-x-auto snap-x snap-mandatory">
          <div className="flex gap-4">
            {loading && !items && Array.from({ length: 4 }).map((_, si) => (
              <div key={`s-${si}`} className="shrink-0 w-[calc(100vw-24px)] snap-start">
                <div className="grid grid-cols-2 gap-x-2 gap-y-6">
                  {Array.from({ length: 2 }).map((__, ci) => (
                    <div key={ci} className="group cursor-pointer rounded-none">
                      <div className="aspect-[2/3] bg-gray-200 relative overflow-hidden animate-pulse border border-gray-200" />
                      <div className="px-3 py-3">
                        <div className="h-3 w-3/4 bg-gray-200 animate-pulse" />
                        <div className="h-2 w-1/2 bg-gray-100 mt-2 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {mobileSlides.map((pair, si) => (
              <div key={si} className="shrink-0 w-[calc(100vw-24px)] snap-start">
                <div className="grid grid-cols-2 gap-x-2 gap-y-6">
                  {pair.map((e, index) => {
                    const slug = e.name ? slugify(e.name) : 'escort'
                    const href = `/escorts/${e.id}/${slug}`
                    const isWeek = Boolean((e as any)?.isEscortOfWeek) || (Array.isArray((e as any)?.badges) && (e as any).badges.includes('ESCORT_OF_WEEK'))
                    const isMonth = Boolean((e as any)?.isEscortOfMonth) || (Array.isArray((e as any)?.badges) && (e as any).badges.includes('ESCORT_OF_MONTH'))
                    const highlight = isMonth ? 'month' : (isWeek ? 'week' : null)
                    const frameClasses = highlight
                      ? (isMonth
                          ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-200/60'
                          : 'ring-2 ring-pink-400 shadow-lg shadow-pink-200/60')
                      : ''
                    const isNew = (() => {
                      const ts = (e as any)?.createdAt
                      if (!ts) return false
                      const t = new Date(ts as any).getTime()
                      if (!t) return false
                      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
                      return Date.now() - t <= SEVEN_DAYS
                    })()
                    const comments: any[] | undefined = Array.isArray((e as any)?.comments) ? (e as any).comments : undefined
                    const reviews: any[] | undefined = Array.isArray((e as any)?.reviews) ? (e as any).reviews : undefined
                    const ratingCountRaw = (e as any)?.ratingCount ?? (e as any)?.commentsCount ?? (e as any)?._count?.comments
                    const ratingAverageRaw = (e as any)?.avgRating ?? (e as any)?.commentsAverage ?? (e as any)?.averageRating ?? (e as any)?.ratingAverage ?? (e as any)?.rating
                    let ratingCount = typeof ratingCountRaw === 'number' ? ratingCountRaw : (comments ? comments.length : (reviews ? reviews.length : 0))
                    let rating = typeof ratingAverageRaw === 'number' ? ratingAverageRaw : NaN
                    if ((!Number.isFinite(rating) || rating <= 0) && ratingsMap[e.id]) {
                      rating = ratingsMap[e.id].avg
                      ratingCount = ratingsMap[e.id].count
                    }
                    if ((!Number.isFinite(rating) || rating <= 0) && comments && comments.length) {
                      const sum = comments.reduce((acc, c: any) => acc + (Number(c?.rating ?? c?.stars) || 0), 0)
                      rating = sum / comments.length
                      ratingCount = comments.length
                    } else if ((!Number.isFinite(rating) || rating <= 0) && reviews && reviews.length) {
                      const sum = reviews.reduce((acc, r: any) => acc + (Number(r?.rating ?? r?.stars) || 0), 0)
                      rating = sum / reviews.length
                      ratingCount = reviews.length
                    }
                    rating = Math.max(0, Math.min(5, Number.isFinite(rating) ? (rating as number) : 0))
                    const stars = Math.round(rating)
                    return (
                      <div key={`${e.id}-${index}`} className={`group cursor-pointer rounded-none`}>
                        <Link href={href} className="block">
                          <div className={`aspect-[2/3] sm:aspect-[3/4] bg-gray-200 relative overflow-hidden border border-gray-200 group-hover:border-pink-500 transition-colors ${frameClasses}`}>
                            <span className={`absolute top-2 left-2 h-3 w-3 rounded-full border-2 border-white ${presenceMap[e.id]?.online ? 'bg-emerald-500' : 'bg-gray-300'}`} title={presenceMap[e.id]?.online ? 'Online' : 'Offline'} />
                            {e.image ? (
                              <img src={e.image} alt={e.name ?? ''} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full bg-gray-300 flex items-center justify-center">
                                <span className="text-gray-500 text-sm">PHOTO</span>
                              </div>
                            )}
                            {highlight && (
                              <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-center">
                                <span className={`${isMonth ? 'bg-amber-400 text-amber-900' : 'bg-pink-500 text-white'} px-2 py-1 text-[10px] uppercase tracking-widest font-medium`}>
                                  {isMonth ? 'ESCORT OF THE MONTH' : 'ESCORT OF THE WEEK'}
                                </span>
                              </div>
                            )}
                            {(isNew || e.isVerified || e.isAgeVerified) && (
                              <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                {isNew && (
                                  <span title="Neu" className="inline-flex items-center gap-1 h-6 px-2 bg-white/90 border border-pink-200 text-pink-600 text-[10px] font-semibold tracking-widest">
                                    <span className="h-2 w-2 rounded-full bg-pink-600"></span>
                                    NEU
                                  </span>
                                )}
                                {e.isVerified && (
                                  <span title="Verifiziert" className="inline-flex items-center justify-center h-6 w-6 bg-white/90 border border-emerald-200 text-emerald-700">
                                    <BadgeCheck className="h-4 w-4" />
                                  </span>
                                )}
                                {(e.isAgeVerified || e.isVerified) && (
                                  <span title="Altersverifiziert" className="inline-flex items-center justify-center h-6 w-6 bg-white/90 border border-rose-200 text-rose-700">
                                    <ShieldCheck className="h-4 w-4" />
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="px-3 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <Link href={href} className="block truncate">
                                <h3 className="text-base font-medium tracking-widest text-gray-900 truncate">
                                  {(e.name?.toUpperCase?.() ?? e.name) || '—'}
                                </h3>
                              </Link>
                              {e.isVerified && <BadgeCheck className="h-4 w-4 text-pink-500 flex-shrink-0" />}
                            </div>
                            {rating > 0 && (
                              <div className="flex items-center">
                                <div className="sm:hidden">
                                  <RatingDonut
                                    value={rating}
                                    showValue
                                    size={28}
                                    strokeWidth={4}
                                    fillColor="#ec4899"
                                  />
                                </div>
                                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap">
                                  <span className="tracking-wide font-medium">{`${rating.toFixed(1)}/5`}</span>
                                  <span className="flex items-center">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star key={i} className={`h-4 w-4 ${i < stars ? 'text-pink-500' : 'text-gray-300'}`} fill="currentColor" />
                                    ))}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          {(e.city || e.country) && (
                            <div className="mt-1 text-sm text-gray-700">{e.city || e.country}</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-6 sm:gap-6 mb-4">
          {loading && !items &&
            Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="group cursor-pointer rounded-none">
                <div className="aspect-[2/3] sm:aspect-[3/4] bg-gray-200 relative overflow-hidden animate-pulse border border-gray-200" />
                <div className="px-3 py-3">
                  <div className="h-3 w-3/4 bg-gray-200 animate-pulse" />
                  <div className="h-2 w-1/2 bg-gray-100 mt-2 animate-pulse" />
                </div>
              </div>
            ))}

          {items?.map((e, index) => {
            const slug = e.name ? slugify(e.name) : 'escort'
            const href = `/escorts/${e.id}/${slug}`
            const isWeek = Boolean((e as any)?.isEscortOfWeek) || (Array.isArray((e as any)?.badges) && (e as any).badges.includes('ESCORT_OF_WEEK'))
            const isMonth = Boolean((e as any)?.isEscortOfMonth) || (Array.isArray((e as any)?.badges) && (e as any).badges.includes('ESCORT_OF_MONTH'))
            const highlight = isMonth ? 'month' : (isWeek ? 'week' : null)
            const frameClasses = highlight
              ? (isMonth
                  ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-200/60'
                  : 'ring-2 ring-pink-400 shadow-lg shadow-pink-200/60')
              : ''
            const isNew = (() => {
              const ts = (e as any)?.createdAt
              if (!ts) return false
              const t = new Date(ts as any).getTime()
              if (!t) return false
              const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
              return Date.now() - t <= SEVEN_DAYS
            })()
            // Build rating from item fields or from ratingsMap fallback (comments API)
            const comments: any[] | undefined = Array.isArray((e as any)?.comments) ? (e as any).comments : undefined
            const reviews: any[] | undefined = Array.isArray((e as any)?.reviews) ? (e as any).reviews : undefined
            const ratingCountRaw = (e as any)?.ratingCount ?? (e as any)?.commentsCount ?? (e as any)?._count?.comments
            const ratingAverageRaw = (e as any)?.avgRating ?? (e as any)?.commentsAverage ?? (e as any)?.averageRating ?? (e as any)?.ratingAverage ?? (e as any)?.rating
            let ratingCount = typeof ratingCountRaw === 'number' ? ratingCountRaw : (comments ? comments.length : (reviews ? reviews.length : 0))
            let rating = typeof ratingAverageRaw === 'number' ? ratingAverageRaw : NaN
            if ((!Number.isFinite(rating) || rating <= 0) && ratingsMap[e.id]) {
              rating = ratingsMap[e.id].avg
              ratingCount = ratingsMap[e.id].count
            }
            if ((!Number.isFinite(rating) || rating <= 0) && comments && comments.length) {
              const sum = comments.reduce((acc, c: any) => acc + (Number(c?.rating ?? c?.stars) || 0), 0)
              rating = sum / comments.length
              ratingCount = comments.length
            } else if ((!Number.isFinite(rating) || rating <= 0) && reviews && reviews.length) {
              const sum = reviews.reduce((acc, r: any) => acc + (Number(r?.rating ?? r?.stars) || 0), 0)
              rating = sum / reviews.length
              ratingCount = reviews.length
            }
            rating = Math.max(0, Math.min(5, Number.isFinite(rating) ? (rating as number) : 0))
            const stars = Math.round(rating)
            return (
              <div key={`${e.id}-${index}`} className={`group cursor-pointer rounded-none`}>
                {/* Image as link */}
                <Link href={href} className="block">
                  <div className={`aspect-[2/3] sm:aspect-[3/4] bg-gray-200 relative overflow-hidden border border-gray-200 group-hover:border-pink-500 transition-colors ${frameClasses}`}>
                    {/* Online indicator top-left */}
                    <span className={`absolute top-2 left-2 h-3 w-3 rounded-full border-2 border-white ${presenceMap[e.id]?.online ? 'bg-emerald-500' : 'bg-gray-300'}`} title={presenceMap[e.id]?.online ? 'Online' : 'Offline'} />
                    {e.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.image} alt={e.name ?? ''} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">PHOTO</span>
                      </div>
                    )}
                    {highlight && (
                      <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-center">
                        <span className={`${isMonth ? 'bg-amber-400 text-amber-900' : 'bg-pink-500 text-white'} px-2 py-1 text-[10px] uppercase tracking-widest font-medium`}>
                          {isMonth ? 'ESCORT OF THE MONTH' : 'ESCORT OF THE WEEK'}
                        </span>
                      </div>
                    )}
                    {(isNew || e.isVerified || e.isAgeVerified) && (
                      <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                        {isNew && (
                          <span title="Neu" className="inline-flex items-center gap-1 h-6 px-2 bg-white/90 border border-pink-200 text-pink-600 text-[10px] font-semibold tracking-widest">
                            <span className="h-2 w-2 rounded-full bg-pink-600"></span>
                            NEU
                          </span>
                        )}
                        {e.isVerified && (
                          <span title="Verifiziert" className="inline-flex items-center justify-center h-6 w-6 bg-white/90 border border-emerald-200 text-emerald-700">
                            <BadgeCheck className="h-4 w-4" />
                          </span>
                        )}
                        {(e.isAgeVerified || e.isVerified) && (
                          <span title="Altersverifiziert" className="inline-flex items-center justify-center h-6 w-6 bg-white/90 border border-rose-200 text-rose-700">
                            <ShieldCheck className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
                {/* Text content (no background, no border) */}
                <div className="px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Link href={href} className="block truncate">
                        <h3 className="text-base font-medium tracking-widest text-gray-900 truncate">
                          {(e.name?.toUpperCase?.() ?? e.name) || '—'}
                        </h3>
                      </Link>
                      {e.isVerified && <BadgeCheck className="h-4 w-4 text-pink-500 flex-shrink-0" />}
                    </div>
                    {rating > 0 && (
                      <div className="flex items-center">
                        {/* Mobile: show donut with numeric value inside */}
                        <div className="sm:hidden">
                          <RatingDonut
                            value={rating}
                            showValue
                            size={28}
                            strokeWidth={4}
                            fillColor="#ec4899" /* pink-500 */
                          />
                        </div>
                        {/* Desktop/Tablet: original text + stars */}
                        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap">
                          <span className="tracking-wide font-medium">{`${rating.toFixed(1)}/5`}</span>
                          <span className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < stars ? 'text-pink-500' : 'text-gray-300'}`} fill="currentColor" />
                            ))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  {(e.city || e.country) && (
                    <div className="mt-1 text-sm text-gray-700">{e.city || e.country}</div>
                  )}
                  {/* CONNECT Button entfernt */}
                </div>
              </div>
            )
          })}

          {!loading && items?.length === 0 && (
            <div className="col-span-full text-center text-sm text-gray-500 py-10">
              Keine Profile verfügbar.
            </div>
          )}
        </div>

        <div className="text-center">
          <Button asChild variant="outline" className="text-sm font-light tracking-widest px-8 py-3 border-gray-300 hover:border-pink-500">
            <Link href="/escorts">ALLE ESCORTS ANSEHEN</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
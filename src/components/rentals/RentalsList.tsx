'use client'

import { useEffect, useState } from 'react'
import RentalsListItem, { RentalItem } from './RentalsListItem'
import { useToast } from '@/components/ui/toast'

export default function RentalsList({ q, category, city, country }: { q?: string; category?: string; city?: string; country?: string }) {
  const [items, setItems] = useState<RentalItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(12)
  const [hasMore, setHasMore] = useState(false)
  const toast = useToast()

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (q && q.trim()) params.set('q', q.trim())
        if (category && category.trim()) params.set('category', category.trim())
        if (city && city.trim()) params.set('city', city.trim())
        if (country && country.trim()) params.set('country', country.trim())
        params.set('page', '1')
        params.set('limit', String(limit))
        const url = `/api/rentals${params.toString() ? `?${params.toString()}` : ''}`
        const res = await fetch(url, { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
        if (!cancelled) {
          const arr = Array.isArray(data?.items) ? data.items : []
          setItems(arr)
          setPage(1)
          setLimit(Number(data?.limit || limit))
          setHasMore(arr.length === Number(data?.limit || limit))
        }
      } catch (e: any) {
        if (!cancelled) {
          const msg = e?.message || 'Fehler beim Laden'
          setError(msg)
          try { toast.show(msg, { variant: 'error' }) } catch {}
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    setItems(null)
    setPage(1)
    load()
    return () => { cancelled = true }
  }, [q, category, city, country])

  const loadMore = async () => {
    let cancelled = false
    try {
      setLoadingMore(true)
      const nextPage = page + 1
      const params = new URLSearchParams()
      if (q && q.trim()) params.set('q', q.trim())
      if (category && category.trim()) params.set('category', category.trim())
      if (city && city.trim()) params.set('city', city.trim())
      if (country && country.trim()) params.set('country', country.trim())
      params.set('page', String(nextPage))
      params.set('limit', String(limit))
      const url = `/api/rentals${params.toString() ? `?${params.toString()}` : ''}`
      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      const arr = Array.isArray(data?.items) ? data.items : []
      setItems(prev => ([...(prev || []), ...arr]))
      setPage(nextPage)
      setHasMore(arr.length === Number(data?.limit || limit))
    } catch (e: any) {
      const msg = e?.message || 'Fehler beim Laden'
      setError(msg)
      try { toast.show(msg, { variant: 'error' }) } catch {}
    } finally {
      if (!cancelled) setLoadingMore(false)
    }
    return () => { cancelled = true }
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-thin tracking-wider text-gray-800">ANGEBOTE</h2>
          <div className="w-24 h-px bg-pink-500 mx-auto mt-3" />
        </div>
        {error && <div className="text-sm text-red-600 mb-4">{error}</div>}
        {loading && <div className="text-sm text-gray-600 mb-4">Lade…</div>}
        <div className="space-y-4">
          {(items ?? Array.from({ length: 3 })).map((rental: any, idx) => (
            items ? (
              <RentalsListItem key={rental.id} rental={rental as RentalItem} />
            ) : (
              <div key={idx} className="h-40 border border-gray-200 bg-gray-50 animate-pulse" />
            )
          ))}
        </div>
        {loadingMore && (
          <div className="mt-4 space-y-4">
            <div className="h-40 border border-gray-200 bg-gray-50 animate-pulse" />
            <div className="h-40 border border-gray-200 bg-gray-50 animate-pulse" />
          </div>
        )}
        {items && items.length > 0 && hasMore && (
          <div className="mt-6 text-center">
            <button onClick={loadMore} disabled={loadingMore} className="px-4 py-2 text-xs uppercase tracking-widest border border-gray-300 hover:border-pink-500 hover:text-pink-600 disabled:opacity-60">{loadingMore ? 'Lädt…' : 'MEHR LADEN'}</button>
          </div>
        )}
      </div>
    </section>
  )
}

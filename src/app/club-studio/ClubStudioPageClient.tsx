'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import StoriesGallery from '@/components/homepage/StoriesGallery'
import ClubStudioHero from '@/components/homepage/ClubStudioHero'
import AgencySearch from '@/components/agency/AgencySearch'
import ClubStudioResultsGrid from '@/components/club-studio/ClubStudioResultsGrid'
import type { AgencyItem } from '@/types/agency'

export default function ClubStudioPageClient(props: {
  initialItems: AgencyItem[]
  initialTotal: number
  initialQ: string
  initialLocation: string
  initialSort: 'newest' | 'name'
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white"><MinimalistNavigation /><div className="max-w-5xl mx-auto px-6 py-10">Laden...</div><Footer /></div>}>
      <ClubStudioPageInner {...props} />
    </Suspense>
  )
}

function ClubStudioPageInner({ initialItems, initialTotal, initialQ, initialLocation, initialSort }: {
  initialItems: AgencyItem[]
  initialTotal: number
  initialQ: string
  initialLocation: string
  initialSort: 'newest' | 'name'
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(initialQ)
  const [location, setLocation] = useState(initialLocation)
  const [sort, setSort] = useState<'newest' | 'name'>(initialSort)
  const [items, setItems] = useState<AgencyItem[] | null>(initialItems ?? null)
  const [total, setTotal] = useState<number | null>(initialTotal ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initializedRef = useRef(false)
  const [take] = useState(60)
  const [skip, setSkip] = useState(initialItems?.length ?? 0)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (location.trim()) params.set('location', location.trim())
    params.set('take', String(take))
    params.set('skip', String(skip))
    params.set('sort', sort)
    return params.toString()
  }, [q, location, take, skip, sort])

  async function fetchItems(opts?: { append?: boolean; skip?: number; take?: number; sort?: string }) {
    setLoading(true)
    setError(null)
    try {
      const urlParams = new URLSearchParams()
      if (q.trim()) urlParams.set('q', q.trim())
      if (location.trim()) urlParams.set('location', location.trim())
      router.replace(`/club-studio?${urlParams.toString()}`)

      const reqParams = new URLSearchParams()
      if (q.trim()) reqParams.set('q', q.trim())
      if (location.trim()) reqParams.set('location', location.trim())
      reqParams.set('take', String(opts?.take ?? take))
      reqParams.set('skip', String(opts?.skip ?? skip))
      reqParams.set('sort', String(opts?.sort ?? sort))

      const res = await fetch(`/api/club-studio/search?${reqParams.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Fehler beim Laden')
      const data = await res.json()
      setItems((prev) => (opts?.append && prev ? [...prev, ...data.items] : data.items))
      setTotal(data.total)
    } catch (e: any) {
      setError(e.message || 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const sp = searchParams
    if (sp) {
      const initialQ2 = sp.get('q')?.trim() || initialQ
      const initialLocation2 = sp.get('location')?.trim() || initialLocation
      const initialSort2 = (sp.get('sort')?.trim()?.toLowerCase() as 'newest' | 'name') || initialSort
      setQ(initialQ2)
      setLocation(initialLocation2)
      setSort(initialSort2)
    }
    initializedRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!initializedRef.current) return
    const t = setTimeout(() => {
      setSkip(0)
      fetchItems({ append: false, skip: 0, take, sort })
    }, 300)
    return () => clearTimeout(t)
  }, [q, location, sort])

  const hasMore = useMemo(() => {
    if (!items || total == null) return false
    return items.length < total
  }, [items, total])

  async function loadMore() {
    if (loading) return
    const nextSkip = (items?.length ?? 0)
    await fetchItems({ append: true, skip: nextSkip, take, sort })
    setSkip(nextSkip)
  }

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!sentinelRef.current) return
    const el = sentinelRef.current
    const obs = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { rootMargin: '200px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMore, loading])

  return (
    <div className="min-h-screen bg-white">
      <MinimalistNavigation />
      <ClubStudioHero />
      <StoriesGallery />
      <AgencySearch
        q={q}
        setQ={setQ}
        location={location}
        setLocation={setLocation}
        sort={sort}
        setSort={(v) => setSort((v as any) as 'newest' | 'name')}
        onSubmit={() => {
          setSkip(0)
          fetchItems({ append: false, skip: 0, take, sort })
        }}
        loading={loading}
        error={error}
      />
      <ClubStudioResultsGrid items={items} loading={loading} total={total} />
      {hasMore && (
        <section className="bg-white pb-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-3 border border-gray-300 text-sm tracking-widest font-light hover:border-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'LADEN…' : 'MEHR LADEN'}
              </button>
            </div>
            <div ref={sentinelRef} className="h-1" />
          </div>
        </section>
      )}
      <Footer />
    </div>
  )
}

'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import AdBanner from '@/components/AdBanner'
import Footer from '@/components/homepage/Footer'
import Tabs from '@/components/Tabs'
import EscortsSearch from '@/components/escorts/EscortsSearch'
import EscortsResultsGrid from '@/components/escorts/EscortsResultsGrid'
import AgencySearch from '@/components/agency/AgencySearch'
import AgencyResultsGrid from '@/components/agency/AgencyResultsGrid'
import ClubStudioResultsGrid from '@/components/club-studio/ClubStudioResultsGrid'
import type { EscortFilters } from '@/types/escort'
import type { EscortItem } from '@/types/escort'
import type { AgencyItem } from '@/types/agency'

function SearchHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/search.jpg"
          alt="Search Hero"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/0 to-white/0 md:to-white/0" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-40 pb-24 md:pt-48 md:pb-40">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-light tracking-[0.25em] text-white">SUCHE</h1>
          <div className="mt-4 h-[2px] w-24 bg-gradient-to-r from-pink-600/0 via-pink-500/80 to-pink-600/0" />
          <p className="mt-6 text-neutral-200 text-base md:text-lg leading-relaxed">
            Finde Escorts, Agenturen, Clubs & Studios – schnell und präzise. Nutze Tabs und Filter, um die perfekten Ergebnisse zu erhalten.
          </p>
        </div>
      </div>
    </section>
  )
}

export default function GlobalSearchPage() {
  // Shared config
  const takeDefault = 60

  // ESCORT state
  const [escortQ, setEscortQ] = useState('')
  const [escortLocation, setEscortLocation] = useState('')
  const [escortFilters, setEscortFilters] = useState<EscortFilters>({
    height: '',
    weight: '',
    breastType: '',
    breastSize: '',
    eyeColor: '',
    hairColor: '',
    hairLength: '',
    clothingStyle: '',
    clothingSize: '',
    ageMin: '',
    ageMax: '',
    gender: '',
    nationality: [],
    languages: [],
    services: []
  })
  const [escortVerifiedOnly, setEscortVerifiedOnly] = useState(false)
  const [escortAgeVerifiedOnly, setEscortAgeVerifiedOnly] = useState(false)
  const [escortHasVideoOnly, setEscortHasVideoOnly] = useState(false)
  const [escortSort, setEscortSort] = useState<'newest' | 'name'>('newest')
  const [escortItems, setEscortItems] = useState<EscortItem[] | null>(null)
  const [escortTotal, setEscortTotal] = useState<number | null>(null)
  const [escortLoading, setEscortLoading] = useState(false)
  const [escortSkip, setEscortSkip] = useState(0)
  const escortHasMore = useMemo(() => (escortItems && escortTotal != null ? escortItems.length < escortTotal : false), [escortItems, escortTotal])
  const escortSentinelRef = useRef<HTMLDivElement | null>(null)

  async function fetchEscorts(opts?: { append?: boolean; skip?: number; take?: number }) {
    setEscortLoading(true)
    try {
      const params = new URLSearchParams()
      if (escortQ.trim()) params.set('q', escortQ.trim())
      if (escortLocation.trim()) params.set('location', escortLocation.trim())
      if (escortVerifiedOnly) params.set('verifiedOnly', '1')
      if (escortAgeVerifiedOnly) params.set('ageVerifiedOnly', '1')
      if (escortHasVideoOnly) params.set('hasVideo', '1')
      // Advanced filters (strings and arrays)
      Object.entries(escortFilters).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          if (v.length > 0) params.set(k, v.join(','))
        } else if (typeof v === 'string') {
          if (v) params.set(k, v)
        }
      })
      params.set('take', String(opts?.take ?? takeDefault))
      params.set('skip', String(opts?.skip ?? 0))
      params.set('sort', escortSort)

      const res = await fetch(`/api/escorts/search?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Fehler beim Laden')
      const data = await res.json()
      setEscortItems(prev => (opts?.append && prev ? [...prev, ...data.items] : data.items))
      setEscortTotal(data.total)
    } finally {
      setEscortLoading(false)
    }
  }
  function onSubmitEscort() {
    setEscortSkip(0)
    fetchEscorts({ append: false, skip: 0, take: takeDefault })
  }
  useEffect(() => {
    if (!escortSentinelRef.current) return
    const el = escortSentinelRef.current
    const obs = new IntersectionObserver((entries) => {
      const [entry] = entries
      if (entry.isIntersecting && escortHasMore && !escortLoading) {
        const nextSkip = (escortItems?.length ?? 0)
        setEscortSkip(nextSkip)
        fetchEscorts({ append: true, skip: nextSkip, take: takeDefault })
      }
    }, { rootMargin: '200px 0px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [escortHasMore, escortLoading, escortItems])

  // AGENCY state
  const [agencyQ, setAgencyQ] = useState('')
  const [agencyLocation, setAgencyLocation] = useState('')
  const [agencySort, setAgencySort] = useState<'newest' | 'name'>('newest')
  const [agencyBusinessType, setAgencyBusinessType] = useState('')
  const [agencyBusinessServices, setAgencyBusinessServices] = useState<string[]>([])
  const [agencyItems, setAgencyItems] = useState<AgencyItem[] | null>(null)
  const [agencyTotal, setAgencyTotal] = useState<number | null>(null)
  const [agencyLoading, setAgencyLoading] = useState(false)
  const [agencySkip, setAgencySkip] = useState(0)
  const agencyHasMore = useMemo(() => (agencyItems && agencyTotal != null ? agencyItems.length < agencyTotal : false), [agencyItems, agencyTotal])
  const agencySentinelRef = useRef<HTMLDivElement | null>(null)

  async function fetchAgencies(opts?: { append?: boolean; skip?: number; take?: number; sort?: 'newest' | 'name' }) {
    setAgencyLoading(true)
    try {
      const params = new URLSearchParams()
      if (agencyQ.trim()) params.set('q', agencyQ.trim())
      if (agencyLocation.trim()) params.set('location', agencyLocation.trim())
      if (agencyBusinessType) params.set('businessType', agencyBusinessType)
      if (agencyBusinessServices.length) params.set('services', agencyBusinessServices.join(','))
      params.set('take', String(opts?.take ?? takeDefault))
      params.set('skip', String(opts?.skip ?? 0))
      params.set('sort', String(opts?.sort ?? agencySort))
      const res = await fetch(`/api/agency/search?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Fehler beim Laden')
      const data = await res.json()
      setAgencyItems(prev => (opts?.append && prev ? [...prev, ...data.items] : data.items))
      setAgencyTotal(data.total)
    } finally {
      setAgencyLoading(false)
    }
  }
  function onSubmitAgency() {
    setAgencySkip(0)
    fetchAgencies({ append: false, skip: 0, take: takeDefault, sort: agencySort })
  }
  useEffect(() => {
    if (!agencySentinelRef.current) return
    const el = agencySentinelRef.current
    const obs = new IntersectionObserver((entries) => {
      const [entry] = entries
      if (entry.isIntersecting && agencyHasMore && !agencyLoading) {
        const nextSkip = (agencyItems?.length ?? 0)
        setAgencySkip(nextSkip)
        fetchAgencies({ append: true, skip: nextSkip, take: takeDefault, sort: agencySort })
      }
    }, { rootMargin: '200px 0px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [agencyHasMore, agencyLoading, agencyItems, agencySort])

  // CLUB state (shares API with club-studio combined)
  const [clubQ, setClubQ] = useState('')
  const [clubLocation, setClubLocation] = useState('')
  const [clubSort, setClubSort] = useState<'newest' | 'name'>('newest')
  const [clubBusinessType, setClubBusinessType] = useState<string>('Club')
  const [clubServices, setClubServices] = useState<string[]>([])
  const [clubItems, setClubItems] = useState<AgencyItem[] | null>(null)
  const [clubTotal, setClubTotal] = useState<number | null>(null)
  const [clubLoading, setClubLoading] = useState(false)
  const [clubSkip, setClubSkip] = useState(0)
  const clubHasMore = useMemo(() => (clubItems && clubTotal != null ? clubItems.length < clubTotal : false), [clubItems, clubTotal])
  const clubSentinelRef = useRef<HTMLDivElement | null>(null)

  async function fetchClubs(opts?: { append?: boolean; skip?: number; take?: number; sort?: 'newest' | 'name' }) {
    setClubLoading(true)
    try {
      const params = new URLSearchParams()
      if (clubQ.trim()) params.set('q', clubQ.trim())
      if (clubLocation.trim()) params.set('location', clubLocation.trim())
      params.set('take', String(opts?.take ?? takeDefault))
      params.set('skip', String(opts?.skip ?? 0))
      params.set('sort', String(opts?.sort ?? clubSort))
      if (clubBusinessType) params.set('businessType', clubBusinessType)
      if (clubServices.length) params.set('services', clubServices.join(','))
      const res = await fetch(`/api/club-studio/search?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Fehler beim Laden')
      const data = await res.json()
      setClubItems(prev => (opts?.append && prev ? [...prev, ...data.items] : data.items))
      setClubTotal(data.total)
    } finally {
      setClubLoading(false)
    }
  }
  function onSubmitClub() {
    setClubSkip(0)
    fetchClubs({ append: false, skip: 0, take: takeDefault, sort: clubSort })
  }
  useEffect(() => {
    if (!clubSentinelRef.current) return
    const el = clubSentinelRef.current
    const obs = new IntersectionObserver((entries) => {
      const [entry] = entries
      if (entry.isIntersecting && clubHasMore && !clubLoading) {
        const nextSkip = (clubItems?.length ?? 0)
        setClubSkip(nextSkip)
        fetchClubs({ append: true, skip: nextSkip, take: takeDefault, sort: clubSort })
      }
    }, { rootMargin: '200px 0px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [clubHasMore, clubLoading, clubItems, clubSort])

  // STUDIO state (shares API with club-studio combined)
  const [studioQ, setStudioQ] = useState('')
  const [studioLocation, setStudioLocation] = useState('')
  const [studioSort, setStudioSort] = useState<'newest' | 'name'>('newest')
  const [studioBusinessType, setStudioBusinessType] = useState<string>('Studio')
  const [studioServices, setStudioServices] = useState<string[]>([])
  const [studioItems, setStudioItems] = useState<AgencyItem[] | null>(null)
  const [studioTotal, setStudioTotal] = useState<number | null>(null)
  const [studioLoading, setStudioLoading] = useState(false)
  const [studioSkip, setStudioSkip] = useState(0)
  const studioHasMore = useMemo(() => (studioItems && studioTotal != null ? studioItems.length < studioTotal : false), [studioItems, studioTotal])
  const studioSentinelRef = useRef<HTMLDivElement | null>(null)

  async function fetchStudios(opts?: { append?: boolean; skip?: number; take?: number; sort?: 'newest' | 'name' }) {
    setStudioLoading(true)
    try {
      const params = new URLSearchParams()
      if (studioQ.trim()) params.set('q', studioQ.trim())
      if (studioLocation.trim()) params.set('location', studioLocation.trim())
      params.set('take', String(opts?.take ?? takeDefault))
      params.set('skip', String(opts?.skip ?? 0))
      params.set('sort', String(opts?.sort ?? studioSort))
      if (studioBusinessType) params.set('businessType', studioBusinessType)
      if (studioServices.length) params.set('services', studioServices.join(','))
      const res = await fetch(`/api/club-studio/search?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Fehler beim Laden')
      const data = await res.json()
      setStudioItems(prev => (opts?.append && prev ? [...prev, ...data.items] : data.items))
      setStudioTotal(data.total)
    } finally {
      setStudioLoading(false)
    }
  }
  function onSubmitStudio() {
    setStudioSkip(0)
    fetchStudios({ append: false, skip: 0, take: takeDefault, sort: studioSort })
  }
  useEffect(() => {
    if (!studioSentinelRef.current) return
    const el = studioSentinelRef.current
    const obs = new IntersectionObserver((entries) => {
      const [entry] = entries
      if (entry.isIntersecting && studioHasMore && !studioLoading) {
        const nextSkip = (studioItems?.length ?? 0)
        setStudioSkip(nextSkip)
        fetchStudios({ append: true, skip: nextSkip, take: takeDefault, sort: studioSort })
      }
    }, { rootMargin: '200px 0px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [studioHasMore, studioLoading, studioItems, studioSort])

  return (
    <div className="min-h-screen bg-white">
      <MinimalistNavigation />
      <SearchHero />

      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <Tabs
            tabs={[
              {
                id: 'escort',
                label: 'ESCORT',
                content: (
                  <>
                    <EscortsSearch
                      q={escortQ}
                      setQ={setEscortQ}
                      location={escortLocation}
                      setLocation={setEscortLocation}
                      onSubmit={onSubmitEscort}
                      loading={escortLoading}
                      error={null}
                      filters={escortFilters}
                      onFiltersChange={setEscortFilters}
                      verifiedOnly={escortVerifiedOnly}
                      setVerifiedOnly={setEscortVerifiedOnly}
                      ageVerifiedOnly={escortAgeVerifiedOnly}
                      setAgeVerifiedOnly={setEscortAgeVerifiedOnly}
                      hasVideoOnly={escortHasVideoOnly}
                      setHasVideoOnly={setEscortHasVideoOnly}
                      sort={escortSort}
                      setSort={setEscortSort}
                    />
                    <EscortsResultsGrid items={escortItems} loading={escortLoading} total={escortTotal} />
                    <AdBanner placement="search_escort_mid" className="my-8" />
                    {escortHasMore && (
                      <section className="bg-white pb-16">
                        <div className="max-w-7xl mx-auto px-6">
                          <div className="flex justify-center">
                            <button
                              onClick={() => {
                                if (escortLoading) return
                                const nextSkip = (escortItems?.length ?? 0)
                                setEscortSkip(nextSkip)
                                fetchEscorts({ append: true, skip: nextSkip, take: takeDefault })
                              }}
                              disabled={escortLoading}
                              className="px-6 py-3 border border-gray-300 text-sm tracking-widest font-light hover:border-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {escortLoading ? 'LADEN…' : 'MEHR LADEN'}
                            </button>
                          </div>
                          <div ref={escortSentinelRef} className="h-1" />
                        </div>
                      </section>
                    )}
                  </>
                ),
              },
              {
                id: 'agency',
                label: 'AGENTUR',
                content: (
                  <>
                    <AgencySearch
                      q={agencyQ}
                      setQ={setAgencyQ}
                      location={agencyLocation}
                      setLocation={setAgencyLocation}
                      sort={agencySort}
                      setSort={(v) => setAgencySort((v as any) as 'newest' | 'name')}
                      businessType={agencyBusinessType}
                      setBusinessType={setAgencyBusinessType}
                      businessServices={agencyBusinessServices}
                      setBusinessServices={setAgencyBusinessServices}
                      onSubmit={onSubmitAgency}
                      loading={agencyLoading}
                      error={null}
                    />
                    <AgencyResultsGrid items={agencyItems} loading={agencyLoading} total={agencyTotal} />
                    <AdBanner placement="search_agency_mid" className="my-8" />
                    {agencyHasMore && (
                      <section className="bg-white pb-16">
                        <div className="max-w-7xl mx-auto px-6">
                          <div className="flex justify-center">
                            <button
                              onClick={() => {
                                if (agencyLoading) return
                                const nextSkip = (agencyItems?.length ?? 0)
                                setAgencySkip(nextSkip)
                                fetchAgencies({ append: true, skip: nextSkip, take: takeDefault, sort: agencySort })
                              }}
                              disabled={agencyLoading}
                              className="px-6 py-3 border border-gray-300 text-sm tracking-widest font-light hover:border-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {agencyLoading ? 'LADEN…' : 'MEHR LADEN'}
                            </button>
                          </div>
                          <div ref={agencySentinelRef} className="h-1" />
                        </div>
                      </section>
                    )}
                  </>
                ),
              },
              {
                id: 'club',
                label: 'CLUB',
                content: (
                  <>
                    <AgencySearch
                      q={clubQ}
                      setQ={setClubQ}
                      location={clubLocation}
                      setLocation={setClubLocation}
                      sort={clubSort}
                      setSort={(v) => setClubSort((v as any) as 'newest' | 'name')}
                      businessType={clubBusinessType}
                      setBusinessType={setClubBusinessType}
                      businessServices={clubServices}
                      setBusinessServices={setClubServices}
                      onSubmit={onSubmitClub}
                      loading={clubLoading}
                      error={null}
                    />
                    <ClubStudioResultsGrid items={clubItems} loading={clubLoading} total={clubTotal} />
                    <AdBanner placement="search_club_mid" className="my-8" />
                    {clubHasMore && (
                      <section className="bg-white pb-16">
                        <div className="max-w-7xl mx-auto px-6">
                          <div className="flex justify-center">
                            <button
                              onClick={() => {
                                if (clubLoading) return
                                const nextSkip = (clubItems?.length ?? 0)
                                setClubSkip(nextSkip)
                                fetchClubs({ append: true, skip: nextSkip, take: takeDefault, sort: clubSort })
                              }}
                              disabled={clubLoading}
                              className="px-6 py-3 border border-gray-300 text-sm tracking-widest font-light hover:border-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {clubLoading ? 'LADEN…' : 'MEHR LADEN'}
                            </button>
                          </div>
                          <div ref={clubSentinelRef} className="h-1" />
                        </div>
                      </section>
                    )}
                  </>
                ),
              },
              {
                id: 'studio',
                label: 'STUDIO',
                content: (
                  <>
                    <AgencySearch
                      q={studioQ}
                      setQ={setStudioQ}
                      location={studioLocation}
                      setLocation={setStudioLocation}
                      sort={studioSort}
                      setSort={(v) => setStudioSort((v as any) as 'newest' | 'name')}
                      businessType={studioBusinessType}
                      setBusinessType={setStudioBusinessType}
                      businessServices={studioServices}
                      setBusinessServices={setStudioServices}
                      onSubmit={onSubmitStudio}
                      loading={studioLoading}
                      error={null}
                    />
                    <ClubStudioResultsGrid items={studioItems} loading={studioLoading} total={studioTotal} />
                    <AdBanner placement="search_studio_mid" className="my-8" />
                    {studioHasMore && (
                      <section className="bg-white pb-16">
                        <div className="max-w-7xl mx-auto px-6">
                          <div className="flex justify-center">
                            <button
                              onClick={() => {
                                if (studioLoading) return
                                const nextSkip = (studioItems?.length ?? 0)
                                setStudioSkip(nextSkip)
                                fetchStudios({ append: true, skip: nextSkip, take: takeDefault, sort: studioSort })
                              }}
                              disabled={studioLoading}
                              className="px-6 py-3 border border-gray-300 text-sm tracking-widest font-light hover:border-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {studioLoading ? 'LADEN…' : 'MEHR LADEN'}
                            </button>
                          </div>
                          <div ref={studioSentinelRef} className="h-1" />
                        </div>
                      </section>
                    )}
                  </>
                ),
              },
            ]}
          />
        </div>
      </section>

      <Footer />
    </div>
  )
}

'use client'

import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import JobsHero from '@/components/homepage/JobsHero'
import JobsList from '@/components/jobs/JobsList'
import JobsSearch from '@/components/jobs/JobsSearch'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function JobsClientPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')

  useEffect(() => {
    const sp = searchParams
    const initialQ = sp?.get('q')?.trim() || ''
    const initialC = sp?.get('category')?.trim().toUpperCase() || ''
    const initialCity = sp?.get('city')?.trim() || ''
    const initialCountry = sp?.get('country')?.trim() || ''
    setQ(initialQ)
    setCategory(initialC)
    setCity(initialCity)
    setCountry(initialCountry)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (q.trim()) p.set('q', q.trim())
    if (category.trim()) p.set('category', category.trim())
    if (city.trim()) p.set('city', city.trim())
    if (country.trim()) p.set('country', country.trim())
    return p.toString()
  }, [q, category, city, country])

  const onSubmit = () => {
    router.replace(`/jobs${qs ? `?${qs}` : ''}`)
  }

  return (
    <div className="min-h-screen bg-white">
      <MinimalistNavigation />
      <JobsHero />
      <JobsSearch q={q} setQ={setQ} category={category} setCategory={setCategory} city={city} setCity={setCity} country={country} setCountry={setCountry} onSubmit={onSubmit} />
      <JobsList q={q} category={category} city={city} country={country} />
      <Footer />
    </div>
  )
}

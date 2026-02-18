'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import StoriesHero from '@/components/homepage/StoriesHero'
import StoriesLatestGrid from '@/components/stories/StoriesLatestGrid'
import StoriesSearch from '@/components/stories/StoriesSearch'

export default function StoriesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white"><MinimalistNavigation /><div className="max-w-5xl mx-auto px-6 py-10">Laden...</div><Footer /></div>}>
      <StoriesPageInner />
    </Suspense>
  )
}

function StoriesPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [q, setQ] = useState('')

  useEffect(() => {
    const sp = searchParams
    const initialQ = sp?.get('q')?.trim() || ''
    setQ(initialQ)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    return params.toString()
  }, [q])

  const onSubmit = () => {
    router.replace(`/stories${queryString ? `?${queryString}` : ''}`)
  }

  return (
    <div className="min-h-screen bg-white">
      <MinimalistNavigation />
      <StoriesHero />
      <StoriesSearch q={q} setQ={setQ} onSubmit={onSubmit} />
      <StoriesLatestGrid userType="ESCORT" q={q} />
      <Footer />
    </div>
  )
}

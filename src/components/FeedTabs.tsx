"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import NewsfeedComponent from '@/components/NewsfeedComponent'
import FeedRightSidebar from '@/components/FeedRightSidebar'
import GroupsDashboard from '@/components/GroupsDashboard'

export default function FeedTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [subTab, setSubTab] = useState<'aktuell' | 'gruppen'>('aktuell')

  useEffect(() => {
    const t = searchParams.get('feedtab')
    if (t === 'gruppen') setSubTab('gruppen')
    else setSubTab('aktuell')
  }, [searchParams])

  const setTab = (next: 'aktuell' | 'gruppen') => {
    const sp = new URLSearchParams(Array.from(searchParams.entries()))
    if (next === 'aktuell') sp.delete('feedtab')
    else sp.set('feedtab', next)
    router.replace(`?${sp.toString()}`)
  }

  return (
    <div>
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6">
          <button
            className={`text-sm font-light tracking-widest uppercase py-3 border-b-2 transition-colors ${subTab === 'aktuell' ? 'text-pink-500 border-pink-500' : 'text-gray-600 border-transparent hover:text-pink-500'}`}
            onClick={() => setTab('aktuell')}
          >
            AKTUELL
          </button>
          <button
            className={`text-sm font-light tracking-widest uppercase py-3 border-b-2 transition-colors ${subTab === 'gruppen' ? 'text-pink-500 border-pink-500' : 'text-gray-600 border-transparent hover:text-pink-500'}`}
            onClick={() => setTab('gruppen')}
          >
            GRUPPEN
          </button>
        </div>
      </div>

      {subTab === 'aktuell' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <NewsfeedComponent />
          </div>
          <div>
            <FeedRightSidebar />
          </div>
        </div>
      ) : (
        <GroupsDashboard />
      )}
    </div>
  )
}

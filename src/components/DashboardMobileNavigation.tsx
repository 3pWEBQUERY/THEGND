'use client'

import { canCreateStories } from '@/lib/validations'
import { UserType } from '@prisma/client'
import { useEffect, useState } from 'react'

interface DashboardMobileNavigationProps {
  session: any
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function DashboardMobileNavigation({ session, activeTab, setActiveTab }: DashboardMobileNavigationProps) {
  const userType = session.user.userType as UserType
  const canStories = canCreateStories(userType)
  const [matchingCounts, setMatchingCounts] = useState<{ likes: number; mutual: number }>({ likes: 0, mutual: 0 })

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/matching/counts', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setMatchingCounts({ likes: Number(data?.likes || 0), mutual: Number(data?.mutual || 0) })
      } catch {}
    }
    load()
    const id = setInterval(load, 60000)
    return () => { cancelled = true; clearInterval(id) }
  }, [session?.user?.id, userType])

  // Realtime updates via SSE for mobile badge
  useEffect(() => {
    if (!session?.user?.id) return
    const es = new EventSource('/api/realtime/stream')
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data || '{}')
        if (typeof data.likes === 'number' || typeof data.mutual === 'number') {
          setMatchingCounts((prev) => ({
            likes: typeof data.likes === 'number' ? data.likes : prev.likes,
            mutual: typeof data.mutual === 'number' ? data.mutual : prev.mutual,
          }))
        }
      } catch {}
    }
    es.onerror = () => { try { es.close() } catch {} }
    return () => { try { es.close() } catch {} }
  }, [session?.user?.id])

  return (
    <div className="md:hidden mb-8">
      <div className="flex space-x-4 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`text-sm font-light tracking-widest uppercase whitespace-nowrap py-2 px-4 border-b-2 transition-colors ${
            activeTab === 'dashboard' ? 'text-pink-500 border-pink-500' : 'text-gray-600 border-transparent hover:text-pink-500'
          }`}
        >
          DASHBOARD
        </button>
        <button 
          onClick={() => setActiveTab('feed')}
          className={`text-sm font-light tracking-widest uppercase whitespace-nowrap py-2 px-4 border-b-2 transition-colors ${
            activeTab === 'feed' ? 'text-pink-500 border-pink-500' : 'text-gray-600 border-transparent hover:text-pink-500'
          }`}
        >
          FEED
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`text-sm font-light tracking-widest uppercase whitespace-nowrap py-2 px-4 border-b-2 transition-colors ${
            activeTab === 'profile' ? 'text-pink-500 border-pink-500' : 'text-gray-600 border-transparent hover:text-pink-500'
          }`}
        >
          PROFIL
        </button>
        {(userType === 'MEMBER' || userType === 'ESCORT' || userType === 'HOBBYHURE') && (
          <button 
            onClick={() => setActiveTab('matching')}
            className={`text-sm font-light tracking-widest uppercase whitespace-nowrap py-2 px-4 border-b-2 transition-colors ${
              activeTab === 'matching' ? 'text-pink-500 border-pink-500' : 'text-gray-600 border-transparent hover:text-pink-500'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              MATCHING
              {(() => {
                const c = (userType === 'ESCORT' || userType === 'HOBBYHURE') ? matchingCounts.likes : (userType === 'MEMBER' ? matchingCounts.mutual : 0)
                if (!c) return null
                return (
                  <span className="h-4 w-4 inline-flex items-center justify-center rounded-full bg-pink-500 text-white text-[10px] leading-none">
                    {c > 99 ? '99+' : c}
                  </span>
                )
              })()}
            </span>
          </button>
        )}
        <button 
          onClick={() => setActiveTab('community')}
          className={`text-sm font-light tracking-widest uppercase whitespace-nowrap py-2 px-4 border-b-2 transition-colors ${
            activeTab === 'community' ? 'text-pink-500 border-pink-500' : 'text-gray-600 border-transparent hover:text-pink-500'
          }`}
        >
          COMMUNITIES
        </button>
        {(userType === 'ESCORT' || userType === 'HOBBYHURE') && (
          <button 
            onClick={() => setActiveTab('dates')}
            className={`text-sm font-light tracking-widest uppercase whitespace-nowrap py-2 px-4 border-b-2 transition-colors ${
              activeTab === 'dates' ? 'text-pink-500 border-pink-500' : 'text-gray-600 border-transparent hover:text-pink-500'
            }`}
          >
            DATE ANFRAGEN
          </button>
        )}
        <button 
          onClick={() => setActiveTab('blog')}
          className={`text-sm font-light tracking-widest uppercase whitespace-nowrap py-2 px-4 border-b-2 transition-colors ${
            activeTab === 'blog' ? 'text-pink-500 border-pink-500' : 'text-gray-600 border-transparent hover:text-pink-500'
          }`}
        >
          BLOG
        </button>
        <button 
          onClick={() => setActiveTab('messages')}
          className={`text-sm font-light tracking-widest uppercase whitespace-nowrap py-2 px-4 border-b-2 transition-colors ${
            activeTab === 'messages' ? 'text-pink-500 border-pink-500' : 'text-gray-600 border-transparent hover:text-pink-500'
          }`}
        >
          NACHRICHTEN
        </button>
        <button 
          onClick={() => setActiveTab('network')}
          className={`text-sm font-light tracking-widest uppercase whitespace-nowrap py-2 px-4 border-b-2 transition-colors ${
            activeTab === 'network' ? 'text-pink-500 border-pink-500' : 'text-gray-600 border-transparent hover:text-pink-500'
          }`}
        >
          NETZWERK
        </button>
        {canStories && (
          <button 
            onClick={() => setActiveTab('stories')}
            className={`text-sm font-light tracking-widest uppercase whitespace-nowrap py-2 px-4 border-b-2 transition-colors ${
              activeTab === 'stories' ? 'text-pink-500 border-pink-500' : 'text-gray-600 border-transparent hover:text-pink-500'
            }`}
          >
            STORIES
          </button>
        )}
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import Link from 'next/link'
import CommunityCard from '@/components/community/CommunityCard'
import PostFeed from '@/components/community/PostFeed'
import { cn } from '@/lib/utils'
import { Plus, Search, Flame, TrendingUp, Star } from 'lucide-react'

interface CommunityData {
  id: string
  name: string
  slug: string
  description?: string | null
  icon?: string | null
  memberCount: number
  type: string
}

interface CommunityIndexClientProps {
  topCommunities: CommunityData[]
  myCommunities: CommunityData[]
  isAuthenticated: boolean
}

const FEED_MODES = [
  { key: 'all', label: 'Alle', icon: Flame },
  { key: 'popular', label: 'Beliebt', icon: TrendingUp },
  ...([] as { key: string; label: string; icon: any }[]),
] as const

type FeedMode = 'all' | 'popular' | 'home'

export default function CommunityIndexClient({
  topCommunities,
  myCommunities,
  isAuthenticated,
}: CommunityIndexClientProps) {
  const [feedMode, setFeedMode] = useState<FeedMode>(isAuthenticated && myCommunities.length > 0 ? 'home' : 'all')
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<CommunityData[] | null>(null)
  const [searching, setSearching] = useState(false)

  const doSearch = async () => {
    if (!search.trim()) {
      setSearchResults(null)
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/communities?search=${encodeURIComponent(search.trim())}&limit=20`)
      const data = await res.json()
      if (res.ok) setSearchResults(data.communities)
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              if (!e.target.value.trim()) setSearchResults(null)
            }}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            placeholder="Communities suchen..."
            className="w-full border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-pink-400"
          />
        </div>
        {isAuthenticated && (
          <Link
            href="/community/create"
            className="flex items-center gap-1.5 bg-pink-500 hover:bg-pink-600 text-white text-[10px] font-light tracking-widest px-4 py-2.5 uppercase whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            Erstellen
          </Link>
        )}
      </div>

      {/* Search results */}
      {searchResults !== null ? (
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest text-gray-500">
              {searchResults.length} Ergebnisse
            </h2>
            <button
              onClick={() => {
                setSearch('')
                setSearchResults(null)
              }}
              className="text-[10px] uppercase tracking-widest text-pink-600 hover:text-pink-700"
            >
              Zurücksetzen
            </button>
          </div>
          {searchResults.map((c) => (
            <CommunityCard key={c.id} community={c} />
          ))}
          {searchResults.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Keine Communities gefunden.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Main feed */}
          <div>
            {/* Feed mode tabs */}
            <div className="flex items-center gap-1 border border-gray-200 bg-white p-1 mb-3">
              {isAuthenticated && myCommunities.length > 0 && (
                <button
                  onClick={() => setFeedMode('home')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-widest font-light transition-colors',
                    feedMode === 'home'
                      ? 'bg-pink-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100',
                  )}
                >
                  <Star className="h-3.5 w-3.5" />
                  Mein Feed
                </button>
              )}
              <button
                onClick={() => setFeedMode('all')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-widest font-light transition-colors',
                  feedMode === 'all'
                    ? 'bg-pink-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100',
                )}
              >
                <Flame className="h-3.5 w-3.5" />
                Alle
              </button>
              <button
                onClick={() => setFeedMode('popular')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-widest font-light transition-colors',
                  feedMode === 'popular'
                    ? 'bg-pink-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100',
                )}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Beliebt
              </button>
            </div>

            <PostFeed mode={feedMode} showCommunity />
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            {/* Top communities */}
            <div className="border border-gray-200 bg-white">
              <div className="bg-pink-500 px-3 py-2">
                <h3 className="text-[10px] uppercase tracking-widest text-white font-light">
                  Top Communities
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {topCommunities.map((c, idx) => (
                  <CommunityCard key={c.id} community={c} rank={idx + 1} />
                ))}
              </div>
            </div>

            {/* My communities */}
            {myCommunities.length > 0 && (
              <div className="border border-gray-200 bg-white">
                <div className="bg-gray-900 px-3 py-2">
                  <h3 className="text-[10px] uppercase tracking-widest text-white font-light">
                    Meine Communities
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {myCommunities.map((c) => (
                    <CommunityCard key={c.id} community={c} />
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            {isAuthenticated && (
              <div
                className="relative border border-gray-200 overflow-hidden flex flex-col items-center justify-end text-center"
                style={{ minHeight: 320 }}
              >
                <img
                  src="/circle.jpg"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30" />
                <div className="relative z-10 w-full p-6">
                  <Link
                    href="/community/create"
                    className="block w-full bg-pink-500 hover:bg-pink-600 text-white text-[10px] font-light tracking-widest py-3 uppercase"
                  >
                    Community erstellen
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

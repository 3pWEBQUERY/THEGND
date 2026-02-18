'use client'

import { useEffect, useMemo, useState } from 'react'

export type StoryItem = {
  id: string
  content: string
  image?: string | null
  video?: string | null
  createdAt: string
  expiresAt?: string
  authorId?: string
  author: { displayName: string | null; email: string; avatar?: string | null }
  _count?: { views: number }
}

export default function StoriesLatestGrid({ userType, q }: { userType?: string; q?: string }) {
  const [stories, setStories] = useState<StoryItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visible, setVisible] = useState(25)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const qs = new URLSearchParams()
        if (userType) qs.set('userType', userType)
        if (q) qs.set('q', q)
        const url = `/api/stories/latest${qs.toString() ? `?${qs.toString()}` : ''}`
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) throw new Error('Fehler beim Laden')
        const data: { stories: StoryItem[] } = await res.json()
        if (!cancelled) setStories(Array.isArray(data.stories) ? data.stories : [])
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Unbekannter Fehler')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [userType, q])

  const items = useMemo(() => (stories || []).slice(0, visible), [stories, visible])
  const hasMore = useMemo(() => (stories?.length || 0) > visible, [stories, visible])

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-thin tracking-wider text-gray-800 mb-3">STORIES</h2>
          <div className="w-16 h-px bg-pink-500 mx-auto" />
        </div>

        {error && (
          <div className="text-sm text-rose-600 mb-4 text-center">{error}</div>
        )}

        {/* 5er Grid (responsive), 25 Elemente initial */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {(items.length ? items : Array.from({ length: loading ? 10 : 0 })).map((it: any, idx: number) => {
            if (!stories) {
              return (
                <div key={idx} className="aspect-[3/4] bg-gray-200 animate-pulse" />
              )
            }
            const story = it as StoryItem
            const author = (story.author.displayName || story.author.email.split('@')[0]).toUpperCase()
            const cover = story.image || story.author.avatar || undefined
            return (
              <div key={story.id} className="aspect-[3/4] bg-gray-100 ring-1 ring-gray-200 overflow-hidden group cursor-pointer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {cover ? (
                  <img src={cover} alt={story.content || author} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-gray-400 text-sm tracking-widest">{author}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Laden Button */}
        {(hasMore || (!stories && loading)) && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              className="px-6 py-3 border border-gray-300 text-sm tracking-widest font-light hover:border-pink-500 disabled:opacity-50"
              onClick={() => setVisible(v => v + 25)}
              disabled={loading}
            >
              {loading ? 'LADEN…' : 'LADEN'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

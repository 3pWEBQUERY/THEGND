'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { X, Eye, ChevronLeft, ChevronRight } from 'lucide-react'

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

  // Viewer state
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerSeq, setViewerSeq] = useState<StoryItem[]>([])
  const [seqIndex, setSeqIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const lastIdRef = useRef<string | null>(null)

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

  // Auto-advance for image stories (10s)
  useEffect(() => {
    if (!viewerOpen || viewerSeq.length === 0) return
    if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    const current = viewerSeq[seqIndex]
    if (!current) return
    if (lastIdRef.current !== current.id) { setProgress(0); lastIdRef.current = current.id }
    if (paused) return
    if (current.image) {
      const total = 10000
      const startAt = Date.now() - Math.round((progress / 100) * total)
      startRef.current = startAt
      const tick = () => {
        if (!startRef.current) return
        const pct = Math.min(100, Math.max(0, ((Date.now() - startRef.current) / total) * 100))
        setProgress(pct)
        if (pct < 100 && !paused) rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
      timerRef.current = window.setTimeout(() => {
        setSeqIndex(i => {
          const next = i + 1
          if (next >= viewerSeq.length) { setViewerOpen(false); return i }
          return next
        })
      }, total)
    }
    return () => {
      if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null }
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    }
  }, [viewerOpen, viewerSeq, seqIndex, paused])

  const openViewer = (story: StoryItem) => {
    // Build sequence of same-author stories
    const allStories = stories || []
    const authorId = story.authorId || story.author.email
    const seq = allStories
      .filter(s => (s.authorId || s.author.email) === authorId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    const idx = seq.findIndex(s => s.id === story.id)
    setViewerSeq(seq.length ? seq : [story])
    setSeqIndex(idx >= 0 ? idx : 0)
    setProgress(0)
    lastIdRef.current = null
    setViewerOpen(true)
    // Register view
    fetch(`/api/stories/${story.id}/view`, { method: 'POST' }).catch(() => {})
  }

  const items = useMemo(() => (stories || []).slice(0, visible), [stories, visible])
  const hasMore = useMemo(() => (stories?.length || 0) > visible, [stories, visible])

  const currentStory = viewerSeq[seqIndex] || null

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
              <div
                key={story.id}
                className="aspect-[3/4] bg-gray-100 ring-1 ring-gray-200 overflow-hidden group cursor-pointer"
                onClick={() => openViewer(story)}
              >
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

      {/* Story Viewer */}
      {viewerOpen && currentStory && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[10020] p-0 md:p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setViewerOpen(false) }}
        >
          <div className="bg-gray-950/95 w-full h-full md:w-full md:max-w-3xl md:h-[85vh] overflow-y-auto overflow-x-hidden">
            <div className="p-4 md:p-8 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center space-x-3">
                  {currentStory.author.avatar ? (
                    <img src={currentStory.author.avatar} alt="" className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gray-800 flex items-center justify-center text-sm font-light tracking-widest text-gray-300">
                      {(currentStory.author.displayName || currentStory.author.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-light tracking-wide text-white">
                      {currentStory.author.displayName || currentStory.author.email}
                    </div>
                    <div className="text-xs font-light tracking-wide text-gray-500 mt-0.5">
                      {new Date(currentStory.createdAt).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                </div>
                <button
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 focus:outline-none"
                  onClick={() => setViewerOpen(false)}
                  aria-label="Schließen"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Progress bar */}
              {viewerSeq.length > 1 && (
                <div className="w-full flex items-center gap-1 mb-3">
                  {viewerSeq.map((_, i) => (
                    <div key={i} className="h-1 flex-1 bg-white/10 overflow-hidden">
                      <div
                        className={`h-full ${i <= seqIndex ? 'bg-pink-500' : 'bg-transparent'}`}
                        style={{ width: i < seqIndex ? '100%' : i === seqIndex ? `${progress}%` : '0%' }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Media */}
              <div
                className="flex-1 min-h-0 w-full relative"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
              >
                {currentStory.image ? (
                  <img
                    src={currentStory.image}
                    alt="Story"
                    className="w-full h-full object-contain md:object-cover md:h-[60vh]"
                  />
                ) : currentStory.video ? (
                  <video
                    key={currentStory.id}
                    src={currentStory.video}
                    className="w-full h-full object-contain md:object-cover md:h-[60vh]"
                    controls
                    autoPlay
                    muted
                    playsInline
                    onLoadedMetadata={(e) => {
                      const el = e.currentTarget
                      if (el.duration && isFinite(el.duration)) setProgress((el.currentTime / el.duration) * 100)
                      else setProgress(0)
                    }}
                    onTimeUpdate={(e) => {
                      const el = e.currentTarget
                      if (el.duration && isFinite(el.duration)) setProgress((el.currentTime / el.duration) * 100)
                    }}
                    onEnded={() => {
                      setSeqIndex(i => {
                        const next = i + 1
                        if (next >= viewerSeq.length) { setViewerOpen(false); return i }
                        return next
                      })
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center min-h-[40vh]">
                    <p className="text-lg text-gray-300 font-light text-center px-4">{currentStory.content}</p>
                  </div>
                )}
              </div>

              {/* Text */}
              {currentStory.content && (currentStory.image || currentStory.video) && (
                <p className="text-sm font-light tracking-wide text-gray-300 leading-relaxed mt-3">
                  {currentStory.content}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs font-light tracking-wide text-gray-500 pt-4 border-t border-white/10 mt-3">
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>{currentStory._count?.views ?? 0} AUFRUFE</span>
                </div>
                {viewerSeq.length > 1 && (
                  <div className="flex items-center gap-4">
                    <button
                      className="text-gray-400 hover:text-white disabled:opacity-30"
                      onClick={() => setSeqIndex(i => Math.max(0, i - 1))}
                      disabled={seqIndex === 0}
                      aria-label="Zurück"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-gray-500">{seqIndex + 1}/{viewerSeq.length}</span>
                    <button
                      className="text-gray-400 hover:text-white disabled:opacity-30"
                      onClick={() => setSeqIndex(i => Math.min(viewerSeq.length - 1, i + 1))}
                      disabled={seqIndex === viewerSeq.length - 1}
                      aria-label="Weiter"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
                <span>{new Date(currentStory.createdAt).toLocaleDateString('de-DE')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Play, X } from 'lucide-react'
import { getProfileUrl } from '@/lib/validations'

type StoryItem = {
  id: string
  content: string
  image?: string | null
  video?: string | null
  createdAt: string
  expiresAt?: string
  authorId?: string
  author: { displayName: string | null; email: string; avatar?: string | null; userType?: string | null }
  _count?: { views: number }
}

function timeAgoISO(iso: string): string {
  const from = new Date(iso)
  const diff = Date.now() - from.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'gerade eben'
  if (minutes < 60) return `${minutes}m vorher`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} Stunden vorher`
  const days = Math.floor(hours / 24)
  return `vor ${days} Tagen`
}

function formatTimeRemaining(expiresAt?: string) {
  if (!expiresAt) return null
  const now = new Date()
  const expires = new Date(expiresAt)
  const diff = expires.getTime() - now.getTime()
  if (diff <= 0) return 'Abgelaufen'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

export default function StoriesGallery({ userType, q }: { userType?: string; q?: string }) {
  const [stories, setStories] = useState<StoryItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedStory, setSelectedStory] = useState<StoryItem | null>(null)
  const [authorSequence, setAuthorSequence] = useState<StoryItem[]>([])
  const [seqIndex, setSeqIndex] = useState(0)
  const [videoPosters, setVideoPosters] = useState<Record<string, string>>({})
  const [autoAdvancePaused, setAutoAdvancePaused] = useState(false)
  const [progress, setProgress] = useState(0) // 0..100 for current segment
  const advanceTimerRef = useRef<number | null>(null)
  const progressRafRef = useRef<number | null>(null)
  const progressStartRef = useRef<number | null>(null)
  const lastItemIdRef = useRef<string | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  // Swipe state
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const touchStartAt = useRef<number | null>(null)
  // Seen timestamps by authorId
  const [seenByAuthor, setSeenByAuthor] = useState<Record<string, number>>({})
  // Sponsored marketing asset (HOME_BANNER)
  const [sponsoredUrl, setSponsoredUrl] = useState<string | null>(null)
  const [sponsoredTargetUrl, setSponsoredTargetUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    {
      const qs = new URLSearchParams()
      if (userType) qs.set('userType', userType)
      if (q) qs.set('q', q)
      const url = `/api/stories/latest${qs.toString() ? `?${qs.toString()}` : ''}`
      fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: { stories: StoryItem[] }) => {
        if (active) setStories(data.stories)
      })
      .catch((e) => {
        if (active) setError(e.message)
      })
    }
    return () => {
      active = false
    }
  }, [userType, q])

  // Load active approved marketing asset for HOME_BANNER
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/marketing/active?placement=HOME_BANNER&limit=1', { cache: 'no-store' })
        if (!res.ok) return
        const data: { assets: { url: string; targetUrl?: string | null }[] } = await res.json()
        if (!cancelled) {
          setSponsoredUrl(data.assets?.[0]?.url || null)
          setSponsoredTargetUrl(data.assets?.[0]?.targetUrl ?? null)
        }
      } catch {
        if (!cancelled) {
          setSponsoredUrl(null)
          setSponsoredTargetUrl(null)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Load seen timestamps from localStorage when stories load
  useEffect(() => {
    if (!stories) return
    try {
      const map: Record<string, number> = {}
      const authorIds = Array.from(new Set(stories.map(s => s.authorId).filter(Boolean))) as string[]
      for (const id of authorIds) {
        const v = Number(localStorage.getItem(`storiesSeen:${id}`) || '0')
        if (v > 0) map[id] = v
      }
      setSeenByAuthor(map)
    } catch {}
  }, [stories])

  // Revalidate on focus/visibility and every 60s
  useEffect(() => {
    let cancelled = false
    const revalidate = async () => {
      try {
        const qs = new URLSearchParams()
        if (userType) qs.set('userType', userType)
        if (q) qs.set('q', q)
        const url = `/api/stories/latest${qs.toString() ? `?${qs.toString()}` : ''}`
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setStories(data.stories)
      } catch {}
    }
    const onFocus = () => revalidate()
    const onVis = () => { if (!document.hidden) revalidate() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)
    const id = window.setInterval(revalidate, 60000)
    return () => {
      cancelled = true
      window.clearInterval(id)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [userType, q])

  // Revalidate marketing asset periodically and on focus as well (every 60s)
  useEffect(() => {
    let cancelled = false
    const reload = async () => {
      try {
        const res = await fetch('/api/marketing/active?placement=HOME_BANNER&limit=1', { cache: 'no-store' })
        if (!res.ok) return
        const data: { assets: { url: string; targetUrl?: string | null }[] } = await res.json()
        if (!cancelled) {
          setSponsoredUrl(data.assets?.[0]?.url || null)
          setSponsoredTargetUrl(data.assets?.[0]?.targetUrl ?? null)
        }
      } catch {}
    }
    const onFocus = () => reload()
    const onVis = () => { if (!document.hidden) reload() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)
    const id = window.setInterval(reload, 60000)
    return () => {
      cancelled = true
      window.clearInterval(id)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(!!mq.matches)
    update()
    // Prefer modern API
    if (typeof (mq as any).addEventListener === 'function') {
      (mq as any).addEventListener('change', update)
      return () => (mq as any).removeEventListener('change', update)
    }
    // Safari fallback (deprecated API)
    ;(mq as any).addListener?.(update)
    return () => (mq as any).removeListener?.(update)
  }, [])

  // Auto-advance logic in viewer
  useEffect(() => {
    if (!viewDialogOpen || !authorSequence.length) return
    // Clear any previous timer
    if (advanceTimerRef.current) {
      window.clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
    if (progressRafRef.current) {
      cancelAnimationFrame(progressRafRef.current)
      progressRafRef.current = null
    }
    const current = authorSequence[seqIndex]
    if (!current) return
    // Always reset progress when switching to a new item
    const isNewItem = lastItemIdRef.current !== current.id
    if (isNewItem) {
      setProgress(0)
      lastItemIdRef.current = current.id
    }
    if (autoAdvancePaused || reducedMotion) return
    if (current.image) {
      // advance after 10s for images
      const total = 10000
      // When switching items, always start fresh from 0
      const startAt = isNewItem ? Date.now() : Date.now() - Math.round((progress / 100) * total)
      progressStartRef.current = startAt
      const tick = () => {
        if (!progressStartRef.current) return
        const elapsed = Date.now() - progressStartRef.current
        const pct = Math.min(100, Math.max(0, (elapsed / total) * 100))
        setProgress(pct)
        if (pct < 100 && !autoAdvancePaused) {
          progressRafRef.current = requestAnimationFrame(tick)
        }
      }
      progressRafRef.current = requestAnimationFrame(tick)
      advanceTimerRef.current = window.setTimeout(() => {
        setSeqIndex((i) => {
          const next = i + 1
          if (next >= authorSequence.length) {
            setViewDialogOpen(false)
            return i
          }
          return next
        })
      }, 10000)
    }
    return () => {
      if (advanceTimerRef.current) {
        window.clearTimeout(advanceTimerRef.current)
        advanceTimerRef.current = null
      }
      if (progressRafRef.current) {
        cancelAnimationFrame(progressRafRef.current)
        progressRafRef.current = null
      }
    }
  }, [viewDialogOpen, authorSequence, seqIndex, autoAdvancePaused, reducedMotion])

  // Pause auto-advance when tab is hidden or window is blurred; resume on focus
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        setAutoAdvancePaused(true)
      } else {
        setAutoAdvancePaused(false)
      }
    }
    const onBlur = () => setAutoAdvancePaused(true)
    const onFocus = () => setAutoAdvancePaused(false)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  // Generate poster frames for video-only stories
  const captureVideoFrame = async (videoUrl: string): Promise<string | null> => {
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video')
        video.crossOrigin = 'anonymous'
        video.preload = 'metadata'
        video.muted = true
        video.src = videoUrl

        const fail = () => resolve(null)
        video.addEventListener('error', fail, { once: true })
        video.addEventListener(
          'loadedmetadata',
          () => {
            const seekTo = Math.min(0.1, (video.duration || 1) / 10)
            const onSeeked = () => {
              try {
                const w = video.videoWidth || 320
                const h = video.videoHeight || 180
                const canvas = document.createElement('canvas')
                canvas.width = w
                canvas.height = h
                const ctx = canvas.getContext('2d')
                if (!ctx) return resolve(null)
                ctx.drawImage(video, 0, 0, w, h)
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
                resolve(dataUrl)
              } catch (e) {
                resolve(null)
              }
            }
            video.addEventListener('seeked', onSeeked, { once: true })
            try {
              video.currentTime = seekTo
            } catch {
              // Some browsers require a small timeout before seeking
              setTimeout(() => {
                try {
                  video.currentTime = seekTo
                } catch {
                  resolve(null)
                }
              }, 150)
            }
          },
          { once: true }
        )
      } catch (e) {
        resolve(null)
      }
    })
  }

  useEffect(() => {
    if (!stories) return
    let cancelled = false
    const generate = async () => {
      const need = stories.filter(
        (s) => s.video && !s.image && !videoPosters[s.id]
      )
      for (const s of need) {
        const poster = await captureVideoFrame(s.video!)
        if (cancelled) return
        if (poster) {
          setVideoPosters((prev) => ({ ...prev, [s.id]: poster }))
        }
      }
    }
    generate()
    return () => {
      cancelled = true
    }
  }, [stories, videoPosters])

  const viewStory = async (story: StoryItem) => {
    setSelectedStory(story)
    // Build author sequence within 24h if possible
    if (stories && story.authorId) {
      const dayMs = 24 * 60 * 60 * 1000
      const selTs = new Date(story.createdAt).getTime()
      const seq = stories
        .filter(s => s.authorId === story.authorId && Math.abs(new Date(s.createdAt).getTime() - selTs) <= dayMs)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      setAuthorSequence(seq)
      // Always start at the first story within the 24h window
      setSeqIndex(0)
      // Mark as seen for this author (up to latest story in sequence)
      try {
        const latest = seq[seq.length - 1]
        if (latest) {
          const ts = new Date(latest.createdAt).getTime()
          if (story.authorId) localStorage.setItem(`storiesSeen:${story.authorId}`, String(ts))
          if (story.authorId) setSeenByAuthor((m) => ({ ...m, [story.authorId!]: ts }))
        }
      } catch {}
    } else {
      setAuthorSequence([])
      setSeqIndex(0)
    }
    setViewDialogOpen(true)
    // Try to register a view (if user is logged in); ignore errors
    try {
      await fetch(`/api/stories/${story.id}/view`, { method: 'POST' })
    } catch (e) {
      // no-op
    }
  }

  // ESC to close and scroll lock when viewer is open
  useEffect(() => {
    if (!viewDialogOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewDialogOpen(false)
      if (e.key === 'ArrowLeft') { lastItemIdRef.current = null; setSeqIndex((i) => Math.max(0, i - 1)) }
      if (e.key === 'ArrowRight') { lastItemIdRef.current = null; setSeqIndex((i) => Math.min((authorSequence.length || 1) - 1, i + 1)) }
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [viewDialogOpen, authorSequence.length])

  // Preload next segment (image or video metadata)
  useEffect(() => {
    if (!viewDialogOpen || !authorSequence.length) return
    const next = authorSequence[seqIndex + 1]
    if (!next) return
    if (next.image) {
      const img = new window.Image()
      img.decoding = 'async'
      img.src = next.image
    } else if (next.video) {
      try {
        const v = document.createElement('video')
        v.preload = 'metadata'
        v.src = next.video
        v.load()
      } catch {
        // ignore
      }
    }
  }, [viewDialogOpen, authorSequence, seqIndex])

  // Grid grouping by author within 24h (latest cover)
  const groupedGridItems = useMemo(() => {
    if (!stories) return null
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000
    const byAuthor = new Map<string, StoryItem[]>()
    for (const s of stories) {
      if (!s.authorId) continue
      const created = new Date(s.createdAt).getTime()
      if (now - created <= dayMs) {
        const arr = byAuthor.get(s.authorId) ?? []
        arr.push(s)
        byAuthor.set(s.authorId, arr)
      }
    }
    const covers: StoryItem[] = []
    byAuthor.forEach((arr) => {
      arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      covers.push(arr[0])
    })
    return covers
  }, [stories])

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-thin tracking-wider text-gray-800 mb-4">STORIES DER 24H</h2>
          <div className="w-24 h-px bg-pink-500 mx-auto"></div>
        </div>
        {error && (
          <div className="text-sm text-red-600">Fehler beim Laden der Stories: {error}</div>
        )}
        {/* Mobile: horizontal slider */}
        <div className="md:hidden mb-6" role="region" aria-label="Stories der 24h – Slider">
          <div className="stories-scroll flex gap-4 overflow-x-auto snap-x snap-mandatory [-webkit-overflow-scrolling:touch] scroll-px-3 sm:scroll-px-6">
            {/* Sponsored HOME_BANNER tile (if any) */}
            {sponsoredUrl && (
              <div
                key="sponsored-mobile"
                className="shrink-0 w-[45vw] aspect-[3/4] group overflow-hidden relative ring-2 ring-[var(--brand-pink)] bg-gray-200 snap-start"
                title="Sponsored – Story Banner"
                aria-label="Sponsored – Story Banner"
              >
                {/* Use a plain <img> because the CDN uses dynamic subdomains (e.g., *.ufs.sh) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sponsoredUrl}
                  alt="Sponsored Story Banner"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="eager"
                />
                <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] uppercase tracking-widest px-2 py-1">Sponsored</div>
                {sponsoredTargetUrl && (
                  <a
                    href={sponsoredTargetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0"
                    aria-label="Gesponsertes Banner öffnen"
                  />
                )}
              </div>
            )}
            {((groupedGridItems ?? Array.from({ length: 7 })) as any[]).map((story, idx) => {
              if (!stories) {
                return (
                  <div key={idx} className="shrink-0 w-[45vw] aspect-[3/4] bg-gray-200 animate-pulse rounded snap-start" />
                )
              }

              const authorName = (
                story.author.displayName ?? story.author.email.split('@')[0]
              ).toUpperCase()
              const label = timeAgoISO(story.createdAt)
              const coverUrl = story.author.avatar || story.image || (story.video ? videoPosters[story.id] : undefined)
              const fetchPrio: 'high' | 'low' = idx < 4 ? 'high' : 'low'
              const sizes = '(min-width: 1024px) 12vw, (min-width: 768px) 22vw, 45vw'
              const initials = authorName
                .split(/\s|\.|-|_/)
                .filter(Boolean)
                .slice(0, 2)
                .map((s: string) => s[0])
                .join('') || authorName[0]

              // Unseen indicator per author based on seenByAuthor state
              const coverTs = new Date(story.createdAt).getTime()
              const lastSeen = story.authorId ? seenByAuthor[story.authorId] ?? 0 : 0
              const unseen = coverTs > lastSeen

              return (
                <div
                  key={story.id}
                  className={`shrink-0 w-[45vw] aspect-[3/4] bg-gray-200 group cursor-pointer overflow-hidden relative snap-start ${unseen ? 'ring-2 ring-[var(--brand-pink)]' : 'ring-1 ring-gray-200'}`}
                  title={`${authorName} - ${story.content} (${label})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${authorName} – Story öffnen (${label})`}
                  onClick={() => viewStory(story)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      viewStory(story)
                    }
                  }}
                >
                  {coverUrl ? (
                    <>
                      <Image
                        src={coverUrl}
                        alt={story.content || authorName}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        fetchPriority={fetchPrio}
                        sizes={sizes}
                      />
                      {story.video && (
                        <div className="absolute bottom-2 right-2 bg-black/60 rounded-full p-1.5">
                          <Play className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center brand-gradient">
                      <div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/40">
                        <span className="text-white text-xl font-light tracking-widest">{initials}</span>
                      </div>
                    </div>
                  )}

                  {/* Story Info Overlay (nur bei Hover sichtbar) */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2">
                    <div className="text-white text-xs font-light tracking-wider">
                      {authorName}
                    </div>
                    <div className="text-gray-300 text-xs mt-1">{label}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Desktop/Tablet: horizontal slider with 5er Grid */}
        <div className="hidden md:block" role="region" aria-label="Stories der 24h – Slider (Desktop)">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
            {/* Sponsored HOME_BANNER tile (if any) */}
            {sponsoredUrl && (
              <div
                key="sponsored-desktop"
                className="shrink-0 basis-[20%] aspect-[3/4] group overflow-hidden relative ring-2 ring-[var(--brand-pink)] bg-gray-200 snap-start"
                title="Sponsored – Story Banner"
                aria-label="Sponsored – Story Banner"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sponsoredUrl}
                  alt="Sponsored Story Banner"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="eager"
                />
                <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] uppercase tracking-widest px-2 py-1">Sponsored</div>
                {sponsoredTargetUrl && (
                  <a
                    href={sponsoredTargetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0"
                    aria-label="Gesponsertes Banner öffnen"
                  />
                )}
              </div>
            )}
            {((groupedGridItems ?? Array.from({ length: 7 })) as any[]).map((story, idx) => {
              if (!stories) {
                return (
                  <div key={idx} className="shrink-0 basis-[20%] aspect-[3/4] bg-gray-200 animate-pulse rounded snap-start" />
                )
              }

              const authorName = (
                story.author.displayName ?? story.author.email.split('@')[0]
              ).toUpperCase()
              const label = timeAgoISO(story.createdAt)
              const coverUrl = story.author.avatar || story.image || (story.video ? videoPosters[story.id] : undefined)
              const fetchPrio: 'high' | 'low' = idx < 4 ? 'high' : 'low'
              const sizes = '(min-width: 1024px) 20vw, (min-width: 768px) 25vw, 45vw'
              const initials = authorName
                .split(/\s|\.|-|_/)
                .filter(Boolean)
                .slice(0, 2)
                .map((s: string) => s[0])
                .join('') || authorName[0]

              // Unseen indicator per author based on seenByAuthor state
              const coverTs = new Date(story.createdAt).getTime()
              const lastSeen = story.authorId ? seenByAuthor[story.authorId] ?? 0 : 0
              const unseen = coverTs > lastSeen

              return (
                <div
                  key={story.id}
                  className={`shrink-0 basis-[20%] aspect-[3/4] bg-gray-200 group cursor-pointer overflow-hidden relative snap-start ${unseen ? 'ring-2 ring-[var(--brand-pink)]' : 'ring-1 ring-gray-200'}`}
                  title={`${authorName} - ${story.content} (${label})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${authorName} – Story öffnen (${label})`}
                  onClick={() => viewStory(story)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      viewStory(story)
                    }
                  }}
                >
                  {coverUrl ? (
                    <>
                      <Image
                        src={coverUrl}
                        alt={story.content || authorName}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        fetchPriority={fetchPrio}
                        sizes={sizes}
                      />
                      {story.video && (
                        <div className="absolute bottom-2 right-2 bg-black/60 rounded-full p-1.5">
                          <Play className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center brand-gradient">
                      <div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/40">
                        <span className="text-white text-xl font-light tracking-widest">{initials}</span>
                      </div>
                    </div>
                  )}

                  {/* Story Info Overlay (nur bei Hover sichtbar) */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2">
                    <div className="text-white text-xs font-light tracking-wider">
                      {authorName}
                    </div>
                    <div className="text-gray-300 text-xs mt-1">{label}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Story View Dialog */}
        {viewDialogOpen && selectedStory && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[10020] p-0 md:p-6"
            onClick={() => setViewDialogOpen(false)}
          >
            <div className="bg-gray-950/95 w-full h-full md:w-full md:max-w-3xl md:h-[85vh] overflow-y-auto overflow-x-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 md:p-8 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div className="flex items-center space-x-3">
                    <Link href={getProfileUrl({ id: selectedStory.authorId || '', userType: selectedStory.author.userType || 'MEMBER', displayName: selectedStory.author.displayName })}>
                      {selectedStory.author.avatar ? (
                        <img src={selectedStory.author.avatar} alt="" className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gray-800 flex items-center justify-center text-sm font-light tracking-widest text-gray-300">
                          {(selectedStory.author.displayName || selectedStory.author.email)[0].toUpperCase()}
                        </div>
                      )}
                    </Link>
                    <div>
                      <Link href={getProfileUrl({ id: selectedStory.authorId || '', userType: selectedStory.author.userType || 'MEMBER', displayName: selectedStory.author.displayName })} className="text-sm font-light tracking-wide text-white hover:text-pink-400 transition-colors">
                        {(selectedStory.author.displayName ?? selectedStory.author.email.split('@')[0]).toUpperCase()}
                      </Link>
                      <div className="text-xs font-light tracking-wide text-gray-500 mt-0.5">
                        {formatTimeRemaining(selectedStory.expiresAt) ?? timeAgoISO(selectedStory.createdAt)}
                      </div>
                    </div>
                  </div>
                  <button
                    className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 focus:outline-none"
                    onClick={() => setViewDialogOpen(false)}
                    aria-label="Viewer schließen"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {authorSequence.length > 0 ? (
                  <>
                    {/* Segmented progress bar */}
                    <div className="w-full flex items-center gap-1 mb-3" aria-label="Story Fortschrittsanzeige">
                      {authorSequence.map((_, i) => (
                        <div key={i} className="flex-1">
                          <div
                            className="h-1 bg-white/10 overflow-hidden cursor-pointer"
                            role="button"
                            aria-label={`Segment ${i + 1} von ${authorSequence.length}${i === seqIndex ? ' – aktuell' : ''}`}
                            aria-current={i === seqIndex ? 'step' : undefined}
                            tabIndex={0}
                            onClick={() => { lastItemIdRef.current = null; setSeqIndex(i); }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                lastItemIdRef.current = null
                                setSeqIndex(i)
                              }
                            }}
                          >
                            <div
                              className={`h-full ${i <= seqIndex ? 'bg-pink-500' : 'bg-transparent'}`}
                              style={{
                                width: i < seqIndex ? '100%' : i === seqIndex ? `${progress}%` : '0%'
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="sr-only" aria-live="polite">
                      {(
                        authorSequence[seqIndex].author.displayName ?? authorSequence[seqIndex].author.email.split('@')[0]
                      ).toUpperCase()} – {timeAgoISO(authorSequence[seqIndex].createdAt)}
                    </div>
                    {(authorSequence[seqIndex].image || authorSequence[seqIndex].video) ? (
                      <div
                        className="flex-1 min-h-0 w-full"
                        onMouseEnter={() => setAutoAdvancePaused(true)}
                        onMouseLeave={() => setAutoAdvancePaused(false)}
                        onTouchStart={(e) => {
                          const t = e.changedTouches[0]
                          touchStartX.current = t.clientX
                          touchStartY.current = t.clientY
                          touchStartAt.current = Date.now()
                        }}
                        onTouchEnd={(e) => {
                          const t = e.changedTouches[0]
                          if (touchStartX.current == null || touchStartY.current == null || touchStartAt.current == null) return
                          const dx = t.clientX - touchStartX.current
                          const dy = t.clientY - touchStartY.current
                          const dt = Date.now() - touchStartAt.current
                          touchStartX.current = null
                          touchStartY.current = null
                          touchStartAt.current = null
                          if (dt < 600 && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
                            lastItemIdRef.current = null
                            if (dx < 0) {
                              setSeqIndex((i) => (i + 1 < authorSequence.length ? i + 1 : i))
                            } else {
                              setSeqIndex((i) => (i - 1 >= 0 ? i - 1 : i))
                            }
                          }
                        }}
                      >
                        {authorSequence[seqIndex].image ? (
                          <div className="relative w-full h-full md:h-[60vh]">
                            <Image
                              src={authorSequence[seqIndex].image!}
                              alt={authorSequence[seqIndex].content}
                              fill
                              className="object-contain md:object-cover rounded-none"
                              priority
                              fetchPriority="high"
                              sizes="100vw"
                            />
                          </div>
                        ) : (
                          <video
                            key={authorSequence[seqIndex].id}
                            src={authorSequence[seqIndex].video!}
                            className="w-full h-full object-contain md:object-cover md:h-[60vh] rounded-none"
                            controls
                            autoPlay
                            muted
                            playsInline
                            onLoadedMetadata={(e) => {
                              const el = e.currentTarget
                              if (el.duration && isFinite(el.duration)) {
                                setProgress((el.currentTime / el.duration) * 100)
                              } else {
                                setProgress(0)
                              }
                            }}
                            onTimeUpdate={(e) => {
                              const el = e.currentTarget
                              if (el.duration && isFinite(el.duration)) {
                                setProgress((el.currentTime / el.duration) * 100)
                              }
                            }}
                            onEnded={() => {
                              setSeqIndex((i) => {
                                const next = i + 1
                                if (next >= authorSequence.length) {
                                  setViewDialogOpen(false)
                                  return i
                                }
                                return next
                              })
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-full flex-1 min-h-0 flex items-center justify-center" style={{ minHeight: '40vh' }}>
                        <p className="text-lg text-gray-300 font-light text-center px-4">{authorSequence[seqIndex].content}</p>
                      </div>
                    )}
                    {authorSequence[seqIndex].content && (authorSequence[seqIndex].image || authorSequence[seqIndex].video) && (
                      <p className="text-sm font-light tracking-wide text-gray-300 leading-relaxed mt-3">
                        {authorSequence[seqIndex].content}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs font-light tracking-wide text-gray-500 pt-4 border-t border-white/10 mt-3">
                      <div className="flex items-center space-x-2">
                        <span>{authorSequence[seqIndex]._count?.views ?? 0} AUFRUFE</span>
                      </div>
                      <span>{new Date(authorSequence[seqIndex].createdAt).toLocaleDateString('de-DE')}</span>
                    </div>
                    {authorSequence.length > 1 && (
                      <div className="flex items-center justify-between pt-3">
                        <button
                          className="text-[10px] font-light tracking-widest uppercase bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 disabled:opacity-30 transition-colors"
                          onClick={() => { lastItemIdRef.current = null; setSeqIndex(i => Math.max(0, i - 1)); }}
                          disabled={seqIndex === 0}
                        >
                          ZURÜCK
                        </button>
                        <div className="text-xs font-light tracking-wide text-gray-500">
                          {seqIndex + 1}/{authorSequence.length}
                        </div>
                        <button
                          className="text-[10px] font-light tracking-widest uppercase bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 disabled:opacity-30 transition-colors"
                          onClick={() => { lastItemIdRef.current = null; setSeqIndex(i => Math.min(authorSequence.length - 1, i + 1)); }}
                          disabled={seqIndex === authorSequence.length - 1}
                        >
                          WEITER
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {selectedStory.image ? (
                      <div className="relative w-full flex-1 min-h-0 md:h-[60vh]">
                        <Image
                          src={selectedStory.image}
                          alt={selectedStory.content}
                          fill
                          className="object-contain md:object-cover rounded-none"
                          sizes="100vw"
                        />
                      </div>
                    ) : selectedStory.video ? (
                      <video
                        src={selectedStory.video}
                        className="w-full h-full object-contain md:object-cover md:h-[60vh] flex-1 min-h-0 rounded-none"
                        controls
                        autoPlay
                        muted
                        playsInline
                      />
                    ) : (
                      <div className="w-full flex-1 min-h-0 flex items-center justify-center" style={{ minHeight: '40vh' }}>
                        <p className="text-lg text-gray-300 font-light text-center px-4">{selectedStory.content}</p>
                      </div>
                    )}
                    {selectedStory.content && (selectedStory.image || selectedStory.video) && (
                      <p className="text-sm font-light tracking-wide text-gray-300 leading-relaxed mt-3">
                        {selectedStory.content}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs font-light tracking-wide text-gray-500 pt-4 border-t border-white/10 mt-3">
                      <div className="flex items-center space-x-2">
                        <span>{selectedStory._count?.views ?? 0} AUFRUFE</span>
                      </div>
                      <span>{new Date(selectedStory.createdAt).toLocaleDateString('de-DE')}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Hide scrollbar on the mobile slider */}
      <style jsx>{`
        .stories-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .stories-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  )
}

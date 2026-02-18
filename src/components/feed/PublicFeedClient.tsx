'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ProfileFeed, { type ProfileFeedPost } from '@/components/ProfileFeed'

type Props = {
  initialPosts: ProfileFeedPost[]
  pageSize?: number
}

export default function PublicFeedClient({ initialPosts, pageSize = 12 }: Props) {
  const [posts, setPosts] = useState<ProfileFeedPost[]>(initialPosts || [])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Track known IDs to avoid duplicates
  const knownIds = useMemo(() => new Set(posts.map(p => p.id)), [posts])

  const fetchNext = useCallback(async () => {
    if (loading || done) return
    setLoading(true)
    try {
      const nextPage = page + 1
      const res = await fetch(`/api/feed/public?page=${nextPage}&limit=${pageSize}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Fehler beim Laden')
      const data = await res.json()
      const items: ProfileFeedPost[] = Array.isArray(data?.posts) ? data.posts : []
      // Deduplicate by id
      const filtered = items.filter(p => !knownIds.has(p.id))
      if (filtered.length === 0) {
        // If no new items returned, consider finished
        setDone(true)
      } else {
        setPosts(prev => [...prev, ...filtered])
        setPage(nextPage)
      }
    } catch {
      // Soft fail: stop trying further to avoid loops
      setDone(true)
    } finally {
      setLoading(false)
    }
  }, [loading, done, page, pageSize, knownIds])

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || done) return
    const el = sentinelRef.current
    const io = new IntersectionObserver((entries) => {
      const first = entries[0]
      if (first?.isIntersecting) {
        fetchNext()
      }
    }, { rootMargin: '600px 0px 600px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [fetchNext, done])

  // If initialPosts changes (unlikely), sync
  useEffect(() => {
    setPosts(initialPosts || [])
    setPage(1)
    setDone(false)
  }, [initialPosts])

  return (
    <div>
      <ProfileFeed posts={posts} />
      <div ref={sentinelRef} />
      {loading && !done && (
        <div className="bg-white border border-gray-100 rounded-none mt-4">
          <div className="p-6 text-center text-sm text-gray-500">Laden…</div>
        </div>
      )}
      {done && posts.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-none mt-4">
          <div className="p-6 text-center text-sm text-gray-500">Keine Beiträge gefunden.</div>
        </div>
      )}
    </div>
  )
}

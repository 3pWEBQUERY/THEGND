'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import PostCard, { PostCardData } from './PostCard'
import FeedSortTabs from './FeedSortTabs'
import { Loader2 } from 'lucide-react'

interface PostFeedProps {
  /** If provided, fetches from community-specific endpoint */
  communitySlug?: string
  /** Feed mode: home (joined), popular, all */
  mode?: 'home' | 'popular' | 'all'
  /** Show community name on each card */
  showCommunity?: boolean
}

export default function PostFeed({ communitySlug, mode = 'all', showCommunity = true }: PostFeedProps) {
  const [posts, setPosts] = useState<PostCardData[]>([])
  const [sort, setSort] = useState<'hot' | 'new' | 'top'>('hot')
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const observerRef = useRef<HTMLDivElement>(null)

  const buildUrl = useCallback(
    (cursorVal?: string | null) => {
      const params = new URLSearchParams({ sort, limit: '20' })
      if (cursorVal) params.set('cursor', cursorVal)

      if (communitySlug) {
        return `/api/communities/${communitySlug}/posts?${params}`
      }
      if (mode) params.set('mode', mode)
      return `/api/communities/feed?${params}`
    },
    [communitySlug, mode, sort],
  )

  const fetchPosts = useCallback(
    async (append = false) => {
      if (append) setLoadingMore(true)
      else setLoading(true)

      try {
        const url = buildUrl(append ? cursor : null)
        const res = await fetch(url)
        const data = await res.json()
        if (res.ok) {
          setPosts((prev) => (append ? [...prev, ...data.posts] : data.posts))
          setCursor(data.nextCursor ?? null)
          setHasMore(!!data.nextCursor)
        }
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [buildUrl, cursor],
  )

  // Reset on sort change
  useEffect(() => {
    setCursor(null)
    setHasMore(true)
    fetchPosts(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, communitySlug, mode])

  // Infinite scroll
  useEffect(() => {
    const el = observerRef.current
    if (!el || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore) {
          fetchPosts(true)
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loadingMore, cursor])

  const toggleSave = async (postId: string) => {
    await fetch(`/api/communities/posts/${postId}/save`, { method: 'POST' })
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isSaved: !p.isSaved } : p)),
    )
  }

  return (
    <div className="space-y-2">
      <FeedSortTabs active={sort} onChange={setSort} />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
        </div>
      ) : posts.length === 0 ? (
        <div className="border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">Keine Beiträge gefunden.</p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              showCommunity={showCommunity}
              onSave={toggleSave}
            />
          ))}

          <div ref={observerRef} className="h-4" />

          {loadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-pink-400" />
            </div>
          )}
        </>
      )}
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarUrl } from '@/utils/avatar'

interface FollowerUser {
  id: string
  email: string
  profile?: { displayName?: string | null; companyName?: string | null; avatar?: string | null } | null
  followedAt?: string
}

interface FollowersResponse {
  type?: 'followers' | 'following'
  users?: FollowerUser[]
  count?: number
  followersCount?: number
  followingCount?: number
}

interface PostLite {
  id: string
  images: string[]
  createdAt: string
  _count: { likes: number; comments: number }
  comments: Array<{
    id: string
    content: string
    createdAt?: string
    author: { id: string; email: string; profile?: { displayName?: string; avatar?: string } }
  }>
  likes?: Array<{
    id?: string
    createdAt?: string
    user: { id: string; email: string; profile?: { displayName?: string; avatar?: string } }
  }>
}

interface SuggestedUser {
  id: string
  email: string
  profile?: { displayName?: string | null; companyName?: string | null; avatar?: string | null } | null
  isFollowing: boolean
}

// Avatar-Normalisierung jetzt in @/utils/avatar (getAvatarUrl)

export default function FeedRightSidebar() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [followers, setFollowers] = useState<FollowerUser[]>([])
  const [followersCount, setFollowersCount] = useState<number>(0)
  const [followingCount, setFollowingCount] = useState<number>(0)
  const [posts, setPosts] = useState<PostLite[]>([])
  const [suggested, setSuggested] = useState<SuggestedUser[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const [followersRes, countsRes, postsRes, suggestionsRes] = await Promise.all([
          fetch('/api/social?type=followers', { cache: 'no-store' }),
          fetch('/api/social', { cache: 'no-store' }),
          fetch('/api/posts?limit=10', { cache: 'no-store' }),
          fetch('/api/users/search?limit=12', { cache: 'no-store' }),
        ])
        if (!cancelled) {
          if (followersRes.ok) {
            const data: FollowersResponse = await followersRes.json()
            setFollowers(Array.isArray(data.users) ? data.users : [])
          } else {
            setFollowers([])
          }
          if (countsRes.ok) {
            const c: FollowersResponse = await countsRes.json()
            setFollowersCount(Number(c.followersCount || 0))
            setFollowingCount(Number(c.followingCount || 0))
          } else {
            setFollowersCount(0)
            setFollowingCount(0)
          }
          if (postsRes.ok) {
            const d = await postsRes.json()
            setPosts(Array.isArray(d.posts) ? d.posts : [])
          } else {
            setPosts([])
          }
          if (suggestionsRes.ok) {
            const su = await suggestionsRes.json()
            const clean: SuggestedUser[] = Array.isArray(su)
              ? su.filter((u: any) => !u.isFollowing).map((u: any) => ({ id: u.id, email: u.email, profile: u.profile, isFollowing: !!u.isFollowing }))
              : []
            setSuggested(clean.slice(0, 8))
          } else {
            setSuggested([])
          }
        }
      } catch {
        if (!cancelled) {
          setFollowers([])
          setFollowersCount(0)
          setFollowingCount(0)
          setPosts([])
          setSuggested([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const stats = useMemo(() => {
    const postsCount = posts.length
    const totalComments = posts.reduce((acc, p) => acc + (p?._count?.comments || 0), 0)
    const totalLikes = posts.reduce((acc, p) => acc + (p?._count?.likes || 0), 0)
    return { postsCount, totalComments, totalLikes }
  }, [posts])

  const recentCommenters = useMemo(() => {
    const all: Array<{ id: string; name: string; avatar?: string; content: string; createdAt?: string }> = []
    for (const p of posts) {
      for (const c of p.comments || []) {
        const name = c.author.profile?.displayName || c.author.email
        all.push({ id: c.author.id, name, avatar: c.author.profile?.avatar, content: c.content, createdAt: c.createdAt })
      }
    }
    all.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    return all.slice(0, 6)
  }, [posts])

  const recentLikers = useMemo(() => {
    const liked: Array<{ id: string; label: string; email: string; avatar?: string; createdAt?: string }> = []
    for (const p of posts) {
      for (const l of p.likes || []) {
        const label = l.user.profile?.displayName || l.user.email
        liked.push({ id: l.user.id, label, email: l.user.email, avatar: l.user.profile?.avatar, createdAt: l.createdAt })
      }
    }
    // sort by createdAt desc and unique by user id
    liked.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    const seen = new Set<string>()
    const unique: typeof liked = []
    for (const x of liked) {
      if (seen.has(x.id)) continue
      seen.add(x.id)
      unique.push(x)
    }
    return unique.slice(0, 6)
  }, [posts])

  async function followUser(userId: string) {
    try {
      const res = await fetch(`/api/users/${userId}/follow`, { method: 'POST' })
      if (res.ok) {
        setSuggested((prev) => prev.map((u) => u.id === userId ? { ...u, isFollowing: true } : u))
      }
    } catch {}
  }

  async function unfollowUser(userId: string) {
    try {
      const res = await fetch(`/api/users/${userId}/follow`, { method: 'DELETE' })
      if (res.ok) {
        setSuggested((prev) => prev.map((u) => u.id === userId ? { ...u, isFollowing: false } : u))
      }
    } catch {}
  }

  return (
    <aside className="space-y-6 lg:sticky lg:top-28">
      {/* Followers */}
      <div className="bg-white border border-gray-100 rounded-none">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-light tracking-widest text-gray-800 uppercase">Follower</h3>
            <span className="text-xs text-gray-500">{followersCount}</span>
          </div>
          {loading && followers.length === 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-2 w-14 bg-gray-100 animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {followers.slice(0, 6).map((u) => {
                const label = (u.profile?.displayName || u.profile?.companyName || u.email) as string
                return (
                <Link key={u.id} href={`/profile/${u.id}`} className="group flex flex-col items-center gap-2 p-2 border border-transparent hover:border-pink-500 hover:bg-pink-50 transition-colors rounded-none">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getAvatarUrl(u.profile?.avatar)} alt={label} />
                    <AvatarFallback className="text-xs bg-gray-100">
                      {label.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="block w-full text-center text-[10px] text-gray-600 truncate">
                    {label}
                  </span>
                </Link>
              )})}
            </div>
          )}
        </div>
      </div>

      {/* Follow Suggestions */}
      <div className="bg-white border border-gray-100 rounded-none">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-light tracking-widest text-gray-800 uppercase">Wem folgen</h3>
            <span className="text-xs text-gray-500">{suggested.filter(s => !s.isFollowing).length}</span>
          </div>
          {suggested.length === 0 ? (
            <div className="text-xs text-gray-500">Keine Vorschläge</div>
          ) : (
            <div className="space-y-3">
              {suggested.slice(0, 6).map((u) => {
                const label = (u.profile?.displayName || u.profile?.companyName || u.email) as string
                return (
                <div key={u.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getAvatarUrl(u.profile?.avatar)} alt={label} />
                      <AvatarFallback className="text-xs bg-gray-100">{label.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="text-xs text-gray-800 truncate">{label}</div>
                  </div>
                  {u.isFollowing ? (
                    <button
                      className="px-3 py-1 border border-gray-300 text-[10px] tracking-widest uppercase rounded-none hover:border-pink-500 text-gray-600"
                      onClick={() => unfollowUser(u.id)}
                    >
                      Gefolgt
                    </button>
                  ) : (
                    <button
                      className="px-3 py-1 bg-pink-500 hover:bg-pink-600 text-white text-[10px] tracking-widest uppercase rounded-none"
                      onClick={() => followUser(u.id)}
                    >
                      Folgen
                    </button>
                  )}
                </div>
              )})}
            </div>
          )}
        </div>
      </div>

      {/* Recent commenters */}
      <div className="bg-white border border-gray-100 rounded-none">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-light tracking-widest text-gray-800 uppercase">Aktive Kommentare</h3>
            <span className="text-xs text-gray-500">{recentCommenters.length}</span>
          </div>
          {loading && recentCommenters.length === 0 ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 bg-gray-200 animate-pulse" />
                    <div className="h-2 w-40 bg-gray-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {recentCommenters.map((c, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getAvatarUrl(c.avatar)} alt={c.name} />
                    <AvatarFallback className="text-xs bg-gray-100">{c.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-xs font-light tracking-wide text-gray-800 truncate">{c.name}</div>
                    <div className="text-[11px] text-gray-600 truncate">{c.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white border border-gray-100 rounded-none">
        <div className="p-4 sm:p-6">
          <h3 className="text-sm font-light tracking-widest text-gray-800 uppercase mb-4">Statistiken</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50">
              <div className="text-lg font-thin tracking-wider text-gray-800">{followersCount}</div>
              <div className="text-[10px] tracking-widest text-gray-500 uppercase">Follower</div>
            </div>
            <div className="text-center p-3 bg-gray-50">
              <div className="text-lg font-thin tracking-wider text-gray-800">{followingCount}</div>
              <div className="text-[10px] tracking-widest text-gray-500 uppercase">Folge ich</div>
            </div>
            <div className="text-center p-3 bg-gray-50">
              <div className="text-lg font-thin tracking-wider text-gray-800">{stats.postsCount}</div>
              <div className="text-[10px] tracking-widest text-gray-500 uppercase">Beiträge</div>
            </div>
            <div className="text-center p-3 bg-gray-50">
              <div className="text-lg font-thin tracking-wider text-gray-800">{stats.totalComments}</div>
              <div className="text-[10px] tracking-widest text-gray-500 uppercase">Kommentare</div>
            </div>
            <div className="text-center p-3 bg-gray-50 col-span-2">
              <div className="text-lg font-thin tracking-wider text-gray-800">{stats.totalLikes}</div>
              <div className="text-[10px] tracking-widest text-gray-500 uppercase">Likes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Likes */}
      <div className="bg-white border border-gray-100 rounded-none">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-light tracking-widest text-gray-800 uppercase">Letzte Likes</h3>
            <span className="text-xs text-gray-500">{recentLikers.length}</span>
          </div>
          {loading && recentLikers.length === 0 ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-2 w-28 bg-gray-100 animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {recentLikers.map((l, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getAvatarUrl(l.avatar)} alt={l.label} />
                    <AvatarFallback className="text-xs bg-gray-100">{l.label.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-xs text-gray-800 truncate">{l.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { Bell, MessageCircle, UserPlus, Heart, MessageSquare, Rss } from 'lucide-react'
import { getUserTypeDisplayName, canCreateStories } from '@/lib/validations'
import { UserType } from '@prisma/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarUrl } from '@/utils/avatar'
import Image from 'next/image'

interface DashboardHeaderProps {
  session: any
  activeTab: string
  setActiveTab: (tab: string) => void
}

interface NotificationItem {
  id: string
  type: string // "follow", "like", "comment", "message", "feed"
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export default function DashboardHeader({ session, activeTab, setActiveTab }: DashboardHeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [profileNavOpen, setProfileNavOpen] = useState(false)
  const profileNavRef = useRef<HTMLDivElement>(null)
  const [matchingCounts, setMatchingCounts] = useState<{ likes: number; mutual: number }>({ likes: 0, mutual: 0 })
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifUnreadOnly, setNotifUnreadOnly] = useState(false)
  const [notifThumbs, setNotifThumbs] = useState<Record<string, { avatar: string | null; galleryFirst: string | null; displayName: string }>>({})
  const [notifCursor, setNotifCursor] = useState<string | null>(null)
  const [notifHasMore, setNotifHasMore] = useState(false)
  const [countryBlockEnabled, setCountryBlockEnabled] = useState(false)
  const [seoEnabled, setSeoEnabled] = useState(false)
  const [seoAvailable, setSeoAvailable] = useState(false)
  const [hasMembership, setHasMembership] = useState(false)

  const handleSignOut = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '/'
    signOut({ callbackUrl: `${origin}/` })
  }

  const markNotificationRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setNotifications((prev) => {
          const updated = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
          return notifUnreadOnly ? updated.filter(n => !n.isRead) : updated
        })
        if (typeof data.unread === 'number') setUnreadCount(data.unread)
      }
    } catch {}
  }

  const markAllNotificationsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setNotifications((prev) => notifUnreadOnly ? [] : prev.map((n) => ({ ...n, isRead: true })))
        if (typeof data.unread === 'number') setUnreadCount(data.unread)
      }
    } catch {}
  }

  const linkify = (text: string) => {
    if (!text) return null
    // Strip embedded uid tokens from display text
    const cleaned = text.replace(/\[uid:[^\]]+\]/g, '')
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = cleaned.split(urlRegex)
    return parts.map((part, idx) => {
      if (part.startsWith('http://') || part.startsWith('https://')) {
        return (
          <a key={idx} href={part} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline break-all">
            {part}
          </a>
        )
      }
      return <span key={idx}>{part}</span>
    })
  }

  const userType = (session?.user?.userType as UserType) ?? 'MEMBER'
  const canStories = canCreateStories(userType)

  // Check if MEMBER has an active membership (for blog tab gating)
  useEffect(() => {
    if (userType !== 'MEMBER') return
    fetch('/api/membership/my')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.memberships?.some((m: any) => m.status === 'ACTIVE')) {
          setHasMembership(true)
        }
      })
      .catch(() => {})
  }, [userType])

  const loadNotifications = async (reset = false) => {
    try {
      setNotifLoading(true)
      const qUnread = notifUnreadOnly ? '&unreadOnly=true' : ''
      const qCursor = !reset && notifCursor ? `&cursor=${encodeURIComponent(notifCursor)}` : ''
      const res = await fetch(`/api/notifications/list?limit=20${qUnread}${qCursor}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        const items = Array.isArray(data?.items) ? data.items : []
        setNotifications(prev => reset ? items : [...prev, ...items])
        setNotifCursor(data?.nextCursor ?? null)
        setNotifHasMore(!!data?.nextCursor)
      }
    } catch (e) {
      // optional: console.error
    } finally {
      setNotifLoading(false)
    }
  }

  useEffect(() => {
    if (notifOpen) {
      loadNotifications(true)
    }
  }, [notifOpen, notifUnreadOnly])

  // Load avatar for header display
  useEffect(() => {
    const loadAvatar = async () => {
      try {
        const res = await fetch('/api/profile')
        if (!res.ok) return
        const data = await res.json()
        setAvatarUrl(data?.user?.profile?.avatar ?? null)
      } catch {}
    }
    if (session?.user?.id) loadAvatar()
  }, [session?.user?.id])

  const userType = (session?.user as any)?.userType ?? 'MEMBER'

  // Load thumbnails for notifications that embed [uid:<id>]
  useEffect(() => {
    if (!notifOpen || !notifications || notifications.length === 0) return
    const ids = new Set<string>()
    const uidRe = /\[uid:([a-zA-Z0-9_-]+)\]/g
    for (const n of notifications) {
      if (!n?.message) continue
      let m
      while ((m = uidRe.exec(n.message)) !== null) {
        if (m[1]) ids.add(m[1])
      }
    }
    if (ids.size === 0) return
    const toLoad = Array.from(ids).filter((id) => !notifThumbs[id])
    if (toLoad.length === 0) return
    const load = async () => {
      try {
        const res = await fetch(`/api/users/minimal?ids=${encodeURIComponent(toLoad.join(','))}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!data?.users) return
        setNotifThumbs((prev) => {
          const next = { ...prev }
          for (const u of data.users as any[]) {
            next[u.id] = { avatar: u.avatar ?? null, galleryFirst: u.galleryFirst ?? null, displayName: u.displayName }
          }
          return next
        })
      } catch {}
    }
    load()
    // we intentionally don't depend on notifThumbs to avoid refetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifOpen, notifications])

  // Load admin flag to conditionally show ACP link
  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const res = await fetch('/api/account')
        if (!res.ok) return
        const data = await res.json()
        setIsAdmin(!!data?.isAdmin)
      } catch {}
    }
    loadAdmin()
  }, [])

  // Load add-on states to determine if LÄNDERSPERRE and SEO should be shown
  useEffect(() => {
    const loadAddons = async () => {
      try {
        if (!session?.user?.id) return
        const res = await fetch('/api/addons/state', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const st = Array.isArray(data) ? data : []
        const found = st.find((s: any) => s?.key === 'COUNTRY_BLOCK' && !!s?.enabled)
        setCountryBlockEnabled(!!found)
        const seo = st.find((s: any) => s?.key === 'SEO' && !!s?.enabled)
        setSeoEnabled(!!seo)
      } catch {}
    }
    loadAddons()
  }, [session?.user?.id])

  // Load global availability for SEO (ACP-controlled)
  useEffect(() => {
    const loadAvailable = async () => {
      try {
        const res = await fetch('/api/addons/available', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const keys = Array.isArray(data?.activeKeys) ? data.activeKeys : []
        setSeoAvailable(keys.includes('SEO'))
      } catch {}
    }
    loadAvailable()
  }, [])

  // Load matching counts (badge) and refresh periodically
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

  // Realtime updates via SSE
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
        if (typeof data.unread === 'number') setUnreadCount(data.unread)
      } catch {}
    }
    es.onerror = () => {
      try { es.close() } catch {}
    }
    return () => { try { es.close() } catch {} }
  }, [session?.user?.id])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', onClickOutside)
    }
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [notifOpen])

  // Close user dropdown on outside click
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', onClickOutside)
    }
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [userMenuOpen])

  // Close profile dropdown on outside click
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (profileNavRef.current && !profileNavRef.current.contains(e.target as Node)) {
        setProfileNavOpen(false)
      }
    }
    if (profileNavOpen) {
      document.addEventListener('mousedown', onClickOutside)
    }
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [profileNavOpen])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)
    if (diffInHours < 24) {
      return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
  }

  const renderIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="h-4 w-4" />
      case 'follow':
        return <UserPlus className="h-4 w-4" />
      case 'like':
        return <Heart className="h-4 w-4" />
      case 'comment':
        return <MessageSquare className="h-4 w-4" />
      case 'feed':
      case 'post':
        return <Rss className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  return (
    <header className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-12">
            <h1 className="text-2xl font-thin tracking-wider text-gray-800">
              <Link href="/" className="hover:text-pink-500 transition-colors">THEGND</Link>
            </h1>
            
            {/* Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link 
                href="/dashboard?tab=dashboard"
                className={`relative group text-sm font-light tracking-widest uppercase transition-colors ${
                  activeTab === 'dashboard' ? 'text-pink-500' : 'text-gray-600 hover:text-pink-500'
                }`}
              >
                DASHBOARD
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-pink-500 transition-all duration-300 ${activeTab === 'dashboard' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </Link>
              {/* PROFILE DROPDOWN (desktop) */}
              <div className="relative" ref={profileNavRef}>
                <button
                  type="button"
                  onClick={() => setProfileNavOpen(o => !o)}
                  aria-haspopup="true"
                  aria-expanded={profileNavOpen}
                  className={`relative group text-sm font-light tracking-widest uppercase transition-colors ${
                    ['profile','feed','network','comments','stories','dates'].includes(activeTab) ? 'text-pink-500' : 'text-gray-600 hover:text-pink-500'
                  }`}
                >
                  PROFIL
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-pink-500 transition-all duration-300 ${['profile','feed','network','comments','stories','dates'].includes(activeTab) ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </button>
                {profileNavOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 shadow-lg z-50">
                    <div className="py-2">
                      <Link href="/dashboard?tab=profile" onClick={() => setProfileNavOpen(false)} className="block px-4 py-2 text-sm font-light tracking-widest text-gray-700 hover:bg-pink-50 hover:text-pink-600">PROFIL</Link>
                      {(userType === 'ESCORT' || userType === 'HOBBYHURE') && (
                        <Link href="/dashboard?tab=dates" onClick={() => setProfileNavOpen(false)} className="block px-4 py-2 text-sm font-light tracking-widest text-gray-700 hover:bg-pink-50 hover:text-pink-600">DATE ANFRAGEN</Link>
                      )}
                      <Link href="/dashboard?tab=feed" onClick={() => setProfileNavOpen(false)} className="block px-4 py-2 text-sm font-light tracking-widest text-gray-700 hover:bg-pink-50 hover:text-pink-600">FEED</Link>
                      
                      <Link href="/dashboard?tab=network" onClick={() => setProfileNavOpen(false)} className="block px-4 py-2 text-sm font-light tracking-widest text-gray-700 hover:bg-pink-50 hover:text-pink-600">NETZWERK</Link>
                      {userType === 'MEMBER' && (
                        <Link href="/dashboard?tab=favorites" onClick={() => setProfileNavOpen(false)} className="block px-4 py-2 text-sm font-light tracking-widest text-gray-700 hover:bg-pink-50 hover:text-pink-600">FAVORITEN</Link>
                      )}
                      <Link href="/dashboard?tab=comments" onClick={() => setProfileNavOpen(false)} className="block px-4 py-2 text-sm font-light tracking-widest text-gray-700 hover:bg-pink-50 hover:text-pink-600">KOMMENTARE</Link>
                      {canStories && (
                        <Link href="/dashboard?tab=stories" onClick={() => setProfileNavOpen(false)} className="block px-4 py-2 text-sm font-light tracking-widest text-gray-700 hover:bg-pink-50 hover:text-pink-600">STORIES</Link>
                      )}
                      {(userType === 'ESCORT' || userType === 'HOBBYHURE') && countryBlockEnabled && (
                        <Link href="/addons/laendersperre" onClick={() => setProfileNavOpen(false)} className="block px-4 py-2 text-sm font-light tracking-widest text-gray-700 hover:bg-pink-50 hover:text-pink-600">LÄNDERSPERRE</Link>
                      )}
                      {['ESCORT','HOBBYHURE','AGENCY','CLUB','STUDIO'].includes(userType as any) && seoEnabled && seoAvailable && (
                        <Link href="/addons/seo" onClick={() => setProfileNavOpen(false)} className="block px-4 py-2 text-sm font-light tracking-widest text-gray-700 hover:bg-pink-50 hover:text-pink-600">SEO</Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {(userType === 'MEMBER' || userType === 'ESCORT' || userType === 'HOBBYHURE') && (
                <Link 
                  href="/dashboard?tab=matching"
                  className={`relative group inline-flex items-center gap-2 text-sm font-light tracking-widest uppercase transition-colors ${
                    activeTab === 'matching' ? 'text-pink-500' : 'text-gray-600 hover:text-pink-500'
                  }`}
                >
                  MATCHING
                  {/* Badge for counts */}
                  {(() => {
                    const c = (userType === 'ESCORT' || userType === 'HOBBYHURE') ? matchingCounts.likes : (userType === 'MEMBER' ? matchingCounts.mutual : 0)
                    if (!c) return null
                    return (
                      <span className="h-5 w-5 inline-flex items-center justify-center rounded-full bg-pink-500 text-white text-[10px] leading-none">
                        {c > 99 ? '99+' : c}
                      </span>
                    )
                  })()}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-pink-500 transition-all duration-300 ${activeTab === 'matching' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
              )}
              <Link 
                href="/dashboard?tab=forum"
                className={`relative group text-sm font-light tracking-widest uppercase transition-colors ${
                  activeTab === 'forum' ? 'text-pink-500' : 'text-gray-600 hover:text-pink-500'
                }`}
              >
                FORUM
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-pink-500 transition-all duration-300 ${activeTab === 'forum' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </Link>
              {(userType !== 'MEMBER' || hasMembership) && (
                <Link 
                  href="/dashboard?tab=blog"
                  className={`relative group text-sm font-light tracking-widest uppercase transition-colors ${
                    activeTab === 'blog' ? 'text-pink-500' : 'text-gray-600 hover:text-pink-500'
                  }`}
                >
                  BLOG
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-pink-500 transition-all duration-300 ${activeTab === 'blog' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
              )}
              {(userType === 'AGENCY' || userType === 'CLUB' || userType === 'STUDIO') && (
                <Link 
                  href="/dashboard?tab=jobs"
                  className={`relative group text-sm font-light tracking-widest uppercase transition-colors ${
                    activeTab === 'jobs' ? 'text-pink-500' : 'text-gray-600 hover:text-pink-500'
                  }`}
                >
                  JOBS
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-pink-500 transition-all duration-300 ${activeTab === 'jobs' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
              )}
              {(userType === 'AGENCY' || userType === 'CLUB' || userType === 'STUDIO') && (
                <Link 
                  href="/dashboard?tab=girls"
                  className={`relative group text-sm font-light tracking-widest uppercase transition-colors ${
                    activeTab === 'girls' ? 'text-pink-500' : 'text-gray-600 hover:text-pink-500'
                  }`}
                >
                  GIRLS
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-pink-500 transition-all duration-300 ${activeTab === 'girls' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
              )}
              {(userType === 'AGENCY' || userType === 'CLUB' || userType === 'STUDIO') && (
                <Link 
                  href="/dashboard?tab=rentals"
                  className={`relative group text-sm font-light tracking-widest uppercase transition-colors ${
                    activeTab === 'rentals' ? 'text-pink-500' : 'text-gray-600 hover:text-pink-500'
                  }`}
                >
                  MIETEN
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-pink-500 transition-all duration-300 ${activeTab === 'rentals' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
              )}
              <Link 
                href="/dashboard?tab=messages"
                className={`relative group text-sm font-light tracking-widest uppercase transition-colors ${
                  activeTab === 'messages' ? 'text-pink-500' : 'text-gray-600 hover:text-pink-500'
                }`}
              >
                NACHRICHTEN
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-pink-500 transition-all duration-300 ${activeTab === 'messages' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setNotifOpen(o => !o)}
                className="relative p-2 text-gray-600 hover:text-pink-500 transition-colors"
                aria-haspopup="true"
                aria-expanded={notifOpen}
              >
                <Bell className="h-5 w-5" />
                {(unreadCount > 0 || notifications.some(n => !n.isRead)) && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-pink-500 rounded-full"></span>
                )}
              </button>
              {notifOpen && (
                <div className="fixed left-1/2 -translate-x-1/2 top-20 md:absolute md:top-auto md:left-auto md:right-0 md:mt-2 md:translate-x-0 w-80 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 shadow-lg z-50">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="text-sm font-thin tracking-wider text-gray-800">BENACHRICHTIGUNGEN</div>
                    <button
                      onClick={() => setNotifUnreadOnly(v => !v)}
                      className={`text-[10px] font-medium tracking-widest uppercase px-2 py-1 border ${notifUnreadOnly ? 'bg-pink-500 text-white border-pink-500' : 'border-gray-300 text-gray-700'}`}
                    >
                      UNGELESENE
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifLoading && notifications.length === 0 ? (
                      <div className="p-4 text-sm font-light tracking-wide text-gray-500">Wird geladen...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm font-light tracking-wide text-gray-500">Keine Benachrichtigungen</div>
                    ) : (
                      notifications.map(n => {
                        const m = n.message?.match(/\[uid:([a-zA-Z0-9_-]+)\]/)
                        const uid = m?.[1]
                        const t = uid ? notifThumbs[uid] : undefined
                        const thumb = t?.avatar || t?.galleryFirst || null
                        return (
                        <div key={n.id} className={`flex items-start gap-3 p-3 border-b border-gray-50 ${n.isRead ? '' : 'bg-pink-50/40'}`} onClickCapture={() => { if (!n.isRead) markNotificationRead(n.id) }}>
                          <div className="mt-0.5 text-gray-500">
                            {thumb ? (
                              <div className="relative h-6 w-6 overflow-hidden bg-gray-100 border border-gray-200">
                                <Image src={thumb} alt={t?.displayName || 'User'} fill className="object-cover" />
                              </div>
                            ) : (
                              renderIcon(n.type)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-light tracking-wide text-gray-800 truncate">{n.title}</div>
                              <div className="text-xs font-light tracking-wide text-gray-400 ml-2 shrink-0">{formatTime(n.createdAt)}</div>
                            </div>
                            <div className="text-xs font-light tracking-wide text-gray-600 truncate">{linkify(n.message)}</div>
                            <div className="mt-1 text-right">
                              {!n.isRead && (
                                <button onClick={() => markNotificationRead(n.id)} className="text-[10px] font-medium tracking-widest text-pink-600 hover:underline uppercase">
                                  Als gelesen
                                </button>
                              )}
                            </div>
                          </div>
                          {!n.isRead && <span className="h-2 w-2 bg-pink-500 rounded-full mt-2"></span>}
                        </div>
                      )})
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      {notifHasMore && (
                        <button
                          onClick={() => loadNotifications(false)}
                          disabled={notifLoading}
                          className="text-xs font-light tracking-widest text-gray-600 hover:text-pink-500 transition-colors uppercase"
                        >
                          MEHR LADEN
                        </button>
                      )}
                    </div>
                    {notifications.some(n => !n.isRead) && (
                      <button onClick={markAllNotificationsRead} className="mr-3 text-xs font-light tracking-widest text-gray-600 hover:text-pink-500 transition-colors uppercase">
                        ALLE ALS GELESEN
                      </button>
                    )}
                    <Link
                      href="/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-light tracking-widest text-gray-600 hover:text-pink-500 transition-colors uppercase inline-block ml-auto"
                    >
                      ALLE ANZEIGEN
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative" ref={userMenuRef}>
              <button 
                type="button"
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center space-x-3 hover:opacity-90 transition-opacity"
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
              >
                <Avatar className="size-8 bg-gray-200">
                  <AvatarImage src={getAvatarUrl(avatarUrl, userType)} alt="avatar" />
                  <AvatarFallback className="text-xs font-light tracking-widest text-gray-600">
                    {session?.user?.email?.charAt(0)?.toUpperCase() ?? '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-light text-gray-800">{session?.user?.email ?? 'Gast'}</div>
                  <div className="text-xs font-light text-gray-500 tracking-wide uppercase">
                    {getUserTypeDisplayName(userType)}
                  </div>
                </div>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 shadow-lg z-50">
                  <div className="py-2">
                    <Link href="/notifications" className="block px-4 py-2 text-sm font-light tracking-widest text-gray-700 hover:bg-pink-50 hover:text-pink-600">
                      BENACHRICHTIGUNGEN
                    </Link>
                    {userType !== 'MEMBER' && (
                      <Link href="/verify" className="block px-4 py-2 text-sm font-light tracking-widest text-gray-700 hover:bg-pink-50 hover:text-pink-600">
                        VERIFIZIEREN
                      </Link>
                    )}
                    <Link href="/membership" className="block px-4 py-2 text-sm font-light tracking-widest text-gray-700 hover:bg-pink-50 hover:text-pink-600">
                      MITGLIEDSCHAFT
                    </Link>
                    {userType !== 'MEMBER' && (
                      <Link href="/marketing" className="block px-4 py-2 text-sm font-light tracking-widest text-gray-700 hover:bg-pink-50 hover:text-pink-600">
                        MARKETING
                      </Link>
                    )}
                    <Link href="/addons" className="block px-4 py-2 text-sm font-light tracking-widest text-gray-700 hover:bg-pink-50 hover:text-pink-600">
                      ADD-ONS
                    </Link>
                    <Link href="/dashboard?tab=gamification" className="block px-4 py-2 text-sm font-light tracking-widest text-gray-700 hover:bg-pink-50 hover:text-pink-600">
                      GAMIFIKATION
                    </Link>
                    <Link href="/settings" className="block px-4 py-2 text-sm font-light tracking-widest text-gray-700 hover:bg-pink-50 hover:text-pink-600">
                      EINSTELLUNGEN
                    </Link>
                    {isAdmin && (
                      <Link href="/acp" className="block px-4 py-2 text-sm font-light tracking-widest text-gray-700 hover:bg-pink-50 hover:text-pink-600">
                        ADMIN
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={handleSignOut}
              className="relative group text-sm font-light tracking-widest text-gray-600 hover:text-pink-500 transition-colors uppercase"
            >
              ABMELDEN
              <span className="absolute -bottom-1 left-0 h-0.5 bg-pink-500 transition-all duration-300 w-0 group-hover:w-full"></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Bell, Menu, Home, Users2, Building2, BookOpen, Rss, MessageSquare, Briefcase, LayoutDashboard, Search as SearchIcon, Tag, Info as InfoIcon, Settings as SettingsIcon, LogIn as LogInIcon, LogOut as LogOutIcon } from 'lucide-react'
 
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSession, signOut } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTranslation } from 'react-i18next'
import { usePathname, useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { usePublicSettingsCtx } from '@/components/providers/public-settings-provider'
import { useDateFormatter } from '@/hooks/useDateFormatter'

const LOCALES = ["de","en","fr","it","es","pt","nl","pl","cs","hu","ro"] as const
const FLAGS: Record<string, string> = { de:"🇩🇪", en:"🇬🇧", fr:"🇫🇷", it:"🇮🇹", es:"🇪🇸", pt:"🇵🇹", nl:"🇳🇱", pl:"🇵🇱", cs:"🇨🇿", hu:"🇭🇺", ro:"🇷🇴" }

function LocaleSwitcher() {
  const { i18n } = useTranslation('common')
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const current = (i18n.language || 'de').toLowerCase()

  // Close on outside click or Escape
  useEffect(() => {
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!open) return
      const target = e.target as Node
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown, { passive: true })
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const onSelect = (code: string) => {
    const locale = code
    const localePattern = /^(?:\/(de|en|fr|it|es|pt|nl|pl|cs|hu|ro))(?:\/|$)/
    const basePath = pathname.replace(localePattern, '/').replace(/\/$/, '') || '/'
    const nextPath = `/${locale}${basePath === '/' ? '' : basePath}`
    i18n.changeLanguage(locale)
    router.push(nextPath)
    setOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-none border border-pink-500/60 bg-black/40 px-3 py-1 text-xs font-medium tracking-widest text-white hover:bg-black/50 focus:outline-none focus:ring-2 focus:ring-pink-500/60"
      >
        <span>{current.toUpperCase()}</span>
        <span className="text-base leading-none">{FLAGS[current] ?? '🌐'}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-none bg-neutral-900 text-neutral-100 shadow-2xl ring-1 ring-neutral-700/60 p-1">
          {LOCALES.map((code) => (
            <button
              key={code}
              onClick={() => onSelect(code)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-none hover:bg-neutral-800 text-xs tracking-widest"
            >
              <span className="font-semibold">{code.toUpperCase()}</span>
              <span className="text-base">{FLAGS[code]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function MinimalistNavigation({ darkBg = false }: { darkBg?: boolean } = {}) {
  const { data: session, status } = useSession()
  const { t } = useTranslation('common')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const site = usePublicSettingsCtx()
  const df = useDateFormatter()
  const [discoverOpen, setDiscoverOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; isRead: boolean; createdAt: string }>>([])
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const infoCloseTimer = useRef<number | null>(null)
  const pathname = usePathname()
  const isAuthed = status === 'authenticated'

  // Active path helper (strip locale prefix)
  const stripLocale = (p: string) => (p || '/').replace(/^(?:\/(de|en|fr|it|es|pt|nl|pl|cs|hu|ro))(?:\/+|$)/, '/') || '/'
  const pathNoLocale = stripLocale(pathname || '/')
  const isActive = (href: string) => {
    if (href === '/') return pathNoLocale === '/'
    return pathNoLocale.startsWith(href)
  }

  

  useEffect(() => {
    const load = async () => {
      try {
        if (!session?.user?.id) return
        const res = await fetch('/api/profile')
        if (!res.ok) return
        const data = await res.json()
        setAvatarUrl(data?.user?.profile?.avatar ?? null)
      } catch {}
    }
    load()
    setMounted(true)
  }, [session?.user?.id])

  // Navigation-Banner entfernt

  // Cleanup any pending timers on unmount
  useEffect(() => {
    return () => {
      if (infoCloseTimer.current) {
        clearTimeout(infoCloseTimer.current)
        infoCloseTimer.current = null
      }
    }
  }, [])

  // Notifications: load on open and close on outside click
  const loadNotifications = async () => {
    try {
      setNotifLoading(true)
      const res = await fetch('/api/notifications?limit=20', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setNotifications(Array.isArray(data) ? data : [])
      }
    } catch {}
    finally {
      setNotifLoading(false)
    }
  }

  useEffect(() => {
    if (notifOpen) loadNotifications()
  }, [notifOpen])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [notifOpen])

  return (
    <nav className={`absolute top-0 w-full z-50 ${darkBg ? 'bg-neutral-900' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button (left of THEGND) */}
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <button
                type="button"
                aria-label="Menü öffnen"
                onClick={() => setMobileNavOpen(true)}
                className="md:hidden inline-flex items-center justify-center size-9 rounded-none bg-white/10 ring-1 ring-white/25 text-white hover:bg-white/20"
              >
                <Menu className="h-5 w-5" />
              </button>
              <SheetContent side="left" className="md:hidden bg-neutral-900/95 text-white border-none ring-1 ring-white/10 backdrop-blur-md w-[84vw] sm:w-[360px] max-w-[360px]">
                <SheetHeader className="p-4">
                  <SheetTitle className="text-white font-light tracking-wider uppercase">THEGND MENÜ</SheetTitle>
                  <div className="mt-2 h-[2px] w-full rounded-full bg-gradient-to-r from-pink-600/0 via-pink-500/80 to-pink-600/0" aria-hidden="true" />
                </SheetHeader>
                <div className="px-2 py-3 space-y-1 text-sm">
                  {/* Auth section */}
                  {!isAuthed ? (
                    <div className="mb-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href="/auth/signin"
                          onClick={() => setMobileNavOpen(false)}
                          className="flex flex-col items-center justify-center gap-1 rounded-none py-3 bg-white/10 hover:bg-white/15 text-white text-[10px] tracking-widest uppercase"
                        >
                          <LogInIcon className="h-5 w-5" />
                          <span>Anmelden</span>
                        </Link>
                        <Link
                          href="/auth/signup"
                          onClick={() => setMobileNavOpen(false)}
                          className="flex flex-col items-center justify-center gap-1 rounded-none py-3 bg-pink-600 hover:bg-pink-500 text-white text-[10px] tracking-widest uppercase"
                        >
                          <LogInIcon className="h-5 w-5 rotate-180" />
                          <span>Registrieren</span>
                        </Link>
                      </div>
                      <div
                        className="my-3 h-[2px] w-full rounded-full bg-gradient-to-r from-pink-600/0 via-pink-500/80 to-pink-600/0"
                        aria-hidden="true"
                      />
                    </div>
                  ) : (
                    <div className="mb-2">
                      <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-white/60">MEIN BEREICH</div>
                      <div className="grid grid-cols-3 gap-2 px-2">
                        <Link
                          href="/dashboard"
                          onClick={() => setMobileNavOpen(false)}
                          className={`flex flex-col items-center justify-center gap-1 py-3 rounded-none ring-1 tracking-widest uppercase text-[10px] ${isActive('/dashboard') ? 'bg-white/15 text-white ring-white/30' : 'bg-white/10 text-white/90 ring-white/20 hover:bg-white/15 hover:ring-white/30'}`}
                        >
                          <LayoutDashboard className="h-5 w-5" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setMobileNavOpen(false)}
                          className={`flex flex-col items-center justify-center gap-1 py-3 rounded-none ring-1 tracking-widest uppercase text-[10px] ${isActive('/settings') ? 'bg-white/15 text-white ring-white/30' : 'bg-white/10 text-white/90 ring-white/20 hover:bg-white/15 hover:ring-white/30'}`}
                        >
                          <SettingsIcon className="h-5 w-5" />
                          <span>Einstellungen</span>
                        </Link>
                        <button
                          onClick={() => {
                            setMobileNavOpen(false)
                            setTimeout(() => {
                              const origin = typeof window !== 'undefined' ? window.location.origin : '/'
                              signOut({ callbackUrl: `${origin}/` })
                            }, 150)
                          }}
                          className="flex flex-col items-center justify-center gap-1 py-3 rounded-none bg-white/10 text-white/90 hover:bg-red-600 ring-1 ring-white/20 hover:ring-red-500 tracking-widest uppercase text-[10px]"
                        >
                          <LogOutIcon className="h-5 w-5" />
                          <span>Abmelden</span>
                        </button>
                      </div>
                      <div className="my-2 h-px bg-white/10" />
                    </div>
                  )}

                  {/* Main navigation items with icons */}
                  <div className="grid grid-cols-3 gap-2 px-2">
                    {[
                      { href: '/', label: 'Startseite', Icon: Home },
                      { href: '/escorts', label: 'Escorts', Icon: Users2 },
                      { href: '/agency', label: 'Agenturen', Icon: Building2 },
                      { href: '/club-studio', label: 'Clubs & Studios', Icon: Building2 },
                      { href: '/stories', label: 'Stories', Icon: BookOpen },
                      { href: '/feed', label: 'Feed', Icon: Rss },
                      { href: '/forum', label: 'Forum', Icon: MessageSquare },
                      { href: '/jobs', label: 'Jobs', Icon: Briefcase },
                      { href: '/mieten', label: 'Mieten', Icon: Building2 },
                      { href: '/blog', label: 'Blog', Icon: BookOpen },
                      { href: '/search', label: 'Suche', Icon: SearchIcon },
                      { href: '/preise', label: 'Preise', Icon: Tag },
                      { href: '/info', label: 'Info', Icon: InfoIcon },
                    ].map(({ href, label, Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileNavOpen(false)}
                        className={`flex flex-col items-center justify-center gap-1 py-3 rounded-none tracking-widest uppercase text-[10px] ${isActive(href) ? 'bg-white/15 text-white' : 'bg-white/10 text-white/90 hover:bg-white/15'}`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-center">{label}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="pt-[env(safe-area-inset-bottom)]" />
                </div>
              </SheetContent>
            </Sheet>
            <div className="text-2xl font-light tracking-widest text-white">
              <Link href="/">
                {site?.logo?.kind === 'image' && site.logo.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={site.logo.imageUrl} alt={site.name || 'Logo'} className="h-7 w-auto" />
                ) : (
                  <span>{site?.logo?.text || site?.name || 'THEGND'}</span>
                )}
              </Link>
            </div>
          </div>
          
          {/* Centered Navigation */}
          <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center gap-10 text-sm font-light tracking-widest text-white">
            {/* ENTDECKEN with Mega Menu */}
            <div
              className="relative"
              onMouseEnter={() => setDiscoverOpen(true)}
            >
              <button className="relative group transition-colors select-none">
                {t('nav.discover', { defaultValue: 'ENTDECKEN' })}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pink-500 transition-all duration-300 group-hover:w-full"></span>
              </button>

              {mounted && discoverOpen && (
                createPortal(
                  <div
                    className="fixed inset-x-0 top-20 z-[60] text-gray-800"
                    onMouseEnter={() => setDiscoverOpen(true)}
                    onMouseLeave={() => setDiscoverOpen(false)}
                  >
                    <div className="w-full bg-white border-y border-gray-200 rounded-none shadow-[0_6px_40px_rgba(0,0,0,0.12)]">
                      <div className="mx-auto max-w-7xl px-6 md:px-10">
                        <div className="grid grid-cols-12 gap-6 py-6">
                      {/* Left column: primary categories as 9:16 cards (smaller, 2-up) */}
                      <div className="col-span-12 md:col-span-4">
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">{t('sections.categories', { defaultValue: 'KATEGORIEN' })}</div>
                        <div className="grid grid-cols-2 gap-3">
                          <Link href="/escorts" className="group block border border-gray-200 hover:border-pink-500 rounded-none overflow-hidden">
                            <div style={{ aspectRatio: '9 / 16' }} className="relative">
                              <img src="/Escorts.jpg" alt="Escorts" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent transition-colors group-hover:from-black/70"></div>
                              <div className="absolute inset-0 flex items-end p-3">
                                <span className="text-xs tracking-widest text-white">{t('categories.escorts', { defaultValue: 'ESCORTS' })}</span>
                              </div>
                            </div>
                          </Link>
                          <Link href="/hobbyhuren" className="group block border border-gray-200 hover:border-pink-500 rounded-none overflow-hidden">
                            <div style={{ aspectRatio: '9 / 16' }} className="relative">
                              <img src="/Hobbyhuren.jpg" alt="Hobbyhuren" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent transition-colors group-hover:from-black/70"></div>
                              <div className="absolute inset-0 flex items-end p-3">
                                <span className="text-xs tracking-widest text-white">HOBBYHUREN</span>
                              </div>
                            </div>
                          </Link>
                          <Link href="/agency" className="group block border border-gray-200 hover:border-pink-500 rounded-none overflow-hidden">
                            <div style={{ aspectRatio: '9 / 16' }} className="relative">
                              <img src="/Agenturen.jpg" alt="Agenturen" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent transition-colors group-hover:from-black/70"></div>
                              <div className="absolute inset-0 flex items-end p-3">
                                <span className="text-xs tracking-widest text-white">{t('categories.agencies', { defaultValue: 'AGENTUREN' })}</span>
                              </div>
                            </div>
                          </Link>
                          <Link href="/club-studio" className="group block border border-gray-200 hover:border-pink-500 rounded-none overflow-hidden">
                            <div style={{ aspectRatio: '9 / 16' }} className="relative">
                              <img src="/Clubs-Studios.jpg" alt="Clubs & Studios" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent transition-colors group-hover:from-black/70"></div>
                              <div className="absolute inset-0 flex items-end p-3">
                                <span className="text-xs tracking-widest text-white">{t('categories.clubsStudios', { defaultValue: 'CLUBS & STUDIOS' })}</span>
                              </div>
                            </div>
                          </Link>
                        </div>
                      </div>

                      {/* Middle column: secondary links as 9:16 cards (smaller) */}
                      <div className="col-span-12 md:col-span-4">
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">{t('sections.content', { defaultValue: 'INHALTE' })}</div>
                        <div className="grid grid-cols-2 gap-3">
                          <Link href="/stories" className="group block border border-gray-200 hover:border-pink-500 rounded-none overflow-hidden">
                            <div style={{ aspectRatio: '9 / 16' }} className="relative">
                              <img src="/Stories_.jpg" alt="Stories" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent transition-colors group-hover:from-black/70"></div>
                              <div className="absolute inset-0 flex items-end p-3">
                                <span className="text-xs tracking-widest text-white">{t('content.stories', { defaultValue: 'STORIES' })}</span>
                              </div>
                            </div>
                          </Link>
                          <Link href="/feed" className="group block border border-gray-200 hover:border-pink-500 rounded-none overflow-hidden">
                            <div style={{ aspectRatio: '9 / 16' }} className="relative">
                              <img src="/Feeds.jpg" alt="Feeds" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent transition-colors group-hover:from-black/70"></div>
                              <div className="absolute inset-0 flex items-end p-3">
                                <span className="text-xs tracking-widest text-white">{t('content.feeds', { defaultValue: 'FEEDS' })}</span>
                              </div>
                            </div>
                          </Link>
                          <Link href="/jobs" className="group block border border-gray-200 hover:border-pink-500 rounded-none overflow-hidden">
                            <div style={{ aspectRatio: '9 / 16' }} className="relative">
                              <img src="/Jobs-Nav.jpg" alt="Jobs" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent transition-colors group-hover:from-black/70"></div>
                              <div className="absolute inset-0 flex items-end p-3">
                                <span className="text-xs tracking-widest text-white">{t('content.jobs', { defaultValue: 'JOBS' })}</span>
                              </div>
                            </div>
                          </Link>
                          <Link href="/mieten" className="group block border border-gray-200 hover:border-pink-500 rounded-none overflow-hidden">
                            <div style={{ aspectRatio: '9 / 16' }} className="relative">
                              <img src="/Mieten.jpg" alt="Mieten" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent transition-colors group-hover:from-black/70"></div>
                              <div className="absolute inset-0 flex items-end p-3">
                                <span className="text-xs tracking-widest text-white">{t('content.rent', { defaultValue: 'MIETEN' })}</span>
                              </div>
                            </div>
                          </Link>
                        </div>
                      </div>

                      {/* Right column: stacked vertical cards */}
                      <div className="col-span-12 md:col-span-4">
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">COMMUNITY</div>
                        <div className="flex h-full flex-col gap-3">
                          <Link href="/blog" className="group block border border-gray-200 hover:border-pink-500 rounded-none overflow-hidden">
                            <div style={{ aspectRatio: '9 / 7.7' }} className="relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src="/Blog-Nav.jpg" alt="Blog" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent transition-colors group-hover:from-black/70" />
                              <div className="absolute inset-0 p-3 flex items-end">
                                <div className="text-left">
                                  <div className="text-[10px] uppercase tracking-widest text-white">{t('labels.blog', { defaultValue: 'BLOG' })}</div>
                                  <div className="mt-1 text-white text-sm">Neueste News & Stories</div>
                                  <span className="mt-3 inline-block text-xs uppercase tracking-widest underline underline-offset-4 text-white">JETZT ANSEHEN</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                          <Link href="/forum" className="group block border border-gray-200 hover:border-pink-500 rounded-none overflow-hidden">
                            <div style={{ aspectRatio: '9 / 7.7' }} className="relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src="/Forum-Nav.jpg" alt="Forum" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent transition-colors group-hover:from-black/70" />
                              <div className="absolute inset-0 p-3 flex items-end">
                                <div className="text-left">
                                  <div className="text-[10px] uppercase tracking-widest text-white">{t('labels.forum', { defaultValue: 'FORUM' })}</div>
                                  <div className="mt-1 text-white text-sm">Community & Diskussionen</div>
                                  <span className="mt-3 inline-block text-xs uppercase tracking-widest underline underline-offset-4 text-white">MEHR LESEN</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Bottom promo banner removed per request */}
                  </div>
                </div>
              </div>,
                document.body
              )
            )}
          </div>

            {/* Remaining simple nav items */}
            <Link href="/search" className="relative group transition-colors">
              {t('nav.search', { defaultValue: 'SUCHE' })}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pink-500 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            {/* INFO dropdown */}
            <div
              className="relative"
              onMouseEnter={() => {
                if (infoCloseTimer.current) {
                  clearTimeout(infoCloseTimer.current)
                  infoCloseTimer.current = null
                }
                setInfoOpen(true)
              }}
              onMouseLeave={() => {
                if (infoCloseTimer.current) clearTimeout(infoCloseTimer.current)
                infoCloseTimer.current = window.setTimeout(() => setInfoOpen(false), 150)
              }}
            >
              <button className="relative group transition-colors select-none" aria-haspopup="true" aria-expanded={infoOpen}>
                {t('nav.info', { defaultValue: 'INFO' })}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pink-500 transition-all duration-300 group-hover:w-full"></span>
              </button>
              {infoOpen && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-56 bg-white text-gray-800 border border-gray-200 shadow-2xl z-[70]"
                  onMouseEnter={() => {
                    if (infoCloseTimer.current) {
                      clearTimeout(infoCloseTimer.current)
                      infoCloseTimer.current = null
                    }
                    setInfoOpen(true)
                  }}
                  onMouseLeave={() => {
                    if (infoCloseTimer.current) clearTimeout(infoCloseTimer.current)
                    infoCloseTimer.current = window.setTimeout(() => setInfoOpen(false), 150)
                  }}
                >
                  <div className="py-1">
                    <Link href="/feedback" className="block px-4 py-2 text-sm tracking-widest hover:bg-pink-50" onClick={() => setInfoOpen(false)}>
                      FEEDBACK
                    </Link>
                    
                    <Link href="/preise" className="block px-4 py-2 text-sm tracking-widest hover:bg-pink-50" onClick={() => setInfoOpen(false)}>
                      {t('nav.pricing', { defaultValue: 'PREISE' })}
                    </Link>
                    <Link href="/info" className="block px-4 py-2 text-sm tracking-widest hover:bg-pink-50" onClick={() => setInfoOpen(false)}>
                      {t('nav.info', { defaultValue: 'INFO' })}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {session?.user ? (
              <Link href="/dashboard" className="hidden md:flex items-center">
                <Avatar className="size-8 bg-white/10 ring-1 ring-white/30">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt="avatar" />
                  ) : (
                    <AvatarFallback className="text-xs font-light tracking-widest text-white bg-white/10">
                      {session.user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Link>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link href="/auth/signin">
                  <Button variant="ghost" className="text-sm font-light tracking-widest text-white hover:text-pink-500">
                    {t('nav.signin', { defaultValue: 'ANMELDEN' })}
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-pink-500 hover:bg-pink-600 text-white text-sm font-light tracking-widest px-6">
                    {t('nav.signup', { defaultValue: 'REGISTRIEREN' })}
                  </Button>
                </Link>
              </div>
            )}
            {/* Notifications */}
            {session?.user && (
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setNotifOpen(o => !o)}
                  className="relative p-2 text-white hover:text-pink-300 transition-colors"
                  aria-haspopup="true"
                  aria-expanded={notifOpen}
                >
                  <Bell className="h-5 w-5" />
                  {notifications.some(n => !n.isRead) && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-pink-500 rounded-full"></span>
                  )}
                </button>
                {notifOpen && (
                  <div className="fixed left-1/2 -translate-x-1/2 top-20 md:absolute md:top-auto md:left-auto md:right-0 md:mt-2 md:translate-x-0 w-80 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 shadow-lg z-50">
                    <div className="p-4 border-b border-gray-100">
                      <div className="text-sm font-thin tracking-wider text-gray-800">BENACHRICHTIGUNGEN</div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifLoading ? (
                        <div className="p-4 text-sm font-light tracking-wide text-gray-500">Wird geladen...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm font-light tracking-wide text-gray-500">Keine Benachrichtigungen</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className={`flex items-start gap-3 p-3 border-b border-gray-50 ${n.isRead ? '' : 'bg-pink-50/40'}`}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-light tracking-wide text-gray-800 truncate">{n.title}</div>
                                <div className="text-xs font-light tracking-wide text-gray-400 ml-2 shrink-0">{df.formatDateTime(n.createdAt)}</div>
                              </div>
                              <div className="text-xs font-light tracking-wide text-gray-600 truncate">{n.message}</div>
                            </div>
                            {!n.isRead && <span className="h-2 w-2 bg-pink-500 rounded-full mt-2"></span>}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-100 text-right">
                      <Link
                        href="/notifications"
                        onClick={() => setNotifOpen(false)}
                        className="text-xs font-light tracking-widest text-gray-600 hover:text-pink-500 transition-colors uppercase inline-block"
                      >
                        ALLE ANZEIGEN
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Language Switcher */}
            <div className="block">
              <LocaleSwitcher />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

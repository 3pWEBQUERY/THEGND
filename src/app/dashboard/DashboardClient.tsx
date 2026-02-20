'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getUserTypeDisplayName, canCreateStories } from '@/lib/validations'
import { UserType } from '@prisma/client'
import ProfileComponent from '@/components/ProfileComponent'
import NewsfeedComponent from '@/components/NewsfeedComponent'
import StoriesComponent from '@/components/StoriesComponent'
import SocialComponent from '@/components/SocialComponent'
import MessagingComponent from '@/components/MessagingComponent'
import CommentsComponent from '@/components/CommentsComponent'
import DashboardHeader from '@/components/DashboardHeader'
import DashboardMobileNavigation from '@/components/DashboardMobileNavigation'
import ForumDashboard from '@/components/ForumDashboard'
import CommunityDashboard from '@/components/community/CommunityDashboard'
import JobsDashboard from '@/components/jobs/JobsDashboard'
import RentalsDashboard from '@/components/rentals/RentalsDashboard'
import GirlsDashboard from '@/components/girls/GirlsDashboard'
import FeedTabs from '@/components/FeedTabs'
import GamificationComponent from '@/components/GamificationComponent'
import { useToast } from '@/components/ui/toast'
import ProfileAnalyticsWidget from '@/components/analytics/ProfileAnalyticsWidget'
import VerificationTicketModal from '@/components/dashboard/VerificationTicketModal'
import EscortLikesSection from '@/components/dashboard/EscortLikesSection'
import EscortMutualMatches from '@/components/dashboard/EscortMutualMatches'
import DashboardWelcome from '@/components/dashboard/DashboardWelcome'
import DashboardQuickActions from '@/components/dashboard/DashboardQuickActions'
import MatchingToolbar from '@/components/dashboard/MatchingToolbar'
import MemberMatchingSection from '@/components/dashboard/MemberMatchingSection'
import BusinessOnly from '@/components/dashboard/BusinessOnly'
import DashboardSettings from '@/components/dashboard/DashboardSettings'
import BlogDashboard from '@/components/blog/BlogDashboard'
import ConnectedEscortsSlider from '@/components/dashboard/ConnectedEscortsSlider'
import DatesPanel from '@/components/dates/DatesPanel'
import DatesCalendarWidget from '@/components/dates/DatesCalendarWidget'
import NewestEscortsSlider from '@/components/dashboard/NewestEscortsSlider'

/** Blog tab gated behind active membership for MEMBER users */
function BlogTabGated({ session }: { session: any }) {
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    const userType = (session?.user as any)?.userType
    if (userType !== 'MEMBER') {
      setAllowed(true)
      return
    }
    fetch('/api/membership/my')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setAllowed(data?.memberships?.some((m: any) => m.status === 'ACTIVE') ?? false)
      })
      .catch(() => setAllowed(false))
  }, [session])

  if (allowed === null) {
    return <div className="flex justify-center py-16 text-gray-400 text-sm tracking-widest">Lade…</div>
  }
  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-gray-500 text-sm tracking-widest uppercase">Blog ist nur mit aktiver Mitgliedschaft verfügbar.</p>
        <a href="/membership" className="text-pink-500 hover:text-pink-600 text-sm tracking-widest uppercase underline">Mitgliedschaft abschließen</a>
      </div>
    )
  }
  return <BlogDashboard />
}

export default function DashboardClient() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [matchLoading, setMatchLoading] = useState(false)
  const [matchError, setMatchError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showPrefs, setShowPrefs] = useState(false)
  const [showAuto, setShowAuto] = useState(false)
  const [mutual, setMutual] = useState<any[]>([])
  const [mutualLoading, setMutualLoading] = useState(false)
  const [likesReceived, setLikesReceived] = useState<any[]>([])
  const [likesLoading, setLikesLoading] = useState(false)
  const [likesFilter, setLikesFilter] = useState<'all' | 'new' | 'liked_back'>('all')
  const { show } = useToast()
  const [gridAnim, setGridAnim] = useState<Record<string, 'LEFT' | 'RIGHT'>>({})
  const [matchingView, setMatchingView] = useState<'grid' | 'reels'>('grid')
  const [reelsEffects, setReelsEffects] = useState(true)
  // Review ticket modal state (ESCORT quick action)
  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [issuedTicket, setIssuedTicket] = useState<{ code: string; expiresAt?: string | null } | null>(null)

  const gridSwipe = async (id: string, action: 'LIKE' | 'PASS') => {
    try {
      // start animation immediately
      setGridAnim(prev => ({ ...prev, [id]: action === 'LIKE' ? 'RIGHT' : 'LEFT' }))
      await fetch('/api/matching/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escortId: id, action })
      }).catch(() => null)
    } catch {}
    finally {
      // remove after short delay to allow CSS transition
      setTimeout(() => {
        setSuggestions(prev => prev.filter(s => s.id !== id))
        setGridAnim(prev => { const { [id]: _, ...rest } = prev; return rest })
      }, 260)
      show(action === 'LIKE' ? 'Geliked' : 'Abgelehnt', { variant: action === 'LIKE' ? 'success' : 'info' })
    }
  }

  const issueReviewTicket = async () => {
    try {
      const res = await fetch('/api/review-tickets/issue', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        show(data?.error || 'Fehler beim Erstellen', { variant: 'error' })
        return
      }
      const t = data?.ticket
      setIssuedTicket({ code: t?.code, expiresAt: t?.expiresAt ?? null })
      setTicketModalOpen(true)
    } catch {
      show('Serverfehler', { variant: 'error' })
    }
  }

  const undoGrid = async () => {
    try {
      const res = await fetch('/api/matching/swipe/undo', { method: 'POST' })
      await res.json().catch(() => null)
      // Refresh suggestions
      try {
        const r = await fetch('/api/matching/suggestions?limit=24', { cache: 'no-store' })
        const d = await r.json()
        if (r.ok) setSuggestions(Array.isArray(d?.suggestions) ? d.suggestions : [])
      } catch {}
      show('Letzte Aktion rückgängig gemacht', { variant: 'info' })
    } catch {}
  }

  const reloadSuggestions = async () => {
    try {
      const r = await fetch('/api/matching/suggestions?limit=24', { cache: 'no-store' })
      const d = await r.json()
      if (r.ok) {
        setSuggestions(Array.isArray(d?.suggestions) ? d.suggestions : [])
        show('Vorschläge aktualisiert', { variant: 'success' })
      }
    } catch {}
  }

  const [resetting, setResetting] = useState<null | 'soft' | 'hard'>(null)
  const [resetResult, setResetResult] = useState<null | { mode: 'soft' | 'hard'; count: number }>(null)

  const reloadMutual = async () => {
    try {
      const res = await fetch('/api/matching/mutual?limit=24', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) setMutual(Array.isArray(data?.matches) ? data.matches : [])
    } catch {}
  }

  const reloadLikesReceived = async () => {
    try {
      const res = await fetch('/api/matching/likes-received', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) setLikesReceived(Array.isArray(data?.likes) ? data.likes : [])
    } catch {}
  }

  const resetMatching = async (mode: 'soft' | 'hard') => {
    try {
      if (mode === 'hard') {
        if (!window.confirm('Möchtest du ALLE Likes/Pass-Entscheidungen zurücksetzen?')) return
      } else {
        if (!window.confirm('Möchtest du nur PASS-Entscheidungen zurücksetzen (Soft-Reset)?')) return
      }
      setResetting(mode)
      setResetResult(null)
      const res = await fetch('/api/matching/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        show(data?.error || 'Fehler beim Zurücksetzen', { variant: 'error' })
        setResetting(null)
        return
      }
      const scope = data?.scope || ''
      const cleared = typeof data?.cleared === 'number' ? data.cleared : undefined
      setResetResult({ mode: (data?.mode === 'soft' ? 'soft' : 'hard'), count: cleared ?? 0 })
      show(`Zurückgesetzt${typeof cleared === 'number' ? ` (${cleared})` : ''}${data?.mode === 'soft' ? ' • Soft-Reset' : ''}`, { variant: 'success' })

      if (session?.user?.userType === 'MEMBER') {
        await reloadSuggestions()
        await reloadMutual()
        // inform SwipeDeck on mobile
        try { window.dispatchEvent(new Event('matching:refresh')) } catch {}
      } else if (session?.user?.userType === 'ESCORT') {
        await reloadLikesReceived()
        await reloadMutual()
      }
      setResetting(null)
      // Hide result after a few seconds
      setTimeout(() => setResetResult(null), 6000)
    } catch (e) {
      show('Fehler beim Zurücksetzen', { variant: 'error' })
      setResetting(null)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session?.user?.onboardingStatus === 'NOT_STARTED') {
      router.push('/onboarding')
    }
  }, [session, status, router])

  // Initialize tab from URL (?tab=messages,profile,network,...)
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && typeof tab === 'string') {
      setActiveTab(tab)
    }
    const view = searchParams.get('view')
    setShowPrefs(view === 'prefs')
    setShowAuto(view === 'auto-message')
    const layout = searchParams.get('layout')
    if (layout === 'reels' || layout === 'grid') {
      setMatchingView(layout as 'grid' | 'reels')
    }
    try {
      const v = localStorage.getItem('reelsEffects')
      if (v !== null) setReelsEffects(v === '1')
    } catch {}
  }, [searchParams])

  // Load matching suggestions when matching tab is active
  useEffect(() => {
    const load = async () => {
      if (activeTab !== 'matching') return
      if (!session) return
      setMatchLoading(true)
      setMatchError(null)
      try {
        if (session.user.userType === 'MEMBER') {
          const res = await fetch('/api/matching/suggestions?limit=24', { cache: 'no-store' })
          const data = await res.json()
          if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
          setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : [])
        } else {
          setSuggestions([])
        }
      } catch (e: any) {
        setMatchError(e?.message || 'Fehler beim Laden')
      } finally {
        setMatchLoading(false)
      }
    }
    load()
  }, [activeTab, session])

  // Keyboard shortcuts for desktop grid (Left=Pass, Right=Like)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (activeTab !== 'matching') return
      if (showPrefs) return
      if (!suggestions || suggestions.length === 0) return
      if (session?.user?.userType !== 'MEMBER') return
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        const id = suggestions[0]?.id
        if (id) gridSwipe(id, 'LIKE')
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const id = suggestions[0]?.id
        if (id) gridSwipe(id, 'PASS')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeTab, showPrefs, suggestions, session?.user?.userType])

  // Load mutual matches
  useEffect(() => {
    const load = async () => {
      if (activeTab !== 'matching') return
      if (!session) return
      try {
        setMutualLoading(true)
        const res = await fetch('/api/matching/mutual?limit=24', { cache: 'no-store' })
        const data = await res.json()
        if (res.ok) {
          setMutual(Array.isArray(data?.matches) ? data.matches : [])
        } else {
          setMutual([])
        }
      } catch {
        setMutual([])
      } finally {
        setMutualLoading(false)
      }
    }
    load()
  }, [activeTab, session])

  // Load likes received for ESCORT
  useEffect(() => {
    const load = async () => {
      if (activeTab !== 'matching') return
      if (!session || session.user.userType !== 'ESCORT') return
      try {
        setLikesLoading(true)
        const res = await fetch('/api/matching/likes-received', { cache: 'no-store' })
        const data = await res.json()
        if (res.ok) {
          setLikesReceived(Array.isArray(data?.likes) ? data.likes : [])
        } else {
          setLikesReceived([])
        }
      } catch {
        setLikesReceived([])
      } finally {
        setLikesLoading(false)
      }
    }
    load()
  }, [activeTab, session])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm font-light tracking-widest text-gray-600">DASHBOARD WIRD GELADEN...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const userType = session.user.userType as UserType
  const canStories = canCreateStories(userType)
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://thegnd.com'
  const isBusiness = userType === 'AGENCY' || userType === 'CLUB' || userType === 'STUDIO'

  return (
    <div className="min-h-screen bg-white">
      {/* Dashboard Header */}
      <DashboardHeader 
        session={session}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Mobile Navigation */}
        <DashboardMobileNavigation 
          session={session}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Content Area */}
        <div className="">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Dashboard Welcome */}
              <DashboardWelcome />
              
              {/* Quick Actions */}
              <DashboardQuickActions
                onEditProfile={() => setActiveTab('profile')}
                onDiscover={() => setActiveTab('network')}
                onMessages={() => setActiveTab('messages')}
                isEscort={userType === 'ESCORT'}
                onIssueReviewTicket={issueReviewTicket}
              />

              {/* Ticket Modal */}
              <VerificationTicketModal
                open={ticketModalOpen}
                code={issuedTicket?.code}
                expiresAt={issuedTicket?.expiresAt ?? null}
                appOrigin={appOrigin}
                onClose={() => setTicketModalOpen(false)}
              />

              {/* Calendar under VERIFIZIERUNGS-TICKET section */}
              <div className="bg-white border border-gray-200 p-6">
                <h2 className="text-sm font-light tracking-widest text-gray-800 uppercase">KALENDER</h2>
                <div className="mt-3">
                  <DatesCalendarWidget scope={userType === 'ESCORT' ? 'ESCORT' : 'MEMBER'} />
                </div>
              </div>

              {/* Profile Analytics (shown only if add-on PROFILE_ANALYTICS is globally active and enabled for user) */}
              <ProfileAnalyticsWidget />

              {/* Newest Escorts Slider under Profile Analytics (only for MEMBER) */}
              {userType === 'MEMBER' && (
                <NewestEscortsSlider heading="NEUESTE ESCORTS" />
              )}

              {/* Connected Escorts Slider for business users */}
              {isBusiness && (
                <ConnectedEscortsSlider heading="AKTUELLE ESCORTS" />
              )}

            </div>
          )}
          
          {activeTab === 'feed' && (
            <FeedTabs />
          )}
          
          {activeTab === 'profile' && (
            <ProfileComponent />
          )}
          
          {activeTab === 'messages' && (
            <MessagingComponent />
          )}
          {activeTab === 'comments' && (
            <CommentsComponent />
          )}
          
          {activeTab === 'network' && (
            <SocialComponent />
          )}
          
          {canStories && activeTab === 'stories' && (
            <StoriesComponent />
          )}
          
          {activeTab === 'forum' && (
            <ForumDashboard />
          )}
          {activeTab === 'community' && (
            <CommunityDashboard />
          )}
          {activeTab === 'blog' && (
            <BlogTabGated session={session} />
          )}
          {activeTab === 'dates' && (
            <DatesPanel />
          )}
          {activeTab === 'jobs' && (
            <BusinessOnly isBusiness={isBusiness} fallbackMessage="Nur Agenturen, Clubs oder Studios können Jobs verwalten.">
              <JobsDashboard />
            </BusinessOnly>
          )}
          {activeTab === 'rentals' && (
            <BusinessOnly isBusiness={isBusiness} fallbackMessage="Nur Agenturen, Clubs oder Studios können Mieten verwalten.">
              <RentalsDashboard />
            </BusinessOnly>
          )}
          {activeTab === 'girls' && (
            <BusinessOnly isBusiness={isBusiness} fallbackMessage="Nur Agenturen, Clubs oder Studios können GIRLS verwalten.">
              <GirlsDashboard />
            </BusinessOnly>
          )}
          {activeTab === 'matching' && (
            <div className="">
              <div className={matchingView === 'reels' ? 'md:hidden' : ''}>
              <MatchingToolbar
                isMember={session.user.userType === 'MEMBER'}
                showAuto={showAuto}
                showPrefs={showPrefs}
                reelsEffects={reelsEffects}
                matchingView={matchingView}
                onSetView={(view) => {
                  setMatchingView(view)
                  router.push(`/dashboard?tab=matching${showAuto ? '&view=auto-message' : (showPrefs ? '&view=prefs' : '')}&layout=${view}`)
                  if (view === 'reels') { try { reloadSuggestions() } catch {} }
                }}
                onOpenAuto={() => router.push('/dashboard?tab=matching&view=auto-message')}
                onTogglePrefs={() => {
                  const next = !showPrefs
                  router.push(`/dashboard?tab=matching${next ? '&view=prefs' : ''}`)
                  setShowPrefs(next)
                }}
                onToggleEffects={() => {
                  const nv = !reelsEffects
                  setReelsEffects(nv)
                  try { localStorage.setItem('reelsEffects', nv ? '1' : '0') } catch {}
                  show(nv ? 'Effekte aktiviert' : 'Effekte deaktiviert', { variant: 'info' })
                  if (matchingView !== 'reels') {
                    show('Effekte wirken im REELS-Layout', { variant: 'info' })
                  }
                }}
              />
              </div>

              {session.user.userType === 'MEMBER' ? (
                <MemberMatchingSection
                  showAuto={showAuto}
                  showPrefs={showPrefs}
                  matchingView={matchingView}
                  suggestions={suggestions}
                  reelsEffects={reelsEffects}
                  gridAnim={gridAnim}
                  matchLoading={matchLoading}
                  matchError={matchError}
                  mutualLoading={mutualLoading}
                  mutual={mutual}
                  resetting={resetting}
                  resetResult={resetResult}
                  onSwipe={gridSwipe}
                  onReload={reloadSuggestions}
                  onUndo={undoGrid}
                  onShowPrefs={() => setShowPrefs(true)}
                  onResetSoft={() => resetMatching('soft')}
                  onResetHard={() => resetMatching('hard')}
                  onMessage={(id) => router.push(`/dashboard?tab=messages&to=${id}`)}
                  onSetView={(view) => {
                    setMatchingView(view)
                    router.push(`/dashboard?tab=matching${showAuto ? '&view=auto-message' : (showPrefs ? '&view=prefs' : '')}&layout=${view}`)
                    if (view === 'reels') { try { reloadSuggestions() } catch {} }
                  }}
                  onOpenAuto={() => router.push('/dashboard?tab=matching&view=auto-message')}
                  onTogglePrefs={() => {
                    const next = !showPrefs
                    router.push(`/dashboard?tab=matching${next ? '&view=prefs' : ''}`)
                    setShowPrefs(next)
                  }}
                  onToggleEffects={() => {
                    const nv = !reelsEffects
                    setReelsEffects(nv)
                    try { localStorage.setItem('reelsEffects', nv ? '1' : '0') } catch {}
                    show(nv ? 'Effekte aktiviert' : 'Effekte deaktiviert', { variant: 'info' })
                    if (matchingView !== 'reels') {
                      show('Effekte wirken im REELS-Layout', { variant: 'info' })
                    }
                  }}
                />
              ) : (
                <>
                  {/* Likes received */}
                  <EscortLikesSection
                    likesReceived={likesReceived}
                    setLikesReceived={setLikesReceived}
                    likesLoading={likesLoading}
                    likesFilter={likesFilter}
                    setLikesFilter={setLikesFilter}
                    setMutual={setMutual}
                    show={show}
                  />

                  {/* Mutual Matches for ESCORT */}
                  <EscortMutualMatches
                    loading={mutualLoading}
                    mutual={mutual}
                    onMessage={(id) => router.push(`/dashboard?tab=messages&to=${id}`)}
                  />
                  </>
                )}
            </div>
          )}

          {activeTab === 'gamification' && (
            <GamificationComponent />
          )}
          
          {activeTab === 'settings' && (
            <DashboardSettings />
          )}
        </div>
      </div>
    </div>
  )
}

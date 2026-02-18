'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Send, Trash2, Edit3, MessageSquare, X } from 'lucide-react'
import { FaStar, FaRegStar } from 'react-icons/fa6'
import Tabs from '@/components/Tabs'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import RatingDonut from '@/components/RatingDonut'
import { useToast } from '@/components/ui/toast'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useDateFormatter } from '@/hooks/useDateFormatter'

interface CommentItem {
  id: string
  content: string
  authorId: string
  createdAt: string
  parentId?: string | null
  isVisible: boolean
  hiddenByOwner: boolean
  deletionRequested: boolean
  deletionRequestMessage?: string | null
  editRequested: boolean
  editRequestMessage?: string | null
  rating?: number | null
  verifiedByTicket?: boolean | null
  author?: { email?: string | null; profile?: { displayName?: string | null; avatar?: string | null } | null } | null
}

export default function CommentsComponent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const { show } = useToast()
  const df = useDateFormatter()
  const myId = session?.user?.id as string | undefined
  const myType = session?.user?.userType as string | undefined
  const canModerate = useMemo(() => !!myId, [myId])

  const [loading, setLoading] = useState(false)
  const [authored, setAuthored] = useState<CommentItem[]>([])
  const [received, setReceived] = useState<CommentItem[]>([])
  const [requestMessage, setRequestMessage] = useState('')
  // Composer state
  const [targetInput, setTargetInput] = useState('')
  const [newComment, setNewComment] = useState('')
  const [rateEnabled, setRateEnabled] = useState(false)
  const [rating, setRating] = useState<number>(0)
  const [showAuthModal, setShowAuthModal] = useState(false)
  // Ticket redeem state (verified review)
  const [ticketCode, setTicketCode] = useState('')
  const [ticketComment, setTicketComment] = useState('')
  const [ticketRating, setTicketRating] = useState<number>(0)
  const [ticketSubmitting, setTicketSubmitting] = useState(false)
  const [tipEditOpenForId, setTipEditOpenForId] = useState<string | null>(null)
  const [tipDeleteOpenForId, setTipDeleteOpenForId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const donutColor = (v?: number | null) => {
    const x = typeof v === 'number' ? v : 0
    if (x <= 2) return 'var(--rating-low)'
    if (x < 4) return 'var(--rating-mid)'
    return 'var(--rating-high)'
  }

  const redeemTicket = async () => {
    if (requireAuth()) return
    if (!ticketCode.trim() || !ticketComment.trim()) return
    setTicketSubmitting(true)
    try {
      const res = await fetch('/api/review-tickets/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: ticketCode.trim(), content: ticketComment.trim(), rating: ticketRating > 0 ? ticketRating : undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        show(data?.error || 'Fehler beim Einlösen', { variant: 'error' })
        return
      }
      // Clear and reload lists
      setTicketCode('')
      setTicketComment('')
      setTicketRating(0)
      load()
      show('Verifizierte Bewertung erstellt', { variant: 'success' })
    } finally {
      setTicketSubmitting(false)
    }
  }

  const load = async () => {
    if (!myId) return
    try {
      setLoading(true)
      const [aRes, rRes] = await Promise.all([
        fetch('/api/comments?authorId=me'),
        fetch(`/api/comments?targetUserId=${encodeURIComponent(myId)}&all=1`),
      ])
      if (aRes.ok) setAuthored(await aRes.json())
      if (rRes.ok) setReceived(await rRes.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId])

  // Detect mobile viewport
  useEffect(() => {
    const update = () => setIsMobile(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Prefill ticket code from URL (?code=...)
  useEffect(() => {
    const c = searchParams.get('code')
    if (c) setTicketCode(String(c).toUpperCase())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const requireAuth = (): boolean => {
    if (!myId) {
      setShowAuthModal(true)
      return true
    }
    return false
  }

  const parseTargetUserId = (input: string): string | null => {
    const s = (input || '').trim()
    if (!s) return null
    // if it's likely an id (cuid-like), accept directly
    if (/^[a-z0-9]{10,}$/i.test(s) && s.includes('c')) return s
    try {
      const url = new URL(s, typeof window !== 'undefined' ? window.location.origin : 'https://thegnd.com')
      // expect paths like /escorts/:id/:slug or /agency/:id/:slug or /club/:id/:slug /studio/:id/:slug
      const parts = url.pathname.split('/').filter(Boolean)
      const id = parts[1]
      if (id) return id
    } catch {}
    return null
  }

  const submitComment = async () => {
    if (requireAuth()) return
    const targetUserId = parseTargetUserId(targetInput)
    if (!targetUserId) return
    const body: any = {
      targetUserId,
      content: newComment.trim(),
      rating: rateEnabled && rating > 0 ? rating : undefined,
    }
    if (!body.content) return
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setNewComment('')
      setTargetInput('')
      setRateEnabled(false)
      setRating(0)
      load()
    }
  }

  const request = async (id: string, type: 'requestDeletion' | 'requestEdit') => {
    const res = await fetch(`/api/comments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: type, message: requestMessage || '' }),
    })
    if (res.ok) {
      setRequestMessage('')
      load()
    }
  }

  const toggleVisibility = async (id: string, show: boolean) => {
    const res = await fetch(`/api/comments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: show ? 'unhide' : 'hide' }),
    })
    if (res.ok) {
      load()
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="mb-6">
        <div className="text-2xl font-thin tracking-wider text-gray-800 mb-2 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" /> KOMMENTARE
        </div>
        <div className="w-16 h-px bg-pink-500"></div>
      </div>

      {/* Verified review via ticket (MEMBER only) */}
      {myType === 'MEMBER' && (
        <div className="mb-8 border border-gray-200 p-4">
          <div className="text-sm font-light tracking-wider text-gray-800 mb-2">VERIFIZIERTE BEWERTUNG MIT TICKET</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              value={ticketCode}
              onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
              onFocus={() => { if (!myId) setShowAuthModal(true) }}
              placeholder="Ticket-Code (z. B. ABCD2345)"
              className="border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              value={ticketComment}
              onChange={(e) => setTicketComment(e.target.value)}
              onFocus={() => { if (!myId) setShowAuthModal(true) }}
              placeholder="Deine Bewertung"
              className="border border-gray-300 px-3 py-2 text-sm md:col-span-2"
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs text-gray-600">Bewertung:</span>
            {[1,2,3,4,5].map(i => (
              <button
                key={i}
                type="button"
                onClick={() => setTicketRating(i)}
                className={`text-lg ${i <= ticketRating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                aria-label={`${i} Sterne`}
              >
                {i <= ticketRating ? <FaStar /> : <FaRegStar />}
              </button>
            ))}
            <button onClick={redeemTicket} disabled={ticketSubmitting || !ticketCode.trim() || !ticketComment.trim()} className="ml-auto px-3 py-2 border text-sm tracking-widest hover:border-pink-500">
              EINLÖSEN
            </button>
          </div>
          <div className="mt-1 text-[11px] text-gray-500">Der Code wird von der Escort im Dashboard generiert und ist einmalig gültig.</div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAuthModal(false)} />
          <div className="relative z-10 w-full max-w-2xl bg-white md:grid md:grid-cols-2">
            <div className="hidden md:flex flex-col justify-between bg-black text-white p-6">
              <div>
                <div className="text-lg font-semibold">Du bist noch kein Mitglied?</div>
                <div className="mt-1 text-pink-400 font-semibold">Jetzt kostenlos Mitglied werden!</div>
                <p className="mt-4 text-sm text-gray-200">Melde dich jetzt an und profitiere als Free Member von:</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>• Deine Favoriten hinzufügen</li>
                  <li>• Kommentare hinzufügen</li>
                  <li>• Live Chat</li>
                </ul>
              </div>
              <Link href="/auth/signup" className="mt-6 inline-block text-center px-4 py-2 bg-pink-600 hover:bg-pink-700 transition-colors">Jetzt anmelden</Link>
            </div>
            <div className="relative p-6">
              <button onClick={() => setShowAuthModal(false)} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700" aria-label="Schließen">
                <X className="h-5 w-5" />
              </button>
              <div className="text-lg font-light tracking-wider text-gray-800 mb-4">Bist du schon Mitglied?</div>
              <div className="space-y-3">
                <Link href="/auth/signin" className="inline-flex items-center justify-center w-full px-4 py-2 bg-pink-600 text-white hover:bg-pink-700 transition-colors">Einloggen</Link>
                <div className="text-xs text-gray-500 text-center">Oder <Link href="/auth/signup" className="text-pink-600 hover:underline">kostenlos registrieren</Link></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="mb-8 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            onFocus={() => { if (!myId) setShowAuthModal(true) }}
            placeholder="Profil-ID oder URL (Escort/Agentur/Club/Studio)"
            className="border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onFocus={() => { if (!myId) setShowAuthModal(true) }}
            placeholder="Kommentar schreiben..."
            className="border border-gray-300 px-3 py-2 text-sm md:col-span-2"
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={rateEnabled}
              onChange={() => setRateEnabled(v => !v)}
              className="h-4 w-4 border-gray-300"
            />
            Bewerten
          </label>
          {rateEnabled && (
            <div className="flex items-center gap-3">
              <RatingDonut value={rating} size={22} strokeWidth={5} fillColor={donutColor(rating)} trackColor={'var(--rating-track)'} showValue />
              {[1,2,3,4,5].map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  className={`text-lg ${i <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                  aria-label={`${i} Sterne`}
                >
                  {i <= rating ? <FaStar /> : <FaRegStar />}
                </button>
              ))}
            </div>
          )}
          <button onClick={submitComment} className="ml-auto px-3 py-2 border text-sm tracking-widest hover:border-pink-500 inline-flex items-center gap-2">
            <Send className="h-4 w-4" /> SENDEN
          </button>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500 mb-4">Laden...</div>}

      <Tabs
        tabs={[
          {
            id: 'mine',
            label: 'MEINE KOMMENTARE',
            content: (
              <div className="space-y-3">
                {authored.length === 0 ? (
                  <div className="text-sm text-gray-500">Keine eigenen Kommentare.</div>
                ) : (
                  authored.map((c) => (
                    <div key={c.id} className="border border-gray-100 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="size-6 bg-gray-200">
                            {c.author?.profile?.avatar ? (
                              <AvatarImage src={c.author.profile.avatar} alt="avatar" />
                            ) : (
                              <AvatarFallback className="text-[10px] text-gray-600">
                                {(c.author?.profile?.displayName?.charAt(0) || c.author?.email?.charAt(0) || '?').toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="text-xs text-gray-800 truncate flex items-center gap-2">
                            <span className="truncate">{c.author?.profile?.displayName || c.author?.email || 'Nutzer'}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500">{df.formatDateTime(c.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {typeof c.rating === 'number' && (
                            <RatingDonut value={c.rating ?? 0} size={22} strokeWidth={5} fillColor={donutColor(c.rating)} />
                          )}
                          {c.verifiedByTicket && (
                            <span className="ml-2 text-[10px] uppercase tracking-widest text-emerald-700 border border-emerald-300 px-1.5 py-0.5">VERIFIZIERT</span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-800 mt-1">{c.content}</div>
                      <Tooltip.Provider delayDuration={0}>
                      <div className="mt-3 grid [grid-template-columns:1fr_auto_auto] gap-2 items-stretch">
                        <input
                          value={requestMessage}
                          onChange={(e) => setRequestMessage(e.target.value)}
                          placeholder="Nachricht an Admin (optional)"
                          className="w-full min-w-0 border border-gray-200 px-2 py-1 text-xs"
                        />
                        <Tooltip.Root
                          open={tipEditOpenForId === c.id}
                          onOpenChange={(open) => setTipEditOpenForId(open ? c.id : (tipEditOpenForId === c.id ? null : tipEditOpenForId))}
                        >
                          <Tooltip.Trigger asChild>
                            <button
                              type="button"
                              aria-label="Bearbeitung anfragen"
                              onClick={() => {
                                const isOpen = tipEditOpenForId === c.id
                                if (isMobile && !isOpen) { setTipEditOpenForId(c.id); return }
                                request(c.id, 'requestEdit')
                                setTipEditOpenForId(prev => prev === c.id ? null : prev)
                              }}
                              onMouseLeave={() => setTipEditOpenForId(prev => prev === c.id ? null : prev)}
                              className="px-2 py-1 border text-xs hover:border-pink-500 hover:text-pink-600 inline-flex items-center justify-center gap-1"
                            >
                              <Edit3 className="h-3 w-3"/>
                              <span className="hidden md:inline">Bearbeitung anfragen</span>
                            </button>
                          </Tooltip.Trigger>
                          <Tooltip.Content side="top" align="center" className="px-2 py-1 text-xs bg-gray-900 text-white border border-gray-700">
                            Bearbeitung anfragen
                            <Tooltip.Arrow className="fill-gray-900" />
                          </Tooltip.Content>
                        </Tooltip.Root>
                        <Tooltip.Root
                          open={tipDeleteOpenForId === c.id}
                          onOpenChange={(open) => setTipDeleteOpenForId(open ? c.id : (tipDeleteOpenForId === c.id ? null : tipDeleteOpenForId))}
                        >
                          <Tooltip.Trigger asChild>
                            <button
                              type="button"
                              aria-label="Löschung anfragen"
                              onClick={() => {
                                const isOpen = tipDeleteOpenForId === c.id
                                if (isMobile && !isOpen) { setTipDeleteOpenForId(c.id); return }
                                request(c.id, 'requestDeletion')
                                setTipDeleteOpenForId(prev => prev === c.id ? null : prev)
                              }}
                              onMouseLeave={() => setTipDeleteOpenForId(prev => prev === c.id ? null : prev)}
                              className="px-2 py-1 border text-xs hover:border-pink-500 hover:text-pink-600 inline-flex items-center justify-center gap-1"
                            >
                              <Trash2 className="h-3 w-3"/>
                              <span className="hidden md:inline">Löschung anfragen</span>
                            </button>
                          </Tooltip.Trigger>
                          <Tooltip.Content side="top" align="center" className="px-2 py-1 text-xs bg-gray-900 text-white border border-gray-700">
                            Löschung anfragen
                            <Tooltip.Arrow className="fill-gray-900" />
                          </Tooltip.Content>
                        </Tooltip.Root>
                      </div>
                      </Tooltip.Provider>
                    </div>
                  ))
                )}
              </div>
            ),
          },
          {
            id: 'received',
            label: 'ERHALTENE KOMMENTARE',
            content: (
              <div className="space-y-3">
                {received.length === 0 ? (
                  <div className="text-sm text-gray-500">Keine erhaltenen Kommentare.</div>
                ) : (
                  received.map((c) => (
                    <div key={c.id} className="border border-gray-100 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="size-6 bg-gray-200">
                            {c.author?.profile?.avatar ? (
                              <AvatarImage src={c.author.profile.avatar as any} alt="avatar" />
                            ) : (
                              <AvatarFallback className="text-[10px] text-gray-600">
                                {(c.author?.profile?.displayName?.charAt(0) || c.author?.email?.charAt(0) || '?').toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="text-xs text-gray-800 truncate flex items-center gap-2">
                            <span className="truncate">{c.author?.profile?.displayName || c.author?.email || 'Nutzer'}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500">{df.formatDateTime(c.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {typeof c.rating === 'number' && (
                            <RatingDonut value={c.rating ?? 0} size={22} strokeWidth={5} fillColor={donutColor(c.rating)} />
                          )}
                        </div>
                      </div>
                      <div className={`text-sm ${c.isVisible ? 'text-gray-800' : 'text-gray-400 line-through'} mt-1`}>{c.content}</div>
                      {canModerate && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {c.isVisible ? (
                            <button onClick={() => toggleVisibility(c.id, false)} className="px-2 py-1 border text-xs hover:border-pink-500 hover:text-pink-600 inline-flex items-center gap-1"><EyeOff className="h-3 w-3"/> Verbergen</button>
                          ) : (
                            <button onClick={() => toggleVisibility(c.id, true)} className="px-2 py-1 border text-xs hover:border-pink-500 hover:text-pink-600 inline-flex items-center gap-1"><Eye className="h-3 w-3"/> Einblenden</button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}

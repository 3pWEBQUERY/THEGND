'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { MessageSquare, Send, EyeOff, Eye, Trash2, Edit3, X } from 'lucide-react'
import { FaStar, FaRegStar } from 'react-icons/fa6'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getAvatarUrl } from '@/utils/avatar'
import RatingDonut from '@/components/RatingDonut'

type CommentItem = {
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
  author?: { profile?: { displayName?: string | null; avatar?: string | null } | null; email?: string | null; userType?: string | null } | null
}

interface ProfileCommentsProps {
  targetUserId: string
}

export default function ProfileComments({ targetUserId }: ProfileCommentsProps) {
  const { data: session } = useSession()
  const currentUserId = session?.user?.id as string | undefined
  const currentUserType = session?.user?.userType as string | undefined
  const canModerate = useMemo(() => currentUserId && currentUserId === targetUserId, [currentUserId, targetUserId])

  const [loading, setLoading] = useState(false)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [requestMessage, setRequestMessage] = useState('')
  const [rateEnabled, setRateEnabled] = useState(false)
  const [rating, setRating] = useState<number>(0)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [replyRateEnabled, setReplyRateEnabled] = useState<Record<string, boolean>>({})
  const [replyRating, setReplyRating] = useState<Record<string, number>>({})

  const donutColor = (v?: number | null) => {
    const x = typeof v === 'number' ? v : 0
    if (x <= 2) return 'var(--rating-low)'
    if (x < 4) return 'var(--rating-mid)'
    return 'var(--rating-high)'
  }

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/comments?targetUserId=${encodeURIComponent(targetUserId)}`)
      if (res.ok) {
        const data = await res.json()
        setComments(Array.isArray(data) ? data : [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (targetUserId) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId])

  const requireAuth = (): boolean => {
    if (!currentUserId) {
      setShowAuthModal(true)
      return true
    }
    return false
  }

  const post = async (parentId?: string | null) => {
    if (requireAuth()) return
    if (!newComment.trim()) return
    let ratingToSend: number | undefined
    if (parentId) {
      const r = replyRating[parentId] ?? 0
      ratingToSend = replyRateEnabled[parentId] && r > 0 ? r : undefined
    } else {
      ratingToSend = rateEnabled && rating > 0 ? rating : undefined
    }
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        targetUserId, 
        content: newComment.trim(), 
        parentId: parentId || undefined,
        rating: ratingToSend,
      }),
    })
    if (res.ok) {
      setNewComment('')
      setReplyTo(null)
      setRateEnabled(false)
      setRating(0)
      if (parentId) {
        setReplyRateEnabled(prev => ({ ...prev, [parentId]: false }))
        setReplyRating(prev => ({ ...prev, [parentId]: 0 }))
      }
      load()
    }
  }

  const action = async (id: string, type: 'hide' | 'unhide' | 'requestDeletion' | 'requestEdit') => {
    const body: any = { action: type }
    if (type === 'requestDeletion' || type === 'requestEdit') {
      body.message = requestMessage || ''
    }
    const res = await fetch(`/api/comments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setRequestMessage('')
      load()
    }
  }

  const roots = comments.filter(c => !c.parentId)
  const byParent: Record<string, CommentItem[]> = {}
  comments.forEach(c => {
    if (c.parentId) {
      if (!byParent[c.parentId]) byParent[c.parentId] = []
      byParent[c.parentId].push(c)
    }
  })

  return (
    <div>
      <div className="text-sm font-light tracking-wider text-gray-800 flex items-center gap-2">
        <MessageSquare className="h-4 w-4" /> KOMMENTARE
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAuthModal(false)} />
          <div className="relative z-10 w-full max-w-2xl bg-white md:grid md:grid-cols-2">
            {/* Left: promo */}
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
            {/* Right: login */}
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

      {/* New comment (always visible, prompts auth if necessary) */}
      <div className="mt-3 space-y-2">
        <div className="flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onFocus={() => { if (!currentUserId) setShowAuthModal(true) }}
            placeholder="Schreibe einen Kommentar..."
            className="flex-1 border border-gray-300 px-3 py-2 text-sm"
          />
          <button onClick={() => post(null)} className="px-3 py-2 border text-sm tracking-widest hover:border-pink-500 flex items-center gap-2">
            <Send className="h-4 w-4" /> SENDEN
          </button>
        </div>
        {/* Rating toggle and stars (only for root comments) */}
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
        </div>
      </div>

      {/* List */}
      <div className="mt-4 space-y-4">
        {loading ? (
          <div className="text-sm text-gray-500">Laden...</div>
        ) : roots.length === 0 ? (
          <div className="text-sm text-gray-500">Noch keine Kommentare.</div>
        ) : (
          roots.map((c) => (
            <div key={c.id} className="border border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="size-6 bg-gray-200">
                    <AvatarImage src={getAvatarUrl(c.author?.profile?.avatar, c.author?.userType)} alt="avatar" />
                    <AvatarFallback className="text-[10px] text-gray-600">
                      {(c.author?.profile?.displayName?.charAt(0) || c.author?.email?.charAt(0) || '?').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-xs text-gray-800 truncate flex items-center gap-2">
                    <span className="truncate">{c.author?.profile?.displayName || c.author?.email || 'Nutzer'}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">{new Date(c.createdAt).toLocaleString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                    {c.hiddenByOwner && <span className="ml-1 text-amber-600">(verborgen)</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {typeof c.rating === 'number' && (
                    <RatingDonut value={c.rating ?? 0} size={22} strokeWidth={5} fillColor={donutColor(c.rating)} />
                  )}
                </div>
              </div>
              <div className={`text-sm mt-2 ${c.isVisible ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{c.content}</div>

              <div className="mt-2 flex flex-wrap gap-2">
                {currentUserId && (
                  <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)} className="px-2 py-1 border text-xs hover:border-pink-500 hover:text-pink-600 inline-flex items-center gap-1">
                    Antworten
                  </button>
                )}
                {canModerate && (
                  c.isVisible ? (
                    <button onClick={() => action(c.id, 'hide')} className="px-2 py-1 border text-xs hover:border-pink-500 hover:text-pink-600 inline-flex items-center gap-1"><EyeOff className="h-3 w-3"/> Verbergen</button>
                  ) : (
                    <button onClick={() => action(c.id, 'unhide')} className="px-2 py-1 border text-xs hover:border-pink-500 hover:text-pink-600 inline-flex items-center gap-1"><Eye className="h-3 w-3"/> Einblenden</button>
                  )
                )}
                {currentUserId === c.authorId && (
                  <>
                    <button onClick={() => action(c.id, 'requestEdit')} className="px-2 py-1 border text-xs hover:border-pink-500 hover:text-pink-600 inline-flex items-center gap-1"><Edit3 className="h-3 w-3"/> Bearbeitung anfragen</button>
                    <button onClick={() => action(c.id, 'requestDeletion')} className="px-2 py-1 border text-xs hover:border-pink-500 hover:text-pink-600 inline-flex items-center gap-1"><Trash2 className="h-3 w-3"/> Löschung anfragen</button>
                    <input
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="Nachricht an Admin (optional)"
                      className="border border-gray-200 px-2 py-1 text-xs"
                    />
                  </>
                )}
              </div>

              {/* Reply box */}
              {replyTo === c.id && (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Antwort schreiben..."
                      className="flex-1 border border-gray-300 px-3 py-2 text-sm"
                    />
                    <button onClick={() => post(c.id)} className="px-3 py-2 border text-sm tracking-widest hover:border-pink-500 flex items-center gap-2">
                      <Send className="h-4 w-4" /> SENDEN
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={!!replyRateEnabled[c.id]}
                        onChange={() => setReplyRateEnabled(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                        className="h-4 w-4 border-gray-300"
                      />
                      Bewerten
                    </label>
                    {replyRateEnabled[c.id] && (
                      <div className="flex items-center gap-3">
                        <RatingDonut value={replyRating[c.id] ?? 0} size={22} strokeWidth={5} fillColor={donutColor(replyRating[c.id])} trackColor={'var(--rating-track)'} showValue />
                        {[1,2,3,4,5].map(i => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setReplyRating(prev => ({ ...prev, [c.id]: i }))}
                            className={`text-lg ${i <= (replyRating[c.id] ?? 0) ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                            aria-label={`${i} Sterne`}
                          >
                            {i <= (replyRating[c.id] ?? 0) ? <FaStar /> : <FaRegStar />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Replies */}
              {(byParent[c.id] || []).map((r) => (
                <div key={r.id} className="mt-3 border-l-2 border-gray-100 pl-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="size-6 bg-gray-200">
                        <AvatarImage src={getAvatarUrl(r.author?.profile?.avatar, r.author?.userType)} alt="avatar" />
                        <AvatarFallback className="text-[10px] text-gray-600">
                          {(r.author?.profile?.displayName?.charAt(0) || r.author?.email?.charAt(0) || '?').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-xs text-gray-800 truncate flex items-center gap-2">
                        <span className="truncate">{r.author?.profile?.displayName || r.author?.email || 'Nutzer'}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">{new Date(r.createdAt).toLocaleString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                        {r.hiddenByOwner && <span className="ml-1 text-amber-600">(verborgen)</span>}
                      </div>
                    </div>
                    <div className="h-0" />
                  </div>
                  <div className={`text-sm mt-1 ${r.isVisible ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{r.content}</div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

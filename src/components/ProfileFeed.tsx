'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarUrl } from '@/utils/avatar'
import { Heart, MessageCircle, Share, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatTimeAgo, getUserTypeDisplayName } from '@/lib/validations'
import CommentsThread from '@/components/CommentsThread'
import CommentsModal from '@/components/CommentsModal'

export type ProfileFeedPost = {
  id: string
  content: string
  images: string[]
  createdAt: string | Date
  isLikedByUser?: boolean
  _count?: { likes: number; comments: number }
  author: {
    email: string
    userType?: string
    profile?: { displayName?: string | null; avatar?: string | null }
  }
  comments?: Array<{
    id: string
    content: string
    parentId?: string | null
    author: {
      email: string
      profile?: { displayName?: string | null; avatar?: string | null }
    }
  }>
}

type Props = {
  posts: ProfileFeedPost[]
  adminActions?: (post: ProfileFeedPost) => React.ReactNode
}

// Variants for profile view schematic
export type ProfileViewVariant = 'STANDARD' | 'ALT1' | 'ALT2' | 'FULL_SIDE'

// A small, image-free schematic/thumbnail to preview the page layout for a profile view.
// This is purely illustrative (boxes/lines), no real images are used.
export function ProfileViewPreview({ variant = 'STANDARD' }: { variant?: ProfileViewVariant }) {
  const src =
    variant === 'STANDARD' ? '/Ansicht_1.png' :
    variant === 'ALT1' ? '/Ansicht_2.png' :
    variant === 'ALT2' ? '/Ansicht_3.png' :
    '/Ansicht_3.png'
  const label =
    variant === 'STANDARD' ? 'STANDARD' :
    variant === 'ALT1' ? 'ANSICHT 1' :
    variant === 'ALT2' ? 'ANSICHT 2' :
    'FULL SIZE'
  return (
    <div className="w-full">
      <div className="text-xs font-light tracking-widest text-gray-600 mb-2 transition-colors group-hover:text-pink-600">PROFILANSICHT • {label}</div>
      <div className="relative w-full aspect-[16/9] bg-white border border-gray-200 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={`Profilansicht ${label}`} className={`absolute inset-0 h-full w-full object-cover ${variant === 'ALT1' || variant === 'ALT2' || variant === 'FULL_SIDE' ? 'object-top' : ''}`} />
      </div>
    </div>
  )
}

// Avatar-Normalisierung jetzt in @/utils/avatar (getAvatarUrl)

export default function ProfileFeed({ posts, adminActions }: Props) {
  const { data: session } = useSession()
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [localPosts, setLocalPosts] = useState<ProfileFeedPost[]>(posts || [])
  // Sponsored marketing assets for FEED – SPONSORED POST
  const [sponsored, setSponsored] = useState<Array<{ id: string; url: string; targetUrl?: string | null }>>([])
  // Hide ads for PLUS/PREMIUM memberships
  const [isAdFree, setIsAdFree] = useState(false)
  // Dismiss individual sponsored slots by key (e.g., slot-0, slot-1)
  const [dismissedAds, setDismissedAds] = useState<Set<string>>(new Set())

  // Share menu state
  const [shareMenuFor, setShareMenuFor] = useState<string | null>(null)

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null)
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null)
  const [openCommentsModalFor, setOpenCommentsModalFor] = useState<string | null>(null)
  const [imageOrientation, setImageOrientation] = useState<Record<string, 'landscape' | 'portrait' | 'square'>>({})

  const handleImageLoad = (url: string, e: any) => {
    try {
      const img = e?.currentTarget as HTMLImageElement
      const w = img?.naturalWidth || 0
      const h = img?.naturalHeight || 0
      const o: 'landscape' | 'portrait' | 'square' = w > h ? 'landscape' : w < h ? 'portrait' : 'square'
      setImageOrientation((prev) => (prev[url] === o ? prev : { ...prev, [url]: o }))
    } catch {}
  }

  useEffect(() => {
    setLocalPosts(posts || [])
  }, [posts])

  // Load active SPONSORED_POST assets (limit a few to rotate)
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/marketing/active?placement=SPONSORED_POST&limit=5', { cache: 'no-store' })
        if (!res.ok) return
        const data: { assets?: { id: string; url: string; targetUrl?: string | null }[] } = await res.json()
        if (!cancelled) setSponsored(Array.isArray(data.assets) ? data.assets : [])
      } catch {}
    }
    load()
    const id = window.setInterval(load, 60000)
    return () => { cancelled = true; window.clearInterval(id) }
  }, [])

  // Load membership status to hide ads for PLUS/PREMIUM
  useEffect(() => {
    let cancelled = false
    const check = async () => {
      try {
        const res = await fetch('/api/membership/my', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const memberships: any[] = Array.isArray(data?.memberships) ? data.memberships : []
        const hasPlusPremium = memberships.some((m: any) => {
          const planKey = String(m?.plan?.key || m?.plan?.name || '').toUpperCase()
          const status = String(m?.status || '').toUpperCase()
          const isActive = status ? status === 'ACTIVE' : true
          return isActive && (planKey.includes('PLUS') || planKey.includes('PREMIUM'))
        })
        if (!cancelled) setIsAdFree(!!hasPlusPremium)
      } catch {}
    }
    check()
    return () => { cancelled = true }
  }, [])

  const requireAuth = (action: () => void) => {
    if (!session?.user?.id) {
      setShowAuthPrompt(true)
      return
    }
    action()
  }

  const toggleLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setLocalPosts((prev) => prev.map((p) =>
          p.id === postId
            ? { ...p, isLikedByUser: !!data.isLiked, _count: { ...(p._count || { likes: 0, comments: 0 }), likes: data.likesCount } }
            : p
        ))
      }
    } catch {}
  }

  // Share helpers
  const getShareUrl = (postId: string) => {
    if (typeof window === 'undefined') return `#post-${postId}`
    return `${window.location.origin}${window.location.pathname}#post-${postId}`
  }
  const onCopyLink = async (postId: string) => {
    try {
      await navigator.clipboard?.writeText(getShareUrl(postId))
    } catch {}
    setShareMenuFor(null)
  }
  const onNativeShare = async (post: ProfileFeedPost) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.author.profile?.displayName || post.author.email,
          text: post.content,
          url: getShareUrl(post.id)
        })
      } else {
        await onCopyLink(post.id)
      }
    } catch {}
    setShareMenuFor(null)
  }
  const onShareTo = (platform: 'whatsapp' | 'telegram' | 'x' | 'facebook' | 'email' | 'sms' | 'qr', post: ProfileFeedPost) => {
    const url = getShareUrl(post.id)
    const text = post.content || ''
    let shareUrl = ''
    if (platform === 'whatsapp') {
      shareUrl = `https://wa.me/?text=${encodeURIComponent((text + ' ' + url).trim())}`
    } else if (platform === 'telegram') {
      shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    } else if (platform === 'x') {
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent((text + ' ' + url).trim())}`
    } else if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    } else if (platform === 'email') {
      const subject = `Beitrag teilen: ${post.author.profile?.displayName || post.author.email}`
      shareUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent((text + '\n\n' + url).trim())}`
    } else if (platform === 'sms') {
      const body = encodeURIComponent((text + ' ' + url).trim())
      shareUrl = `sms:?&body=${body}`
    } else if (platform === 'qr') {
      shareUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`
    }
    window.open(shareUrl, '_blank', 'noopener,noreferrer')
    setShareMenuFor(null)
  }

  const openLightbox = (images: string[], index: number) => {
    if (!images || images.length === 0) return
    setLightboxImages(images)
    setLightboxIndex(index)
    setLightboxOpen(true)
  }
  const closeLightbox = () => setLightboxOpen(false)
  const showPrev = (e?: any) => {
    if (e) e.stopPropagation()
    setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length)
  }
  const showNext = (e?: any) => {
    if (e) e.stopPropagation()
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length)
  }

  // Cap: max 2 sponsored blocks per page render
  let adsShown = 0

  return (
    <div className="space-y-8" onClickCapture={() => setShareMenuFor(null)}>
      {localPosts && localPosts.length > 0 ? (
        localPosts.map((post, idx) => {
          const displayName = post.author.profile?.displayName || post.author.email
          // Determine if a sponsored slot should be shown after this post
          const slotIndex = Math.floor((idx + 1) / 5) - 1
          const slotKey = `slot-${slotIndex}`
          const shouldShowAdBase = ((idx + 1) % 5 === 0) && sponsored.length > 0 && !isAdFree && !dismissedAds.has(slotKey)
          const shouldShowAd = shouldShowAdBase && adsShown < 2
          if (shouldShowAd) adsShown++
          return (
            <React.Fragment key={`pf-${post.id}`}>
            <div key={post.id} id={`post-${post.id}`} className="bg-white border border-gray-100 rounded-none">
              <div className="p-4 sm:p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12 object-cover">
                      <AvatarImage src={getAvatarUrl(post.author.profile?.avatar, post.author.userType)} alt={`Avatar von ${displayName}`} />
                      <AvatarFallback className="text-sm font-light tracking-widest bg-gray-100">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-light tracking-wide text-gray-800">{displayName}</span>
                        {post.author.userType && (
                          <div className="text-xs font-light tracking-widest text-gray-500 uppercase">
                            {getUserTypeDisplayName(post.author.userType as any)}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-light tracking-wide text-gray-400 mt-1">
                        {formatTimeAgo(new Date(post.createdAt))}
                      </span>
                    </div>
                  </div>
                  {adminActions && (
                    <div className="ml-4">
                      {adminActions(post)}
                    </div>
                  )}
                </div>

                {/* Content */}
                {post.content && (
                  <div className="mb-6">
                    <p className="text-sm font-light tracking-wide text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>
                )}

                {/* Images */}
                {post.images && post.images.length > 0 && (
                  post.images.length === 1 ? (
                    <div className="mt-6">
                      <div 
                        className="relative group cursor-zoom-in"
                        onClick={() => openLightbox(post.images!, 0)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.images[0]}
                          alt={`Beitragsbild 1`}
                          onLoad={(e) => handleImageLoad(post.images![0], e)}
                          className={
                            imageOrientation[post.images![0]] === 'landscape'
                              ? 'w-full h-auto max-h-[560px] object-cover rounded-none'
                              : 'h-96 w-auto object-cover rounded-none mx-auto'
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {post.images.map((image, index) => (
                        <div 
                          key={index} 
                          className="relative group cursor-zoom-in"
                          onClick={() => openLightbox(post.images!, index)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={image} 
                            alt={`Beitragsbild ${index + 1}`}
                            className="w-full h-64 sm:h-80 object-cover rounded-none"
                          />
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-xs font-light tracking-widest text-gray-400 mb-4 pb-4 border-b border-gray-100 mt-6">
                  <span>{post._count?.likes ?? 0} GEFÄLLT MIR</span>
                  <span>{post._count?.comments ?? 0} KOMMENTARE</span>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-8">
                  <button
                    aria-label="Gefällt mir"
                    onClick={() => requireAuth(() => toggleLike(post.id))}
                    className={`flex items-center space-x-2 text-xs font-light tracking-widest transition-colors ${post.isLikedByUser ? 'text-pink-500 hover:text-pink-600' : 'text-gray-400 hover:text-pink-500'}`}
                  >
                    <Heart className={`h-4 w-4 ${post.isLikedByUser ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline">GEFÄLLT MIR</span>
                  </button>

                  <button
                    aria-label="Kommentieren"
                    onClick={() => requireAuth(() => { setOpenCommentsModalFor(post.id); setReplyToCommentId(null) })}
                    className="flex items-center space-x-2 text-xs font-light tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">KOMMENTIEREN</span>
                  </button>

                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      aria-label="Teilen"
                      className="flex items-center space-x-2 text-xs font-light tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        requireAuth(() => setShareMenuFor(shareMenuFor === post.id ? null : post.id))
                      }}
                    >
                      <Share className="h-4 w-4" />
                      <span className="hidden sm:inline">TEILEN</span>
                    </button>
                    {shareMenuFor === post.id && (
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 shadow-lg z-10" onClick={(e) => e.stopPropagation()}>
                        <button className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => onNativeShare(post)}>
                          Mit System teilen
                        </button>
                        <button className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => onCopyLink(post.id)}>
                          Link kopieren
                        </button>
                        <button className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => onShareTo('whatsapp', post)}>
                          WhatsApp
                        </button>
                        <button className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => onShareTo('telegram', post)}>
                          Telegram
                        </button>
                        <button className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => onShareTo('x', post)}>
                          X (Twitter)
                        </button>
                        <div className="h-px bg-gray-100 my-1" />
                        <button className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => onShareTo('facebook', post)}>
                          Facebook
                        </button>
                        <button className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => onShareTo('sms', post)}>
                          SMS
                        </button>
                        <button className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => onShareTo('email', post)}>
                          E-Mail
                        </button>
                        <div className="h-px bg-gray-100 my-1" />
                        <button className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => onShareTo('qr', post)}>
                          QR-Code
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comments Preview */}
                {post.comments && post.comments.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="space-y-4">
                      {post.comments.slice(0, 2).map((comment: any) => (
                        <div key={comment.id} className={`flex items-start space-x-3 ${comment.parentId ? 'pl-8' : ''}`}>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={getAvatarUrl(comment.author?.profile?.avatar, comment.author?.userType)} alt={`Avatar von ${(comment.author?.profile?.displayName || comment.author?.email) ?? 'Nutzer'}`} />
                            <AvatarFallback className="text-xs font-light tracking-widest bg-gray-100">
                              {(comment.author?.profile?.displayName || comment.author?.email || '?').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <span className="text-xs font-light tracking-wide text-gray-800">
                              {comment.author?.profile?.displayName || comment.author?.email}
                            </span>
                            <span className="text-xs font-light tracking-wide text-gray-600 ml-2">
                              {comment.content}
                            </span>
                            <div className="mt-1">
                              <button
                                type="button"
                                className="text-[10px] tracking-widest text-gray-500 hover:text-gray-700 uppercase"
                                onClick={() => requireAuth(() => { setOpenCommentsModalFor(post.id); setReplyToCommentId(comment.id) })}
                              >
                                ANTWORTEN
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {post.comments.length > 2 && (
                        <button
                          className="text-xs font-light tracking-widest text-gray-500 hover:text-gray-700 transition-colors uppercase"
                          onClick={() => requireAuth(() => { setOpenCommentsModalFor(post.id); setReplyToCommentId(null) })}
                        >
                          ALLE {post.comments.length} KOMMENTARE ANZEIGEN
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Full Comments Thread */}
                {/* Thread wird jetzt im Modal geöffnet */}
              </div>
            </div>
            {/* Sponsored insertion after each 5 posts (positions 5,10,15,...) */}
            {shouldShowAd ? (
              <div key={`sponsored-${idx}`} className="bg-white border border-gray-100 rounded-none">
                <div className="p-4 sm:p-8">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[10px] uppercase tracking-widest text-gray-500">GESCHALTETE ANZEIGE</div>
                    <div className="flex items-center gap-3">
                      <button
                        className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-600"
                        onClick={() => setDismissedAds((prev) => { const n = new Set(prev); n.add(slotKey); return n })}
                        aria-label="Anzeige schließen"
                      >
                        Schließen
                      </button>
                      <a
                        className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-600"
                        href={`mailto:support@thegnd.ch?subject=${encodeURIComponent('Anzeige melden')}&body=${encodeURIComponent(`Seite: ${typeof window !== 'undefined' ? window.location.href : ''}\nSlot: ${slotKey}`)}`}
                        target="_blank" rel="noopener noreferrer"
                      >
                        Melden
                      </a>
                    </div>
                  </div>
                  <div className="relative">
                    {(() => {
                      const asset = sponsored[Math.floor(idx / 5) % sponsored.length]
                      const img = (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={asset.url}
                          alt="Sponsored Post"
                          className="w-full h-auto object-cover"
                          loading="lazy"
                        />
                      )
                      return asset.targetUrl ? (
                        <a href={asset.targetUrl} target="_blank" rel="noopener noreferrer" className="block group">
                          {img}
                        </a>
                      ) : img
                    })()}
                  </div>
                </div>
              </div>
            ) : null}
            </React.Fragment>
          )
        })
      ) : (
        <div className="bg-white border border-gray-100 rounded-none">
          <div className="p-12 text-center text-sm font-light tracking-wide text-gray-500">Noch keine Beiträge.</div>
        </div>
      )}

      {/* Comments Modal */}
      <CommentsModal
        open={!!openCommentsModalFor}
        onClose={() => { setOpenCommentsModalFor(null); setReplyToCommentId(null) }}
        title="KOMMENTARE"
      >
        {openCommentsModalFor && (
          <CommentsThread
            postId={openCommentsModalFor}
            requireAuth={requireAuth}
            initialReplyToId={replyToCommentId || undefined}
            onCountChange={(count) => {
              setLocalPosts((prev) => prev.map((p) => p.id === openCommentsModalFor ? { ...p, _count: { ...(p._count || { likes: 0, comments: 0 }), comments: count } } : p))
            }}
          />
        )}
      </CommentsModal>

      {/* Auth prompt modal */}
      {showAuthPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => setShowAuthPrompt(false)}>
          <div className="bg-white border border-gray-200 w-full max-w-sm p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600" onClick={() => setShowAuthPrompt(false)} aria-label="Schließen">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-thin tracking-wider text-gray-900 mb-2">ANMELDUNG ERFORDERLICH</h3>
            <p className="text-sm text-gray-600 mb-4">Melde dich an oder registriere dich, um zu liken, zu kommentieren und zu teilen.</p>
            <div className="flex gap-3">
              <a href="/auth/signin" className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-none text-sm tracking-widest hover:border-pink-500">ANMELDEN</a>
              <a href="/auth/signup" className="flex-1 text-center px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-none text-sm tracking-widest">REGISTRIEREN</a>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Overlay */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={closeLightbox}>
          {/* Close */}
          <button
            type="button"
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={(e) => { e.stopPropagation(); closeLightbox() }}
            aria-label="Schließen"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Prev/Next */}
          {lightboxImages.length > 1 && (
            <>
              <button type="button" className="absolute left-4 text-white/80 hover:text-white" onClick={showPrev} aria-label="Vorheriges Bild">
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button type="button" className="absolute right-4 text-white/80 hover:text-white" onClick={showNext} aria-label="Nächstes Bild">
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Media */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxImages[lightboxIndex]}
            alt={`Bild ${lightboxIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

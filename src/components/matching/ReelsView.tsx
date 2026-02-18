"use client"

import Image from 'next/image'
import { Heart, X, Undo2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useRef, useState } from 'react'
import ServicesChips from '@/components/matching/ServicesChips'

export type ReelItem = {
  id: string
  displayName: string
  image?: string | null
  avatar?: string | null
  city?: string | null
  country?: string | null
  services?: string[]
  media?: string[]
  gallery?: string | null
}

type Props = {
  items: ReelItem[]
  onSwipe: (id: string, action: 'LIKE' | 'PASS') => void
  onReload?: () => void
  onUndo?: () => void
  effectsEnabled?: boolean
}

export default function ReelsView({ items, onSwipe, onReload, onUndo, effectsEnabled = true }: Props) {
  const [index, setIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [anim, setAnim] = useState<null | 'LEFT' | 'RIGHT'>(null)
  const startXRef = useRef<number | null>(null)
  const startYRef = useRef<number | null>(null)
  const [snapBack, setSnapBack] = useState(false)
  const [heartBurst, setHeartBurst] = useState(false)
  const [superFlash, setSuperFlash] = useState(false)
  const [mediaIndex, setMediaIndex] = useState(0)

  useEffect(() => { setIndex(0); setDragX(0); setAnim(null); setMediaIndex(0) }, [items?.length])
  useEffect(() => { setMediaIndex(0) }, [index])
  const nextCard = () => {
    setAnim(null)
    setDragX(0)
    setDragY(0)
    setIndex((i) => Math.min(i + 1, (items?.length || 1) - 1))
  }

  const current = items?.[index]
  const total = items?.length || 0

  const deriveMediaList = (it?: ReelItem): string[] => {
    if (!it) return []
    const out: string[] = []
    // media can be string[] or array of objects
    if (Array.isArray((it as any).media)) {
      for (const m of (it as any).media as any[]) {
        if (typeof m === 'string' && m) { out.push(m); continue }
        if (m && typeof m === 'object') {
          const cand = (m.url || m.src || m.image || m.video)
          if (typeof cand === 'string' && cand) out.push(cand)
        }
      }
    }
    if (typeof (it as any).gallery === 'string') {
      try {
        const g = JSON.parse((it as any).gallery)
        if (Array.isArray(g)) {
          for (const m of g) if (typeof m === 'string' && m) out.push(m)
        }
      } catch {}
    }
    if (it.image) out.push(it.image)
    if (it.avatar) out.push(it.avatar)
    // dedupe
    return Array.from(new Set(out))
  }
  const mediaList = deriveMediaList(current)

  const buzz = (ms = 20) => { try { if (navigator?.vibrate) navigator.vibrate(ms) } catch {} }
  const tone = (freq: number, durMs = 120) => {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!Ctx) return
      const ctx = new Ctx()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = freq
      o.connect(g)
      g.connect(ctx.destination)
      g.gain.value = 0.06
      o.start()
      setTimeout(() => { try { o.stop(); ctx.close() } catch {} }, durMs)
    } catch {}
  }

  const commit = (action: 'LIKE' | 'PASS' | 'SUPER') => {
    if (!current) return
    if (effectsEnabled) {
      if (action === 'LIKE') { buzz(20); tone(880) }
      if (action === 'PASS') { buzz(10); tone(220) }
      if (action === 'SUPER') { buzz(40); tone(1320, 180); setSuperFlash(true); setTimeout(() => setSuperFlash(false), 320) }
    }
    setAnim(action === 'PASS' ? 'LEFT' : 'RIGHT')
    // wait for exit animation then notify + advance
    setTimeout(() => {
      try { onSwipe(current.id, action === 'PASS' ? 'PASS' : 'LIKE') } catch {}
      setAnim(null)
      setDragX(0)
      setDragY(0)
      setIndex((i) => Math.min(i + 1, (items?.length || 1) - 1))
    }, 260)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (!current) return
    startXRef.current = e.clientX
    startYRef.current = e.clientY
    setDragging(true)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || startXRef.current === null) return
    setDragX(e.clientX - startXRef.current)
    if (startYRef.current !== null) setDragY(e.clientY - startYRef.current)
  }
  const onPointerUp = () => {
    if (!dragging) return
    setDragging(false)
    const threshold = 80
    // Up-swipe = SUPER
    if (-dragY > 90) {
      commit('SUPER')
    } else if (dragX > threshold) {
      commit('LIKE')
    } else if (dragX < -threshold) {
      commit('PASS')
    } else {
      setSnapBack(true)
      setDragX(0)
      setDragY(0)
      setTimeout(() => setSnapBack(false), 220)
    }
    startXRef.current = null
    startYRef.current = null
  }

  // keyboard shortcuts inside reels
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!current) return
      if (e.key === 'ArrowRight') { e.preventDefault(); commit('LIKE') }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); commit('PASS') }
      else if (e.key === 'ArrowUp') { e.preventDefault(); commit('SUPER') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current?.id])

  // Preload next media (within current, then first of next item)
  useEffect(() => {
    const preload = (url?: string | null) => {
      if (!url) return
      if (!/\.(mp4|webm|ogg)$/i.test(url)) { try { const img = new window.Image(); img.src = url } catch {} }
    }
    // next in current
    preload(mediaList[mediaIndex + 1])
    // first of next item
    const nextItem = items?.[index + 1]
    const nextList = deriveMediaList(nextItem)
    preload(nextList?.[0])
  }, [index, mediaIndex, items])

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-sm text-gray-500 mb-3">Keine weiteren Vorschläge</div>
        {onReload && (
          <Button variant="outline" size="sm" onClick={onReload} className="uppercase tracking-widest text-gray-700 hover:border-pink-500 hover:text-pink-600">Neu laden</Button>
        )}
      </div>
    )
  }

  const src = mediaList[mediaIndex] || current.image || current.avatar || undefined
  const likeOpacity = Math.min(1, Math.max(0, (dragX - 20) / 120))
  const passOpacity = Math.min(1, Math.max(0, (-dragX - 20) / 120))
  const superOpacity = Math.min(1, Math.max(0, (-dragY - 10) / 110))
  const transform = anim
    ? (anim === 'RIGHT' ? 'translateX(1000px) rotate(10deg)' : 'translateX(-1000px) rotate(-10deg)')
    : `translateX(${dragX}px) rotate(${dragX / 40}deg)`
  const style: React.CSSProperties = {
    transform,
    transition: anim
      ? 'transform 260ms ease-out, opacity 260ms ease-out'
      : (dragging ? undefined : `transform ${snapBack ? 260 : 180}ms ${snapBack ? 'cubic-bezier(.2,.8,.2,1.4)' : 'ease-out'}`),
  }

  return (
    <div className="relative mx-auto w-full max-w-lg md:max-w-xl lg:max-w-2xl">
      <div
        className="relative aspect-[9/15] bg-gray-100 border border-gray-200 overflow-hidden select-none touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => { setHeartBurst(true); setTimeout(() => setHeartBurst(false), 240); commit('LIKE') }}
      >
        <div style={style} className="absolute inset-0">
          {src ? (
            /\.(mp4|webm|ogg)$/i.test(src) ? (
              <video src={src} autoPlay muted playsInline className="h-full w-full object-cover" onEnded={() => {
                if (mediaIndex < mediaList.length - 1) setMediaIndex(i => Math.min(i + 1, mediaList.length - 1))
                else nextCard()
              }} />
            ) : (
              <Image src={src} alt={current.displayName} fill className="object-cover" />
            )
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400">Kein Bild</div>
          )}
        </div>

        {/* Media navigation arrows */}
        {mediaList.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setMediaIndex(i => (i - 1 + mediaList.length) % mediaList.length) }}
              aria-label="Vorheriges Medium"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-none bg-black/40 hover:bg-black/60 text-white flex items-center justify-center z-[1]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setMediaIndex(i => (i + 1) % mediaList.length) }}
              aria-label="Nächstes Medium"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-none bg-black/40 hover:bg-black/60 text-white flex items-center justify-center z-[1]"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[11px] bg-black/50 text-white px-2 py-0.5 rounded z-[1]">
              {mediaIndex + 1} / {mediaList.length}
            </div>
          </>
        )}

        {/* Like/Pass overlays */}
        <div className="pointer-events-none absolute top-4 left-4">
          <div className="text-[11px] tracking-[0.2em] font-semibold text-white bg-emerald-500/80 px-2 py-1 rotate-[-8deg]" style={{ opacity: likeOpacity }}>LIKE</div>
        </div>
        <div className="pointer-events-none absolute top-4 right-4">
          <div className="text-[11px] tracking-[0.2em] font-semibold text-white bg-rose-500/80 px-2 py-1 rotate-[8deg]" style={{ opacity: passOpacity }}>PASS</div>
        </div>
        <div className="pointer-events-none absolute top-4 inset-x-0 flex justify-center">
          <div className="text-[11px] tracking-[0.2em] font-semibold text-white bg-sky-500/80 px-2 py-1" style={{ opacity: superOpacity || (superFlash ? 1 : 0) }}>SUPER</div>
        </div>
        {/* Bottom overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-white text-lg font-medium tracking-widest">{(current.displayName || '').toUpperCase()}</div>
              <div className="text-white/80 text-xs">{[current.city, current.country].filter(Boolean).join(', ')}</div>
              {Array.isArray(current.services) && current.services.length > 0 && (
                <div className="mt-2">
                  <ServicesChips services={current.services} maxVisible={5} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {onUndo && (
                <button
                  onClick={() => onUndo()}
                  aria-label="Rückgängig"
                  className="h-10 w-10 rounded-full bg-white/90 hover:bg-white text-gray-700 flex items-center justify-center shadow"
                >
                  <Undo2 className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={() => commit('PASS')}
                aria-label="Ablehnen"
                className="h-12 w-12 rounded-full bg-white/95 hover:bg-white text-gray-700 flex items-center justify-center shadow"
              >
                <X className="h-6 w-6" />
              </button>
              <button
                onClick={() => commit('LIKE')}
                aria-label="Like"
                className="h-14 w-14 rounded-full bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center shadow"
              >
                <Heart className="h-7 w-7" />
              </button>
            </div>
          </div>
        </div>

        {/* Top-right counter */}
        <div className="absolute top-2 right-2 text-[11px] bg-black/50 text-white px-2 py-0.5">{index + 1} / {total}</div>

        {/* Heart burst on double-tap */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ opacity: heartBurst ? 1 : 0, transition: 'opacity 220ms ease-out' }}>
          <Heart className="h-24 w-24 text-white drop-shadow-[0_0_8px_rgba(0,0,0,0.4)]" />
        </div>
      </div>
    </div>
  )
}

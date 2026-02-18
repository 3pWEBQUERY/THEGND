"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Heart, X, RefreshCw, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import Link from 'next/link'
import ServicesChips from '@/components/matching/ServicesChips'

export type MatchSuggestion = {
  id: string
  email: string
  displayName: string
  city?: string | null
  country?: string | null
  avatar?: string | null
  image?: string | null
  services?: string[]
  appearance?: Record<string, any>
}

type SwipeDeckProps = {
  fetchLimit?: number
}

export default function SwipeDeck({ fetchLimit = 20 }: SwipeDeckProps) {
  const [cards, setCards] = useState<MatchSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { show } = useToast()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const autoReloadedRef = useRef(false)

  // For drag gestures
  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)
  const currentX = useRef<number>(0)
  const currentY = useRef<number>(0)
  const dragging = useRef<boolean>(false)

  const topCardId = cards[0]?.id

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/matching/suggestions?limit=${fetchLimit}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      setCards(data.suggestions || [])
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Laden')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // If deck becomes empty, auto-reload once
  useEffect(() => {
    if (!loading && !error && cards.length === 0) {
      if (!autoReloadedRef.current) {
        autoReloadedRef.current = true
        const t = setTimeout(() => { load() }, 1500)
        return () => clearTimeout(t)
      }
    } else if (cards.length > 0) {
      autoReloadedRef.current = false
    }
  }, [cards.length, loading, error])

  // Listen for global refresh event (triggered by reset button in DashboardClient)
  useEffect(() => {
    const handler = () => { load() }
    window.addEventListener('matching:refresh', handler)
    return () => window.removeEventListener('matching:refresh', handler)
  }, [])

  const onAction = async (id: string, action: 'LIKE' | 'PASS') => {
    try {
      setBusy(true)
      const res = await fetch('/api/matching/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escortId: id, action })
      })
      // Ignore non-200 silently; UI continues
      await res.json().catch(() => null)
    } catch {}
    finally {
      setBusy(false)
    }
  }

  const shift = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id))
  }

  const likeTop = async () => {
    const id = cards[0]?.id
    if (!id) return
    await onAction(id, 'LIKE')
    shift(id)
    show('Geliked', { variant: 'success' })
  }

  const passTop = async () => {
    const id = cards[0]?.id
    if (!id) return
    await onAction(id, 'PASS')
    shift(id)
    show('Abgelehnt', { variant: 'info' })
  }

  const undo = async () => {
    try {
      setBusy(true)
      const res = await fetch('/api/matching/swipe/undo', { method: 'POST' })
      await res.json().catch(() => null)
      // Easiest: reload deck to reflect change
      await load()
    } catch {}
    finally {
      setBusy(false)
    }
  }

  // Drag handlers
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handlePointerDown = (e: PointerEvent) => {
      if (busy) return
      const target = (e.target as HTMLElement)
      if (!target.closest('[data-top-card="true"]')) return
      dragging.current = true
      startX.current = e.clientX
      startY.current = e.clientY
      currentX.current = 0
      currentY.current = 0
      ;(target as HTMLElement).setPointerCapture?.(e.pointerId)
    }
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragging.current || startX.current == null || startY.current == null) return
      currentX.current = e.clientX - startX.current
      currentY.current = e.clientY - startY.current
      const card = el.querySelector('[data-top-card="true"]') as HTMLElement | null
      if (card) {
        const rot = currentX.current / 20
        card.style.transform = `translate(${currentX.current}px, ${currentY.current}px) rotate(${rot}deg)`
        const likeBadge = card.querySelector('[data-like-badge="true"]') as HTMLElement | null
        const passBadge = card.querySelector('[data-pass-badge="true"]') as HTMLElement | null
        const v = Math.min(1, Math.abs(currentX.current) / 100)
        if (currentX.current > 0) {
          if (likeBadge) likeBadge.style.opacity = String(v)
          if (passBadge) passBadge.style.opacity = '0'
        } else if (currentX.current < 0) {
          if (passBadge) passBadge.style.opacity = String(v)
          if (likeBadge) likeBadge.style.opacity = '0'
        } else {
          if (likeBadge) likeBadge.style.opacity = '0'
          if (passBadge) passBadge.style.opacity = '0'
        }
      }
    }
    const handlePointerUp = async (e: PointerEvent) => {
      if (!dragging.current) return
      dragging.current = false
      const dx = currentX.current
      const dy = currentY.current
      startX.current = startY.current = null
      currentX.current = currentY.current = 0
      const card = el.querySelector('[data-top-card="true"]') as HTMLElement | null
      if (!card) return

      const threshold = 80
      if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy)) {
        // Swipe decision
        const id = card.getAttribute('data-id')!
        const dir = dx > 0 ? 'LIKE' : 'PASS'
        card.style.transition = 'transform 200ms ease-out'
        card.style.transform = `translate(${dx > 0 ? 1000 : -1000}px, ${dy}px) rotate(${dx / 10}deg)`
        setTimeout(() => {
          card.style.transition = ''
          card.style.transform = ''
          const likeBadge = card.querySelector('[data-like-badge="true"]') as HTMLElement | null
          const passBadge = card.querySelector('[data-pass-badge="true"]') as HTMLElement | null
          if (likeBadge) likeBadge.style.opacity = '0'
          if (passBadge) passBadge.style.opacity = '0'
        }, 220)
        await onAction(id, dir as 'LIKE' | 'PASS')
        shift(id)
        if (dir === 'LIKE') {
          show('Geliked', { variant: 'success' })
        } else {
          show('Abgelehnt', { variant: 'info' })
        }
      } else {
        // Reset
        card.style.transition = 'transform 160ms ease-out'
        card.style.transform = 'translate(0,0) rotate(0)'
        setTimeout(() => {
          card.style.transition = ''
        }, 170)
        const likeBadge = card.querySelector('[data-like-badge="true"]') as HTMLElement | null
        const passBadge = card.querySelector('[data-pass-badge="true"]') as HTMLElement | null
        if (likeBadge) likeBadge.style.opacity = '0'
        if (passBadge) passBadge.style.opacity = '0'
      }
    }

    el.addEventListener('pointerdown', handlePointerDown)
    el.addEventListener('pointermove', handlePointerMove)
    el.addEventListener('pointerup', handlePointerUp)
    el.addEventListener('pointercancel', handlePointerUp)
    return () => {
      el.removeEventListener('pointerdown', handlePointerDown)
      el.removeEventListener('pointermove', handlePointerMove)
      el.removeEventListener('pointerup', handlePointerUp)
      el.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [busy, topCardId])

  // Keyboard shortcuts: Left = PASS, Right = LIKE
  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      if (busy) return
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        await likeTop()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        await passTop()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, cards])

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="text-sm text-gray-500">Lade Vorschläge…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="text-sm text-gray-500">{error}</div>
        <Button variant="outline" onClick={load} className="tracking-widest">Neu laden</Button>
      </div>
    )
  }

  if (!cards.length) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="text-sm text-gray-500">Keine weiteren Vorschläge</div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={load} className="tracking-widest"><RefreshCw className="h-4 w-4 mr-2"/>Neu laden</Button>
          <Link href="/dashboard?tab=matching&view=prefs" className="text-xs tracking-widest text-pink-600 hover:underline uppercase">Präferenzen anpassen</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto" ref={containerRef} style={{ touchAction: 'pan-y' }}>
      <div className="relative h-[70vh] select-none">
        {cards.slice(0, 3).map((c, idx) => (
          <div
            key={c.id}
            data-id={c.id}
            data-top-card={idx === 0 ? 'true' : 'false'}
            className={`absolute inset-0 bg-white border border-gray-200 overflow-hidden ${idx === 0 ? 'cursor-grab active:cursor-grabbing' : ''}`}
            style={{
              borderRadius: 0,
              zIndex: 10 - idx,
              transform: idx === 0 ? undefined : `scale(${1 - idx * 0.04}) translateY(${idx * 10}px)`
            }}
          >
            <div className="relative h-[86%] bg-gray-100">
              {c.image || c.avatar ? (
                <Image src={(c.image || c.avatar)!} alt={c.displayName} fill className="object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400">Kein Bild</div>
              )}
              {/* Drag Indicators */}
              <div className="absolute inset-0 pointer-events-none">
                <div
                  data-pass-badge="true"
                  className="absolute top-4 left-4 px-3 py-1 border-2 border-red-500 text-red-600 bg-white/80 text-sm font-semibold tracking-widest"
                  style={{ opacity: 0, transform: 'rotate(-15deg)' }}
                >
                  NOPE
                </div>
                <div
                  data-like-badge="true"
                  className="absolute top-4 right-4 px-3 py-1 border-2 border-pink-500 text-pink-600 bg-white/80 text-sm font-semibold tracking-widest"
                  style={{ opacity: 0, transform: 'rotate(15deg)' }}
                >
                  LIKE
                </div>
              </div>
            </div>
            <div className="px-4 pt-2 pb-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-light tracking-widest text-gray-900 truncate">{c.displayName.toUpperCase()}</h3>
                <div className="text-xs text-gray-500 whitespace-nowrap">{c.city || ''}{c.city && c.country ? ', ' : ''}{c.country || ''}</div>
              </div>
              {Array.isArray(c.services) && c.services.length > 0 && (
                <ServicesChips services={c.services} maxVisible={6} className="mt-1" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="mt-6 flex items-center justify-center gap-6">
        <Button variant="outline" onClick={passTop} aria-label="Pass" className="h-12 w-12 p-0 rounded-full border-gray-300"><X className="h-6 w-6"/></Button>
        <Button onClick={likeTop} aria-label="Like" className="h-14 w-14 p-0 rounded-full bg-pink-500 hover:bg-pink-600"><Heart className="h-7 w-7 text-white"/></Button>
      </div>
      <div className="mt-3 text-center text-xs text-gray-500">Wische links für Pass, rechts für Like</div>
      
    </div>
  )
}

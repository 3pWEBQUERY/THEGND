'use client'

import React, { useState, useMemo, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function SimpleSlider({
  images,
  altBase,
  className,
}: {
  images: string[]
  altBase?: string
  className?: string
}) {
  const cleanImages = useMemo(() => (Array.isArray(images) ? images.filter(Boolean) : []), [images])
  const [index, setIndex] = useState(0)
  const [loadedMain, setLoadedMain] = useState<Set<number>>(new Set())
  const [loadedThumbs, setLoadedThumbs] = useState<Set<number>>(new Set())
  const [loadedLightbox, setLoadedLightbox] = useState<Set<number>>(new Set())

  if (!cleanImages.length) {
    return (
      <div className={`relative w-full aspect-[9/16] bg-gray-100 border border-gray-200 flex items-center justify-center ${className || ''}`}>
        <div className="text-sm text-gray-500">Keine Bilder vorhanden.</div>
      </div>
    )
  }

  const prev = useCallback(() => setIndex((i) => (i - 1 + cleanImages.length) % cleanImages.length), [cleanImages.length])
  const next = useCallback(() => setIndex((i) => (i + 1) % cleanImages.length), [cleanImages.length])

  // Swipe gestures (touch)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchEndX.current = null
    touchStartX.current = e.changedTouches[0]?.clientX ?? null
  }
  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    touchEndX.current = e.changedTouches[0]?.clientX ?? null
  }
  const onTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return
    const delta = touchStartX.current - touchEndX.current
    const threshold = 30 // px
    if (delta > threshold) {
      // swipe left → next
      next()
    } else if (delta < -threshold) {
      // swipe right → prev
      prev()
    }
    touchStartX.current = null
    touchEndX.current = null
  }

  // Keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      prev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      next()
    }
  }

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const openLightbox = () => setLightboxOpen(true)
  const closeLightbox = () => setLightboxOpen(false)

  return (
    <div
      className={`relative w-full ${className || ''}`}
      tabIndex={0}
      role="region"
      aria-label="Bilderslider"
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative w-full aspect-[9/16] bg-black/5 overflow-hidden cursor-zoom-in" onClick={openLightbox}>
        {!loadedMain.has(index) && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cleanImages[index]}
          alt={`${altBase || 'Bild'} ${index + 1}/${cleanImages.length}`}
          className={`w-full h-full object-cover transition-all duration-500 ease-out ${loadedMain.has(index) ? 'blur-0 opacity-100 scale-100' : 'blur-md opacity-80 scale-105'}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoadedMain((prev) => new Set(prev).add(index))}
        />
      </div>

      {/* Controls */}
      <button
        type="button"
        aria-label="Vorheriges Bild"
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 border border-gray-200 p-2"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Nächstes Bild"
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 border border-gray-200 p-2"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 bg-white/80 border border-gray-200 text-gray-700">
        {index + 1} / {cleanImages.length}
      </div>

      {/* Thumbnail strip */}
      <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar py-1">
        {cleanImages.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            aria-label={`Bild ${i + 1} anzeigen`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={`relative shrink-0 border ${i === index ? 'border-pink-500 ring-2 ring-pink-500' : 'border-gray-200'} focus:outline-none`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${altBase || 'Bild'} Miniatur ${i + 1}`}
              className={`h-20 w-12 object-cover transition-all duration-500 ease-out ${loadedThumbs.has(i) ? 'blur-0 opacity-100' : 'blur-sm opacity-80'}`}
              loading="lazy"
              decoding="async"
              onLoad={() => setLoadedThumbs((prev) => new Set(prev).add(i))}
            />
          </button>
        ))}
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Bild Lightbox"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              closeLightbox()
            } else if (e.key === 'ArrowLeft') {
              e.preventDefault()
              prev()
            } else if (e.key === 'ArrowRight') {
              e.preventDefault()
              next()
            }
          }}
          tabIndex={0}
        >
          {/* Close */}
          <button
            type="button"
            aria-label="Schließen"
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 p-2"
          >
            ✕
          </button>

          {/* Prev/Next in overlay */}
          <button
            type="button"
            aria-label="Vorheriges Bild"
            onClick={prev}
            className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label="Nächstes Bild"
            onClick={next}
            className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="max-w-[90vw] max-h-[90vh] relative">
            {!loadedLightbox.has(index) && (
              <div className="absolute inset-0 bg-white/5 animate-pulse" />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cleanImages[index]}
              alt={`${altBase || 'Bild'} ${index + 1}/${cleanImages.length}`}
              className={`w-full h-full object-contain transition-all duration-500 ease-out ${loadedLightbox.has(index) ? 'blur-0 opacity-100' : 'blur-sm opacity-80'}`}
              loading="lazy"
              decoding="async"
              onLoad={() => setLoadedLightbox((prev) => new Set(prev).add(index))}
            />
          </div>
        </div>
      )}
    </div>
  )
}

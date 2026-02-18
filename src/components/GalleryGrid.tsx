"use client"

import React, { useCallback, useEffect, useState } from "react"

type Props = {
  images: string[]
  altBase?: string
  className?: string
}

export default function GalleryGrid({ images, altBase, className = "" }: Props) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState<number>(0)
  const [originalSize, setOriginalSize] = useState(true)

  // Build an absolute URL for the image (handles relative /uploads/... paths)
  const toAbsoluteUrl = (u: string): string => {
    if (!u) return ""
    if (/^https?:\/\//i.test(u)) return u
    try {
      if (typeof window !== 'undefined') {
        return new URL(u, window.location.origin).toString()
      }
    } catch {}
    return u
  }

  // Use Google Lens upload-by-URL to trigger reverse image search directly
  const googleLensUrl = (u: string): string => {
    const abs = toAbsoluteUrl(u)
    return `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(abs)}`
  }

  const openAt = (i: number) => {
    setIndex(i)
    setOriginalSize(true)
    setOpen(true)
  }

  const close = () => setOpen(false)

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length)
  }, [images.length])

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % images.length)
  }, [images.length])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, prev, next])

  if (!images || images.length === 0) return null

  return (
    <>
      <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 ${className}`}>
        {images.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => openAt(i)}
            className="relative aspect-[3/4] bg-gray-200 overflow-hidden group"
            aria-label="Bild in voller Größe ansehen"
          >
            {/* Google Reverse Image Search badge */}
            <a
              href={googleLensUrl(src)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute top-1 right-1 z-10 px-2 py-1 text-[10px] tracking-widest uppercase border border-white/70 bg-white/90 text-gray-800 hover:bg-white hover:border-white shadow-sm"
              title="Google Check"
              aria-label="Google Check (Rückwärts-Bildersuche)"
            >
              GOOGLE CHECK
            </a>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={altBase ?? ''} className="w-full h-full object-cover group-hover:opacity-95 transition-opacity" />
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex flex-col"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-3 p-3 text-white text-xs tracking-widest">
            <div className="flex items-center gap-2">
              <span>{index + 1} / {images.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={googleLensUrl(images[index])}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 border border-white/30 hover:border-white rounded-none"
                onClick={(e) => e.stopPropagation()}
                title="Google Check (Rückwärts-Bildersuche)"
                aria-label="Google Check (Rückwärts-Bildersuche)"
              >
                GOOGLE CHECK
              </a>
              <a
                href={images[index]}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 border border-white/30 hover:border-white rounded-none"
                onClick={(e) => e.stopPropagation()}
              >
                IN NEUEM TAB
              </a>
              <button
                className="px-3 py-1 border border-white/30 hover:border-white rounded-none"
                onClick={(e) => {
                  e.stopPropagation()
                  setOriginalSize((v) => !v)
                }}
              >
                {originalSize ? "ANPASSEN" : "ORIGINALGRÖSSE"}
              </button>
              <button
                className="px-3 py-1 border border-white/30 hover:border-white rounded-none"
                onClick={(e) => {
                  e.stopPropagation()
                  close()
                }}
              >
                SCHLIEßEN
              </button>
            </div>
          </div>

          {/* Image Area */}
          <div className="relative flex-1 overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 flex items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[index]}
                alt={altBase ?? ''}
                className={originalSize ? "max-w-none" : "max-h-[85vh] max-w-[95vw] object-contain"}
              />
            </div>

            {/* Navigation Controls */}
            {images.length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white"
                  onClick={prev}
                  aria-label="Vorheriges Bild"
                >
                  ‹
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white"
                  onClick={next}
                  aria-label="Nächstes Bild"
                >
                  ›
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

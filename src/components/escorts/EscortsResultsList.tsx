"use client"

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import type { EscortItem } from '@/types/escort'
import { BadgeCheck, ShieldCheck } from 'lucide-react'
import { LANGUAGES_DE } from '@/data/languages.de'
import { SERVICES_DE } from '@/data/services.de'

export type EscortsResultsListProps = {
  items: EscortItem[] | null
  loading: boolean
  total: number | null
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

const LANGUAGE_LABELS = new Map(LANGUAGES_DE.map((o) => [o.value, o.label]))
const SERVICE_LABELS = new Map(SERVICES_DE.map((o) => [o.value, o.label]))

function formatLanguage(val: string): string {
  return LANGUAGE_LABELS.get(val) || val
}

function titleCaseFallback(s: string): string {
  return s
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatService(val: string): string {
  return SERVICE_LABELS.get(val) || titleCaseFallback(val)
}

function EscortListRow({ e }: { e: EscortItem }) {
  const slug = e.name ? slugify(e.name) : 'escort'
  const href = `/escorts/${e.id}/${slug}`
  const isWeek = Boolean((e as any)?.isEscortOfWeek) || (Array.isArray((e as any)?.badges) && (e as any).badges.includes('ESCORT_OF_WEEK'))
  const isMonth = Boolean((e as any)?.isEscortOfMonth) || (Array.isArray((e as any)?.badges) && (e as any).badges.includes('ESCORT_OF_MONTH'))
  const highlightLabel = isMonth ? 'ESCORT OF THE MONTH' : (isWeek ? 'ESCORT OF THE WEEK' : null)
  const isNew = (() => {
    const ts = (e as any)?.createdAt
    if (!ts) return false
    const t = new Date(ts as any).getTime()
    if (!t) return false
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
    return Date.now() - t <= SEVEN_DAYS
  })()

  const images = useMemo(() => {
    const arr: string[] = []
    if (e.image) arr.push(e.image)
    if (Array.isArray(e.gallery)) arr.push(...e.gallery)
    return Array.from(new Set(arr)).filter(Boolean)
  }, [e.image, e.gallery])
  const [sel, setSel] = useState(0)
  const main = images[sel] || null
  const thumbs = images.slice(1, 8)

  return (
    <div className="p-4 md:p-5 border border-gray-200 bg-white flex flex-col gap-6 md:grid md:grid-cols-[auto_1fr] md:gap-8 md:items-center">
      {/* Image area: main + vertical thumbs */}
      <div className="md:flex items-start md:items-center gap-4 w-full">
        <Link href={href} className="block flex-shrink-0 w-full md:w-auto">
          <div className="relative h-80 w-full sm:h-96 md:h-96 md:w-72 lg:w-80 bg-gray-200 border border-gray-200 overflow-hidden shadow-sm">
            {main ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={main} alt={e.name ?? ''} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gray-300" />
            )}
            {isNew && (
              <div className="absolute top-2 right-2 z-10">
                <span title="Neu" className="inline-flex items-center gap-1 h-6 px-2 bg-white/90 border border-pink-200 text-pink-600 text-[10px] font-semibold tracking-widest">
                  <span className="h-2 w-2 rounded-full bg-pink-600"></span>
                  NEU
                </span>
              </div>
            )}
          </div>
        </Link>
        {/* Mobile thumbs below main image */}
        {thumbs.length > 0 && (
          <div className="mt-3 grid grid-cols-5 gap-2 w-full md:hidden">
            {thumbs.map((url, i) => (
              <button
                key={`${e.id}-mthumb-${i}`}
                onMouseEnter={() => setSel(i + 1)}
                onFocus={() => setSel(i + 1)}
                onClick={() => setSel(i + 1)}
                className={`relative block ring-1 ${sel === i + 1 ? 'ring-pink-500' : 'ring-gray-200'}`}
                aria-label="Vorschaubild anzeigen"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Thumbnail" className="h-16 w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        {thumbs.length > 0 && (
          <div className="hidden md:flex flex-col gap-2 h-96 w-20 overflow-hidden self-center">
            {thumbs.map((url, i) => (
              <button
                key={`${e.id}-thumb-${i}`}
                onMouseEnter={() => setSel(i + 1)}
                onFocus={() => setSel(i + 1)}
                onClick={() => setSel(i + 1)}
                className={`relative block ring-1 ${sel === i + 1 ? 'ring-pink-500' : 'ring-gray-200'}`}
                aria-label="Vorschaubild anzeigen"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Thumbnail" className="h-12 w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        {/* Divider between images and info (md+) */}
        <div className="hidden md:block w-px bg-gray-200" />
      </div>

      {/* Info area */}
      <div className="flex-1 min-w-0 flex flex-col self-center space-y-2 md:space-y-3">
        {/* Name */}
        <div className="flex items-center gap-2">
          <Link href={href} className="block">
            <h3 className="text-base font-medium tracking-widest text-gray-900">
              {(e.name?.toUpperCase?.() ?? e.name) || '—'}
            </h3>
          </Link>
          {e.isVerified && <BadgeCheck className="h-4 w-4 text-pink-500 flex-shrink-0" />}
          {(e.isAgeVerified || e.isVerified) && <ShieldCheck className="h-4 w-4 text-rose-600 flex-shrink-0" />}
          {highlightLabel && (
            <span className={`ml-2 text-[10px] uppercase tracking-widest font-medium ${isMonth ? 'text-amber-600' : 'text-pink-600'}`}>{highlightLabel}</span>
          )}
        </div>
        {/* Slogan */}
        {e.slogan && (
          <div className="mt-1 text-sm text-gray-900">{e.slogan}</div>
        )}
        {/* Standort */}
        {(e.locationFormatted || e.city || e.country) && (
          <div className="mt-1 text-sm text-gray-700">{e.locationFormatted || e.city || e.country}</div>
        )}
        {/* Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {typeof e.age === 'number' && e.age > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs border border-gray-300 text-gray-700 uppercase tracking-widest">
              {e.age} Jahre
            </span>
          )}
          {Array.isArray(e.languages) && e.languages.slice(0, 3).map((lang, i) => (
            <span key={`lang-${e.id}-${i}`} className="inline-flex items-center px-2 py-0.5 text-xs border border-pink-300 text-pink-700">
              {formatLanguage(String(lang))}
            </span>
          ))}
          {Array.isArray(e.services) && e.services.slice(0, 3).map((srv, i) => (
            <span key={`srv-${e.id}-${i}`} className="inline-flex items-center px-2 py-0.5 text-xs border border-gray-300 text-gray-700">
              {formatService(String(srv))}
            </span>
          ))}
        </div>
        {/* Actions under info: on mobile, 'Speichern' + 'Nachricht' side-by-side */}
        <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <Link
            href={href}
            className="inline-flex items-center justify-center px-3 py-2 w-full md:w-auto text-sm uppercase tracking-widest bg-pink-600 text-white hover:bg-pink-700"
          >
            Profil anzeigen
          </Link>
          <div className="grid grid-cols-2 gap-2 md:flex md:flex-row md:gap-3 w-full md:w-auto">
            <button
              type="button"
              className="inline-flex items-center justify-center px-3 py-2 w-full md:w-auto text-sm uppercase tracking-widest border border-gray-300 text-gray-800 bg-white hover:bg-gray-50"
            >
              Speichern
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center px-3 py-2 w-full md:w-auto text-sm uppercase tracking-widest border border-pink-300 text-pink-700 bg-white hover:bg-pink-50"
            >
              Nachricht
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EscortsResultsList({ items, loading, total }: EscortsResultsListProps) {
  return (
    <section className="py-6 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-light tracking-widest text-gray-800">ERGEBNISSE (LISTE)</h2>
          {typeof total === 'number' && (
            <span className="text-xs text-gray-500">{total} Treffer</span>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {loading && !items && (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="py-4 flex gap-4 items-center">
                <div className="h-24 w-18 bg-gray-200 animate-pulse border border-gray-200" />
                <div className="flex-1">
                  <div className="h-4 w-1/3 bg-gray-200 animate-pulse" />
                  <div className="h-3 w-1/4 bg-gray-100 mt-2 animate-pulse" />
                </div>
              </div>
            ))
          )}

          {items?.map((e) => (
            <EscortListRow key={e.id} e={e} />
          ))}

          {!loading && items?.length === 0 && (
            <div className="text-center text-sm text-gray-500 py-10">
              Keine Ergebnisse gefunden. Passe deine Suche an.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

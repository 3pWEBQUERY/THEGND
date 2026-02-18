'use client'

import React, { useRef } from 'react'
import { ProfileViewPreview } from '@/components/ProfileFeed'

type Variant = 'STANDARD' | 'ALT1' | 'ALT2' | 'FULL_SIDE'

type Props = {
  selected: Variant | null
  onChange: (v: Variant) => void
  onSave: () => void
  saving: boolean
  savedAt?: number | null
  onEdit?: () => void
}

export default function ProfileViewSelector({ selected, onChange, onSave, saving, savedAt, onEdit }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const scrollBy = (dir: -1 | 1) => {
    const el = trackRef.current
    if (!el) return
    const w = el.clientWidth
    el.scrollBy({ left: dir * (w * 0.9), behavior: 'smooth' })
  }
  const variants = ['STANDARD','ALT1','ALT2','FULL_SIDE'] as const
  return (
    <div className="bg-white border border-gray-100 rounded-none">
      <div className="p-4 sm:p-8">
        <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-1">PROFILANSICHT</h3>
        <p className="text-sm text-gray-600 mb-4">Wähle eine von vier Ansichten für dein öffentliches Escort-Profil aus. Die Auswahl wird gespeichert und auf deiner Profilseite verwendet.</p>
        <div className="relative">
          <button type="button" aria-label="Vorherige Ansicht" onClick={() => scrollBy(-1)} className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center border border-gray-200 bg-white text-gray-700 hover:border-pink-500">
            ‹
          </button>
          <div ref={trackRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth px-1 no-scrollbar">
            {variants.map((key) => (
              <label key={key} className={`${selected === key ? 'border border-pink-500' : 'group border border-gray-200 hover:border-pink-500 hover:bg-pink-50/40'} p-4 cursor-pointer flex-shrink-0 w-[85vw] sm:w-[420px] snap-center transition-colors`}>
                <ProfileViewPreview variant={key as any} />
                <div className="flex items-center gap-3 mt-3">
                  <input type="radio" name="profile-view" className="accent-pink-500" checked={selected === key} onChange={() => onChange(key)} />
                  <div>
                    <div className="text-sm font-light tracking-widest text-gray-800 transition-colors group-hover:text-pink-600">{key === 'STANDARD' ? 'STANDARD' : key === 'ALT1' ? 'ANSICHT 1' : key === 'ALT2' ? 'ANSICHT 2' : 'FULL SIZE'}</div>
                    <div className="text-xs text-gray-500 transition-colors group-hover:text-pink-500">{key === 'STANDARD' ? 'Aktuelle Standard-Ansicht' : key === 'ALT1' ? 'Kompakte Seitenleiste + Tabs' : key === 'ALT2' ? 'Großes Hero + Sektionen' : 'Full Side: Großes Bild links, Details rechts'}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
          <button type="button" aria-label="Nächste Ansicht" onClick={() => scrollBy(1)} className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center border border-gray-200 bg-white text-gray-700 hover:border-pink-500">
            ›
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={onSave} disabled={!selected || saving} className={`px-5 py-2 text-xs tracking-widest uppercase ${saving ? 'bg-pink-400' : 'bg-pink-500 hover:bg-pink-600'} text-white`}>
            {saving ? 'SPEICHERN…' : 'AUSWAHL SPEICHERN'}
          </button>
          {onEdit && (
            <button type="button" onClick={onEdit} className="px-5 py-2 text-xs tracking-widest uppercase border border-gray-300 hover:border-pink-500 text-gray-800">
              ANSICHT BEARBEITEN
            </button>
          )}
          {savedAt && (
            <span className="text-xs text-emerald-600">Gespeichert</span>
          )}
        </div>
      </div>
    </div>
  )
}

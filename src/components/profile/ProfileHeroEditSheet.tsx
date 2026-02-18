'use client'

import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'

export default function ProfileHeroEditSheet(props: {
  open: boolean
  onOpenChange: (v: boolean) => void
  profile: any
  heroGridItems: Array<{ type: 'image' | 'video'; url: string; thumbnail?: string }>
  uploadingHero: boolean
  onUploadHero: (file: File) => void
  heroMobileLayout: 'cover' | 'half' | 'compact'
  setHeroMobileLayout: (v: 'cover' | 'half' | 'compact') => void
  onSetHeroImage: (url: string) => void
  onSaveHeroPrefs: () => void
  savingHeroPrefs: boolean
}) {
  const {
    open,
    onOpenChange,
    profile,
    heroGridItems,
    uploadingHero,
    onUploadHero,
    heroMobileLayout,
    setHeroMobileLayout,
    onSetHeroImage,
    onSaveHeroPrefs,
    savingHeroPrefs,
  } = props

  const heroCurrent = ((profile as any)?.preferences?.hero?.imageUrl) || null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="bg-white border-l border-gray-200"
        style={{ width: 'min(96vw, 1080px)', maxWidth: 'none' }}
      >
        <SheetHeader className="p-6">
          <SheetTitle className="text-lg font-thin tracking-wider text-gray-800">ANSICHT BEARBEITEN</SheetTitle>
          <div className="text-sm text-gray-600">Passe das Hero-Bild und die mobile Hero-Ansicht deines öffentlichen Profils an.</div>
        </SheetHeader>
        <div className="px-6 pb-6 space-y-8 overflow-y-auto">
          {/* Hero Image Picker */}
          <div>
            <div className="text-xs font-light tracking-widest text-gray-600 mb-2">HERO-BILD</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {heroGridItems.map((item, idx) => {
                const url = item.url
                const isActive = !!url && url === heroCurrent
                const isVideo = item.type === 'video'
                return (
                  <button
                    key={url + '-' + idx}
                    type="button"
                    onClick={() => !isVideo && url && onSetHeroImage(url)}
                    className={`relative aspect-[3/4] border ${isActive ? 'border-pink-500' : 'border-gray-200'} overflow-hidden group ${isVideo ? 'opacity-50 cursor-not-allowed' : 'hover:border-pink-500'}`}
                    title={isVideo ? 'Videos können nicht als Hero-Bild gesetzt werden' : (isActive ? 'Aktuelles Hero-Bild' : 'Als Hero-Bild setzen')}
                  >
                    {item.type === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="Hero Auswahl" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-500">Video</div>
                    )}
                    {isActive && (
                      <span className="absolute top-1 right-1 bg-pink-500 text-white text-[10px] px-1 py-0.5">AKTIV</span>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="mt-2 text-xs text-gray-500">Tipp: Wähle ein vertikales Bild für die beste Darstellung.</div>
            <div className="mt-3">
              <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-xs tracking-widest uppercase text-gray-800 hover:border-pink-500 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) onUploadHero(f)
                  }}
                />
                {uploadingHero ? 'HOCHLADEN…' : 'EIGENES BILD HOCHLADEN'}
              </label>
              {uploadingHero && <span className="ml-2 text-xs text-gray-500">Bitte warten…</span>}
            </div>
          </div>

          {/* Mobile Hero Layout */}
          <div>
            <div className="text-xs font-light tracking-widest text-gray-600 mb-2">MOBILE HERO-ANSICHT</div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-800">
                <input type="radio" name="mobile-hero" className="accent-pink-500" checked={heroMobileLayout === 'cover'} onChange={() => setHeroMobileLayout('cover')} />
                Vollbild (empfohlen)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-800">
                <input type="radio" name="mobile-hero" className="accent-pink-500" checked={heroMobileLayout === 'half'} onChange={() => setHeroMobileLayout('half')} />
                Halb-Höhe
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-800">
                <input type="radio" name="mobile-hero" className="accent-pink-500" checked={heroMobileLayout === 'compact'} onChange={() => setHeroMobileLayout('compact')} />
                Kompakt
              </label>
            </div>
          </div>
        </div>
        <SheetFooter className="p-6">
          <button
            type="button"
            onClick={onSaveHeroPrefs}
            disabled={savingHeroPrefs}
            className={`px-5 py-2 text-xs tracking-widest uppercase ${savingHeroPrefs ? 'bg-pink-400' : 'bg-pink-500 hover:bg-pink-600'} text-white`}
          >
            {savingHeroPrefs ? 'SPEICHERN…' : 'EINSTELLUNGEN SPEICHERN'}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

'use client'

import React, { useState } from 'react'
import { Wand2 } from 'lucide-react'
import ProfileTabsBar from '@/components/profile/ProfileTabsBar'
import ProfileAboutTab from '@/components/profile/ProfileAboutTab'
import ProfilePosts from '@/components/profile/ProfilePosts'
import ProfileGalleryGrid from '@/components/profile/ProfileGalleryGrid'
import ProfileContactInfo from '@/components/profile/ProfileContactInfo'
import ProfileVisitorsTab from '@/components/profile/ProfileVisitorsTab'

export default function ProfileTabs(props: {
  active: string
  onChange: (key: string) => void
  profile: any
  userType: any
  user: { posts: any[]; followers: any[]; following: any[]; stories: any[] }
  displayName: string
  avatar?: string | null
  mediaItems: any[]
  isOwnProfile: boolean
  settingAvatarUrl: string | null
  deletingIndex: number | null
  onSetAvatar: (url: string) => void
  onDelete: (item: any, index: number) => void
  onOpenLightbox: (index: number) => void
  visitors: any[] | null
}) {
  const {
    active,
    onChange,
    profile,
    userType,
    user,
    displayName,
    avatar,
    mediaItems,
    isOwnProfile,
    settingAvatarUrl,
    deletingIndex,
    onSetAvatar,
    onDelete,
    onOpenLightbox,
    visitors,
  } = props

  const [aiInfoOpen, setAiInfoOpen] = useState(false)

  return (
    <div className="bg-white border border-gray-100 rounded-none">
      <ProfileTabsBar active={active as any} onChange={onChange} />
      <div className="p-4 sm:p-8">
        {active === 'about' && (
          <ProfileAboutTab profile={profile} userType={userType} />
        )}
        {active === 'posts' && (
          <ProfilePosts posts={user.posts} displayName={displayName} avatar={avatar} />
        )}
        {active === 'gallery' && (
          <>
            {isOwnProfile && userType === 'ESCORT' && (
              <div className="relative mb-6 rounded-none border border-pink-200 border-l-2 border-l-pink-400 bg-gradient-to-r from-pink-50 to-white p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 min-h-[140px] sm:min-h-[160px]">
                <div className="flex items-start gap-4">
                  <div className="hidden sm:flex items-center justify-center h-10 w-10 bg-pink-600 text-white">
                    <Wand2 className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="inline-block mb-1 text-[10px] uppercase tracking-widest text-white bg-pink-600 px-2 py-0.5">NEU</span>
                    <h3 className="text-lg md:text-xl font-light tracking-wider text-gray-900 mb-0.5">BILDER PER KI VERBESSERN</h3>
                    <p className="text-xs md:text-sm font-light tracking-wide text-gray-700">Verbessere deine Fotos automatisch – mehr Schärfe, bessere Farben und weniger Rauschen – mit nur einem Klick.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAiInfoOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm uppercase tracking-widest bg-pink-600 text-white hover:bg-pink-700 shadow-sm transition"
                >
                  <Wand2 className="h-4 w-4" />
                  JETZT VERBESSERN
                </button>
              </div>
            )}
            <ProfileGalleryGrid
              mediaItems={mediaItems as any}
              isOwnProfile={isOwnProfile}
              currentAvatarUrl={avatar || null}
              settingAvatarUrl={settingAvatarUrl}
              deletingIndex={deletingIndex}
              onSetAvatar={(url) => onSetAvatar(url)}
              onDelete={(item, index) => onDelete(item, index)}
              onOpenLightbox={(index) => onOpenLightbox(index)}
            />
            {aiInfoOpen && (
              <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
                <div className="bg-white w-full max-w-lg border border-gray-200">
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-thin tracking-widest text-gray-800 uppercase">KI‑Bildverbesserung</h3>
                    <p className="text-sm text-gray-700">Mit der KI kannst du deine Fotos mit einem Klick verbessern. Folgende Funktionen sind geplant:</p>
                    <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                      <li>Automatische Optimierung: Schärfe, Kontrast, Rauschen</li>
                      <li>Retusche & Hintergrund‑Optimierung (in Arbeit)</li>
                      <li>Serienverarbeitung mehrerer Bilder (in Arbeit)</li>
                    </ul>
                    <div className="text-xs text-gray-500">Diese Funktion befindet sich noch in Arbeit. Verfügbarkeit folgt in Kürze.</div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setAiInfoOpen(false)}
                        className="px-4 py-2 text-xs uppercase tracking-widest border border-gray-300 text-gray-700 hover:border-pink-500 hover:text-pink-600"
                      >
                        Schließen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {active === 'contact' && profile && (
          <ProfileContactInfo profile={profile} city={profile?.city} country={profile?.country} />
        )}
        {active === 'visitors' && (
          <ProfileVisitorsTab visitors={visitors || []} />
        )}
      </div>
    </div>
  )
}

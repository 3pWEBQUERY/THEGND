'use client'

import { User, Trash2, Camera } from 'lucide-react'

export type MediaItem = {
  type: 'image' | 'video'
  url: string
  thumbnail?: string
  source?: 'media' | 'gallery'
}

type Props = {
  mediaItems: MediaItem[]
  isOwnProfile: boolean
  currentAvatarUrl?: string | null
  settingAvatarUrl: string | null
  deletingIndex: number | null
  onSetAvatar: (url: string) => void
  onDelete: (item: any, index: number) => void
  onOpenLightbox: (index: number) => void
}

export default function ProfileGalleryGrid({ mediaItems, isOwnProfile, currentAvatarUrl, settingAvatarUrl, deletingIndex, onSetAvatar, onDelete, onOpenLightbox }: Props) {
  if (!mediaItems || mediaItems.length === 0) {
    return (
      <div className="text-center py-12">
        <Camera className="h-16 w-16 mx-auto mb-6 opacity-30 text-gray-400" />
        <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-4">KEINE MEDIEN</h3>
        <div className="w-12 h-px bg-pink-500 mx-auto mb-4"></div>
        <p className="text-sm font-light tracking-wide text-gray-500">Keine Bilder oder Videos vorhanden</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {mediaItems.map((item, index) => (
        <div
          key={index}
          className="relative group aspect-square overflow-hidden bg-black/5 cursor-pointer"
          onClick={() => onOpenLightbox(index)}
        >
          {item.type === 'video' ? (
            <video
              src={item.url}
              className="w-full h-full object-cover"
              muted
              playsInline
              poster={item.thumbnail || undefined}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.url}
              alt={`Media ${index + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          )}
          {isOwnProfile && (
            <div className="absolute top-2 right-2 flex gap-1">
              {item.type === 'image' && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onSetAvatar(item.url) }}
                  disabled={settingAvatarUrl !== null}
                  className={`text-[10px] uppercase tracking-widest bg-white/90 border px-2 py-0.5 ${currentAvatarUrl === item.url ? 'border-emerald-300 text-emerald-700' : 'border-gray-300 text-gray-700 hover:border-pink-500 hover:text-pink-600'}`}
                  title="Als Profilbild setzen"
                >
                  <User className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(item, index) }}
                disabled={deletingIndex === index}
                className="text-[10px] uppercase tracking-widest bg-white/90 border border-gray-300 px-2 py-0.5 hover:border-rose-300 hover:text-rose-700"
                title="Löschen"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

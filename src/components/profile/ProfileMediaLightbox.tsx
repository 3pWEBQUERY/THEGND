'use client'

import { X } from 'lucide-react'

type MediaItem = {
  type: 'image' | 'video'
  url: string
  thumbnail?: string
}

type Props = {
  open: boolean
  item: MediaItem | null
  onClose: () => void
}

export default function ProfileMediaLightbox({ open, item, onClose }: Props) {
  if (!open || !item) return null
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="relative max-w-5xl w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <button
          className="absolute -top-4 -right-4 bg-white text-gray-700 hover:text-black p-2 shadow"
          onClick={onClose}
          aria-label="Schließen"
        >
          <X className="h-5 w-5" />
        </button>
        {item.type === 'video' ? (
          <video
            src={item.url}
            className="max-h-[90vh] max-w-[90vw]"
            controls
            autoPlay
            poster={item.thumbnail || undefined}
          />
        ) : (
          <img
            src={item.url}
            alt="Media"
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
        )}
      </div>
    </div>
  )
}

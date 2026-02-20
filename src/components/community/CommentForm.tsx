'use client'

import { useState, useRef } from 'react'
import { useUploadThing } from '@/utils/uploadthing'
import { cn } from '@/lib/utils'
import {
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
  Video,
  X,
  Plus,
} from 'lucide-react'

const COMMENT_TYPES = [
  { key: 'TEXT', label: 'Text', icon: FileText },
  { key: 'LINK', label: 'Link', icon: LinkIcon },
  { key: 'IMAGE', label: 'Bild', icon: ImageIcon },
  { key: 'VIDEO', label: 'Video', icon: Video },
] as const

type CommentType = (typeof COMMENT_TYPES)[number]['key']

interface CommentFormProps {
  postId: string
  parentId?: string | null
  placeholder?: string
  submitLabel?: string
  onSuccess?: () => void
  onCancel?: () => void
  compact?: boolean
}

export default function CommentForm({
  postId,
  parentId,
  placeholder = 'Kommentar schreiben...',
  submitLabel = 'Kommentieren',
  onSuccess,
  onCancel,
  compact = false,
}: CommentFormProps) {
  const [type, setType] = useState<CommentType>('TEXT')
  const [content, setContent] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { startUpload, isUploading } = useUploadThing('forumAssets')

  const handleImageUpload = async (files: FileList) => {
    try {
      const result = await startUpload(Array.from(files))
      if (result) setImages((prev) => [...prev, ...result.map((r) => r.url)])
    } catch {
      setError('Bild-Upload fehlgeschlagen')
    }
  }

  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx))

  const canSubmit = () => {
    if (loading || isUploading) return false
    switch (type) {
      case 'TEXT':
        return !!content.trim()
      case 'LINK':
        return !!linkUrl.trim()
      case 'IMAGE':
        return images.length > 0
      case 'VIDEO':
        return !!videoUrl.trim()
    }
  }

  const submit = async () => {
    if (!canSubmit()) return
    setLoading(true)
    setError(null)

    const body: Record<string, unknown> = {
      content: content.trim() || undefined,
      type,
      parentId: parentId || undefined,
    }

    if (type === 'LINK') body.linkUrl = linkUrl.trim()
    if (type === 'IMAGE') body.images = images
    if (type === 'VIDEO') body.videoUrl = videoUrl.trim()

    try {
      const res = await fetch(`/api/communities/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setContent('')
        setLinkUrl('')
        setVideoUrl('')
        setImages([])
        setType('TEXT')
        onSuccess?.()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Fehler beim Senden')
      }
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-gray-200 bg-white">
      {/* Type tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {COMMENT_TYPES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setType(key)}
            className={cn(
              'flex items-center gap-1 px-3 py-2 text-[10px] uppercase tracking-widest font-light transition-colors whitespace-nowrap border-b-2 flex-1',
              type === key
                ? 'border-pink-500 text-pink-600 bg-pink-50/30'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50',
            )}
          >
            <Icon className={cn('h-3.5 w-3.5', compact && 'h-3 w-3')} />
            {label}
          </button>
        ))}
      </div>

      <div className="p-3 space-y-2">
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-2">{error}</div>
        )}

        {/* Text / description */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={type === 'TEXT' ? placeholder : 'Beschreibung (optional)'}
          className="w-full border border-gray-200 p-2.5 text-sm resize-y min-h-[60px] focus:outline-none focus:border-pink-400"
          rows={compact ? 2 : 3}
        />

        {/* LINK input */}
        {type === 'LINK' && (
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">URL</label>
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              type="url"
              className="w-full border border-gray-200 p-2.5 text-sm focus:outline-none focus:border-pink-400"
            />
          </div>
        )}

        {/* IMAGE upload */}
        {type === 'IMAGE' && (
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Bilder</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleImageUpload(e.target.files)
              }}
            />
            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-2">
                {images.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={url} alt="" className="h-16 w-16 object-cover border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="text-xs uppercase tracking-widest border border-gray-200 px-3 py-1.5 hover:bg-gray-50 flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              {isUploading ? 'Lädt hoch...' : 'Bilder hinzufügen'}
            </button>
          </div>
        )}

        {/* VIDEO input */}
        {type === 'VIDEO' && (
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Video URL</label>
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/... oder direkter Video-Link"
              type="url"
              className="w-full border border-gray-200 p-2.5 text-sm focus:outline-none focus:border-pink-400"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-700 px-3 py-1.5"
            >
              Abbrechen
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit()}
            className="bg-pink-500 hover:bg-pink-600 text-white text-[10px] font-light tracking-widest px-4 py-2 uppercase disabled:opacity-50"
          >
            {loading ? '...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

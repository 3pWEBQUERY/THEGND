'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUploadThing } from '@/utils/uploadthing'
import { cn } from '@/lib/utils'
import {
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
  BarChart2,
  Video,
  X,
  Plus,
} from 'lucide-react'

const POST_TYPES = [
  { key: 'TEXT', label: 'Text', icon: FileText },
  { key: 'LINK', label: 'Link', icon: LinkIcon },
  { key: 'IMAGE', label: 'Bild', icon: ImageIcon },
  { key: 'POLL', label: 'Umfrage', icon: BarChart2 },
  { key: 'VIDEO', label: 'Video', icon: Video },
] as const

type PostType = (typeof POST_TYPES)[number]['key']

interface PostFormProps {
  communitySlug: string
  flairs?: { id: string; name: string; color: string; textColor: string }[]
}

export default function PostForm({ communitySlug, flairs = [] }: PostFormProps) {
  const router = useRouter()
  const [type, setType] = useState<PostType>('TEXT')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [flairId, setFlairId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { startUpload, isUploading } = useUploadThing('forumAssets')

  const handleImageUpload = async (files: FileList) => {
    try {
      const result = await startUpload(Array.from(files))
      if (result) {
        setImages((prev) => [...prev, ...result.map((r) => r.url)])
      }
    } catch {
      setError('Bild-Upload fehlgeschlagen')
    }
  }

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const addPollOption = () => {
    if (pollOptions.length < 10) {
      setPollOptions((prev) => [...prev, ''])
    }
  }

  const removePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions((prev) => prev.filter((_, i) => i !== idx))
    }
  }

  const updatePollOption = (idx: number, value: string) => {
    setPollOptions((prev) => prev.map((o, i) => (i === idx ? value : o)))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError(null)

    const body: Record<string, unknown> = {
      title: title.trim(),
      type,
      flairId: flairId || undefined,
    }

    switch (type) {
      case 'TEXT':
        body.content = content.trim() || undefined
        break
      case 'LINK':
        if (!linkUrl.trim()) {
          setError('Link URL ist erforderlich')
          setLoading(false)
          return
        }
        body.linkUrl = linkUrl.trim()
        body.content = content.trim() || undefined
        break
      case 'IMAGE':
        if (images.length === 0) {
          setError('Mindestens ein Bild ist erforderlich')
          setLoading(false)
          return
        }
        body.images = images
        body.content = content.trim() || undefined
        break
      case 'POLL':
        const validOptions = pollOptions.filter((o) => o.trim())
        if (validOptions.length < 2) {
          setError('Mindestens 2 Optionen erforderlich')
          setLoading(false)
          return
        }
        body.pollOptions = validOptions.map((o) => o.trim())
        body.content = content.trim() || undefined
        break
      case 'VIDEO':
        if (!videoUrl.trim()) {
          setError('Video URL ist erforderlich')
          setLoading(false)
          return
        }
        body.videoUrl = videoUrl.trim()
        body.content = content.trim() || undefined
        break
    }

    try {
      const res = await fetch(`/api/communities/${communitySlug}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Fehler beim Erstellen')
        return
      }
      router.push(`/community/${communitySlug}/post/${data.post.id}`)
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="border border-gray-200 bg-white">
      {/* Type tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {POST_TYPES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setType(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-3 text-[10px] uppercase tracking-widest font-light transition-colors whitespace-nowrap border-b-2 flex-1',
              type === key
                ? 'border-pink-500 text-pink-600 bg-pink-50/30'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-2">{error}</div>
        )}

        {/* Title */}
        <div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel"
            maxLength={300}
            className="w-full border border-gray-200 p-2.5 text-sm focus:outline-none focus:border-pink-400"
            required
          />
          <p className="text-right text-[10px] text-gray-400 mt-0.5">{title.length}/300</p>
        </div>

        {/* Flair */}
        {flairs.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-widest text-gray-500">Flair:</span>
            <button
              type="button"
              onClick={() => setFlairId(null)}
              className={cn(
                'text-[10px] px-2 py-0.5 border transition-colors',
                !flairId
                  ? 'border-pink-400 text-pink-600 bg-pink-50'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300',
              )}
            >
              Keins
            </button>
            {flairs.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFlairId(f.id)}
                className={cn(
                  'text-[10px] uppercase tracking-widest px-2 py-0.5 border transition-colors',
                  flairId === f.id ? 'ring-1 ring-pink-400' : '',
                )}
                style={
                  flairId === f.id
                    ? { backgroundColor: f.color, color: f.textColor, borderColor: f.color }
                    : { borderColor: f.color, color: f.color }
                }
              >
                {f.name}
              </button>
            ))}
          </div>
        )}

        {/* TEXT content */}
        {(type === 'TEXT' || type === 'LINK' || type === 'IMAGE' || type === 'POLL' || type === 'VIDEO') && (
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={type === 'TEXT' ? 'Inhalt (Markdown unterstützt)' : 'Beschreibung (optional)'}
              className="w-full border border-gray-200 p-2.5 text-sm resize-y min-h-[120px] focus:outline-none focus:border-pink-400"
              rows={type === 'TEXT' ? 6 : 3}
            />
          </div>
        )}

        {/* LINK */}
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

        {/* IMAGE */}
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
                    <img src={url} alt="" className="h-20 w-20 object-cover border border-gray-200" />
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

        {/* POLL */}
        {type === 'POLL' && (
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">
              Optionen ({pollOptions.length}/10)
            </label>
            <div className="space-y-2">
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    value={opt}
                    onChange={(e) => updatePollOption(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    maxLength={120}
                    className="flex-1 border border-gray-200 p-2 text-sm focus:outline-none focus:border-pink-400"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removePollOption(idx)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {pollOptions.length < 10 && (
              <button
                type="button"
                onClick={addPollOption}
                className="mt-2 text-xs uppercase tracking-widest text-pink-600 hover:text-pink-700 flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Option hinzufügen
              </button>
            )}
          </div>
        )}

        {/* VIDEO */}
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

        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white text-xs font-light tracking-widest py-3 uppercase disabled:opacity-50"
        >
          {loading ? 'Wird gepostet...' : 'Beitrag veröffentlichen'}
        </button>
      </div>
    </form>
  )
}

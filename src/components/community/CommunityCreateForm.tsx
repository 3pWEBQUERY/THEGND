'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUploadThing } from '@/utils/uploadthing'

export default function CommunityCreateForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'PUBLIC' | 'RESTRICTED' | 'PRIVATE'>('PUBLIC')
  const [isNSFW, setIsNSFW] = useState(false)
  const [iconUrl, setIconUrl] = useState<string | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const iconInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const { startUpload, isUploading } = useUploadThing('forumAssets')

  const handleFileUpload = async (file: File, setter: (url: string) => void) => {
    try {
      const result = await startUpload([file])
      if (result?.[0]?.url) setter(result[0].url)
    } catch {
      setError('Upload fehlgeschlagen')
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          isNSFW,
          icon: iconUrl,
          banner: bannerUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Fehler beim Erstellen')
        return
      }
      router.push(`/community/${data.community.slug}`)
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="border border-gray-200 bg-white p-4 space-y-4">
      <h2 className="text-sm uppercase tracking-widest text-gray-900 font-light">
        Community erstellen
      </h2>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-2">{error}</div>
      )}

      {/* Name */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          placeholder="z.B. Fotografie"
          className="w-full border border-gray-200 p-2 text-sm focus:outline-none focus:border-pink-400"
          required
        />
        <p className="text-[10px] text-gray-400 mt-0.5">
          Community-Namen können nicht geändert werden.
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Beschreibung</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          placeholder="Worum geht es in dieser Community?"
          className="w-full border border-gray-200 p-2 text-sm resize-y min-h-[80px] focus:outline-none focus:border-pink-400"
          rows={3}
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Typ</label>
        <Select value={type} onValueChange={(v) => setType(v as any)}>
          <SelectTrigger className="rounded-none border-gray-200 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="PUBLIC">Öffentlich — Jeder kann sehen und posten</SelectItem>
            <SelectItem value="RESTRICTED">Eingeschränkt — Jeder kann sehen, nur Mitglieder posten</SelectItem>
            <SelectItem value="PRIVATE">Privat — Nur Mitglieder können sehen und posten</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Icon Upload */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Community Icon</label>
        <input
          ref={iconInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFileUpload(f, setIconUrl)
          }}
        />
        <div className="flex items-center gap-3">
          {iconUrl && (
            <img src={iconUrl} alt="" className="h-10 w-10 object-cover border border-gray-200" />
          )}
          <button
            type="button"
            onClick={() => iconInputRef.current?.click()}
            disabled={isUploading}
            className="text-xs uppercase tracking-widest border border-gray-200 px-3 py-1.5 hover:bg-gray-50"
          >
            {isUploading ? 'Lädt...' : 'Bild wählen'}
          </button>
        </div>
      </div>

      {/* Banner Upload */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Banner</label>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFileUpload(f, setBannerUrl)
          }}
        />
        <div>
          {bannerUrl && (
            <img src={bannerUrl} alt="" className="h-20 w-full object-cover border border-gray-200 mb-2" />
          )}
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            disabled={isUploading}
            className="text-xs uppercase tracking-widest border border-gray-200 px-3 py-1.5 hover:bg-gray-50"
          >
            {isUploading ? 'Lädt...' : 'Banner wählen'}
          </button>
        </div>
      </div>

      {/* NSFW */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="nsfw"
          checked={isNSFW}
          onChange={(e) => setIsNSFW(e.target.checked)}
          className="accent-pink-500"
        />
        <label htmlFor="nsfw" className="text-xs text-gray-600">
          NSFW (18+) Community
        </label>
      </div>

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full bg-pink-500 hover:bg-pink-600 text-white text-xs font-light tracking-widest py-3 uppercase disabled:opacity-50"
      >
        {loading ? 'Erstelle...' : 'Community erstellen'}
      </button>
    </form>
  )
}

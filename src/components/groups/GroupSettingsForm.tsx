'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { uploadFiles } from '@/utils/uploadthing'
import { useRef } from 'react'

export default function GroupSettingsForm({ group }: { group: { id: string; slug: string; name: string; description: string; privacy: 'PUBLIC' | 'PRIVATE'; cover?: string | null } }) {
  const router = useRouter()
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description || '')
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE'>(group.privacy)
  const [coverUrl, setCoverUrl] = useState<string | null>(group.cover || null)
  const [coverUploading, setCoverUploading] = useState(false)
  const coverInputRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/groups/${group.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, privacy, cover: coverUrl || null })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Speichern fehlgeschlagen')
      router.refresh()
    } catch (e: any) {
      alert(e?.message || 'Fehler')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {/* Cover */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Gruppenbild</label>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = (e.target.files && e.target.files[0]) || null
            if (!file) return
            try {
              setCoverUploading(true)
              const results = await uploadFiles('storyMedia', { files: [file] })
              const first = results.find((r: any) => typeof r?.url === 'string')
              if (first?.url) setCoverUrl(first.url as string)
            } finally {
              setCoverUploading(false)
              if (coverInputRef.current) coverInputRef.current.value = ''
            }
          }}
        />
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" className="rounded-none text-xs px-3 py-2" onClick={() => coverInputRef.current?.click()} disabled={coverUploading}>
            {coverUploading ? 'Lädt…' : (coverUrl ? 'Neu wählen' : 'Bild wählen')}
          </Button>
          {coverUrl && (
            <div className="flex items-center gap-2">
              <img src={coverUrl} alt="Gruppenbild" className="h-14 w-14 object-cover border" />
              <Button type="button" variant="outline" className="rounded-none text-xs px-3 py-2" onClick={() => setCoverUrl(null)}>Entfernen</Button>
            </div>
          )}
        </div>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Beschreibung</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm" rows={3} />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Sichtbarkeit</label>
        <Select value={privacy} onValueChange={(v) => setPrivacy(v as 'PUBLIC' | 'PRIVATE')}>
          <SelectTrigger className="w-full rounded-none border border-gray-300 px-3 py-2 text-sm">
            <SelectValue placeholder="Bitte wählen" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="PUBLIC">Öffentlich</SelectItem>
            <SelectItem value="PRIVATE">Privat</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <button type="submit" disabled={loading} className="px-3 py-2 text-sm border border-gray-300 hover:bg-gray-50">{loading ? '...' : 'Speichern'}</button>
      </div>
    </form>
  )
}

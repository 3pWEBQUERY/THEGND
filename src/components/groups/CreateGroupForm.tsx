'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { uploadFiles } from '@/utils/uploadthing'
import { useRef } from 'react'

export default function CreateGroupForm() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [coverUploading, setCoverUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const coverInputRef = useRef<HTMLInputElement | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, privacy, cover: coverUrl || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Erstellen fehlgeschlagen')
      router.push(`/groups/${data.group?.slug}`)
      router.refresh()
    } catch (e: any) {
      alert(e?.message || 'Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="border border-gray-200 bg-white p-4 space-y-3">
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
            <img src={coverUrl} alt="Gruppenbild" className="h-14 w-14 object-cover border" />
          )}
        </div>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm" placeholder="Gruppenname" />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Beschreibung</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm" placeholder="Worum geht es?" />
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
      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="px-3 py-2 text-sm border border-gray-300 hover:bg-gray-50">
          {loading ? '...' : 'GRUPPE ERSTELLEN'}
        </button>
      </div>
    </form>
  )
}

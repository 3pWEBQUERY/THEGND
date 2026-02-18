"use client"

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import IconPicker from '@/components/admin/IconPicker'
import { useUploadThing } from '@/utils/uploadthing'

type Category = {
  id: string
  name: string
  forums: { id: string; name: string }[]
}

export default function CreateForumForm({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [parentId, setParentId] = useState<string>('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sortOrder, setSortOrder] = useState<number>(0)
  const [isLocked, setIsLocked] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [icon, setIcon] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const { startUpload, isUploading } = useUploadThing('forumAssets')

  const parentOptions = useMemo(() => {
    const cat = categories.find((c) => c.id === categoryId)
    return cat?.forums || []
  }, [categories, categoryId])

  async function submit() {
    if (!categoryId || !name.trim()) {
      setMessage('Kategorie und Name erforderlich')
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      // Upload image first if present
      let finalImageUrl: string | null = imageUrl
      if (!finalImageUrl && imageFile) {
        const res = await startUpload([imageFile])
        finalImageUrl = (res && res[0] && ((res[0] as any).ufsUrl || (res[0] as any).url)) || null
        setImageUrl(finalImageUrl)
      }
      const res = await fetch('/api/acp/forum/forums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, parentId: parentId || undefined, name, description, sortOrder, isLocked, isHidden, icon, image: finalImageUrl }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Fehler beim Erstellen')
      setName('')
      setDescription('')
      setParentId('')
      setIsLocked(false)
      setIsHidden(false)
      setSortOrder(0)
      setIcon(null)
      setImageFile(null)
      setImageUrl(null)
      router.refresh()
    } catch (e: any) {
      setMessage(e?.message || 'Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-none p-4 space-y-3">
      <h3 className="text-sm font-medium text-gray-900">Forum erstellen</h3>
      {message && <p className="text-xs text-red-600">{message}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-700">Kategorie</label>
          <div className="mt-1">
            <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setParentId('') }}>
              <SelectTrigger className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-700">Übergeordnetes Forum (optional)</label>
          <div className="mt-1">
            <Select value={parentId || "__NONE__"} onValueChange={(v) => setParentId(v === "__NONE__" ? '' : v)}>
              <SelectTrigger className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__NONE__">— Kein —</SelectItem>
                <SelectGroup>
                  {parentOptions.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm"
      />
      <textarea
        placeholder="Beschreibung (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm"
      />
      <IconPicker value={icon || undefined} onChange={(v) => setIcon(v)} label="Icon" />
      <div>
        <label className="block text-sm text-gray-700 mb-1">Bild (optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0] || null
            setImageFile(f)
          }}
          className="block text-sm"
        />
        {(imageFile || imageUrl) && (
          <div className="mt-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl || (imageFile ? URL.createObjectURL(imageFile) : '')} alt="Vorschau" className="w-24 h-16 object-cover border border-gray-200" />
            <button type="button" onClick={() => { setImageFile(null); setImageUrl(null) }} className="px-2 py-1 text-xs border border-gray-300 rounded-none">Entfernen</button>
          </div>
        )}
        {isUploading && <div className="mt-1 text-xs text-gray-500">Lade Bild hoch…</div>}
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Sortierung</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(parseInt(e.target.value || '0', 10))}
            className="w-32 border border-gray-300 rounded-none px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-6 mt-1">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isLocked} onChange={(e) => setIsLocked(e.target.checked)} />
            Gesperrt
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isHidden} onChange={(e) => setIsHidden(e.target.checked)} />
            Versteckt
          </label>
        </div>
      </div>
      <div>
        <button onClick={submit} disabled={loading || isUploading} className="px-4 py-2 rounded-none border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60">
          {loading ? 'Erstelle…' : 'Erstellen'}
        </button>
      </div>
    </div>
  )
}

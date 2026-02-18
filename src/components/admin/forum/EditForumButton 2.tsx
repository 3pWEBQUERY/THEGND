"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import IconPicker from "@/components/admin/IconPicker"
import { useUploadThing } from "@/utils/uploadthing"

type Forum = {
  id: string
  name: string
  description?: string | null
  sortOrder: number
  isLocked: boolean
  isHidden: boolean
  parentId?: string | null
  categoryId: string
  icon?: string | null
}

type Category = {
  id: string
  name: string
  forums: { id: string; name: string }[]
}

export default function EditForumButton({ forum, categories }: { forum: Forum; categories: Category[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(forum.name)
  const [description, setDescription] = useState<string>(forum.description || "")
  const [sortOrder, setSortOrder] = useState<number>(forum.sortOrder || 0)
  const [isLocked, setIsLocked] = useState<boolean>(!!forum.isLocked)
  const [isHidden, setIsHidden] = useState<boolean>(!!forum.isHidden)
  const [parentId, setParentId] = useState<string>(forum.parentId || "__NONE__")
  const [icon, setIcon] = useState<string | null>(forum.icon || null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>((forum as any).image || null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { startUpload, isUploading } = useUploadThing('forumAssets')

  const parentOptions = useMemo(() => {
    const cat = categories.find(c => c.id === forum.categoryId)
    const opts = cat?.forums || []
    // Cannot select itself as parent
    return opts.filter(f => f.id !== forum.id)
  }, [categories, forum.categoryId, forum.id])

  const onSave = async () => {
    setSaving(true)
    setError(null)
    try {
      // Upload image first if changed
      let finalImageUrl: string | null = imageUrl
      if (imageFile) {
        const res = await startUpload([imageFile])
        finalImageUrl = (res && res[0] && ((res[0] as any).ufsUrl || (res[0] as any).url)) || null
        setImageUrl(finalImageUrl)
      }
      const res = await fetch(`/api/acp/forum/forums/${forum.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
          isLocked,
          isHidden,
          parentId: parentId === "__NONE__" ? null : parentId,
          icon: icon || null,
          image: finalImageUrl || null,
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Fehler beim Speichern')
      setOpen(false)
      router.refresh()
    } catch (e: any) {
      setError(e?.message || 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="px-3 py-1.5 text-xs border border-gray-300 hover:border-pink-500 rounded-none">Bearbeiten</button>
      {open && (
        <div className="fixed inset-0 z-50" aria-modal>
          <div className="relative z-10 w-full max-w-xl mx-auto mt-16 bg-white border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-900">Forum bearbeiten</div>
              <button onClick={() => setOpen(false)} className="text-xs border px-2 py-1">Schließen</button>
            </div>
            {error && <div className="text-xs text-red-600 mb-2">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-none px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Beschreibung</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 w-full border border-gray-300 rounded-none px-3 py-2 text-sm" />
              </div>
              <div>
                <IconPicker value={icon || undefined} onChange={setIcon} label="Icon" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Bild (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="block text-sm"
                />
                {(imageFile || imageUrl) && (
                  <div className="mt-2 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl || (imageFile ? URL.createObjectURL(imageFile) : '')} alt="Vorschau" className="w-28 h-20 object-cover border border-gray-200" />
                    <button type="button" onClick={() => { setImageFile(null); setImageUrl(null) }} className="px-2 py-1 text-xs border border-gray-300 rounded-none">Entfernen</button>
                  </div>
                )}
                {isUploading && <div className="mt-1 text-xs text-gray-500">Lade Bild hoch…</div>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Übergeordnetes Forum</label>
                  <Select value={parentId} onValueChange={(v) => setParentId(v)}>
                    <SelectTrigger className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NONE__">— Kein —</SelectItem>
                      <SelectGroup>
                        {parentOptions.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-700">Sortierung</label>
                  <input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value || '0', 10))} className="w-28 border border-gray-300 rounded-none px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={isLocked} onChange={(e) => setIsLocked(e.target.checked)} />
                  Gesperrt
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={isHidden} onChange={(e) => setIsHidden(e.target.checked)} />
                  Versteckt
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onSave} disabled={saving || isUploading} className="px-3 py-2 border text-xs hover:border-pink-500 disabled:opacity-60">{saving || isUploading ? 'Speichern…' : 'Speichern'}</button>
                <button onClick={() => setOpen(false)} className="px-3 py-2 border text-xs hover:border-pink-500">Abbrechen</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

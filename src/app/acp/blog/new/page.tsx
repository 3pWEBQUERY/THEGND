'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useUploadThing } from '@/utils/uploadthing'
import { renderMarkdownToSafeHtml } from '@/lib/markdown'
import CategorySelect from '@/components/blog/CategorySelect'

export default function AcpBlogNewPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [published, setPublished] = useState(false)
  const [category, setCategory] = useState<'AKTUELLES' | 'INTERESSANT_HEISSES' | 'VON_USER_FUER_USER'>('AKTUELLES')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [preview, setPreview] = useState(false)
  const { startUpload, isUploading } = useUploadThing('postImages')

  const submit = async () => {
    try {
      setSaving(true)
      setError(null)
      // If files selected and no coverImage yet, upload the first image as cover
      let cover = coverImage
      if (!cover && files.length > 0) {
        const res = await startUpload([files[0]])
        const url = res && res[0] ? (res[0] as any).ufsUrl || (res[0] as any).url : null
        if (url) cover = url
      }
      const res = await fetch('/api/acp/blog/posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug: slug || undefined, excerpt, content, coverImage: cover, published, category })
      })
      if (!res.ok) throw new Error((await res.json()).error || 'failed')
      const data = await res.json()
      router.push(`/acp/blog/${data.id}`)
    } catch (e: any) {
      setError(e?.message || 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-light tracking-widest text-gray-900">NEUER BLOG-BEITRAG</h1>
      {error && <p className="mt-3 text-sm text-amber-700">{error}</p>}
      <div className="mt-6 space-y-6">
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-800">Kategorie</label>
          <div className="mt-2">
            <CategorySelect
              name="category"
              defaultValue={category}
              onChange={(v) => setCategory(v as any)}
              options={[
                { value: 'AKTUELLES', label: 'AKTUELLES' },
                { value: 'INTERESSANT_HEISSES', label: 'INTERESSANT & HEISSES' },
                { value: 'VON_USER_FUER_USER', label: 'VON USER FÜR USER' },
              ]}
            />
          </div>
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-800">Titel</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full border-0 border-b-2 border-gray-200 py-2 text-sm bg-transparent outline-none focus:border-pink-500" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-800">Slug (optional)</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="mt-2 w-full border-0 border-b-2 border-gray-200 py-2 text-sm bg-transparent outline-none focus:border-pink-500" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-800">Kurzbeschreibung</label>
          <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} className="mt-2 w-full border-0 border-b-2 border-gray-200 py-2 text-sm bg-transparent outline-none focus:border-pink-500" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-800">Inhalt (Markdown/HTML)</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} className="mt-2 w-full border-0 border-b-2 border-gray-200 py-2 text-sm bg-transparent outline-none focus:border-pink-500" />
          <div className="mt-2">
            <button type="button" onClick={() => setPreview(v => !v)} className="text-[11px] uppercase tracking-widest text-gray-600 hover:underline">
              {preview ? 'Vorschau verbergen' : 'Vorschau anzeigen'}
            </button>
          </div>
          {preview && (
            <div className="mt-3 border border-gray-200 p-3 bg-gray-50 text-sm text-gray-800">
              <div dangerouslySetInnerHTML={{ __html: renderMarkdownToSafeHtml(content) }} />
            </div>
          )}
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-800">Cover Bild</label>
          <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="Bild-URL oder hochladen" className="mt-2 w-full border-0 border-b-2 border-gray-200 py-2 text-sm bg-transparent outline-none focus:border-pink-500" />
          <div className="mt-3 flex items-center gap-3">
            <input type="file" accept="image/*" onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files).slice(0,1) : [])} />
            <button type="button" disabled={isUploading || files.length === 0} onClick={async () => {
              if (files.length === 0) return
              const res = await startUpload([files[0]])
              const url = res && res[0] ? (res[0] as any).ufsUrl || (res[0] as any).url : null
              if (url) setCoverImage(url)
            }} className="px-3 py-2 text-xs uppercase tracking-widest border border-gray-300 hover:bg-pink-50/40 disabled:opacity-60">
              {isUploading ? 'Lade hoch…' : 'Hochladen'}
            </button>
          </div>
          {coverImage && (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImage} alt="Cover" className="w-full max-w-md h-40 object-cover border border-gray-200" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gray-800">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Veröffentlichen
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button disabled={saving || isUploading} onClick={submit} className="px-5 py-3 bg-pink-600 text-white text-xs uppercase tracking-widest rounded-none">{saving || isUploading ? 'Speichere…' : 'Speichern'}</button>
        </div>
      </div>
    </div>
  )
}

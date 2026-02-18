'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUploadThing } from '@/utils/uploadthing'
import { renderMarkdownToSafeHtml } from '@/lib/markdown'
import CategorySelect from '@/components/blog/CategorySelect'

export default function AcpBlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null)
  useEffect(() => { params.then(p => setId(p.id)) }, [params])

  const router = useRouter()
  const [post, setPost] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [coverFiles, setCoverFiles] = useState<File[]>([])
  const [preview, setPreview] = useState(false)
  const { startUpload, isUploading } = useUploadThing('postImages')

  const load = async (pid: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/acp/blog/posts/${pid}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('unauthorized or not found')
      setPost(await res.json())
    } catch (e) {
      setError('Laden fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (id) load(id) }, [id])

  const update = async () => {
    if (!id) return
    try {
      setSaving(true)
      setError(null)
      // If new cover file selected, upload it and patch post.coverImage
      let payload = { ...post }
      if (coverFiles.length > 0) {
        const resUp = await startUpload([coverFiles[0]])
        const url = resUp && resUp[0] ? (resUp[0] as any).ufsUrl || (resUp[0] as any).url : null
        if (url) payload = { ...payload, coverImage: url }
      }
      const res = await fetch(`/api/acp/blog/posts/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error((await res.json()).error || 'failed')
      const data = await res.json()
      setPost(data)
    } catch (e: any) {
      setError(e?.message || 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!id) return
    if (!confirm('Beitrag wirklich löschen?')) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/acp/blog/posts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'failed')
      router.push('/acp/blog')
    } catch (e: any) {
      setError(e?.message || 'Löschen fehlgeschlagen')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-light tracking-widest text-gray-900">BLOG-BEITRAG BEARBEITEN</h1>
      {error && <p className="mt-3 text-sm text-amber-700">{error}</p>}
      {loading || !post ? (
        <p className="mt-6 text-sm text-gray-500">Lade…</p>
      ) : (
        <div className="mt-6 space-y-6">
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-800">Kategorie</label>
            <div className="mt-2">
              <CategorySelect
                name="category"
                defaultValue={post.category || 'AKTUELLES'}
                onChange={(v) => setPost({ ...post, category: v })}
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
            <input value={post.title || ''} onChange={(e) => setPost({ ...post, title: e.target.value })} className="mt-2 w-full border-0 border-b-2 border-gray-200 py-2 text-sm bg-transparent outline-none focus:border-pink-500" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-800">Slug</label>
            <input value={post.slug || ''} onChange={(e) => setPost({ ...post, slug: e.target.value })} className="mt-2 w-full border-0 border-b-2 border-gray-200 py-2 text-sm bg-transparent outline-none focus:border-pink-500" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-800">Kurzbeschreibung</label>
            <textarea value={post.excerpt || ''} onChange={(e) => setPost({ ...post, excerpt: e.target.value })} rows={3} className="mt-2 w-full border-0 border-b-2 border-gray-200 py-2 text-sm bg-transparent outline-none focus:border-pink-500" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-800">Inhalt (Markdown/HTML)</label>
            <textarea value={post.content || ''} onChange={(e) => setPost({ ...post, content: e.target.value })} rows={12} className="mt-2 w-full border-0 border-b-2 border-gray-200 py-2 text-sm bg-transparent outline-none focus:border-pink-500" />
            <div className="mt-2">
              <button type="button" onClick={() => setPreview(v => !v)} className="text-[11px] uppercase tracking-widest text-gray-600 hover:underline">
                {preview ? 'Vorschau verbergen' : 'Vorschau anzeigen'}
              </button>
            </div>
            {preview && (
              <div className="mt-3 border border-gray-200 p-3 bg-gray-50 text-sm text-gray-800">
                <div dangerouslySetInnerHTML={{ __html: renderMarkdownToSafeHtml(post.content || '') }} />
              </div>
            )}
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-800">Cover Bild</label>
            <input value={post.coverImage || ''} onChange={(e) => setPost({ ...post, coverImage: e.target.value })} placeholder="Bild-URL oder hochladen" className="mt-2 w-full border-0 border-b-2 border-gray-200 py-2 text-sm bg-transparent outline-none focus:border-pink-500" />
            <div className="mt-3 flex items-center gap-3">
              <input type="file" accept="image/*" onChange={(e) => setCoverFiles(e.target.files ? Array.from(e.target.files).slice(0,1) : [])} />
              <button type="button" disabled={isUploading || coverFiles.length === 0} onClick={async () => {
                if (coverFiles.length === 0) return
                const resUp = await startUpload([coverFiles[0]])
                const url = resUp && resUp[0] ? (resUp[0] as any).ufsUrl || (resUp[0] as any).url : null
                if (url) setPost({ ...post, coverImage: url })
              }} className="px-3 py-2 text-xs uppercase tracking-widest border border-gray-300 hover:bg-pink-50/40 disabled:opacity-60">
                {isUploading ? 'Lade hoch…' : 'Hochladen'}
              </button>
            </div>
            {post.coverImage && (
              <div className="mt-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.coverImage} alt="Cover" className="w-full max-w-md h-40 object-cover border border-gray-200" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gray-800">
              <input type="checkbox" checked={!!post.published} onChange={(e) => setPost({ ...post, published: e.target.checked })} /> Veröffentlichen
            </label>
          </div>
          <div className="flex items-center gap-3">
            <button disabled={saving || isUploading} onClick={update} className="px-5 py-3 bg-pink-600 text-white text-xs uppercase tracking-widest rounded-none">{saving || isUploading ? 'Speichere…' : 'Speichern'}</button>
            <button disabled={deleting} onClick={remove} className="px-5 py-3 border border-gray-300 text-gray-800 text-xs uppercase tracking-widest rounded-none">{deleting ? 'Lösche…' : 'Löschen'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { useUploadThing } from '@/utils/uploadthing'
import { renderMarkdownToSafeHtml } from '@/lib/markdown'

export default function ReplyForm({ threadId, parentId, initialContent }: { threadId: string; parentId?: string; initialContent?: string }) {
  const { status } = useSession()
  const [content, setContent] = useState(initialContent ?? '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const { startUpload, isUploading } = useUploadThing('forumAssets')
  const [preview, setPreview] = useState(false)

  if (status === 'unauthenticated') {
    return null
  }

  const submit = async () => {
    if (!content.trim()) {
      setMessage('Inhalt erforderlich')
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      let finalContent = content
      if (files.length > 0) {
        const resUp = await startUpload(files)
        const urls: string[] = (resUp || []).map((r: any) => r?.ufsUrl || r?.url).filter(Boolean)
        if (urls.length) {
          finalContent += '\n\n' + urls.map((u) => `![Bild](${u})`).join('\n')
        }
      }
      const res = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, content: finalContent, parentId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Fehler beim Antworten')
      setContent('')
      setFiles([])
      // Trigger a refresh if running in a Next.js app router context
      if (typeof window !== 'undefined') {
        // @ts-ignore
        if (window?.next?.router?.refresh) window.next.router.refresh()
        else window.location.reload()
      }
    } catch (e: any) {
      setMessage(e?.message || 'Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-gray-200 p-4">
      <h3 className="text-sm font-light tracking-widest text-gray-800 uppercase">Antworten</h3>
      {message && <p className="mt-2 text-xs text-red-600">{message}</p>}
      <div
        onDragOver={(e) => { e.preventDefault() }}
        onDrop={(e) => {
          e.preventDefault()
          const dropped = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'))
          if (dropped.length) setFiles(prev => [...prev, ...dropped])
        }}
      >
        <textarea
          placeholder="Deine Antwort..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className="mt-3 w-full border border-gray-200 p-3 text-sm focus:outline-none focus:ring-0 focus:border-pink-500"
        />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <button onClick={() => setPreview((v) => !v)} type="button" className="text-[11px] uppercase tracking-widest text-gray-600 hover:underline">
          {preview ? 'Bearbeiten' : 'Vorschau'}
        </button>
      </div>
      {preview && (
        <div className="mt-3 border border-gray-200 p-3 bg-gray-50 text-sm text-gray-800">
          <div dangerouslySetInnerHTML={{ __html: renderMarkdownToSafeHtml(content) }} />
        </div>
      )}
      <div className="mt-3">
        <label className="text-xs uppercase tracking-widest text-gray-600">Bilder hinzufügen</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
          className="mt-2 block text-sm"
        />
        {files.length > 0 && (
          <div className="mt-2">
            <div className="text-xs text-gray-600">{files.length} Bild(er) ausgewählt</div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {files.map((f, idx) => (
                <div key={idx} className="relative border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-20 object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-3">
        <button onClick={submit} disabled={loading || isUploading} className="bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-light tracking-widest py-2 px-4 text-xs uppercase rounded-none">
          {loading || isUploading ? 'Sende…' : 'Antwort senden'}
        </button>
      </div>
    </div>
  )
}

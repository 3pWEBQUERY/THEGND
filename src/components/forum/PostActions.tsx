'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'

export default function PostActions({ postId, authorId, initialContent }: { postId: string; authorId: string; initialContent: string }) {
  const { data: session } = useSession()
  const me = session?.user?.id
  const isOwner = me && me === authorId
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(initialContent)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOwner) return null

  const onDelete = async () => {
    if (!confirm('Diesen Beitrag löschen?')) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/forum/posts/${postId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Löschen fehlgeschlagen')
      if (typeof window !== 'undefined') window.location.reload()
    } catch (e: any) {
      setError(e?.message || 'Fehler')
    } finally {
      setBusy(false)
    }
  }

  const onSave = async () => {
    if (!content.trim()) {
      setError('Inhalt erforderlich')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/forum/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Speichern fehlgeschlagen')
      setEditing(false)
      if (typeof window !== 'undefined') window.location.reload()
    } catch (e: any) {
      setError(e?.message || 'Fehler')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="text-right">
      {!editing ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 border border-gray-300 text-xs uppercase tracking-widest hover:bg-gray-50"
          >
            Bearbeiten
          </button>
          <button
            onClick={onDelete}
            disabled={busy}
            className="px-3 py-1.5 border border-red-300 text-xs uppercase tracking-widest text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            Löschen
          </button>
        </div>
      ) : (
        <div className="mt-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:ring-0 focus:border-pink-500"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={onSave}
              disabled={busy}
              className="px-3 py-1.5 border border-gray-300 text-xs uppercase tracking-widest hover:bg-gray-50 disabled:opacity-60"
            >
              Speichern
            </button>
            <button
              onClick={() => { setEditing(false); setContent(initialContent) }}
              className="px-3 py-1.5 border border-gray-300 text-xs uppercase tracking-widest hover:bg-gray-50"
            >
              Abbrechen
            </button>
          </div>
          {error && <div className="mt-1 text-[11px] text-rose-600">{error}</div>}
        </div>
      )}
    </div>
  )
}

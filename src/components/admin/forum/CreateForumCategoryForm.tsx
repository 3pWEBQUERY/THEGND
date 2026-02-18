"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateForumCategoryForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sortOrder, setSortOrder] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function submit() {
    if (!name.trim()) {
      setMessage('Name erforderlich')
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/acp/forum/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, sortOrder }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Fehler beim Erstellen')
      setName('')
      setDescription('')
      setSortOrder(0)
      router.refresh()
    } catch (e: any) {
      setMessage(e?.message || 'Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-none p-4 space-y-3">
      <h3 className="text-sm font-medium text-gray-900">Kategorie erstellen</h3>
      {message && <p className="text-xs text-red-600">{message}</p>}
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
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-700">Sortierung</label>
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(parseInt(e.target.value || '0', 10))}
          className="w-24 border border-gray-300 rounded-none px-3 py-2 text-sm"
        />
      </div>
      <div>
        <button onClick={submit} disabled={loading} className="px-4 py-2 rounded-none border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">
          {loading ? 'Erstelle…' : 'Erstellen'}
        </button>
      </div>
    </div>
  )
}

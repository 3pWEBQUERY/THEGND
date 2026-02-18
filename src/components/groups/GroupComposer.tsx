'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GroupComposer({ groupId }: { groupId: string }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, groupId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Fehler beim Posten')
      setContent('')
      router.refresh()
    } catch (e: any) {
      alert(e?.message || 'Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="border border-gray-200 bg-white p-4 space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full border border-gray-300 px-3 py-2 text-sm"
        placeholder="Schreibe etwas..."
        rows={3}
      />
      <div className="flex justify-end">
        <button type="submit" disabled={loading || !content.trim()} className="px-3 py-2 text-sm border border-gray-300 hover:bg-gray-50">
          {loading ? '...' : 'Posten'}
        </button>
      </div>
    </form>
  )
}

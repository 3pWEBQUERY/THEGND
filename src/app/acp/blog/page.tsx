'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AcpBlogListPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const load = async (query = '') => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/acp/blog/posts${query ? `?q=${encodeURIComponent(query)}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('unauthorized or failed')
      const data = await res.json()
      setPosts(Array.isArray(data) ? data : [])
    } catch (e) {
      setError('Kein Zugriff oder Laden fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  const toggleBlock = async (id: string, currentBlocked: boolean) => {
    setTogglingId(id)
    try {
      const res = await fetch(`/api/acp/blog/posts/${id}/block`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked: !currentBlocked }),
      })
      if (res.ok) {
        setPosts((prev) => prev.map((p) => p.id === id ? { ...p, blocked: !currentBlocked } : p))
      }
    } finally {
      setTogglingId(null)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-light tracking-widest text-gray-900">BLOG – ADMIN</h1>
        <Link href="/acp/blog/new" className="px-4 py-2 bg-pink-600 text-white text-xs uppercase tracking-widest rounded-none">Neuer Beitrag</Link>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Suchen…" className="border-0 border-b-2 border-gray-200 py-2 text-sm w-full max-w-sm bg-transparent outline-none focus:border-pink-500" />
        <button onClick={() => load(q)} className="px-3 py-2 text-xs uppercase tracking-widest border border-gray-300 hover:bg-pink-50/40">Suchen</button>
      </div>
      {error && <p className="mt-4 text-sm text-amber-700">{error}</p>}
      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Lade…</p>
      ) : (
        <div className="mt-6 overflow-x-auto border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left font-medium px-4 py-2">Titel</th>
                <th className="text-left font-medium px-4 py-2">Slug</th>
                <th className="text-left font-medium px-4 py-2">Status</th>
                <th className="text-left font-medium px-4 py-2">Gesperrt</th>
                <th className="text-left font-medium px-4 py-2">Aktualisiert</th>
                <th className="text-left font-medium px-4 py-2">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {posts.map((p) => (
                <tr key={p.id} className={p.blocked ? 'bg-red-50' : ''}>
                  <td className="px-4 py-2 text-gray-800">{p.title}</td>
                  <td className="px-4 py-2 text-gray-600">{p.slug}</td>
                  <td className="px-4 py-2">{p.published ? <span className="text-green-600 text-xs">veröffentlicht</span> : <span className="text-gray-500 text-xs">Entwurf</span>}</td>
                  <td className="px-4 py-2">
                    {p.blocked
                      ? <span className="text-red-600 text-xs font-medium">GESPERRT</span>
                      : <span className="text-gray-400 text-xs">—</span>
                    }
                  </td>
                  <td className="px-4 py-2 text-gray-600">{new Date(p.updatedAt).toLocaleString()}</td>
                  <td className="px-4 py-2 flex items-center gap-3">
                    <Link href={`/acp/blog/${p.id}`} className="text-xs uppercase tracking-widest text-pink-600 hover:underline">Bearbeiten</Link>
                    <button
                      onClick={() => toggleBlock(p.id, !!p.blocked)}
                      disabled={togglingId === p.id}
                      className={`text-xs uppercase tracking-widest ${p.blocked ? 'text-green-600 hover:underline' : 'text-red-600 hover:underline'}`}
                    >
                      {togglingId === p.id ? '…' : (p.blocked ? 'Entsperren' : 'Sperren')}
                    </button>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={6}>Keine Einträge</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

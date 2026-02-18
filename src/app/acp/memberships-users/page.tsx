'use client'

import { useEffect, useMemo, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Types matching API response

type UserMembership = {
  id: string
  status: 'ACTIVE' | 'CANCELED' | 'PAUSED' | 'EXPIRED'
  startedAt: string
  endedAt?: string | null
  cancelAt?: string | null
  note?: string | null
  user: { id: string; email: string }
  plan: { id: string; name: string; key: 'BASIS' | 'PLUS' | 'PREMIUM' }
}

export default function AdminUserMembershipsPage() {
  const [items, setItems] = useState<UserMembership[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [editing, setEditing] = useState<Record<string, Partial<UserMembership>>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  const statusOptions = useMemo(() => ['ACTIVE', 'CANCELED', 'PAUSED', 'EXPIRED'] as const, [])

  const load = async () => {
    setLoading(true)
    try {
      const url = new URL('/api/acp/user-memberships', window.location.origin)
      if (statusFilter) url.searchParams.set('status', statusFilter)
      const res = await fetch(url.toString(), { cache: 'no-store' })
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch {
      setMessage('Konnte User-Mitgliedschaften nicht laden')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const applyFilter = async () => { await load() }

  const save = async (id: string) => {
    setSavingId(id)
    try {
      const patch = editing[id] || {}
      const res = await fetch('/api/acp/user-memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: patch.status, cancelAt: patch.cancelAt, endedAt: patch.endedAt, note: patch.note }),
      })
      if (!res.ok) throw new Error('failed')
      setMessage('Gespeichert')
      setEditing((e) => { const c = { ...e }; delete c[id]; return c })
      await load()
    } catch {
      setMessage('Speichern fehlgeschlagen')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-light tracking-widest text-gray-900">User-Mitgliedschaften</h1>

      <div className="border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <Label className="text-xs uppercase tracking-widest text-gray-800">Status</Label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-2 w-full border-0 border-b-2 border-gray-200 bg-transparent py-3 text-sm">
              <option value="">Alle</option>
              {statusOptions.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <div>
            <Button onClick={applyFilter} className="bg-pink-500 hover:bg-pink-600 text-white rounded-none">Filter anwenden</Button>
          </div>
        </div>
      </div>

      {message && <p className="text-xs text-gray-600">{message}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Lade…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">Keine Einträge gefunden.</p>
      ) : (
        <div className="space-y-6">
          {items.map((m) => (
            <div key={m.id} className="border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-xs uppercase tracking-widest text-gray-800">User</div>
                  <div className="mt-2 text-sm text-gray-900">{m.user.email}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-gray-800">Plan</div>
                  <div className="mt-2 text-sm text-gray-900">{m.plan.name} ({m.plan.key})</div>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-widest text-gray-800">Status</Label>
                  <select value={editing[m.id]?.status ?? m.status} onChange={(e) => setEditing((ed) => ({ ...ed, [m.id]: { ...ed[m.id], status: e.target.value as any } }))} className="mt-2 w-full border-0 border-b-2 border-gray-200 bg-transparent py-3 text-sm">
                    {statusOptions.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-widest text-gray-800">Notiz</Label>
                  <Input value={editing[m.id]?.note ?? m.note ?? ''} onChange={(e) => setEditing((ed) => ({ ...ed, [m.id]: { ...ed[m.id], note: e.target.value } }))} className="mt-2 border-0 border-b-2 border-gray-200 rounded-none" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-widest text-gray-800">Kündigt am</Label>
                  <Input type="date" value={(editing[m.id]?.cancelAt ?? m.cancelAt ?? '').slice(0, 10)} onChange={(e) => setEditing((ed) => ({ ...ed, [m.id]: { ...ed[m.id], cancelAt: e.target.value } }))} className="mt-2 border-0 border-b-2 border-gray-200 rounded-none" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-widest text-gray-800">Ende</Label>
                  <Input type="date" value={(editing[m.id]?.endedAt ?? m.endedAt ?? '').slice(0, 10)} onChange={(e) => setEditing((ed) => ({ ...ed, [m.id]: { ...ed[m.id], endedAt: e.target.value } }))} className="mt-2 border-0 border-b-2 border-gray-200 rounded-none" />
                </div>
              </div>
              <div className="mt-6">
                <Button onClick={() => save(m.id)} disabled={savingId !== null} className="bg-pink-500 hover:bg-pink-600 text-white rounded-none">
                  {savingId === m.id ? 'Speichere…' : 'Änderungen speichern'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type Plan = {
  id?: string
  key?: 'BASIS' | 'PLUS' | 'PREMIUM'
  name: string
  description?: string | null
  priceCents: number
  active: boolean
  features?: string | null
  sortOrder?: number
  userType?: string | null
}

const USER_TYPES = ['MEMBER', 'ESCORT', 'HOBBYHURE', 'AGENCY', 'CLUB', 'STUDIO'] as const
const USER_TYPE_LABELS: Record<string, string> = {
  MEMBER: 'Mitglied',
  ESCORT: 'Escort',
  HOBBYHURE: 'Hobbyhure',
  AGENCY: 'Agentur',
  CLUB: 'Club',
  STUDIO: 'Studio',
}

export default function AdminMembershipsClient() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<string | 'new' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [filterUserType, setFilterUserType] = useState<string>('')

  const planKeys = useMemo(() => ['BASIS', 'PLUS', 'PREMIUM'] as const, [])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const url = filterUserType
        ? `/api/acp/memberships?userType=${filterUserType}`
        : '/api/acp/memberships'
      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json()
      setPlans(data || [])
    } catch {
      setMessage('Konnte Pläne nicht laden')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [filterUserType])

  const upsertPlan = async (plan: Plan, markId: string | 'new') => {
    try {
      setSavingId(markId)
      setMessage(null)
      const payload = {
        ...plan,
        priceCents: Math.round(Number(plan.priceCents) || 0),
        sortOrder: plan.sortOrder ?? 0,
        userType: plan.userType || null,
      }
      const res = await fetch('/api/acp/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('failed')
      await fetchPlans()
      setMessage('Gespeichert')
    } catch {
      setMessage('Speichern fehlgeschlagen')
    } finally {
      setSavingId(null)
    }
  }

  const addEmpty = () => {
    setPlans((p) => [
      ...p,
      { id: undefined, key: undefined, name: '', description: '', priceCents: 0, active: true, features: '[]', sortOrder: (p?.[p.length-1]?.sortOrder ?? 0) + 1, userType: null },
    ])
  }

  // Group plans by userType for display
  const grouped = useMemo(() => {
    const groups: Record<string, Plan[]> = {}
    for (const plan of plans) {
      const key = plan.userType || '_legacy'
      if (!groups[key]) groups[key] = []
      groups[key].push(plan)
    }
    return groups
  }, [plans])

  const groupKeys = useMemo(() => {
    const order = ['MEMBER', 'ESCORT', 'HOBBYHURE', 'AGENCY', 'CLUB', 'STUDIO', '_legacy']
    return Object.keys(grouped).sort((a, b) => {
      const ai = order.indexOf(a)
      const bi = order.indexOf(b)
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })
  }, [grouped])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-light tracking-widest text-gray-900">Mitgliedschaften verwalten</h1>
        <div className="flex items-center gap-3">
          <select
            value={filterUserType}
            onChange={(e) => setFilterUserType(e.target.value)}
            className="border-0 border-b-2 border-gray-200 bg-transparent py-2 text-sm"
          >
            <option value="">Alle Kontotypen</option>
            {USER_TYPES.map((t) => (
              <option key={t} value={t}>{USER_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <Button onClick={addEmpty} className="bg-pink-500 hover:bg-pink-600 text-white rounded-none">Neuen Plan hinzufügen</Button>
        </div>
      </div>
      {message && <p className="text-xs text-gray-600">{message}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Lade…</p>
      ) : (
        <div className="space-y-10">
          {groupKeys.map((gk) => (
            <div key={gk}>
              <h2 className="text-sm font-light tracking-widest text-gray-500 uppercase mb-4 border-b border-gray-100 pb-2">
                {gk === '_legacy' ? 'Ohne Kontotyp (Legacy)' : USER_TYPE_LABELS[gk] ?? gk}
              </h2>
              <div className="space-y-6">
                {(grouped[gk] || []).map((plan, i) => {
                  const globalIdx = plans.indexOf(plan)
                  return (
                    <div key={plan.id ?? `new-${globalIdx}`} className="border border-gray-200 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                          <Label className="text-xs uppercase tracking-widest text-gray-800">Key</Label>
                          <select
                            value={plan.key ?? ''}
                            onChange={(e) => {
                              const v = e.target.value as Plan['key']
                              setPlans((arr) => arr.map((p, idx) => idx === globalIdx ? { ...p, key: v } : p))
                            }}
                            className="mt-2 w-full border-0 border-b-2 border-gray-200 bg-transparent py-3 text-sm"
                          >
                            <option value="">— auswählen —</option>
                            {planKeys.map((k) => (
                              <option key={k} value={k}>{k}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs uppercase tracking-widest text-gray-800">Kontotyp</Label>
                          <select
                            value={plan.userType ?? ''}
                            onChange={(e) => {
                              const v = e.target.value || null
                              setPlans((arr) => arr.map((p, idx) => idx === globalIdx ? { ...p, userType: v } : p))
                            }}
                            className="mt-2 w-full border-0 border-b-2 border-gray-200 bg-transparent py-3 text-sm"
                          >
                            <option value="">— kein Typ (Legacy) —</option>
                            {USER_TYPES.map((t) => (
                              <option key={t} value={t}>{USER_TYPE_LABELS[t]}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs uppercase tracking-widest text-gray-800">Name</Label>
                          <Input className="mt-2 border-0 border-b-2 border-gray-200 rounded-none"
                            value={plan.name}
                            onChange={(e) => setPlans((arr) => arr.map((p, idx) => idx === globalIdx ? { ...p, name: e.target.value } : p))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs uppercase tracking-widest text-gray-800">Preis (Cent)</Label>
                          <Input type="number" className="mt-2 border-0 border-b-2 border-gray-200 rounded-none"
                            value={plan.priceCents}
                            onChange={(e) => setPlans((arr) => arr.map((p, idx) => idx === globalIdx ? { ...p, priceCents: Number(e.target.value || 0) } : p))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs uppercase tracking-widest text-gray-800">Aktiv</Label>
                          <div className="mt-3">
                            <input type="checkbox" checked={!!plan.active} onChange={(e) => setPlans((arr) => arr.map((p, idx) => idx === globalIdx ? { ...p, active: e.target.checked } : p))} />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs uppercase tracking-widest text-gray-800">Sortierung</Label>
                          <Input type="number" className="mt-2 border-0 border-b-2 border-gray-200 rounded-none"
                            value={plan.sortOrder ?? 0}
                            onChange={(e) => setPlans((arr) => arr.map((p, idx) => idx === globalIdx ? { ...p, sortOrder: Number(e.target.value || 0) } : p))}
                          />
                        </div>
                        <div className="md:col-span-4">
                          <Label className="text-xs uppercase tracking-widest text-gray-800">Beschreibung</Label>
                          <textarea className="mt-2 w-full border-0 border-b-2 border-gray-200 bg-transparent py-3 text-sm"
                            rows={3}
                            value={plan.description ?? ''}
                            onChange={(e) => setPlans((arr) => arr.map((p, idx) => idx === globalIdx ? { ...p, description: e.target.value } : p))}
                          />
                        </div>
                        <div className="md:col-span-4">
                          <Label className="text-xs uppercase tracking-widest text-gray-800">Features (JSON Array)</Label>
                          <textarea className="mt-2 w-full border-0 border-b-2 border-gray-200 bg-transparent py-3 text-sm"
                            rows={3}
                            value={plan.features ?? ''}
                            onChange={(e) => setPlans((arr) => arr.map((p, idx) => idx === globalIdx ? { ...p, features: e.target.value } : p))}
                          />
                        </div>
                      </div>
                      <div className="mt-6 flex items-center gap-3">
                        <Button disabled={savingId !== null} onClick={() => upsertPlan(plan, (plan.id ? plan.id : 'new'))} className="bg-pink-500 hover:bg-pink-600 text-white rounded-none">
                          {savingId === (plan.id ?? 'new') ? 'Speichere…' : (plan.id ? 'Plan speichern' : 'Plan anlegen')}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

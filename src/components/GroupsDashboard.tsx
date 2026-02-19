'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import CreateGroupForm from '@/components/groups/CreateGroupForm'
import GroupSettingsForm from '@/components/groups/GroupSettingsForm'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getAvatarUrl } from '@/utils/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type GroupSummary = {
  id: string
  name: string
  slug: string
  description?: string | null
  cover?: string | null
  privacy?: 'PUBLIC' | 'PRIVATE'
  _count?: { members: number; posts: number }
}

type MemberRow = {
  id: string
  user: { id: string; email: string; profile?: { displayName?: string | null } | null }
  role: 'ADMIN' | 'MEMBER'
}

export default function GroupsDashboard() {
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)

  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [membersSlug, setMembersSlug] = useState<string | null>(null)
  const [members, setMembers] = useState<MemberRow[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)

  const loadGroups = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (q.trim()) params.set('q', q.trim())
      const res = await fetch(`/api/groups/my?${params.toString()}`)
      const out = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(out?.error || 'Fehler beim Laden deiner Gruppen')
      setGroups(Array.isArray(out?.groups) ? out.groups : [])
      setTotal(typeof out?.total === 'number' ? out.total : 0)
    } catch (e: any) {
      setError(e?.message || 'Fehler')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    loadGroups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); loadGroups() }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const onOpenMembers = async (slug: string) => {
    try {
      setMembersSlug(slug)
      setMembersLoading(true)
      setMembersError(null)
      const res = await fetch(`/api/groups/${slug}/members`)
      const out = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(out?.error || 'Fehler beim Laden der Mitglieder')
      setMembers(Array.isArray(out?.members) ? out.members : [])
    } catch (e: any) {
      setMembersError(e?.message || 'Fehler')
    } finally { setMembersLoading(false) }
  }

  const onCloseMembers = () => {
    setMembersSlug(null)
    setMembers([])
    setMembersError(null)
  }

  const onRemoveMember = async (slug: string, userId: string) => {
    if (!confirm('Mitglied entfernen?')) return
    try {
      const res = await fetch(`/api/groups/${slug}/members/${userId}`, { method: 'DELETE' })
      const out = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(out?.error || 'Fehler beim Entfernen')
      setMembers(prev => prev.filter(m => m.user.id !== userId))
    } catch (e: any) {
      alert(e?.message || 'Fehler')
    }
  }

  const onChangeRole = async (slug: string, userId: string, role: 'ADMIN' | 'MEMBER') => {
    try {
      const res = await fetch(`/api/groups/${slug}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      })
      const out = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(out?.error || 'Fehler beim Aktualisieren')
      setMembers(prev => prev.map(m => (m.user.id === userId ? { ...m, role } : m)))
    } catch (e: any) {
      alert(e?.message || 'Fehler')
    }
  }

  // Invite/search state
  const [inviteQuery, setInviteQuery] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteResults, setInviteResults] = useState<Array<{ id: string; email: string; displayName?: string | null }>>([])
  const searchUsers = async () => {
    if (!membersSlug || !inviteQuery.trim()) return
    try {
      setInviteLoading(true)
      const res = await fetch(`/api/users/search?search=${encodeURIComponent(inviteQuery)}&limit=10`)
      const out = await res.json().catch(() => [])
      const mapped = Array.isArray(out)
        ? out.map((u: any) => ({ id: u.id, email: u.email, displayName: u?.profile?.displayName ?? null }))
        : []
      setInviteResults(mapped)
    } finally {
      setInviteLoading(false)
    }
  }
  const inviteToGroup = async (userId: string, role: 'ADMIN' | 'MEMBER' = 'MEMBER') => {
    if (!membersSlug) return
    try {
      const res = await fetch(`/api/groups/${membersSlug}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role })
      })
      const out = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(out?.error || 'Einladen fehlgeschlagen')
      // Soft-update list if not present
      setMembers(prev => prev.some(m => m.user.id === userId) ? prev : [...prev, { id: `tmp-${userId}`, user: { id: userId, email: inviteResults.find(r => r.id === userId)?.email || 'Nutzer', profile: { displayName: inviteResults.find(r => r.id === userId)?.displayName || null } }, role } as any])
    } catch (e: any) {
      alert(e?.message || 'Fehler')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Main */}
      <div className="lg:col-span-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-light tracking-wider text-gray-900">MEINE GRUPPEN</h2>
          <Link href="/groups" className="px-3 py-1.5 text-xs uppercase tracking-widest border border-gray-300 hover:bg-gray-50">ALLE</Link>
        </div>

        {/* Search + page size */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="In meinen Gruppen suchen..." className="w-full sm:max-w-sm border border-gray-300 px-3 py-2 text-sm" />
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>pro Seite:</span>
            <Select value={String(limit)} onValueChange={(v) => { setLimit(parseInt(v, 10)); setPage(1) }}>
              <SelectTrigger className="w-24 rounded-none border border-gray-300 px-2 py-1 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="border border-gray-200 bg-white p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 w-1/3 mb-2" />
                    <div className="h-3 bg-gray-200 w-2/3 mb-2" />
                    <div className="h-3 bg-gray-200 w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {groups.map((g) => (
              <div key={g.id} className="border border-gray-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.cover || '/2.jpg'} alt="Cover" className="w-16 h-16 sm:w-14 sm:h-14 object-cover border" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Link href={`/groups/${g.slug}`} className="text-gray-900 font-medium line-clamp-1 truncate">{g.name}</Link>
                        {g.privacy && (
                          <span className={`text-[10px] px-2 py-0.5 uppercase tracking-widest border ${g.privacy === 'PRIVATE' ? 'text-gray-700 border-gray-300' : 'text-pink-600 border-pink-200'}`}>{g.privacy === 'PRIVATE' ? 'PRIVAT' : 'ÖFFENTLICH'}</span>
                        )}
                      </div>
                      <div className="shrink-0 hidden sm:flex gap-2">
                        <button onClick={() => setEditingSlug(s => (s === g.slug ? null : g.slug))} className="px-2 py-1 text-xs uppercase tracking-widest border border-gray-300 hover:bg-gray-50">BEARBEITEN</button>
                        <button onClick={() => onOpenMembers(g.slug)} className="px-2 py-1 text-xs uppercase tracking-widest border border-gray-300 hover:bg-gray-50">MITGLIEDER</button>
                      </div>
                    </div>
                    {g.description && <div className="text-sm text-gray-600 mt-1 line-clamp-2">{g.description}</div>}
                    <div className="text-xs text-gray-500 mt-2">{g._count?.members ?? 0} Mitglieder · {g._count?.posts ?? 0} Beiträge</div>
                    {/* Mobile actions under counts */}
                    <div className="mt-2 flex gap-2 sm:hidden">
                      <button onClick={() => setEditingSlug(s => (s === g.slug ? null : g.slug))} className="px-2 py-1 text-xs uppercase tracking-widest border border-gray-300 hover:bg-gray-50">BEARBEITEN</button>
                      <button onClick={() => onOpenMembers(g.slug)} className="px-2 py-1 text-xs uppercase tracking-widest border border-gray-300 hover:bg-gray-50">MITGLIEDER</button>
                    </div>
                  </div>
                </div>

                {editingSlug === g.slug && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <GroupSettingsForm group={{ id: g.id, slug: g.slug, name: g.name, description: g.description || '', privacy: (g.privacy as any) || 'PUBLIC', cover: g.cover || null }} />
                  </div>
                )}
              </div>
            ))}
            {groups.length === 0 && (
              <div className="border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">Du bist noch in keiner Gruppe.</div>
            )}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>Seite {page} von {Math.max(1, Math.ceil(total / Math.max(1, limit)))} · {total} Gruppen</div>
          <div className="space-x-2">
            <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className={`px-3 py-1.5 border border-gray-300 text-xs uppercase tracking-widest ${page <= 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'}`}>ZURÜCK</button>
            <button disabled={page >= Math.max(1, Math.ceil(total / Math.max(1, limit)))} onClick={() => setPage(p => p + 1)} className={`px-3 py-1.5 border border-gray-300 text-xs uppercase tracking-widest ${page >= Math.max(1, Math.ceil(total / Math.max(1, limit))) ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'}`}>WEITER</button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-24 self-start">
        <section className="border border-gray-200 bg-white shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-light tracking-widest text-gray-800">NEUE GRUPPE</h3>
          </div>
          <div className="p-4">
            <CreateGroupForm />
          </div>
        </section>
      </aside>

      {/* Members Modal */}
      {membersSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg bg-white border border-gray-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="text-sm font-light tracking-widest text-gray-800">MITGLIEDER VERWALTEN</div>
              <button onClick={onCloseMembers} className="px-3 py-1.5 text-xs uppercase tracking-widest border border-gray-300 hover:bg-gray-50">SCHLIESSEN</button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {membersLoading ? (
                <div className="p-4 text-sm text-gray-600">Wird geladen...</div>
              ) : membersError ? (
                <div className="p-4 text-sm text-red-700 bg-red-50 border-t border-red-100">{membersError}</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {/* Invite UI */}
                  <div className="p-4 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <input value={inviteQuery} onChange={(e) => setInviteQuery(e.target.value)} placeholder="Benutzer suchen..." className="flex-1 border border-gray-300 px-3 py-2 text-sm" />
                    <button onClick={searchUsers} disabled={inviteLoading} className="px-3 py-2 text-sm border border-gray-300 hover:bg-gray-50">{inviteLoading ? '...' : 'Suchen'}</button>
                  </div>
                  {inviteResults.length > 0 && (
                    <div className="p-4">
                      <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">ERGEBNISSE</div>
                      <ul className="space-y-2">
                        {inviteResults.map(u => (
                          <li key={u.id} className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm text-gray-800 truncate">{u.displayName || u.email}</div>
                              {u.displayName && <div className="text-xs text-gray-500 truncate">{u.email}</div>}
                            </div>
                            <div className="shrink-0 flex items-center gap-2">
                              <button onClick={() => inviteToGroup(u.id, 'MEMBER')} className="px-2 py-1 text-xs border border-gray-300 hover:bg-gray-50">Einladen</button>
                              <button onClick={() => inviteToGroup(u.id, 'ADMIN')} className="px-2 py-1 text-xs border border-gray-300 hover:bg-gray-50">Als Admin</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {members.map((m) => (
                    <div key={m.id} className="p-4 flex items-center gap-3">
                      <Avatar className="size-7">
                        <AvatarImage src={getAvatarUrl((m.user as any)?.profile?.avatar, (m.user as any)?.userType)} alt="avatar" />
                        <AvatarFallback className="text-[10px]">
                          {(m.user.profile?.displayName || m.user.email || '?').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-800 line-clamp-1">{m.user.profile?.displayName || m.user.email}</div>
                        <div className="text-xs text-gray-500">{m.role}</div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <Select value={m.role} onValueChange={(v) => onChangeRole(membersSlug, m.user.id, v as any)}>
                          <SelectTrigger className="w-28 h-7 rounded-none border border-gray-300 px-2 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-none">
                            <SelectItem value="MEMBER">MITGLIED</SelectItem>
                            <SelectItem value="ADMIN">ADMIN</SelectItem>
                          </SelectContent>
                        </Select>
                        <button onClick={() => onRemoveMember(membersSlug, m.user.id)} className="px-2 py-1 text-xs border border-gray-300 hover:bg-gray-50">Entfernen</button>
                      </div>
                    </div>
                  ))}
                  {members.length === 0 && (
                    <div className="p-4 text-sm text-gray-600">Keine Mitglieder gefunden.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Settings,
  ScrollText,
  Tag,
  Users,
  ShieldBan,
  Flag,
  FileText,
  ArrowLeft,
  Trash2,
  Plus,
  AlertTriangle,
} from 'lucide-react'
import { formatDistanceToNowStrict } from 'date-fns'
import { de } from 'date-fns/locale'

interface ModDashboardClientProps {
  community: {
    id: string
    name: string
    slug: string
    description: string
    sidebar: string
    type: string
    isNSFW: boolean
    memberCount: number
    postCount: number
  }
  rules: { id: string; title: string; description?: string | null; sortOrder: number }[]
  flairs: { id: string; name: string; color: string; textColor: string }[]
  members: { id: string; userId: string; name: string; email: string; role: string; joinedAt: string }[]
  bans: { id: string; userId: string; name: string; reason?: string | null; status: string; expiresAt: string | null; bannedByName: string; createdAt: string }[]
  reports: { id: string; reason: string; status: string; reporterName: string; postTitle: string | null; postId: string | null; commentContent: string | null; commentId: string | null; createdAt: string }[]
  modLog: { id: string; action: string; reason?: string | null; modName: string; targetName: string | null; createdAt: string }[]
  openReports: number
  isOwner: boolean
}

const TABS = [
  { key: 'overview', label: 'Übersicht', icon: FileText },
  { key: 'settings', label: 'Einstellungen', icon: Settings },
  { key: 'rules', label: 'Regeln', icon: ScrollText },
  { key: 'flairs', label: 'Flairs', icon: Tag },
  { key: 'members', label: 'Mitglieder', icon: Users },
  { key: 'bans', label: 'Bans', icon: ShieldBan },
  { key: 'reports', label: 'Meldungen', icon: Flag },
  { key: 'modlog', label: 'Mod-Log', icon: FileText },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function ModDashboardClient({
  community,
  rules: initialRules,
  flairs: initialFlairs,
  members,
  bans,
  reports,
  modLog,
  openReports,
  isOwner,
}: ModDashboardClientProps) {
  const router = useRouter()
  const [tab, setTab] = useState<TabKey>('overview')
  const [loading, setLoading] = useState(false)

  // Settings state
  const [description, setDescription] = useState(community.description)
  const [sidebar, setSidebar] = useState(community.sidebar)
  const [type, setType] = useState(community.type)
  const [isNSFW, setIsNSFW] = useState(community.isNSFW)

  // Rules state
  const [rules, setRules] = useState(initialRules)
  const [newRuleTitle, setNewRuleTitle] = useState('')
  const [newRuleDesc, setNewRuleDesc] = useState('')

  // Flairs state
  const [flairs, setFlairs] = useState(initialFlairs)
  const [newFlairName, setNewFlairName] = useState('')
  const [newFlairColor, setNewFlairColor] = useState('#EC4899')

  // Ban state
  const [banUserId, setBanUserId] = useState('')
  const [banReason, setBanReason] = useState('')

  const saveSettings = async () => {
    setLoading(true)
    try {
      await fetch(`/api/communities/${community.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, sidebar, type, isNSFW }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const addRule = async () => {
    if (!newRuleTitle.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/communities/${community.slug}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newRuleTitle.trim(), description: newRuleDesc.trim() || undefined }),
      })
      if (res.ok) {
        const data = await res.json()
        setRules((prev) => [...prev, data.rule])
        setNewRuleTitle('')
        setNewRuleDesc('')
      }
    } finally {
      setLoading(false)
    }
  }

  const deleteRule = async (id: string) => {
    await fetch(`/api/communities/${community.slug}/rules/${id}`, { method: 'DELETE' })
    setRules((prev) => prev.filter((r) => r.id !== id))
  }

  const addFlair = async () => {
    if (!newFlairName.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/communities/${community.slug}/flairs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFlairName.trim(), color: newFlairColor }),
      })
      if (res.ok) {
        const data = await res.json()
        setFlairs((prev) => [...prev, data.flair])
        setNewFlairName('')
      }
    } finally {
      setLoading(false)
    }
  }

  const deleteFlair = async (id: string) => {
    await fetch(`/api/communities/${community.slug}/flairs/${id}`, { method: 'DELETE' })
    setFlairs((prev) => prev.filter((f) => f.id !== id))
  }

  const changeRole = async (userId: string, role: string) => {
    await fetch(`/api/communities/${community.slug}/members/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    router.refresh()
  }

  const removeMember = async (userId: string) => {
    if (!confirm('Mitglied wirklich entfernen?')) return
    await fetch(`/api/communities/${community.slug}/members/${userId}`, { method: 'DELETE' })
    router.refresh()
  }

  const banUser = async () => {
    if (!banUserId.trim()) return
    await fetch(`/api/communities/${community.slug}/bans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: banUserId.trim(), reason: banReason.trim() || undefined }),
    })
    setBanUserId('')
    setBanReason('')
    router.refresh()
  }

  const unbanUser = async (userId: string) => {
    await fetch(`/api/communities/${community.slug}/bans`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    router.refresh()
  }

  const resolveReport = async (reportId: string, action: 'RESOLVED' | 'DISMISSED') => {
    await fetch(`/api/communities/${community.slug}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, status: action }),
    })
    router.refresh()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href={`/community/${community.slug}`}
            className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-700 mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zurück zu c/{community.name}
          </Link>
          <h1 className="text-xl font-light tracking-wider text-gray-900">
            Mod Tools — c/{community.name}
          </h1>
        </div>
        {openReports > 0 && (
          <button
            onClick={() => setTab('reports')}
            className="flex items-center gap-1.5 bg-red-500 text-white text-xs px-3 py-1.5 uppercase tracking-widest"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {openReports} offene Meldungen
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
        {/* Tab nav */}
        <div className="border border-gray-200 bg-white p-1 lg:p-0">
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 text-[10px] uppercase tracking-widest font-light transition-colors whitespace-nowrap w-full text-left',
                  tab === key
                    ? 'bg-pink-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="border border-gray-200 bg-white p-4">
          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-4">
              <h2 className="text-sm uppercase tracking-widest text-gray-900 font-light">Übersicht</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Mitglieder', value: community.memberCount },
                  { label: 'Beiträge', value: community.postCount },
                  { label: 'Offene Meldungen', value: openReports },
                  { label: 'Regeln', value: rules.length },
                ].map((stat) => (
                  <div key={stat.label} className="border border-gray-200 p-3">
                    <p className="text-2xl font-light text-gray-900">{stat.value}</p>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {tab === 'settings' && (
            <div className="space-y-4">
              <h2 className="text-sm uppercase tracking-widest text-gray-900 font-light">Einstellungen</h2>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Beschreibung</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-200 p-2 text-sm resize-y min-h-[80px] focus:outline-none focus:border-pink-400"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Sidebar Markdown</label>
                <textarea
                  value={sidebar}
                  onChange={(e) => setSidebar(e.target.value)}
                  className="w-full border border-gray-200 p-2 text-sm resize-y min-h-[80px] focus:outline-none focus:border-pink-400"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Typ</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border border-gray-200 p-2 text-sm focus:outline-none focus:border-pink-400"
                >
                  <option value="PUBLIC">Öffentlich</option>
                  <option value="RESTRICTED">Eingeschränkt</option>
                  <option value="PRIVATE">Privat</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="nsfw-setting"
                  checked={isNSFW}
                  onChange={(e) => setIsNSFW(e.target.checked)}
                  className="accent-pink-500"
                />
                <label htmlFor="nsfw-setting" className="text-xs text-gray-600">NSFW (18+)</label>
              </div>
              <button
                onClick={saveSettings}
                disabled={loading}
                className="bg-pink-500 hover:bg-pink-600 text-white text-xs font-light tracking-widest px-4 py-2 uppercase disabled:opacity-50"
              >
                {loading ? '...' : 'Speichern'}
              </button>
            </div>
          )}

          {/* RULES */}
          {tab === 'rules' && (
            <div className="space-y-4">
              <h2 className="text-sm uppercase tracking-widest text-gray-900 font-light">Regeln</h2>
              {rules.length > 0 && (
                <div className="space-y-2">
                  {rules.map((rule, idx) => (
                    <div key={rule.id} className="flex items-start justify-between border border-gray-200 p-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{idx + 1}. {rule.title}</p>
                        {rule.description && <p className="text-xs text-gray-500 mt-0.5">{rule.description}</p>}
                      </div>
                      <button onClick={() => deleteRule(rule.id)} className="text-gray-400 hover:text-red-500 p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="border border-gray-200 p-3 space-y-2">
                <input
                  value={newRuleTitle}
                  onChange={(e) => setNewRuleTitle(e.target.value)}
                  placeholder="Regeltitel"
                  className="w-full border border-gray-200 p-2 text-sm focus:outline-none focus:border-pink-400"
                />
                <input
                  value={newRuleDesc}
                  onChange={(e) => setNewRuleDesc(e.target.value)}
                  placeholder="Beschreibung (optional)"
                  className="w-full border border-gray-200 p-2 text-sm focus:outline-none focus:border-pink-400"
                />
                <button
                  onClick={addRule}
                  disabled={!newRuleTitle.trim()}
                  className="flex items-center gap-1 text-[10px] uppercase tracking-widest bg-pink-500 hover:bg-pink-600 text-white px-3 py-1.5 disabled:opacity-50"
                >
                  <Plus className="h-3 w-3" />
                  Regel hinzufügen
                </button>
              </div>
            </div>
          )}

          {/* FLAIRS */}
          {tab === 'flairs' && (
            <div className="space-y-4">
              <h2 className="text-sm uppercase tracking-widest text-gray-900 font-light">Flairs</h2>
              {flairs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {flairs.map((f) => (
                    <div key={f.id} className="flex items-center gap-1.5 border border-gray-200 pl-2 pr-1 py-1">
                      <span
                        className="text-[10px] uppercase tracking-widest px-1.5 py-0.5"
                        style={{ backgroundColor: f.color, color: f.textColor }}
                      >
                        {f.name}
                      </span>
                      <button onClick={() => deleteFlair(f.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2 border border-gray-200 p-3">
                <div className="flex-1">
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Flair Name</label>
                  <input
                    value={newFlairName}
                    onChange={(e) => setNewFlairName(e.target.value)}
                    placeholder="z.B. Diskussion"
                    className="w-full border border-gray-200 p-2 text-sm focus:outline-none focus:border-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Farbe</label>
                  <input
                    type="color"
                    value={newFlairColor}
                    onChange={(e) => setNewFlairColor(e.target.value)}
                    className="h-9 w-12 border border-gray-200 cursor-pointer"
                  />
                </div>
                <button
                  onClick={addFlair}
                  disabled={!newFlairName.trim()}
                  className="flex items-center gap-1 text-[10px] uppercase tracking-widest bg-pink-500 hover:bg-pink-600 text-white px-3 py-2 disabled:opacity-50 whitespace-nowrap"
                >
                  <Plus className="h-3 w-3" />
                  Hinzufügen
                </button>
              </div>
            </div>
          )}

          {/* MEMBERS */}
          {tab === 'members' && (
            <div className="space-y-4">
              <h2 className="text-sm uppercase tracking-widest text-gray-900 font-light">
                Mitglieder ({members.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-gray-200">
                      <th className="text-left py-2 px-2">Name</th>
                      <th className="text-left py-2 px-2">Rolle</th>
                      <th className="text-left py-2 px-2">Beigetreten</th>
                      <th className="py-2 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id} className="border-b border-gray-100">
                        <td className="py-2 px-2 text-gray-800">{m.name}</td>
                        <td className="py-2 px-2">
                          {isOwner && m.role !== 'OWNER' ? (
                            <select
                              value={m.role}
                              onChange={(e) => changeRole(m.userId, e.target.value)}
                              className="text-xs border border-gray-200 p-1 focus:outline-none focus:border-pink-400"
                            >
                              <option value="MEMBER">Mitglied</option>
                              <option value="MODERATOR">Moderator</option>
                            </select>
                          ) : (
                            <span className={cn(
                              'text-xs',
                              m.role === 'OWNER' && 'text-pink-600',
                              m.role === 'MODERATOR' && 'text-blue-600',
                            )}>
                              {m.role === 'OWNER' ? 'Eigentümer' : m.role === 'MODERATOR' ? 'Moderator' : 'Mitglied'}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-xs text-gray-500">
                          {formatDistanceToNowStrict(new Date(m.joinedAt), { locale: de, addSuffix: true })}
                        </td>
                        <td className="py-2 px-2">
                          {m.role !== 'OWNER' && (
                            <button
                              onClick={() => removeMember(m.userId)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BANS */}
          {tab === 'bans' && (
            <div className="space-y-4">
              <h2 className="text-sm uppercase tracking-widest text-gray-900 font-light">Bans</h2>
              {/* Ban form */}
              <div className="border border-gray-200 p-3 space-y-2">
                <label className="block text-xs uppercase tracking-widest text-gray-500">User bannen</label>
                <input
                  value={banUserId}
                  onChange={(e) => setBanUserId(e.target.value)}
                  placeholder="User ID"
                  className="w-full border border-gray-200 p-2 text-sm focus:outline-none focus:border-pink-400"
                />
                <input
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Grund (optional)"
                  className="w-full border border-gray-200 p-2 text-sm focus:outline-none focus:border-pink-400"
                />
                <button
                  onClick={banUser}
                  disabled={!banUserId.trim()}
                  className="text-[10px] uppercase tracking-widest bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 disabled:opacity-50"
                >
                  Bannen
                </button>
              </div>
              {/* Ban list */}
              {bans.length > 0 ? (
                <div className="space-y-2">
                  {bans.map((b) => (
                    <div key={b.id} className="flex items-center justify-between border border-gray-200 p-3">
                      <div>
                        <p className="text-sm text-gray-800">{b.name}</p>
                        <p className="text-xs text-gray-500">
                          {b.status} · gebannt von {b.bannedByName}
                          {b.reason && ` · Grund: ${b.reason}`}
                        </p>
                      </div>
                      <button
                        onClick={() => unbanUser(b.userId)}
                        className="text-[10px] uppercase tracking-widest border border-green-300 text-green-600 hover:bg-green-50 px-2 py-1"
                      >
                        Entbannen
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Keine aktiven Bans.</p>
              )}
            </div>
          )}

          {/* REPORTS */}
          {tab === 'reports' && (
            <div className="space-y-4">
              <h2 className="text-sm uppercase tracking-widest text-gray-900 font-light">
                Meldungen ({openReports} offen)
              </h2>
              {reports.length > 0 ? (
                <div className="space-y-2">
                  {reports.map((r) => (
                    <div key={r.id} className="border border-gray-200 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm text-gray-800">
                            {r.postTitle ? (
                              <Link href={`/community/${community.slug}/post/${r.postId}`} className="text-pink-600 hover:underline">
                                {r.postTitle}
                              </Link>
                            ) : r.commentContent ? (
                              <span className="italic text-gray-600">&ldquo;{r.commentContent}&rdquo;</span>
                            ) : (
                              'Unbekannt'
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Gemeldet von {r.reporterName} · {formatDistanceToNowStrict(new Date(r.createdAt), { locale: de, addSuffix: true })}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">Grund: {r.reason}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {r.status === 'OPEN' ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => resolveReport(r.id, 'RESOLVED')}
                                className="text-[10px] uppercase tracking-widest bg-green-500 hover:bg-green-600 text-white px-2 py-1"
                              >
                                Lösen
                              </button>
                              <button
                                onClick={() => resolveReport(r.id, 'DISMISSED')}
                                className="text-[10px] uppercase tracking-widest bg-gray-400 hover:bg-gray-500 text-white px-2 py-1"
                              >
                                Ablehnen
                              </button>
                            </div>
                          ) : (
                            <span className={cn(
                              'text-[10px] uppercase tracking-widest px-2 py-0.5',
                              r.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
                            )}>
                              {r.status === 'RESOLVED' ? 'Gelöst' : 'Abgelehnt'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Keine Meldungen.</p>
              )}
            </div>
          )}

          {/* MOD LOG */}
          {tab === 'modlog' && (
            <div className="space-y-4">
              <h2 className="text-sm uppercase tracking-widest text-gray-900 font-light">Mod-Log</h2>
              {modLog.length > 0 ? (
                <div className="space-y-2">
                  {modLog.map((l) => (
                    <div key={l.id} className="border-b border-gray-100 py-2">
                      <p className="text-xs text-gray-700">
                        <span className="font-medium">{l.modName}</span>
                        {' → '}
                        <span className="text-pink-600">{l.action.replace(/_/g, ' ')}</span>
                        {l.targetName && <span> · Ziel: {l.targetName}</span>}
                      </p>
                      {l.reason && <p className="text-[10px] text-gray-500">Grund: {l.reason}</p>}
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {formatDistanceToNowStrict(new Date(l.createdAt), { locale: de, addSuffix: true })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Keine Mod-Aktionen.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

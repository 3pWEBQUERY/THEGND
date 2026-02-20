'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatDistanceToNowStrict } from 'date-fns'
import { de } from 'date-fns/locale'
import { Search, Archive, Eye, Trash2, Users, MessageSquare, FileText, AlertTriangle } from 'lucide-react'

interface CommunityAdmin {
  id: string
  name: string
  slug: string
  type: string
  isArchived: boolean
  isNSFW: boolean
  memberCount: number
  postCount: number
  creatorName: string
  createdAt: string
}

interface CommunitiesAdminClientProps {
  communities: CommunityAdmin[]
  stats: {
    totalCommunities: number
    totalPosts: number
    totalComments: number
    openReports: number
  }
}

export default function CommunitiesAdminClient({ communities, stats }: CommunitiesAdminClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all')

  const filtered = communities.filter((c) => {
    if (filter === 'active' && c.isArchived) return false
    if (filter === 'archived' && !c.isArchived) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.slug.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const toggleArchive = async (slug: string, archive: boolean) => {
    if (!confirm(archive ? 'Community archivieren?' : 'Community wiederherstellen?')) return
    if (archive) {
      await fetch(`/api/communities/${slug}`, { method: 'DELETE' })
    } else {
      await fetch(`/api/communities/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: false }),
      })
    }
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-light tracking-wider text-gray-900">Communities Verwaltung</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox icon={Users} label="Communities" value={stats.totalCommunities} />
        <StatBox icon={FileText} label="Beiträge" value={stats.totalPosts} />
        <StatBox icon={MessageSquare} label="Kommentare" value={stats.totalComments} />
        <StatBox icon={AlertTriangle} label="Offene Meldungen" value={stats.openReports} color="red" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen..."
            className="w-full border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-pink-400"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'active', 'archived'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'text-[10px] uppercase tracking-widest px-3 py-2 transition-colors',
                filter === f ? 'bg-pink-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50',
              )}
            >
              {f === 'all' ? 'Alle' : f === 'active' ? 'Aktiv' : 'Archiviert'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-gray-200 bg-gray-50">
              <th className="text-left py-2.5 px-3">Community</th>
              <th className="text-left py-2.5 px-3">Typ</th>
              <th className="text-left py-2.5 px-3">Ersteller</th>
              <th className="text-right py-2.5 px-3">Mitglieder</th>
              <th className="text-right py-2.5 px-3">Beiträge</th>
              <th className="text-left py-2.5 px-3">Erstellt</th>
              <th className="py-2.5 px-3">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2.5 px-3">
                  <Link href={`/community/${c.slug}`} className="text-pink-600 hover:underline font-medium">
                    {c.name}
                  </Link>
                  <p className="text-[10px] text-gray-400">/{c.slug}</p>
                  <div className="flex gap-1 mt-0.5">
                    {c.isNSFW && <span className="text-[8px] bg-red-500 text-white px-1 py-px uppercase">NSFW</span>}
                    {c.isArchived && <span className="text-[8px] bg-gray-400 text-white px-1 py-px uppercase">Archiviert</span>}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-xs text-gray-600">{c.type}</td>
                <td className="py-2.5 px-3 text-xs text-gray-600">{c.creatorName}</td>
                <td className="py-2.5 px-3 text-right text-xs">{c.memberCount}</td>
                <td className="py-2.5 px-3 text-right text-xs">{c.postCount}</td>
                <td className="py-2.5 px-3 text-xs text-gray-500">
                  {formatDistanceToNowStrict(new Date(c.createdAt), { locale: de, addSuffix: true })}
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1 justify-center">
                    <Link
                      href={`/community/${c.slug}`}
                      className="text-gray-400 hover:text-pink-500 p-1"
                      title="Ansehen"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => toggleArchive(c.slug, !c.isArchived)}
                      className="text-gray-400 hover:text-yellow-600 p-1"
                      title={c.isArchived ? 'Wiederherstellen' : 'Archivieren'}
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-gray-400">
                  Keine Communities gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatBox({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color?: string }) {
  return (
    <div className="border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        <Icon className={cn('h-4 w-4', color === 'red' && 'text-red-500')} />
      </div>
      <p className={cn('text-2xl font-light', color === 'red' ? 'text-red-600' : 'text-gray-900')}>
        {value.toLocaleString('de-DE')}
      </p>
      <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

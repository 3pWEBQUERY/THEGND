'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, MessageSquare, TrendingUp, Star, Plus, ArrowRight, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNowStrict } from 'date-fns'
import { de } from 'date-fns/locale'

interface OverviewData {
  karma: number
  postCount: number
  commentCount: number
  communities: { id: string; name: string; slug: string; icon?: string | null; role: string }[]
  moderatedCommunities: { id: string; name: string; slug: string; pendingReports: number }[]
  recentPosts: { id: string; title: string; communitySlug: string; score: number; commentCount: number; createdAt: string }[]
}

export default function CommunityDashboard() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/community/overview')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-gray-500">Fehler beim Laden.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={TrendingUp} label="Karma" value={data.karma} />
        <StatCard icon={MessageSquare} label="Beiträge" value={data.postCount} />
        <StatCard icon={MessageSquare} label="Kommentare" value={data.commentCount} />
        <StatCard icon={Users} label="Communities" value={data.communities.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My Communities */}
        <div className="border border-gray-200 bg-white">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
            <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-light">
              Meine Communities
            </h3>
            <Link
              href="/community/create"
              className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-pink-600 hover:text-pink-700"
            >
              <Plus className="h-3 w-3" />
              Erstellen
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {data.communities.length > 0 ? (
              data.communities.map((c) => (
                <Link
                  key={c.id}
                  href={`/community/${c.slug}`}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    {c.icon && <AvatarImage src={c.icon} />}
                    <AvatarFallback className="text-xs bg-pink-100 text-pink-600">
                      {c.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">c/{c.name}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                      {c.role === 'OWNER' ? 'Eigentümer' : c.role === 'MODERATOR' ? 'Moderator' : 'Mitglied'}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </Link>
              ))
            ) : (
              <div className="px-3 py-6 text-center">
                <p className="text-sm text-gray-400 mb-2">Noch keiner Community beigetreten</p>
                <Link
                  href="/community"
                  className="text-[10px] uppercase tracking-widest text-pink-600 hover:text-pink-700"
                >
                  Communities entdecken
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Posts */}
        <div className="border border-gray-200 bg-white">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
            <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-light">
              Letzte Beiträge
            </h3>
            <Link
              href="/community"
              className="text-[10px] uppercase tracking-widest text-pink-600 hover:text-pink-700"
            >
              Alle ansehen
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {data.recentPosts.length > 0 ? (
              data.recentPosts.map((p) => (
                <Link
                  key={p.id}
                  href={`/community/${p.communitySlug}/post/${p.id}`}
                  className="block px-3 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm text-gray-800 truncate">{p.title}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-500">
                    <span>↑ {p.score}</span>
                    <span>{p.commentCount} Kommentare</span>
                    <span>{formatDistanceToNowStrict(new Date(p.createdAt), { locale: de, addSuffix: true })}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-3 py-6 text-center">
                <p className="text-sm text-gray-400">Noch keine Beiträge</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Moderated communities with pending reports */}
      {data.moderatedCommunities.length > 0 && (
        <div className="border border-gray-200 bg-white">
          <div className="px-3 py-2 border-b border-gray-200">
            <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-light">
              Moderierte Communities
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {data.moderatedCommunities.map((c) => (
              <Link
                key={c.id}
                href={`/community/${c.slug}/mod`}
                className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-800">c/{c.name}</span>
                {c.pendingReports > 0 && (
                  <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 uppercase tracking-widest">
                    {c.pendingReports} Meldungen
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-light text-gray-900">{value.toLocaleString('de-DE')}</p>
      <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

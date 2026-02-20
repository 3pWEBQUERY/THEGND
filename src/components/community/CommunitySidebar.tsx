'use client'

import Link from 'next/link'
import { Shield, Calendar, ScrollText, Users } from 'lucide-react'
import { formatDistanceToNowStrict } from 'date-fns'
import { de } from 'date-fns/locale'

interface CommunitySidebarProps {
  community: {
    id: string
    name: string
    slug: string
    description?: string | null
    sidebar?: string | null
    memberCount: number
    createdAt: string
    type: string
  }
  rules?: { id: string; title: string; description?: string | null; sortOrder: number }[]
  moderators?: { user: { id: string; name?: string | null; displayName?: string | null } }[]
  isMember?: boolean
}

export default function CommunitySidebar({ community, rules, moderators, isMember }: CommunitySidebarProps) {
  const created = formatDistanceToNowStrict(new Date(community.createdAt), { locale: de, addSuffix: true })

  return (
    <div className="space-y-3">
      {/* About */}
      <div className="border border-gray-200 bg-white">
        <div className="bg-pink-500 px-3 py-2">
          <h3 className="text-[10px] uppercase tracking-widest text-white font-light">Über diese Community</h3>
        </div>
        <div className="p-3 space-y-3 text-sm">
          {community.description && (
            <p className="text-gray-600 font-light leading-relaxed">{community.description}</p>
          )}
          {community.sidebar && (
            <p className="text-gray-600 font-light leading-relaxed text-xs">{community.sidebar}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="h-3.5 w-3.5" />
            <span>Erstellt {created}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Users className="h-3.5 w-3.5" />
            <span>{community.memberCount.toLocaleString('de-DE')} Mitglieder</span>
          </div>

          {isMember && (
            <Link
              href={`/community/${community.slug}/submit`}
              className="block w-full text-center bg-pink-500 hover:bg-pink-600 text-white text-[10px] font-light tracking-widest py-2 uppercase"
            >
              Beitrag erstellen
            </Link>
          )}
        </div>
      </div>

      {/* Rules */}
      {rules && rules.length > 0 && (
        <div className="border border-gray-200 bg-white">
          <div className="bg-gray-900 px-3 py-2">
            <h3 className="text-[10px] uppercase tracking-widest text-white font-light flex items-center gap-1.5">
              <ScrollText className="h-3 w-3" />
              Regeln
            </h3>
          </div>
          <div className="p-3">
            <ol className="space-y-2">
              {rules.map((rule, idx) => (
                <li key={rule.id} className="text-xs text-gray-700">
                  <span className="font-medium text-gray-900">{idx + 1}. {rule.title}</span>
                  {rule.description && (
                    <p className="text-gray-500 mt-0.5 font-light">{rule.description}</p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Moderators */}
      {moderators && moderators.length > 0 && (
        <div className="border border-gray-200 bg-white">
          <div className="bg-gray-900 px-3 py-2">
            <h3 className="text-[10px] uppercase tracking-widest text-white font-light flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              Moderatoren
            </h3>
          </div>
          <div className="p-3 space-y-1.5">
            {moderators.map((mod) => (
              <Link
                key={mod.user.id}
                href={`/profile/${mod.user.id}`}
                className="block text-xs text-gray-700 hover:text-pink-600"
              >
                u/{mod.user.displayName || mod.user.name || 'Anonym'}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

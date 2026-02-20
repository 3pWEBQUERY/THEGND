'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Shield, Calendar, ScrollText, Users } from 'lucide-react'
import { getProfileUrl } from '@/lib/validations'
import { formatDistanceToNowStrict } from 'date-fns'
import { de } from 'date-fns/locale'

interface CommunitySidebarProps {
  community: {
    id: string
    name: string
    slug: string
    description?: string | null
    sidebar?: string | null
    banner?: string | null
    icon?: string | null
    memberCount: number
    createdAt: string
    type: string
  }
  rules?: { id: string; title: string; description?: string | null; sortOrder: number }[]
  moderators?: { user: { id: string; email?: string; userType?: string | null; profile?: { displayName?: string | null; avatar?: string | null } | null } }[]
  recentMembers?: { id: string; avatar?: string | null; displayName?: string | null }[]
  isMember?: boolean
}

export default function CommunitySidebar({ community, rules, moderators, recentMembers, isMember }: CommunitySidebarProps) {
  const created = formatDistanceToNowStrict(new Date(community.createdAt), { locale: de, addSuffix: true })

  return (
    <div className="space-y-3">
      {/* About */}
      <div className="border border-gray-200 bg-white overflow-hidden">
        {/* Banner */}
        {community.banner && (
          <div className="relative w-full h-24">
            <Image
              src={community.banner}
              alt={`${community.name} Banner`}
              fill
              className="object-cover"
            />
            {/* Community icon overlay */}
            {community.icon && (
              <div className="absolute -bottom-5 left-3">
                <div className="h-12 w-12 border-2 border-white overflow-hidden bg-white shadow">
                  <Image
                    src={community.icon}
                    alt={community.name}
                    width={48}
                    height={48}
                    className="object-cover h-full w-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className={`p-3 space-y-3 text-sm ${community.banner && community.icon ? 'pt-7' : ''}`}>
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
            {/* Stacked member avatars */}
            {recentMembers && recentMembers.length > 0 && (
              <div className="flex items-center -space-x-2 mr-1">
                {recentMembers.map((member, idx) => (
                  <div
                    key={member.id}
                    className="h-6 w-6 rounded-full border-2 border-white overflow-hidden bg-gray-200 flex-shrink-0"
                    style={{ zIndex: recentMembers.length - idx }}
                    title={member.displayName || undefined}
                  >
                    {member.avatar ? (
                      <Image
                        src={member.avatar}
                        alt={member.displayName || 'Mitglied'}
                        width={24}
                        height={24}
                        className="object-cover h-full w-full"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white text-[8px] font-medium">
                        {(member.displayName || '?')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
                href={getProfileUrl({ id: mod.user.id, userType: mod.user.userType || 'MEMBER', displayName: mod.user.profile?.displayName })}
                className="block text-xs text-gray-700 hover:text-pink-600"
              >
                u/{mod.user.profile?.displayName || mod.user.email || 'Anonym'}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, Shield, Globe, Lock, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommunityHeaderProps {
  community: {
    id: string
    name: string
    slug: string
    description?: string | null
    icon?: string | null
    banner?: string | null
    type: 'PUBLIC' | 'RESTRICTED' | 'PRIVATE'
    memberCount: number
    createdAt: string
    isNSFW?: boolean
  }
  membership?: {
    role: 'OWNER' | 'MODERATOR' | 'MEMBER'
  } | null
  isAuthenticated?: boolean
}

export default function CommunityHeader({ community, membership, isAuthenticated }: CommunityHeaderProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isMember = !!membership

  const typeIcon = {
    PUBLIC: <Globe className="h-3.5 w-3.5" />,
    RESTRICTED: <Eye className="h-3.5 w-3.5" />,
    PRIVATE: <Lock className="h-3.5 w-3.5" />,
  }

  const typeLabel = {
    PUBLIC: 'Öffentlich',
    RESTRICTED: 'Eingeschränkt',
    PRIVATE: 'Privat',
  }

  const handleJoinLeave = async () => {
    if (!isAuthenticated) {
      router.push('/auth/signin')
      return
    }
    setLoading(true)
    try {
      const endpoint = isMember
        ? `/api/communities/${community.slug}/leave`
        : `/api/communities/${community.slug}/join`
      const res = await fetch(endpoint, { method: 'POST' })
      if (res.ok) router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Banner */}
      <div className="h-[50vh] min-h-[400px] bg-gray-100 relative overflow-hidden">
        {community.banner ? (
          <img
            src={community.banner}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-pink-400 to-pink-600" />
        )}
      </div>

      {/* Info bar */}
      <div className="max-w-6xl mx-auto px-4 pb-3">
        <div className="flex items-end gap-3 -mt-6 relative z-10">
          <Avatar className="h-16 w-16 border-4 border-white bg-white">
            {community.icon ? (
              <AvatarImage src={community.icon} alt={community.name} />
            ) : null}
            <AvatarFallback className="text-xl font-light bg-pink-100 text-pink-600">
              {community.name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 pt-8">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-light tracking-wider text-gray-900">
                {community.name}
              </h1>
              {community.isNSFW && (
                <span className="text-[9px] uppercase tracking-widest bg-red-500 text-white px-1.5 py-0.5">
                  NSFW
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">c/{community.slug}</p>
          </div>

          <div className="flex items-center gap-2 pt-8">
            {membership?.role === 'OWNER' || membership?.role === 'MODERATOR' ? (
              <Link
                href={`/community/${community.slug}/mod`}
                className="flex items-center gap-1 px-2 py-1 text-[10px] md:px-3 md:py-2 md:text-xs border border-gray-300 uppercase tracking-widest text-gray-600 hover:bg-gray-50"
              >
                <Shield className="h-3.5 w-3.5" />
                Mod Tools
              </Link>
            ) : null}

            <button
              onClick={handleJoinLeave}
              disabled={loading || membership?.role === 'OWNER'}
              className={cn(
                'px-2 py-1 text-[10px] md:px-4 md:py-2 md:text-xs uppercase tracking-widest font-light transition-colors',
                isMember
                  ? 'border border-red-300 text-red-600 hover:bg-red-50'
                  : 'bg-pink-500 hover:bg-pink-600 text-white',
                (loading || membership?.role === 'OWNER') && 'opacity-50 cursor-not-allowed',
              )}
            >
              {loading
                ? '...'
                : membership?.role === 'OWNER'
                  ? 'Ersteller'
                  : isMember
                    ? 'Verlassen'
                    : 'Beitreten'}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-500 uppercase tracking-widest">
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {community.memberCount.toLocaleString('de-DE')} Mitglieder
          </div>
          <div className="flex items-center gap-1">
            {typeIcon[community.type]}
            {typeLabel[community.type]}
          </div>
        </div>

        {community.description && (
          <p className="text-sm text-gray-600 mt-2 font-light leading-relaxed">
            {community.description}
          </p>
        )}
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users } from 'lucide-react'

interface CommunityCardProps {
  community: {
    id: string
    name: string
    slug: string
    description?: string | null
    icon?: string | null
    memberCount: number
    type: string
  }
  rank?: number
}

export default function CommunityCard({ community, rank }: CommunityCardProps) {
  return (
    <Link
      href={`/community/${community.slug}`}
      className="flex items-center gap-3 border border-gray-200 bg-white hover:border-pink-400 transition-colors p-3 group"
    >
      {rank !== undefined && (
        <span className="text-xs font-medium text-gray-400 w-5 text-center">{rank}</span>
      )}
      <Avatar className="h-9 w-9 flex-shrink-0">
        {community.icon ? <AvatarImage src={community.icon} /> : null}
        <AvatarFallback className="text-sm font-light bg-pink-100 text-pink-600">
          {community.name[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 group-hover:text-pink-600 truncate">
          c/{community.name}
        </h4>
        {community.description && (
          <p className="text-[10px] text-gray-500 truncate mt-0.5">
            {community.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 text-[10px] text-gray-400 flex-shrink-0">
        <Users className="h-3 w-3" />
        {community.memberCount.toLocaleString('de-DE')}
      </div>
    </Link>
  )
}

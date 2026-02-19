'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarUrl } from '@/utils/avatar'

interface UserAvatarProps {
  avatar?: string | null
  userType?: string | null
  displayName?: string | null
  className?: string
  fallbackClassName?: string
}

/**
 * Centralised avatar component.
 * Shows the user's custom avatar, or a default silhouette image
 * based on userType (man for MEMBER, woman for ESCORT/HOBBYHURE).
 */
export default function UserAvatar({
  avatar,
  userType,
  displayName,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const src = getAvatarUrl(avatar, userType)
  const initial = (displayName ?? '?').charAt(0).toUpperCase()

  return (
    <Avatar className={className}>
      <AvatarImage src={src} alt={displayName ? `Avatar von ${displayName}` : 'avatar'} />
      <AvatarFallback className={fallbackClassName}>
        {initial}
      </AvatarFallback>
    </Avatar>
  )
}

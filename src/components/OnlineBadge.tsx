'use client'

import { useEffect, useState } from 'react'

type Props = {
  userId: string
  initialOnline?: boolean
  className?: string
}

export default function OnlineBadge({ userId, initialOnline = false, className }: Props) {
  const [online, setOnline] = useState<boolean>(initialOnline)

  useEffect(() => {
    let cancelled = false
    const fetchPresence = async () => {
      try {
        const res = await fetch(`/api/presence?ids=${encodeURIComponent(userId)}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        if (data && typeof data[userId]?.online === 'boolean') {
          setOnline(!!data[userId].online)
        }
      } catch {}
    }
    fetchPresence()
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchPresence()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId])

  return (
    <span className={`${className || ''} inline-block`}>
      <span
        className={`block h-3 w-3 rounded-full ${online ? 'bg-emerald-500' : 'bg-gray-400'} ring-2 ring-white`}
        title={online ? 'Online' : 'Offline'}
        aria-label={online ? 'Online' : 'Offline'}
      />
    </span>
  )
}

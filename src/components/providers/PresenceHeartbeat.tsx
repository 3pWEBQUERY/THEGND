'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function PresenceHeartbeat() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated') return

    let cancelled = false
    const ping = async () => {
      try {
        await fetch('/api/presence', { method: 'POST' })
      } catch {}
    }

    // Initial ping
    ping()

    const onVisibility = () => {
      if (document.visibilityState === 'visible') ping()
    }
    document.addEventListener('visibilitychange', onVisibility)

    // Interval every 2 minutes
    const id = setInterval(ping, 2 * 60 * 1000)

    return () => {
      cancelled = true
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [status])

  return null
}

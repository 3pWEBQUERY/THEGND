'use client'

import { useEffect, useRef } from 'react'

function getOrCreateSessionId(): string {
  try {
    const key = 'tgnd_analytics_session'
    let sid = localStorage.getItem(key)
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem(key, sid)
    }
    return sid
  } catch {
    // Fallback if localStorage unavailable
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
  }
}

export default function ProfileAnalyticsTracker({ profileUserId }: { profileUserId: string }) {
  const startTsRef = useRef<number>(0)
  const sessionIdRef = useRef<string>('')

  useEffect(() => {
    let active = false
    const setup = async () => {
      // Preflight: Only track if globally active to reduce noise
      try {
        const g = await fetch('/api/addons/available', { cache: 'no-store' })
        const gj = await g.json().catch(() => ({}))
        const keys: string[] = Array.isArray(gj?.activeKeys) ? gj.activeKeys : []
        active = keys.includes('PROFILE_ANALYTICS')
      } catch {
        active = false
      }
      if (!active) return

      sessionIdRef.current = getOrCreateSessionId()
      startTsRef.current = Date.now()

      const send = async (payload: any) => {
        try {
          await fetch('/api/analytics/profile/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              profileUserId,
              sessionId: sessionIdRef.current,
              path: typeof window !== 'undefined' ? window.location.pathname : undefined,
              referrer: typeof document !== 'undefined' ? document.referrer : undefined,
              ...payload,
            }),
            keepalive: true,
          })
        } catch {}
      }

      // view_start
      send({ type: 'view_start' })

      // clicks
      const onClick = (e: MouseEvent) => {
        try {
          const target = e.target as HTMLElement | null
          if (!target) return
          // Find nearest clickable element
          const clickable = target.closest('a, button, [role="button"], [data-analytics]') as HTMLElement | null
          if (!clickable) return
          const href = (clickable as HTMLAnchorElement).href || clickable.getAttribute('data-href') || null
          const label = clickable.getAttribute('aria-label') || clickable.innerText?.trim()?.slice(0, 120) || null
          const id = clickable.id || null
          const cls = clickable.className ? String(clickable.className).slice(0, 160) : null
          const meta = { href, label, id, cls }
          send({ type: 'click', meta })
        } catch {}
      }
      document.addEventListener('click', onClick, { capture: true })

      // view_end with duration
      const onUnload = () => {
        const durationMs = Math.max(0, Date.now() - startTsRef.current)
        send({ type: 'view_end', durationMs })
      }
      window.addEventListener('pagehide', onUnload)
      window.addEventListener('beforeunload', onUnload)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') onUnload()
      })

      return () => {
        document.removeEventListener('click', onClick, { capture: true } as any)
        window.removeEventListener('pagehide', onUnload)
        window.removeEventListener('beforeunload', onUnload)
      }
    }

    const cleanupPromise = setup()
    return () => {
      // Best-effort cleanup; listeners are cleaned up inside setup return if active
      void cleanupPromise
    }
  }, [profileUserId])

  return null
}

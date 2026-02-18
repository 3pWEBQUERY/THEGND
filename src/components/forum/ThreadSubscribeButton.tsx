'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { AuthRequiredModal } from '@/components/groups/GroupJoinLeaveButton'

export default function ThreadSubscribeButton({ threadId }: { threadId: string }) {
  const { data: session } = useSession()
  const [subscribed, setSubscribed] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/forum/threads/${threadId}/subscription`, { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        setSubscribed(!!data?.subscribed)
      } catch {
        setSubscribed(false)
      }
    }
    load()
  }, [threadId])

  const toggle = async () => {
    if (subscribed === null) return
    if (!session?.user) { setShowAuth(true); return }
    setBusy(true)
    try {
      const res = await fetch(`/api/forum/threads/${threadId}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: subscribed ? 'unsubscribe' : 'subscribe' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Fehler')
      setSubscribed(!subscribed)
    } catch (e) {
      // ignore
    } finally {
      setBusy(false)
    }
  }

  if (subscribed === null) return null

  return (
    <>
      <button onClick={toggle} disabled={busy} className="px-3 py-1.5 border border-gray-300 text-xs uppercase tracking-widest hover:bg-gray-50 disabled:opacity-60">
        {subscribed ? 'Abo beenden' : 'Abonnieren'}
      </button>
      <AuthRequiredModal open={showAuth && !session?.user} onClose={() => setShowAuth(false)} />
    </>
  )
}

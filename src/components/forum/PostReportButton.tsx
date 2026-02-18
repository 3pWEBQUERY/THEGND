'use client'

import { useEffect, useState } from 'react'

export default function PostReportButton({ postId, authorId }: { postId: string; authorId: string }) {
  const [me, setMe] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/account', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json().catch(() => ({}))
        // Not ideal: we don't return userId here; if needed, expand API. Fallback: hide when not available.
        // For now, show Report button to logged-in users only; account returns 401 if not logged in.
        setMe('me')
      } catch {}
    }
    load()
  }, [])

  if (!me) return null
  // we cannot reliably compare with authorId without userId from /api/account; allow reporting, server-side can check duplicates if needed

  async function report() {
    const reason = window.prompt('Grund für Meldung (optional):') || undefined
    setBusy(true)
    try {
      const res = await fetch(`/api/forum/posts/${postId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Melden fehlgeschlagen')
      alert('Meldung gesendet. Danke!')
    } catch (e: any) {
      alert(e?.message || 'Fehler')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={report}
      disabled={busy}
      className="px-3 py-1.5 border border-amber-300 text-xs uppercase tracking-widest text-amber-700 hover:bg-amber-50 disabled:opacity-60"
    >
      Melden
    </button>
  )
}

'use client'

import { useState } from 'react'

export default function ReviewAssetButtons({ assetId, onDone, hideReject }: { assetId: string; onDone?: (newStatus: 'APPROVED' | 'REJECTED') => void; hideReject?: boolean }) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [toast, setToast] = useState<{ text: string; kind: 'success' | 'error' } | null>(null)
  const act = async (action: 'approve' | 'reject') => {
    if (loading) return
    setLoading(action)
    try {
      const res = await fetch(`/api/acp/marketing/assets/${assetId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error('Fehler')
      // success toast + slight delay before refresh
      const newStatus: 'APPROVED' | 'REJECTED' = action === 'approve' ? 'APPROVED' : 'REJECTED'
      setToast({ text: action === 'approve' ? 'Asset freigegeben.' : 'Asset abgelehnt.', kind: 'success' })
      setTimeout(() => {
        onDone ? onDone(newStatus) : window.location.reload()
      }, 700)
    } catch {
      setToast({ text: 'Aktion fehlgeschlagen.', kind: 'error' })
      setTimeout(() => setToast(null), 2500)
      setLoading(null)
    }
  }
  return (
    <div className="flex items-center gap-2 relative">
      <button
        onClick={() => act('approve')}
        disabled={loading !== null}
        className="px-3 py-1 text-xs uppercase tracking-widest bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
      >
        {loading === 'approve' ? 'Freigebe…' : 'Freigeben'}
      </button>
      {!hideReject && (
        <button
          onClick={() => act('reject')}
          disabled={loading !== null}
          className="px-3 py-1 text-xs uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
        >
          {loading === 'reject' ? 'Ablehne…' : 'Ablehnen'}
        </button>
      )}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 text-sm shadow border z-50 ${toast.kind === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
          {toast.text}
        </div>
      )}
    </div>
  )
}

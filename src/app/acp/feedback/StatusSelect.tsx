'use client'

import React from 'react'

export default function StatusSelect({ id, value }: { id: string; value: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' }) {
  const [v, setV] = React.useState(value)
  const [busy, setBusy] = React.useState(false)

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value
    setV(next as any)
    setBusy(true)
    try {
      await fetch('/api/acp/feedback/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next }),
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <select
      className="border border-gray-300 px-2 py-1 text-xs uppercase tracking-widest bg-white"
      value={v}
      onChange={onChange}
      disabled={busy}
    >
      <option value="OPEN">OPEN</option>
      <option value="IN_REVIEW">IN_REVIEW</option>
      <option value="RESOLVED">RESOLVED</option>
    </select>
  )
}

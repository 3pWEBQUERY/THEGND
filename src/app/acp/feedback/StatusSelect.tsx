'use client'

import React from 'react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export default function StatusSelect({ id, value }: { id: string; value: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' }) {
  const [v, setV] = React.useState(value)
  const [busy, setBusy] = React.useState(false)

  async function handleChange(next: string) {
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
    <Select value={v} onValueChange={handleChange} disabled={busy}>
      <SelectTrigger className="border border-gray-300 px-2 py-1 text-xs uppercase tracking-widest bg-white rounded-none min-w-[130px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="OPEN">OPEN</SelectItem>
        <SelectItem value="IN_REVIEW">IN_REVIEW</SelectItem>
        <SelectItem value="RESOLVED">RESOLVED</SelectItem>
      </SelectContent>
    </Select>
  )
}

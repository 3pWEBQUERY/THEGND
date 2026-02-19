'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export default function FeedbackFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get('status')?.toUpperCase() || ''
  const currentReason = searchParams.get('reason')?.toUpperCase() || ''

  function applyFilters(newStatus?: string, newReason?: string) {
    const params = new URLSearchParams()
    const s = newStatus !== undefined ? newStatus : currentStatus
    const r = newReason !== undefined ? newReason : currentReason
    if (s) params.set('status', s)
    if (r) params.set('reason', r)
    const qs = params.toString()
    router.push(`/acp/feedback${qs ? `?${qs}` : ''}`)
  }

  return (
    <div className="mt-4 mb-4 flex flex-wrap gap-3 items-end">
      <div>
        <label className="block text-[11px] uppercase tracking-widest text-gray-600 mb-1">Status</label>
        <Select
          value={currentStatus || '_all'}
          onValueChange={(v) => applyFilters(v === '_all' ? '' : v, undefined)}
        >
          <SelectTrigger className="border border-gray-300 px-2 py-1 text-xs bg-white rounded-none min-w-[150px]">
            <SelectValue placeholder="Alle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Alle</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_REVIEW">In Review</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-[11px] uppercase tracking-widest text-gray-600 mb-1">Grund</label>
        <Select
          value={currentReason || '_all'}
          onValueChange={(v) => applyFilters(undefined, v === '_all' ? '' : v)}
        >
          <SelectTrigger className="border border-gray-300 px-2 py-1 text-xs bg-white rounded-none min-w-[180px]">
            <SelectValue placeholder="Alle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Alle</SelectItem>
            <SelectItem value="REPORT_AD">Anzeige melden</SelectItem>
            <SelectItem value="BUG">Funktioniert nicht</SelectItem>
            <SelectItem value="PRAISE">Lob &amp; Kritik</SelectItem>
            <SelectItem value="ADVERTISING">Werbung</SelectItem>
            <SelectItem value="CUSTOMER_SERVICE">Kundenbetreuer</SelectItem>
            <SelectItem value="OTHER">Etwas anderes</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

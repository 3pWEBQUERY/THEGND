'use client'

import Link from 'next/link'
import ReviewAssetButtons from '@/components/admin/ReviewAssetButtons'
import { useMemo, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function statusLabel(s: string) {
  if (s === 'APPROVED') return 'Freigegeben'
  if (s === 'REJECTED') return 'Abgelehnt'
  return 'Ausstehend'
}

function statusClass(s: string) {
  if (s === 'APPROVED') return 'bg-green-100 text-green-700'
  if (s === 'REJECTED') return 'bg-red-100 text-red-700'
  return 'bg-amber-100 text-amber-800'
}

function placementLabel(k: string) {
  return k.replace(/_/g, ' ').toLowerCase()
}

function formatCHF(n: number) {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(n)
}

function aspectFor(pk: string) {
  switch (pk) {
    case 'HOME_BANNER':
    case 'HOME_TOP':
    case 'HOME_MID':
    case 'HOME_BOTTOM':
    case 'RESULTS_TOP':
      return 'aspect-[4/1]'
    case 'HOME_TILE':
      return 'aspect-square'
    case 'SIDEBAR':
      return 'aspect-[3/5]'
    case 'SPONSORED_POST':
      return 'aspect-[3/2]'
    default:
      return 'aspect-video'
  }
}

export type MarketingAssetItem = {
  id: string
  url: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewNote?: string | null
  createdAt: string
  reviewedAt?: string | null
  orderItem: {
    id: string
    placementKey: string
    durationDays: number
    priceCents: number
    createdAt: string
    order: { id: string }
  }
}
export default function MarketingAssetsGrid({ initialAssets, statusFilter }: { initialAssets: MarketingAssetItem[]; statusFilter: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL' }) {
  const [assets, setAssets] = useState<MarketingAssetItem[]>(initialAssets)
  const [toast, setToast] = useState<{ text: string; kind: 'success' | 'error' } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogAssetId, setDialogAssetId] = useState<string | null>(null)
  const [dialogNote, setDialogNote] = useState('')
  const [approveOpen, setApproveOpen] = useState(false)
  const [approveAssetId, setApproveAssetId] = useState<string | null>(null)
  const [approveNote, setApproveNote] = useState('')
  const [placementFilter, setPlacementFilter] = useState<string>('ALL')
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'D7' | 'D30'>('ALL')

  const onReviewed = (assetId: string, next: 'APPROVED' | 'REJECTED') => {
    setAssets(prev => {
      const updated = prev.map(a => a.id === assetId ? { ...a, status: next } : a)
      if (statusFilter !== 'ALL') {
        // remove assets that no longer match the current tab
        return updated.filter(a => a.status === statusFilter)
      }
      return updated
    })
    setToast({ text: next === 'APPROVED' ? 'Asset freigegeben.' : 'Asset abgelehnt.', kind: 'success' })
    setTimeout(() => setToast(null), 2000)
  }

  const placements = useMemo(() => {
    const set = new Set<string>()
    assets.forEach(a => set.add(a.orderItem.placementKey))
    return ['ALL', ...Array.from(set)]
  }, [assets])

  const grid = useMemo(() => {
    let list = assets
    if (placementFilter !== 'ALL') list = list.filter(a => a.orderItem.placementKey === placementFilter)
    if (timeFilter !== 'ALL') {
      const now = Date.now()
      const ms = timeFilter === 'D7' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000
      list = list.filter(a => now - new Date(a.createdAt).getTime() <= ms)
    }
    return list
  }, [assets, placementFilter, timeFilter])

  const submitReject = async () => {
    const id = dialogAssetId
    if (!id) return
    try {
      const res = await fetch(`/api/acp/marketing/assets/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', note: dialogNote }),
      })
      const ok = res.ok
      if (!ok) throw new Error('reject_failed')
      onReviewed(id, 'REJECTED')
      setDialogOpen(false)
      setDialogNote('')
      setDialogAssetId(null)
    } catch (e) {
      setToast({ text: 'Aktion fehlgeschlagen.', kind: 'error' })
      setTimeout(() => setToast(null), 2500)
    }
  }

  // Approve with optional note (modal)
  const submitApprove = async () => {
    const id = approveAssetId
    if (!id) return
    try {
      const res = await fetch(`/api/acp/marketing/assets/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', note: approveNote }),
      })
      if (!res.ok) throw new Error('approve_failed')
      onReviewed(id, 'APPROVED')
      setApproveOpen(false)
      setApproveNote('')
      setApproveAssetId(null)
    } catch (e) {
      setToast({ text: 'Aktion fehlgeschlagen.', kind: 'error' })
      setTimeout(() => setToast(null), 2500)
    }
  }

  // Export current grid rows as CSV
  const exportCSV = () => {
    const rows: (string | number)[][] = [
      ['id', 'createdAt', 'status', 'placementKey', 'durationDays', 'priceCHF', 'orderId', 'url'],
      ...grid.map((a: MarketingAssetItem) => [
        a.id,
        new Date(a.createdAt).toISOString(),
        a.status,
        a.orderItem.placementKey,
        String(a.orderItem.durationDays),
        String((a.orderItem.priceCents / 100).toFixed(2)),
        a.orderItem.order.id,
        a.url,
      ]),
    ]
    const csv = rows.map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const aTag = document.createElement('a')
    aTag.href = url
    aTag.download = 'marketing_assets.csv'
    aTag.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mt-6">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Placement:</span>
          <Select value={placementFilter} onValueChange={(v) => setPlacementFilter(v)}>
            <SelectTrigger className="w-48 h-8 border-gray-200 text-sm">
              <SelectValue placeholder="Alle" />
            </SelectTrigger>
            <SelectContent>
              {placements.map((p) => (
                <SelectItem key={p} value={p}>{p === 'ALL' ? 'Alle' : p.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Zeitraum:</span>
          <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as 'ALL' | 'D7' | 'D30')}>
            <SelectTrigger className="w-48 h-8 border-gray-200 text-sm">
              <SelectValue placeholder="Alle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Alle</SelectItem>
              <SelectItem value="D7">Letzte 7 Tage</SelectItem>
              <SelectItem value="D30">Letzte 30 Tage</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <button onClick={exportCSV} className="ml-auto px-2 py-1 border text-xs hover:border-pink-500 hover:text-pink-600">CSV exportieren</button>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 text-sm shadow border z-50 ${toast.kind === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
          {toast.text}
        </div>
      )}
      {grid.map((a) => {
        const now = Date.now()
        const start = a.reviewedAt ? new Date(a.reviewedAt).getTime() : new Date(a.orderItem.createdAt).getTime()
        const end = start + a.orderItem.durationDays * 24 * 60 * 60 * 1000
        const isActive = start <= now && end > now
        return (
        <div key={a.id} className="border border-gray-200 bg-white shadow-sm">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`text-[11px] uppercase tracking-widest px-2 py-0.5 ${statusClass(a.status)}`}>{statusLabel(a.status)}</div>
              {isActive && (
                <div className="text-[11px] uppercase tracking-widest px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200">AKTIV</div>
              )}
            </div>
            <div className="text-[11px] text-gray-500">{new Date(a.createdAt).toLocaleString('de-CH')}</div>
          </div>
          <div className={`w-full bg-gray-50 border-t border-b ${aspectFor(a.orderItem.placementKey)}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.url} alt="Asset" className="w-full h-full object-contain" />
          </div>
          <div className="p-4 text-sm">
            <div className="text-gray-900 font-medium capitalize">{placementLabel(a.orderItem.placementKey)}</div>
            <div className="text-xs text-gray-600">Dauer: {a.orderItem.durationDays} Tage</div>
            <div className="text-xs text-gray-600">Preis: {formatCHF(a.orderItem.priceCents / 100)}</div>
            {a.reviewNote && <div className="mt-2 text-xs text-gray-500">Notiz: {a.reviewNote}</div>}
            <div className="mt-3">
              <Link href={`/acp/marketing?status=${statusFilter}`} className="text-xs text-gray-500 hover:text-gray-700 break-all">#{a.orderItem.order.id}</Link>
            </div>
            {a.status === 'PENDING' ? (
              <div className="mt-2 flex items-center gap-2">
                <ReviewAssetButtons assetId={a.id} hideReject onDone={(ns) => onReviewed(a.id, ns)} />
                <button
                  onClick={() => { setDialogAssetId(a.id); setDialogNote(''); setDialogOpen(true) }}
                  className="px-3 py-1 text-xs uppercase tracking-widest border border-rose-300 text-rose-700 hover:bg-rose-50"
                >
                  Ablehnen
                </button>
              </div>
            ) : (
              <div className="mt-2 text-[11px] text-gray-500 uppercase tracking-widest">Keine Aktion</div>
            )}
          </div>
        </div>
        )
      })}
      {grid.length === 0 && (
        <div className="col-span-full mt-10 text-sm text-gray-600">Keine Assets im aktuellen Filter.</div>
      )}

      {/* Reject Modal */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDialogOpen(false)} />
          <div className="relative bg-white w-full max-w-md mx-4 border border-gray-200 shadow-lg">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-light tracking-widest text-gray-800 uppercase">Asset ablehnen</h3>
              <button onClick={() => setDialogOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-4">
              <label className="block text-xs text-gray-600 mb-1">Begründung (optional)</label>
              <textarea
                value={dialogNote}
                onChange={(e) => setDialogNote(e.target.value)}
                rows={4}
                className="w-full border border-gray-200 p-2 text-sm focus:outline-none focus:ring-0 focus:border-pink-500"
                placeholder="Kurze Begründung für die Ablehnung"
              />
              <div className="mt-4 flex items-center justify-end gap-2">
                <button onClick={() => setDialogOpen(false)} className="px-3 py-2 text-xs border border-gray-200 hover:bg-gray-50">Abbrechen</button>
                <button onClick={submitReject} className="px-3 py-2 text-xs border border-rose-300 text-rose-700 hover:bg-rose-50">Ablehnen</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve with note Modal */}
      {approveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setApproveOpen(false)} />
          <div className="relative bg-white w-full max-w-md mx-4 border border-gray-200 shadow-lg">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-light tracking-widest text-gray-800 uppercase">Asset freigeben</h3>
              <button onClick={() => setApproveOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-4">
              <label className="block text-xs text-gray-600 mb-1">Notiz (optional)</label>
              <textarea
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                rows={4}
                className="w-full border border-gray-200 p-2 text-sm focus:outline-none focus:ring-0 focus:border-pink-500"
                placeholder="Optionale Notiz für die Freigabe"
              />
              <div className="mt-4 flex items-center justify-end gap-2">
                <button onClick={() => setApproveOpen(false)} className="px-3 py-2 text-xs border border-gray-200 hover:bg-gray-50">Abbrechen</button>
                <button onClick={submitApprove} className="px-3 py-2 text-xs border border-emerald-300 text-emerald-700 hover:bg-emerald-50">Freigeben</button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

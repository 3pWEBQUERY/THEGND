"use client"

import { useMemo, useState } from "react"
import { useSession } from "next-auth/react"

export type VerificationItem = {
  id: string
  createdAt: string // ISO
  userEmail?: string | null
  userType?: string | null
  firstName: string
  lastName: string
  birthDate: string // ISO
  status: "PENDING" | "APPROVED" | "REJECTED"
  idPhotoUrl: string
  selfiePhotoUrl: string
  idVideoUrl?: string | null
  reviewedAt?: string | null
  reviewedByEmail?: string | null
}

export default function VerificationsTable({ items: initialItems }: { items: VerificationItem[] }) {
  const { data: session } = useSession()
  const [items, setItems] = useState<VerificationItem[]>(initialItems)
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ text: string; kind: 'success' | 'error' } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogRow, setDialogRow] = useState<VerificationItem | null>(null)
  const [dialogNote, setDialogNote] = useState('')
  const [resyncBusy, setResyncBusy] = useState(false)

  const visible = useMemo(() => {
    if (filter === "ALL") return items
    return items.filter((i) => i.status === filter)
  }, [items, filter])

  const counters = useMemo(() => {
    const all = items.length
    const pending = items.filter(i => i.status === 'PENDING').length
    const approved = items.filter(i => i.status === 'APPROVED').length
    const rejected = items.filter(i => i.status === 'REJECTED').length
    return { all, pending, approved, rejected }
  }, [items])

  const badge = (status: VerificationItem["status"]) => {
    const cls =
      status === "PENDING"
        ? "bg-amber-100 text-amber-800 border-amber-200"
        : status === "APPROVED"
        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
        : "bg-rose-100 text-rose-800 border-rose-200"
    return <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest border ${cls}`}>{status}</span>
  }

  const typeBadge = (userType?: string | null) => {
    const isEscort = (userType || '').toUpperCase() === 'ESCORT'
    return isEscort ? (
      <span className="px-2 py-0.5 text-[10px] uppercase tracking-widest border bg-rose-50 text-rose-700 border-rose-200">18+</span>
    ) : (
      <span className="px-2 py-0.5 text-[10px] uppercase tracking-widest border bg-sky-50 text-sky-700 border-sky-200">ID</span>
    )
  }

  const doAction = async (row: VerificationItem, action: "approve" | "reject", note?: string) => {
    try {
      setBusyId(row.id)
      const res = await fetch(`/api/acp/verifications/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      })
      if (!res.ok) throw new Error("update_failed")
      const data = await res.json().catch(() => ({}))
      const newStatus = (data?.status as VerificationItem["status"]) || (action === "approve" ? "APPROVED" : "REJECTED")
      const reviewerEmail = session?.user?.email ?? null
      setItems((prev) => prev.map((it) => (it.id === row.id ? { ...it, status: newStatus, reviewedAt: new Date().toISOString(), reviewedByEmail: reviewerEmail } : it)))
      setToast({ text: action === 'approve' ? 'Antrag angenommen.' : 'Antrag abgelehnt.', kind: 'success' })
      // auto hide toast
      setTimeout(() => setToast(null), 2500)
    } catch (e) {
      setToast({ text: 'Aktion fehlgeschlagen.', kind: 'error' })
      setTimeout(() => setToast(null), 3000)
    } finally {
      setBusyId(null)
    }
  }

  const onApprove = (row: VerificationItem) => doAction(row, 'approve')
  const onReject = (row: VerificationItem) => {
    setDialogRow(row)
    setDialogNote('')
    setDialogOpen(true)
  }

  const resync = async () => {
    try {
      setResyncBusy(true)
      const res = await fetch('/api/acp/verifications/backfill')
      if (!res.ok) throw new Error('backfill_failed')
      setToast({ text: 'Sichtbarkeit synchronisiert.', kind: 'success' })
      setTimeout(() => setToast(null), 2500)
    } catch (e) {
      setToast({ text: 'Sync fehlgeschlagen.', kind: 'error' })
      setTimeout(() => setToast(null), 3000)
    } finally {
      setResyncBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-gray-600">
          Insgesamt: {counters.all}
          <span className="ml-3 text-xs text-gray-500">Ausstehend: {counters.pending}</span>
          <span className="ml-3 text-xs text-gray-500">Angenommen: {counters.approved}</span>
          <span className="ml-3 text-xs text-gray-500">Abgelehnt: {counters.rejected}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resync}
            disabled={resyncBusy}
            className="px-2 py-1 border text-xs hover:border-pink-500 hover:text-pink-600 disabled:opacity-50"
          >
            {resyncBusy ? 'Sync…' : 'Sichtbarkeit syncen'}
          </button>
          <label className="text-xs text-gray-500">Filtern:</label>
          <select
            value={filter}
            onChange={(e) => {
              const v = e.target.value as any
              setFilter(v)
              const url = new URL(window.location.href)
              if (v === 'ALL') url.searchParams.delete('status')
              else url.searchParams.set('status', v)
              window.history.replaceState({}, '', url.toString())
            }}
            className="border border-gray-200 bg-white text-sm px-2 py-1"
          >
            <option value="ALL">Alle</option>
            <option value="PENDING">Ausstehend</option>
            <option value="APPROVED">Angenommen</option>
            <option value="REJECTED">Abgelehnt</option>
          </select>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 text-sm shadow border ${toast.kind === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
          {toast.text}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <th className="py-2 pr-4 font-normal">Erstellt</th>
              <th className="py-2 pr-4 font-normal">User</th>
              <th className="py-2 pr-4 font-normal">Name</th>
              <th className="py-2 pr-4 font-normal">Geburtsdatum</th>
              <th className="py-2 pr-4 font-normal">Status</th>
              <th className="py-2 pr-4 font-normal">Medien</th>
              <th className="py-2 pr-4 font-normal">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((v) => (
              <tr key={v.id} className="border-t border-gray-200 align-top">
                <td className="py-3 pr-4 whitespace-nowrap">{new Date(v.createdAt).toLocaleString("de-DE")}</td>
                <td className="py-3 pr-4">{v.userEmail || "-"}</td>
                <td className="py-3 pr-4">{v.firstName} {v.lastName}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{new Date(v.birthDate).toLocaleDateString("de-DE")}</td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    {typeBadge(v.userType)}
                    {badge(v.status)}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <a href={v.idPhotoUrl} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline">ID</a>
                    <a href={v.selfiePhotoUrl} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline">Selfie</a>
                    {v.idVideoUrl && (
                      <a href={v.idVideoUrl} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline">Video</a>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  {v.status === "PENDING" ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onApprove(v)}
                        disabled={busyId === v.id}
                        className="px-2 py-1 border text-xs hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-50"
                      >
                        {busyId === v.id ? "…" : "Annehmen"}
                      </button>
                      <button
                        onClick={() => onReject(v)}
                        disabled={busyId === v.id}
                        className="px-2 py-1 border text-xs hover:border-rose-500 hover:text-rose-600 disabled:opacity-50"
                      >
                        {busyId === v.id ? "…" : "Ablehnen"}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {v.reviewedAt ? new Date(v.reviewedAt).toLocaleString("de-DE") : ""}
                      {v.reviewedByEmail ? ` • ${v.reviewedByEmail}` : ""}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={dialogOpen} title="Antrag ablehnen" onClose={() => setDialogOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Begründung (optional)</label>
            <textarea
              value={dialogNote}
              onChange={(e) => setDialogNote(e.target.value)}
              rows={4}
              className="w-full border border-gray-200 p-2 text-sm focus:outline-none focus:ring-0 focus:border-pink-500"
              placeholder="Kurze Begründung für die Ablehnung"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="px-3 py-2 text-xs border border-gray-200 hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={() => {
                const row = dialogRow
                if (!row) return
                setDialogOpen(false)
                doAction(row, 'reject', dialogNote)
                setDialogNote('')
                setDialogRow(null)
              }}
              className="px-3 py-2 text-xs border border-rose-300 text-rose-700 hover:bg-rose-50"
            >
              Ablehnen
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// Simple modal dialog inline
// No external dependencies, Tailwind-based styling
function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md mx-4 border border-gray-200 shadow-lg">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-light tracking-widest text-gray-800 uppercase">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

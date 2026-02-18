'use client'

import { Fragment } from 'react'
import { X } from 'lucide-react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export type Visitor = {
  id: string
  displayName: string
  avatar: string | null
  visitedAt: string
}

type Props = {
  open: boolean
  onClose: () => void
  visitors: Visitor[] | null
  anonCount: number
  loading: boolean
  days: number
  onDaysChange: (n: number) => void
}

export default function ProfileVisitorsModal({ open, onClose, visitors, anonCount, loading, days, onDaysChange }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg border border-gray-200 p-4 sm:p-6 relative">
          <button className="absolute top-2 right-2 p-2 text-gray-600 hover:text-pink-500" onClick={onClose} aria-label="Schließen">
            <X className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-thin tracking-widest text-gray-800 mb-1 uppercase">PROFIL-BESUCHER</h3>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-gray-500 uppercase tracking-widest">ZEITRAUM</div>
            <Select value={String(days)} onValueChange={(v) => onDaysChange(Number(v) || days)}>
              <SelectTrigger size="sm" className="min-w-[8rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[120]">
                <SelectItem value="7">7 Tage</SelectItem>
                <SelectItem value="30">30 Tage</SelectItem>
                <SelectItem value="90">90 Tage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {loading ? (
            <div className="text-sm text-gray-600">Lädt…</div>
          ) : (
            <Fragment>
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
                {(visitors || []).map((v) => (
                  <div key={v.id} className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                      {v.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.avatar} alt={v.displayName} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-gray-600 text-sm">{(v.displayName || '').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="text-[10px] tracking-widest text-gray-700 text-center truncate w-full" title={v.displayName}>{v.displayName}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm text-gray-700">
                Nichtregistrierte Besucher: <span className="font-medium">{anonCount}</span>
              </div>
            </Fragment>
          )}
        </div>
      </div>
    </div>
  )
}

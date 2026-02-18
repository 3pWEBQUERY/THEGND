"use client"

import { useMemo, useState } from "react"
import * as Icons from "lucide-react"
import { POPULAR_KEYS, EXTENDED_KEYS } from '@/components/icons/iconMap'

// Curated lists (fallback-safe)
const POPULAR_ICONS: string[] = POPULAR_KEYS
const EXTENDED_ICONS: string[] = EXTENDED_KEYS

export default function IconPicker({
  value,
  onChange,
  label = "Icon",
}: {
  value?: string | null
  onChange: (icon: string | null) => void
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [all, setAll] = useState(false)

  // Use curated lists to avoid runtime enumeration issues in some bundlers
  const baseList: string[] = useMemo(() => (all ? EXTENDED_ICONS : POPULAR_ICONS), [all])

  // Determine available keys from lucide-react at runtime (for fallback)
  const availableKeys: string[] = useMemo(() => {
    const map = (Icons as any).icons as Record<string, any> | undefined
    if (map && typeof map === 'object') {
      return Object.keys(map)
    }
    // Fallback: try named exports
    return Object.keys(Icons).filter((k) => {
      const v = (Icons as any)[k]
      return (typeof v === 'function' || typeof v === 'object') && /^[A-Z]/.test(k)
    })
  }, [])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const source = q ? baseList.filter((k) => k.toLowerCase().includes(q)) : baseList
    if (source.length > 0) return source
    // Fallback to first N available icons (apply query if present)
    const pool = q ? availableKeys.filter((k) => k.toLowerCase().includes(q)) : availableKeys
    return pool.slice(0, 72)
  }, [baseList, query, availableKeys])

  const toKebab = (s: string) => s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase()

  const resolveIcon = (key?: string) => {
    if (!key) return (Icons as any).Circle
    const direct = (Icons as any)[key]
    if (typeof direct === 'function' || typeof direct === 'object') return direct
    const iconsMap = (Icons as any).icons
    const make = (Icons as any).createLucideIcon
    if (iconsMap && make) {
      const node = iconsMap[key] || iconsMap[toKebab(key)]
      if (node) return make(key, node)
    }
    return (Icons as any).Circle
  }

  const CurrentIcon = resolveIcon(value as string)

  return (
    <div className="relative">
      <label className="block text-sm text-gray-700 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-none text-sm text-gray-700 bg-white"
      >
        <CurrentIcon className="h-4 w-4" />
        <span className="text-xs tracking-widest">{value || "Icon wählen"}</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-2 w-[22rem] border border-gray-200 bg-white p-3 shadow-md">
          <div className="mb-2">
            <input
              placeholder="Suche Icon..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-none px-2 py-1 text-sm"
            />
          </div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[11px] text-gray-600">{all ? 'Alle Icons' : 'Empfohlene Icons'}</div>
            <label className="inline-flex items-center gap-2 text-xs text-gray-700">
              <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} />
              Alle Icons anzeigen
            </label>
          </div>
          <div className="grid grid-cols-6 gap-2 max-h-72 overflow-auto">
            {list.map((k) => {
              const Ico = resolveIcon(k)
              const active = value === k
              return (
                <button
                  type="button"
                  key={k}
                  onClick={() => { onChange(k); setOpen(false) }}
                  className={`flex flex-col items-center gap-1 border px-2 py-2 ${active ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-300'} text-[10px]`}
                  title={k}
                >
                  <Ico className="h-5 w-5" />
                  <span className="truncate w-full text-center">{k}</span>
                </button>
              )
            })}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button type="button" className="text-xs border px-2 py-1" onClick={() => { onChange(null); setOpen(false) }}>Kein Icon</button>
            <button type="button" className="text-xs border px-2 py-1" onClick={() => setOpen(false)}>Schließen</button>
          </div>
        </div>
      )}
    </div>
  )
}

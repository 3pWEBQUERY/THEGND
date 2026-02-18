'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, Search, X } from 'lucide-react'

export type MultiSelectOption = {
  value: string
  label: string
}

type MultiSelectProps = {
  options: MultiSelectOption[]
  value: string[]
  onChange: (val: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  emptyText?: string
  searchPlaceholder?: string
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Auswählen...',
  className,
  disabled,
  emptyText = 'Keine Optionen gefunden',
  searchPlaceholder = 'Suchen...'
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement | null>(null)

  const selectedSet = useMemo(() => new Set(value || []), [value])

  const uniqueOptions = useMemo(() => {
    const seen = new Set<string>()
    return options.filter(o => {
      if (seen.has(o.value)) return false
      seen.add(o.value)
      return true
    })
  }, [options])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return uniqueOptions
    return uniqueOptions.filter(o =>
      o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    )
  }, [uniqueOptions, query])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [])

  const toggle = (val: string) => {
    if (selectedSet.has(val)) {
      onChange(value.filter(v => v !== val))
    } else {
      onChange([...(value || []), val])
    }
  }

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full text-left border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light bg-transparent',
          'focus:border-pink-500 focus:outline-none'
        )}
      >
        {value && value.length > 0 ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-700">{value.length} ausgewählt</span>
            <span className="ml-auto text-gray-400 flex items-center text-xs">
              <ChevronDown className="h-4 w-4" />
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-gray-500">
            <span>{placeholder}</span>
            <ChevronDown className="h-4 w-4" />
          </div>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-2 z-50 bg-white border border-gray-200 shadow-lg">
          <div className="p-2 border-b border-gray-100 flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full outline-none text-sm py-1 bg-transparent"
            />
            {value && value.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
                title="Auswahl löschen"
              >
                <X className="h-3 w-3" />
                Leeren
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-auto">
            {filtered.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">{emptyText}</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filtered.map(opt => {
                  const checked = selectedSet.has(opt.value)
                  return (
                    <li key={opt.value}>
                      <button
                        type="button"
                        onClick={() => toggle(opt.value)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50',
                          checked ? 'bg-pink-50' : ''
                        )}
                      >
                        <span
                          className={cn(
                            'inline-flex items-center justify-center w-4 h-4 border',
                            checked ? 'bg-pink-500 border-pink-500' : 'border-gray-300'
                          )}
                        >
                          {checked && <Check className="h-3 w-3 text-white" />}
                        </span>
                        <span className="text-gray-700">{opt.label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MultiSelect

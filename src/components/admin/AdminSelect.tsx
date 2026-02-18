'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export type AdminSelectOption = {
  value: string
  label: string
}

export default function AdminSelect({
  name,
  label,
  options,
  defaultValue = '',
  className = '',
  value: controlledValue,
  onChange,
}: {
  name: string
  label?: string
  options: AdminSelectOption[]
  defaultValue?: string
  className?: string
  value?: string
  onChange?: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(defaultValue)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const currentValue = controlledValue ?? value
  const selectedLabel = options.find(o => o.value === currentValue)?.label ?? options[0]?.label ?? ''

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input type="hidden" name={name} value={currentValue} />
      {label && (
        <div className="mb-1 text-xs font-light tracking-widest text-gray-500 uppercase">
          {label}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white flex items-center justify-between hover:border-pink-300 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate text-gray-700">{selectedLabel}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded mt-1 z-20 shadow-sm">
          {options.map(opt => (
            <button
              key={opt.value + opt.label}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                currentValue === opt.value ? 'bg-pink-50 text-pink-600' : 'text-gray-700'
              }`}
              onClick={() => {
                setValue(opt.value)
                onChange?.(opt.value)
                setOpen(false)
              }}
              role="option"
              aria-selected={currentValue === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

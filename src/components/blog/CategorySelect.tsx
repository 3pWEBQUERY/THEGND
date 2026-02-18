'use client'

import { useEffect, useRef, useState } from 'react'

type Option = { value: string; label: string }

interface CategorySelectProps {
  name: string
  defaultValue?: string
  options: Option[]
  buttonClassName?: string
  menuClassName?: string
  onChange?: (value: string) => void
}

export default function CategorySelect({ name, defaultValue = '', options, buttonClassName, menuClassName, onChange }: CategorySelectProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(defaultValue)
  const ref = useRef<HTMLDivElement>(null)

  const current = options.find(o => o.value === value) || options[0] || { value: '', label: 'Alle' }

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div ref={ref} className="relative">
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={buttonClassName || 'min-w-[14rem] flex items-center justify-between gap-3 border-0 border-b-2 border-gray-200 py-2 text-sm bg-transparent outline-none focus:border-pink-500 px-2'}
      >
        <span className="truncate text-gray-800">{current.label}</span>
        <span className="ml-2 text-gray-500">▾</span>
      </button>
      {open && (
        <div className={menuClassName || 'absolute z-20 mt-1 w-full bg-white border border-gray-200 shadow-sm'} role="listbox">
          {options.map(opt => (
            <button
              key={opt.value || 'ALL'}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              onClick={() => { setValue(opt.value); setOpen(false); try { onChange && onChange(opt.value) } catch {} }}
              className={`block w-full text-left px-3 py-2 text-sm ${opt.value === value ? 'bg-pink-50/70 text-pink-700' : 'hover:bg-pink-50/40 text-gray-800'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

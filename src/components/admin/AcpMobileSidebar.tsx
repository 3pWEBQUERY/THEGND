'use client'

import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import AcpSidebar from './AcpSidebar'

export default function AcpMobileSidebar() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    // basic scroll lock
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
        className="md:hidden inline-flex items-center justify-center rounded border border-gray-300 px-2.5 py-1.5 text-gray-700 hover:bg-gray-50"
        onClick={() => setOpen(true)}
      >
        <Menu size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" aria-modal="true" role="dialog">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          {/* panel */}
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="text-sm font-medium tracking-widest text-gray-700 uppercase">Admin</div>
              <button
                type="button"
                aria-label="Menü schließen"
                className="inline-flex items-center justify-center rounded border border-gray-300 px-2 py-1 text-gray-700 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-3 overflow-auto">
              <AcpSidebar />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

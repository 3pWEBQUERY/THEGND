'use client'

import { X } from 'lucide-react'
import { ReactNode, useEffect } from 'react'

type CommentsModalProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}

export default function CommentsModal({ open, onClose, children, title = 'KOMMENTARE' }: CommentsModalProps) {
  useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl max-h-[85vh] overflow-hidden border border-gray-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-light tracking-widest text-gray-700 uppercase">{title}</h3>
          <button onClick={onClose} aria-label="Schließen" className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 overflow-auto max-h-[75vh]">
          {children}
        </div>
      </div>
    </div>
  )
}

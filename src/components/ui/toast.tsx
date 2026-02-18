"use client"

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ToastVariant = 'info' | 'success' | 'error'
type ToastItem = { id: string; message: string; variant: ToastVariant }

type ToastContextValue = {
  show: (message: string, opts?: { duration?: number; variant?: ToastVariant }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const show = useCallback((message: string, opts?: { duration?: number; variant?: ToastVariant }) => {
    const id = (globalThis as any)?.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
    const duration = opts?.duration ?? 1500
    const variant: ToastVariant = opts?.variant ?? 'info'
    setItems((prev) => [...prev, { id, message, variant }])
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id))
    }, duration)
  }, [])

  const value = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster items={items} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

export function Toaster({ items }: { items: ToastItem[] }) {
  if (!items?.length) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] space-y-2">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          aria-live="polite"
          className={`px-4 py-2 text-white text-xs tracking-widest shadow-md ${
            t.variant === 'success' ? 'bg-emerald-600' : t.variant === 'error' ? 'bg-red-600' : 'bg-gray-900'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

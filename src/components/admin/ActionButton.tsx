"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ActionButton({
  label,
  endpoint,
  method = 'POST',
  body,
  confirm,
  variant = 'default',
  className = '',
}: {
  label: string
  endpoint: string
  method?: 'POST' | 'PATCH' | 'DELETE'
  body?: any
  confirm?: string
  variant?: 'default' | 'danger'
  className?: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function onClick() {
    if (confirm && !window.confirm(confirm)) return
    setLoading(true)
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || 'Request failed')
      }
      router.refresh()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const base = 'px-3 py-1.5 rounded text-sm border transition-colors'
  const styles =
    variant === 'danger'
      ? 'border-red-300 text-red-600 hover:bg-red-50'
      : 'border-gray-300 text-gray-700 hover:bg-gray-50'

  return (
    <button onClick={onClick} disabled={loading} className={`${base} ${styles} ${className}`}>
      {loading ? '...' : label}
    </button>
  )
}

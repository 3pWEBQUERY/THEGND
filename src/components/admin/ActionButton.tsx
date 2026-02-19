"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Pause, Play, Ban, Check, X, Eye, EyeOff, UserCog, Plus } from 'lucide-react'

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pencil: Pencil,
  trash: Trash2,
  pause: Pause,
  play: Play,
  ban: Ban,
  check: Check,
  x: X,
  eye: Eye,
  eyeOff: EyeOff,
  userCog: UserCog,
  plus: Plus,
}

export function ActionButton({
  label,
  endpoint,
  method = 'POST',
  body,
  confirm,
  variant = 'default',
  className = '',
  icon,
  tooltip,
}: {
  label: string
  endpoint: string
  method?: 'POST' | 'PATCH' | 'DELETE'
  body?: any
  confirm?: string
  variant?: 'default' | 'danger'
  className?: string
  icon?: string
  tooltip?: string
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

  const base = icon && !label
    ? 'p-1.5 rounded border transition-colors'
    : 'px-3 py-1.5 rounded text-sm border transition-colors'
  const styles =
    variant === 'danger'
      ? 'border-red-300 text-red-600 hover:bg-red-50'
      : 'border-gray-300 text-gray-700 hover:bg-gray-50'

  const IconComp = icon ? ICONS[icon] : null

  return (
    <button onClick={onClick} disabled={loading} title={tooltip} className={`${base} ${styles} ${className}`}>
      {loading ? '...' : IconComp ? <IconComp className="h-4 w-4" /> : label}
    </button>
  )
}

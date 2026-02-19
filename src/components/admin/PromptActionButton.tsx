"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, FileText, MessageSquare } from 'lucide-react'

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pencil: Pencil,
  file: FileText,
  message: MessageSquare,
}

export function PromptActionButton({
  label,
  endpoint,
  method = 'PATCH',
  promptLabel,
  field = 'content',
  icon,
  tooltip,
}: {
  label: string
  endpoint: string
  method?: 'POST' | 'PATCH'
  promptLabel: string
  field?: string
  icon?: string
  tooltip?: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function onClick() {
    const value = window.prompt(promptLabel)
    if (value == null) return
    setLoading(true)
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error(await res.text())
      router.refresh()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const IconComp = icon ? ICONS[icon] : null
  const base = icon && !label
    ? 'p-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors'
    : 'px-3 py-1.5 rounded text-sm border border-gray-300 text-gray-700 hover:bg-gray-50'

  return (
    <button onClick={onClick} disabled={loading} title={tooltip} className={base}>
      {loading ? '...' : IconComp ? <IconComp className="h-4 w-4" /> : label}
    </button>
  )
}

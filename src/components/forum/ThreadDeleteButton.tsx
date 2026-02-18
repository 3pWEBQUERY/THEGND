'use client'

import type { MouseEvent } from 'react'

export default function ThreadDeleteButton({ threadId }: { threadId: string }) {
  function onClick(e: MouseEvent<HTMLButtonElement>) {
    if (!confirm('Diesen Thread inkl. aller Beiträge löschen?')) {
      e.preventDefault()
      e.stopPropagation()
    }
  }
  return (
    <form action={`/api/acp/forum/threads/${threadId}`} method="post">
      <button
        onClick={onClick}
        className="px-3 py-1.5 border border-red-300 text-xs uppercase tracking-widest text-red-700 hover:bg-red-50"
        name="action"
        value="delete"
      >
        Löschen
      </button>
    </form>
  )
}

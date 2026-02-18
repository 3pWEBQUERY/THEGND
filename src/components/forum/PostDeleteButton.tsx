'use client'

import type { MouseEvent } from 'react'

export default function PostDeleteButton({ postId }: { postId: string }) {
  function onClick(e: MouseEvent<HTMLButtonElement>) {
    if (!confirm('Diesen Beitrag löschen?')) {
      e.preventDefault()
      e.stopPropagation()
    }
  }
  return (
    <form action={`/api/acp/forum/posts/${postId}`} method="post">
      <input type="hidden" name="_method" value="DELETE" />
      <button
        onClick={onClick}
        className="px-3 py-1.5 border border-red-300 text-xs uppercase tracking-widest text-red-700 hover:bg-red-50"
      >
        Löschen
      </button>
    </form>
  )
}

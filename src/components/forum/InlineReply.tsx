'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { AuthRequiredModal } from '@/components/groups/GroupJoinLeaveButton'
import ReplyForm from './ReplyForm'

export default function InlineReply({ threadId, parentId, quote }: { threadId: string; parentId: string; quote?: { author?: string; content?: string } }) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [quoteMode, setQuoteMode] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const quoted = quote?.content ? `> ${quote.content.split('\n').join('\n> ')}${quote?.author ? `\n\n— ${quote.author}` : ''}\n\n` : ''
  return (
    <div className="mt-2">
      {!open ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!session?.user) { setShowAuth(true); return }
              setQuoteMode(false)
              setOpen(true)
            }}
            className="px-3 py-1.5 border border-gray-300 text-xs uppercase tracking-widest hover:bg-gray-50"
          >
            Antworten
          </button>
          <button
            onClick={() => {
              if (!session?.user) { setShowAuth(true); return }
              setQuoteMode(true)
              setOpen(true)
            }}
            className="px-3 py-1.5 border border-gray-300 text-xs uppercase tracking-widest hover:bg-gray-50"
          >
            Zitieren
          </button>
        </div>
      ) : (
        <div className="mt-2">
          <ReplyForm threadId={threadId} parentId={parentId} initialContent={quoteMode ? quoted : ''} />
          <button
            onClick={() => setOpen(false)}
            className="mt-2 px-3 py-1.5 border border-gray-300 text-xs uppercase tracking-widest hover:bg-gray-50"
          >
            Abbrechen
          </button>
        </div>
      )}
      <AuthRequiredModal open={showAuth && !session?.user} onClose={() => setShowAuth(false)} />
    </div>
  )
}

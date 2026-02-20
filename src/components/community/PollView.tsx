'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { BarChart2, Check } from 'lucide-react'

interface PollOption {
  id: string
  text: string
  _count: { votes: number }
}

interface PollViewProps {
  postId: string
  options: PollOption[]
  totalVotes: number
  userVotedOptionId?: string | null
}

export default function PollView({ postId, options, totalVotes, userVotedOptionId }: PollViewProps) {
  const { status } = useSession()
  const [voted, setVoted] = useState<string | null>(userVotedOptionId ?? null)
  const [localOptions, setLocalOptions] = useState(options)
  const [localTotal, setLocalTotal] = useState(totalVotes)
  const [loading, setLoading] = useState(false)

  const hasVoted = !!voted

  const castVote = async (optionId: string) => {
    if (status !== 'authenticated' || hasVoted || loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/communities/posts/${postId}/poll/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      })
      if (res.ok) {
        setVoted(optionId)
        setLocalTotal((prev) => prev + 1)
        setLocalOptions((prev) =>
          prev.map((o) =>
            o.id === optionId ? { ...o, _count: { votes: o._count.votes + 1 } } : o,
          ),
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-gray-200 bg-white p-4 space-y-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gray-500 mb-2">
        <BarChart2 className="h-3.5 w-3.5" />
        Umfrage · {localTotal} Stimmen
      </div>

      {localOptions.map((opt) => {
        const pct = localTotal > 0 ? (opt._count.votes / localTotal) * 100 : 0
        const isSelected = voted === opt.id

        return (
          <button
            key={opt.id}
            onClick={() => castVote(opt.id)}
            disabled={hasVoted || status !== 'authenticated'}
            className={cn(
              'relative w-full text-left border p-2.5 text-sm transition-colors overflow-hidden',
              hasVoted
                ? 'border-gray-200 cursor-default'
                : 'border-gray-200 hover:border-pink-400 cursor-pointer',
            )}
          >
            {/* Progress bar background */}
            {hasVoted && (
              <div
                className={cn(
                  'absolute inset-0 transition-all',
                  isSelected ? 'bg-pink-100' : 'bg-gray-100',
                )}
                style={{ width: `${pct}%` }}
              />
            )}

            <div className="relative flex items-center justify-between">
              <span className={cn('flex items-center gap-1.5', isSelected && 'font-medium')}>
                {isSelected && <Check className="h-3.5 w-3.5 text-pink-500" />}
                {opt.text}
              </span>
              {hasVoted && (
                <span className="text-xs text-gray-500 ml-2">
                  {pct.toFixed(0)}%
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

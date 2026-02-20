'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { ArrowBigUp, ArrowBigDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoteButtonsProps {
  targetType: 'post' | 'comment'
  targetId: string
  initialScore: number
  initialVote?: 'UP' | 'DOWN' | null
  vertical?: boolean
  size?: 'sm' | 'md'
}

export default function VoteButtons({
  targetType,
  targetId,
  initialScore,
  initialVote = null,
  vertical = true,
  size = 'md',
}: VoteButtonsProps) {
  const { status } = useSession()
  const [score, setScore] = useState(initialScore)
  const [vote, setVote] = useState<'UP' | 'DOWN' | null>(initialVote)
  const [loading, setLoading] = useState(false)

  const endpoint =
    targetType === 'post'
      ? `/api/communities/posts/${targetId}/vote`
      : `/api/communities/comments/${targetId}/vote`

  const cast = useCallback(
    async (type: 'UP' | 'DOWN') => {
      if (status !== 'authenticated' || loading) return
      const newType = vote === type ? 'NONE' : type
      const prevVote = vote
      const prevScore = score

      // Optimistic update
      let diff = 0
      if (prevVote === type) {
        diff = type === 'UP' ? -1 : 1
      } else if (prevVote === null) {
        diff = type === 'UP' ? 1 : -1
      } else {
        diff = type === 'UP' ? 2 : -2
      }

      setVote(newType === 'NONE' ? null : newType)
      setScore(prevScore + diff)
      setLoading(true)

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: newType }),
        })
        if (!res.ok) {
          setVote(prevVote)
          setScore(prevScore)
        }
      } catch {
        setVote(prevVote)
        setScore(prevScore)
      } finally {
        setLoading(false)
      }
    },
    [vote, score, endpoint, status, loading],
  )

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <div
      className={cn(
        'flex items-center gap-0.5 select-none',
        vertical ? 'flex-col' : 'flex-row',
      )}
    >
      <button
        onClick={() => cast('UP')}
        disabled={status !== 'authenticated'}
        className={cn(
          'p-0.5 transition-colors',
          vote === 'UP'
            ? 'text-pink-500'
            : 'text-gray-400 hover:text-pink-400',
        )}
        aria-label="Upvote"
      >
        <ArrowBigUp
          className={cn(iconSize, vote === 'UP' && 'fill-current')}
        />
      </button>

      <span
        className={cn(
          'text-xs font-medium tabular-nums min-w-[1.25rem] text-center',
          vote === 'UP' && 'text-pink-500',
          vote === 'DOWN' && 'text-blue-500',
          !vote && 'text-gray-600',
        )}
      >
        {score}
      </span>

      <button
        onClick={() => cast('DOWN')}
        disabled={status !== 'authenticated'}
        className={cn(
          'p-0.5 transition-colors',
          vote === 'DOWN'
            ? 'text-blue-500'
            : 'text-gray-400 hover:text-blue-400',
        )}
        aria-label="Downvote"
      >
        <ArrowBigDown
          className={cn(iconSize, vote === 'DOWN' && 'fill-current')}
        />
      </button>
    </div>
  )
}

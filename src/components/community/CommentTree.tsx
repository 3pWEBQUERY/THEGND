'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import VoteButtons from './VoteButtons'
import { cn } from '@/lib/utils'
import { formatDistanceToNowStrict } from 'date-fns'
import { de } from 'date-fns/locale'
import { MessageSquare, Flag, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarUrl } from '@/utils/avatar'

export interface CommentData {
  id: string
  content: string
  score: number
  isRemoved: boolean
  isDeleted: boolean
  editedAt?: string | null
  createdAt: string
  userVote?: 'UP' | 'DOWN' | null
  author: { id: string; name?: string | null; displayName?: string | null; avatarUrl?: string | null; userType?: string | null }
  children?: CommentData[]
}

interface CommentItemProps {
  comment: CommentData
  postId: string
  communitySlug: string
  isLocked?: boolean
  depth?: number
  onReplyAdded?: () => void
}

export function CommentItem({
  comment,
  postId,
  communitySlug,
  isLocked = false,
  depth = 0,
  onReplyAdded,
}: CommentItemProps) {
  const { data: session } = useSession()
  const userId = (session?.user as any)?.id
  const [collapsed, setCollapsed] = useState(false)
  const [showReply, setShowReply] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [sending, setSending] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [currentContent, setCurrentContent] = useState(comment.content)
  const [deleted, setDeleted] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const authorName = comment.author.displayName || comment.author.name || 'Anonym'
  const timeAgo = formatDistanceToNowStrict(new Date(comment.createdAt), { locale: de, addSuffix: true })
  const isOwner = userId === comment.author.id

  if (deleted || comment.isDeleted) {
    return (
      <div className={cn('py-2', depth > 0 && 'ml-4 border-l border-gray-200 pl-3')}>
        <p className="text-xs text-gray-400 italic">[gelöscht]</p>
        {!collapsed && comment.children?.map((child) => (
          <CommentItem
            key={child.id}
            comment={child}
            postId={postId}
            communitySlug={communitySlug}
            isLocked={isLocked}
            depth={depth + 1}
            onReplyAdded={onReplyAdded}
          />
        ))}
      </div>
    )
  }

  if (comment.isRemoved) {
    return (
      <div className={cn('py-2', depth > 0 && 'ml-4 border-l border-gray-200 pl-3')}>
        <p className="text-xs text-gray-400 italic">[von Moderator entfernt]</p>
      </div>
    )
  }

  const submitReply = async () => {
    if (!replyContent.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/communities/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent.trim(), parentId: comment.id }),
      })
      if (res.ok) {
        setReplyContent('')
        setShowReply(false)
        onReplyAdded?.()
      }
    } finally {
      setSending(false)
    }
  }

  const submitEdit = async () => {
    if (!editContent.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/communities/comments/${comment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      })
      if (res.ok) {
        setCurrentContent(editContent.trim())
        setEditing(false)
      }
    } finally {
      setSending(false)
    }
  }

  const deleteComment = async () => {
    if (!confirm('Kommentar wirklich löschen?')) return
    const res = await fetch(`/api/communities/comments/${comment.id}`, { method: 'DELETE' })
    if (res.ok) setDeleted(true)
  }

  return (
    <div className={cn('py-1.5', depth > 0 && 'ml-4 border-l border-gray-200 pl-3')}>
      <div className="flex items-start gap-2">
        {/* Collapse bar */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex-shrink-0 mt-1 w-3 flex flex-col items-center group"
          aria-label={collapsed ? 'Aufklappen' : 'Zuklappen'}
        >
          <div className={cn('w-px bg-gray-300 group-hover:bg-pink-400 transition-colors', collapsed ? 'h-3' : 'h-full min-h-[20px]')} />
        </button>

        <div className="flex-1 min-w-0">
          {/* Meta */}
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <Link href={`/profile/${comment.author.id}`} className="font-medium text-gray-700 hover:underline">
              {authorName}
            </Link>
            <span>·</span>
            <span>{timeAgo}</span>
            {comment.editedAt && (
              <>
                <span>·</span>
                <span className="italic">bearbeitet</span>
              </>
            )}
          </div>

          {!collapsed && (
            <>
              {/* Content */}
              {editing ? (
                <div className="mt-1">
                  <textarea
                    ref={textareaRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full border border-gray-200 p-2 text-sm resize-y min-h-[60px] focus:outline-none focus:border-pink-400"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={submitEdit}
                      disabled={sending}
                      className="text-[10px] uppercase tracking-widest text-pink-600 hover:text-pink-700"
                    >
                      Speichern
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false)
                        setEditContent(currentContent)
                      }}
                      className="text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-700"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-800 mt-0.5 whitespace-pre-wrap leading-relaxed">
                  {currentContent}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500 uppercase tracking-widest">
                <VoteButtons
                  targetType="comment"
                  targetId={comment.id}
                  initialScore={comment.score}
                  initialVote={comment.userVote}
                  vertical={false}
                  size="sm"
                />

                {!isLocked && userId && (
                  <button
                    onClick={() => setShowReply(!showReply)}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Antworten
                  </button>
                )}

                {isOwner && (
                  <>
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      <Pencil className="h-3 w-3" />
                      Bearbeiten
                    </button>
                    <button
                      onClick={deleteComment}
                      className="flex items-center gap-1 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                      Löschen
                    </button>
                  </>
                )}
              </div>

              {/* Reply form */}
              {showReply && (
                <div className="mt-2">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Antwort schreiben..."
                    className="w-full border border-gray-200 p-2 text-sm resize-y min-h-[60px] focus:outline-none focus:border-pink-400"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={submitReply}
                      disabled={sending || !replyContent.trim()}
                      className="text-[10px] uppercase tracking-widest bg-pink-500 hover:bg-pink-600 text-white px-3 py-1.5 disabled:opacity-50"
                    >
                      {sending ? '...' : 'Antworten'}
                    </button>
                    <button
                      onClick={() => {
                        setShowReply(false)
                        setReplyContent('')
                      }}
                      className="text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-700 px-3 py-1.5"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}

              {/* Children */}
              {comment.children?.map((child) => (
                <CommentItem
                  key={child.id}
                  comment={child}
                  postId={postId}
                  communitySlug={communitySlug}
                  isLocked={isLocked}
                  depth={depth + 1}
                  onReplyAdded={onReplyAdded}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface CommentTreeProps {
  comments: CommentData[]
  postId: string
  communitySlug: string
  isLocked?: boolean
  onReplyAdded?: () => void
}

export default function CommentTree({ comments, postId, communitySlug, isLocked, onReplyAdded }: CommentTreeProps) {
  if (!comments.length) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        Noch keine Kommentare. Sei der Erste!
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {comments.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          postId={postId}
          communitySlug={communitySlug}
          isLocked={isLocked}
          onReplyAdded={onReplyAdded}
        />
      ))}
    </div>
  )
}

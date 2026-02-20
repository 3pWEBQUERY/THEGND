'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import VoteButtons from './VoteButtons'
import CommentForm from './CommentForm'
import { cn } from '@/lib/utils'
import { formatDistanceToNowStrict } from 'date-fns'
import { de } from 'date-fns/locale'
import { MessageSquare, Flag, MoreHorizontal, Pencil, Trash2, ExternalLink, Share2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarUrl } from '@/utils/avatar'
import { getProfileUrl } from '@/lib/validations'

export interface CommentData {
  id: string
  content: string
  type?: 'TEXT' | 'LINK' | 'IMAGE' | 'VIDEO'
  linkUrl?: string | null
  images?: string | null
  videoUrl?: string | null
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
  const [sending, setSending] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [currentContent, setCurrentContent] = useState(comment.content)
  const [deleted, setDeleted] = useState(false)
  const [shareToast, setShareToast] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
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

  const shareComment = async () => {
    const url = `${window.location.origin}/community/${communitySlug}/post/${postId}#comment-${comment.id}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setShareToast(true)
    setTimeout(() => setShareToast(false), 2000)
  }

  const deleteComment = async () => {
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
            <Link href={getProfileUrl({ id: comment.author.id, userType: comment.author.userType || 'MEMBER', displayName: comment.author.displayName })} className="font-medium text-gray-700 hover:underline inline-flex items-center gap-1">
              {comment.author.avatarUrl ? (
                <Avatar className="h-4 w-4">
                  <AvatarImage src={comment.author.avatarUrl} />
                  <AvatarFallback className="text-[8px]">{(comment.author.displayName || 'A')[0]}</AvatarFallback>
                </Avatar>
              ) : (
                <Avatar className="h-4 w-4">
                  <AvatarFallback className="text-[8px] bg-pink-100 text-pink-600">{(comment.author.displayName || 'A')[0].toUpperCase()}</AvatarFallback>
                </Avatar>
              )}
              {authorName}
            </Link>
            <span>·</span>
            <span suppressHydrationWarning>{timeAgo}</span>
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
                <div className="mt-0.5">
                  {/* Text content */}
                  {currentContent && (
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {currentContent}
                    </p>
                  )}

                  {/* Link */}
                  {comment.type === 'LINK' && comment.linkUrl && (
                    <a
                      href={comment.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {comment.linkUrl}
                    </a>
                  )}

                  {/* Images */}
                  {comment.type === 'IMAGE' && comment.images && (() => {
                    try {
                      const imgs = JSON.parse(comment.images!)
                      if (!Array.isArray(imgs) || imgs.length === 0) return null
                      return (
                        <div className="flex gap-2 flex-wrap mt-1">
                          {imgs.map((url: string, i: number) => (
                            <img
                              key={i}
                              src={url}
                              alt=""
                              className="max-h-48 object-contain border border-gray-200"
                              loading="lazy"
                            />
                          ))}
                        </div>
                      )
                    } catch {
                      return null
                    }
                  })()}

                  {/* Video */}
                  {comment.type === 'VIDEO' && comment.videoUrl && (
                    <div className="mt-1">
                      {comment.videoUrl.includes('youtube.com') || comment.videoUrl.includes('youtu.be') ? (
                        <div className="aspect-video max-w-md">
                          <iframe
                            src={comment.videoUrl
                              .replace('watch?v=', 'embed/')
                              .replace('youtu.be/', 'youtube.com/embed/')}
                            className="w-full h-full border border-gray-200"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <video
                          src={comment.videoUrl}
                          controls
                          className="max-w-md max-h-64 border border-gray-200"
                        />
                      )}
                    </div>
                  )}
                </div>
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

                <div className="relative">
                  <button
                    onClick={shareComment}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    <Share2 className="h-3 w-3" />
                    Teilen
                  </button>
                  {shareToast && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[10px] px-3 py-1.5 whitespace-nowrap z-50 shadow-lg">
                      Link kopiert!
                    </div>
                  )}
                </div>

                {isOwner && (
                  <>
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      <Pencil className="h-3 w-3" />
                      Bearbeiten
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                        className="flex items-center gap-1 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                        Löschen
                      </button>
                      {showDeleteConfirm && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 shadow-lg p-3 z-50 min-w-[220px]">
                          <p className="text-xs text-gray-700 mb-2 normal-case tracking-normal">Kommentar wirklich löschen?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={deleteComment}
                              className="text-[10px] uppercase tracking-widest bg-red-500 hover:bg-red-600 text-white px-3 py-1.5"
                            >
                              Löschen
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(false)}
                              className="text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-700 px-3 py-1.5"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Reply form */}
              {showReply && (
                <div className="mt-2">
                  <CommentForm
                    postId={postId}
                    parentId={comment.id}
                    placeholder="Antwort schreiben..."
                    submitLabel="Antworten"
                    onSuccess={() => {
                      setShowReply(false)
                      onReplyAdded?.()
                    }}
                    onCancel={() => setShowReply(false)}
                    compact
                  />
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

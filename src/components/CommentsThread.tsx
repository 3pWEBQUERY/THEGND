'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarUrl } from '@/utils/avatar'
import { Textarea } from '@/components/ui/textarea'

type Author = {
  email: string
  userType?: string
  profile?: { displayName?: string | null; avatar?: string | null }
}

export type CommentItem = {
  id: string
  content: string
  author: Author & { id?: string }
  children?: CommentItem[]
}

type CommentsThreadProps = {
  postId: string
  requireAuth?: (action: () => void) => void
  onCountChange?: (count: number) => void
  initialReplyToId?: string
}

// Avatar-Normalisierung jetzt in @/utils/avatar (getAvatarUrl)

export default function CommentsThread({ postId, requireAuth, onCountChange, initialReplyToId }: CommentsThreadProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<CommentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newContent, setNewContent] = useState('')
  const [replyFor, setReplyFor] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const replyInputRef = useRef<HTMLTextAreaElement | null>(null)
  const [editCommentId, setEditCommentId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [collapsedReplies, setCollapsedReplies] = useState<Record<string, boolean>>({})

  const gate = (action: () => void) => {
    if (requireAuth) return requireAuth(action)
    if (!session?.user?.id) {
      // fallback: redirect to sign-in
      window.location.href = '/auth/signin'
      return
    }
    action()
  }

  const fetchComments = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/posts/${postId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
        if (onCountChange) onCountChange(countComments(data.comments || []))
      }
    } catch {}
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  // If initialReplyToId is provided, open reply box for that comment and focus textarea
  useEffect(() => {
    if (initialReplyToId) {
      setReplyFor(initialReplyToId)
      // Focus after the textarea renders
      const t = setTimeout(() => {
        try { replyInputRef.current?.focus() } catch {}
      }, 0)
      return () => clearTimeout(t)
    }
  }, [initialReplyToId])

  const countComments = (items: CommentItem[]): number => {
    let c = 0
    for (const it of items) {
      c += 1
      if (it.children && it.children.length) c += countComments(it.children)
    }
    return c
  }

  const submitComment = async () => {
    if (!newContent.trim()) return
    gate(async () => {
      setSubmitting(true)
      try {
        const res = await fetch(`/api/posts/${postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newContent }),
        })
        if (res.ok) {
          setNewContent('')
          await fetchComments()
        }
      } finally {
        setSubmitting(false)
      }
    })
  }

  const submitReply = async (parentId: string) => {
    if (!replyContent.trim()) return
    gate(async () => {
      setSubmitting(true)
      try {
        const res = await fetch(`/api/posts/${postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: replyContent, parentId }),
        })
        if (res.ok) {
          setReplyContent('')
          setReplyFor(null)
          await fetchComments()
        }
      } finally {
        setSubmitting(false)
      }
    })
  }

  const startEdit = (comment: CommentItem) => {
    setEditCommentId(comment.id)
    setEditContent(comment.content)
  }

  const cancelEdit = () => {
    setEditCommentId(null)
    setEditContent('')
  }

  const saveEdit = async (commentId: string) => {
    if (!editContent.trim()) return
    gate(async () => {
      setSubmitting(true)
      try {
        const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: editContent })
        })
        if (res.ok) {
          cancelEdit()
          await fetchComments()
        }
      } finally {
        setSubmitting(false)
      }
    })
  }

  const deleteComment = async (commentId: string) => {
    gate(async () => {
      if (typeof window !== 'undefined') {
        const ok = window.confirm('Diesen Kommentar wirklich löschen?')
        if (!ok) return
      }
      try {
        const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, { method: 'DELETE' })
        if (res.ok) {
          await fetchComments()
        }
      } catch {}
    })
  }

  const toggleReplies = (commentId: string) => {
    setCollapsedReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }))
  }

  const renderComment = (comment: CommentItem, depth = 0) => {
    const displayName = comment.author.profile?.displayName || comment.author.email
    return (
      <div key={comment.id} className="space-y-2">
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={getAvatarUrl(comment.author.profile?.avatar, comment.author.userType)} alt={`Avatar von ${displayName}`} />
            <AvatarFallback className="text-xs font-light tracking-widest bg-gray-100">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="text-xs font-light tracking-wide text-gray-800">{displayName}</div>
            {editCommentId === comment.id ? (
              <div className="mt-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-20 resize-none border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-xs font-light focus:border-pink-500 focus:ring-0 bg-transparent"
                />
                <div className="flex items-center justify-end mt-2 space-x-3">
                  <button type="button" className="text-[10px] tracking-widest text-gray-600 hover:text-gray-800 uppercase" onClick={cancelEdit}>
                    ABBRECHEN
                  </button>
                  <button type="button" className="bg-pink-500 hover:bg-pink-600 text-white text-[10px] tracking-widest px-3 py-2 uppercase" disabled={submitting || !editContent.trim()} onClick={() => saveEdit(comment.id)}>
                    SPEICHERN
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs font-light tracking-wide text-gray-600">{comment.content}</div>
            )}
            <div className="mt-1 space-x-4">
              <button
                type="button"
                className="text-[10px] tracking-widest text-gray-500 hover:text-gray-700 uppercase"
                onClick={() => gate(() => setReplyFor(replyFor === comment.id ? null : comment.id))}
              >
                ANTWORTEN
              </button>
              {session?.user?.id && comment.author?.id && session.user.id === comment.author.id && editCommentId !== comment.id && (
                <>
                  <button type="button" className="text-[10px] tracking-widest text-gray-500 hover:text-gray-700 uppercase" onClick={() => startEdit(comment)}>
                    BEARBEITEN
                  </button>
                  <button type="button" className="text-[10px] tracking-widest text-pink-600 hover:text-pink-700 uppercase" onClick={() => deleteComment(comment.id)}>
                    LÖSCHEN
                  </button>
                </>
              )}
            </div>
            {replyFor === comment.id && (
              <div className="mt-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Antwort schreiben..."
                  className="min-h-20 resize-none border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-xs font-light focus:border-pink-500 focus:ring-0 bg-transparent"
                  ref={replyInputRef}
                />
                <div className="flex items-center justify-end mt-2 space-x-3">
                  <button
                    type="button"
                    className="text-[10px] tracking-widest text-gray-600 hover:text-gray-800 uppercase"
                    onClick={() => setReplyFor(null)}
                  >
                    ABBRECHEN
                  </button>
                  <button
                    type="button"
                    className="bg-pink-500 hover:bg-pink-600 text-white text-[10px] tracking-widest px-3 py-2 uppercase"
                    disabled={submitting || !replyContent.trim()}
                    onClick={() => submitReply(comment.id)}
                  >
                    SENDEN
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Children */}
        {comment.children && comment.children.length > 0 && (
          <div className="pl-10 space-y-3">
            {(() => {
              const all = comment.children || []
              const collapsed = collapsedReplies[comment.id] !== false
              const visible = collapsed && all.length > 2 ? all.slice(0, 2) : all
              return (
                <>
                  {visible.map((child) => renderComment(child, depth + 1))}
                  {all.length > 2 && (
                    <button
                      type="button"
                      className="text-[10px] tracking-widest text-gray-500 hover:text-gray-700 uppercase"
                      onClick={() => toggleReplies(comment.id)}
                    >
                      {collapsed ? `MEHR ANTWORTEN ANZEIGEN (${all.length - 2})` : 'WENIGER ANZEIGEN'}
                    </button>
                  )}
                </>
              )
            })()}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mt-6">
      {/* Create new comment */}
      <div className="mb-4">
        <Textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Schreibe einen Kommentar..."
          className="min-h-20 resize-none border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-xs sm:text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent"
        />
        <div className="flex items-center justify-end mt-2">
          <button
            type="button"
            className="bg-pink-500 hover:bg-pink-600 text-white text-[10px] sm:text-xs tracking-widest px-4 py-2 uppercase"
            disabled={submitting || !newContent.trim()}
            onClick={submitComment}
          >
            KOMMENTIEREN
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-xs font-light tracking-widest text-gray-500">KOMMENTARE WERDEN GELADEN...</div>
      ) : comments.length === 0 ? (
        <div className="text-xs font-light tracking-widest text-gray-400">NOCH KEINE KOMMENTARE</div>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => renderComment(c))}
        </div>
      )}
    </div>
  )
}

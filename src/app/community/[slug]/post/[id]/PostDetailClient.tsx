'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import VoteButtons from '@/components/community/VoteButtons'
import CommentTree, { CommentData } from '@/components/community/CommentTree'
import CommentForm from '@/components/community/CommentForm'
import PollView from '@/components/community/PollView'
import { cn } from '@/lib/utils'
import { getProfileUrl } from '@/lib/validations'
import { formatDistanceToNowStrict } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  MessageSquare,
  Bookmark,
  Share2,
  Flag,
  Pin,
  Lock,
  ExternalLink,
  ArrowLeft,
  Eye,
  Trash2,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface PostDetail {
  id: string
  title: string
  content?: string | null
  linkUrl?: string | null
  images?: string[]
  videoUrl?: string | null
  type: 'TEXT' | 'LINK' | 'IMAGE' | 'POLL' | 'VIDEO'
  score: number
  commentCount: number
  viewCount: number
  isPinned: boolean
  isLocked: boolean
  createdAt: string
  userVote?: 'UP' | 'DOWN' | null
  isSaved?: boolean
  flair?: { id: string; name: string; color: string; textColor: string } | null
  author: { id: string; name?: string | null; displayName?: string | null; avatarUrl?: string | null; userType?: string | null }
  community: { slug: string; name: string; icon?: string | null }
  pollOptions?: { id: string; text: string; _count: { votes: number } }[]
  pollTotalVotes?: number
  userPollVoteOptionId?: string | null
}

interface PostDetailClientProps {
  post: PostDetail
  comments: CommentData[]
  isMember: boolean
  isAuthenticated: boolean
  currentUserId?: string | null
}

export default function PostDetailClient({
  post,
  comments,
  isMember,
  isAuthenticated,
  currentUserId,
}: PostDetailClientProps) {
  const router = useRouter()
  const [saved, setSaved] = useState(post.isSaved ?? false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [shareToast, setShareToast] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const authorName = post.author.displayName || post.author.name || 'Anonym'
  const timeAgo = formatDistanceToNowStrict(new Date(post.createdAt), { locale: de, addSuffix: true })
  const isAuthor = currentUserId === post.author.id

  const toggleSave = async () => {
    if (!isAuthenticated) return
    await fetch(`/api/communities/posts/${post.id}/save`, { method: 'POST' })
    setSaved(!saved)
  }

  const submitReport = async () => {
    if (!reportReason.trim()) return
    await fetch(`/api/communities/posts/${post.id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reportReason.trim() }),
    })
    setShowReport(false)
    setReportReason('')
  }

  const sharePost = async () => {
    const url = window.location.href
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

  const deletePost = async () => {
    const res = await fetch(`/api/communities/posts/${post.id}`, { method: 'DELETE' })
    if (res.ok) router.push(`/community/${post.community.slug}`)
  }

  return (
    <div className="space-y-3">
      {/* Back link */}
      <Link
        href={`/community/${post.community.slug}`}
        className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Zurück zu c/{post.community.name}
      </Link>

      {/* Post */}
      <div className="border border-gray-200 bg-white">
        <div className="flex">
          {/* Vote column */}
          <div className="flex-shrink-0 w-12 bg-gray-50 flex justify-center pt-4 pb-4">
            <VoteButtons
              targetType="post"
              targetId={post.id}
              initialScore={post.score}
              initialVote={post.userVote}
              vertical
              size="md"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 p-4">
            {/* Meta */}
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-2 flex-wrap">
              {post.community.icon && (
                <Avatar className="h-5 w-5">
                  <AvatarImage src={post.community.icon} />
                  <AvatarFallback className="text-[8px]">{post.community.name[0]}</AvatarFallback>
                </Avatar>
              )}
              <Link
                href={`/community/${post.community.slug}`}
                className="font-medium text-gray-800 hover:underline"
              >
                c/{post.community.name}
              </Link>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                von{' '}
                <Link href={getProfileUrl({ id: post.author.id, userType: post.author.userType || 'MEMBER', displayName: post.author.displayName })} className="hover:underline inline-flex items-center gap-1">
                  {post.author.avatarUrl ? (
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={post.author.avatarUrl} />
                      <AvatarFallback className="text-[8px]">{(post.author.displayName || 'A')[0]}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-[8px] bg-pink-100 text-pink-600">{(post.author.displayName || 'A')[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                  {authorName}
                </Link>
              </span>
              <span>·</span>
              <span suppressHydrationWarning>{timeAgo}</span>
              <span>·</span>
              <span className="flex items-center gap-0.5">
                <Eye className="h-3 w-3" />
                {post.viewCount}
              </span>
              {post.isPinned && (
                <>
                  <span>·</span>
                  <Pin className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">Angepinnt</span>
                </>
              )}
              {post.isLocked && (
                <>
                  <span>·</span>
                  <Lock className="h-3 w-3 text-yellow-600" />
                  <span className="text-yellow-600">Gesperrt</span>
                </>
              )}
            </div>

            {/* Title */}
            <h1 className="text-lg font-medium text-gray-900 leading-snug flex items-center gap-2">
              {post.title}
              {post.flair && (
                <span
                  className="inline-block text-[9px] uppercase tracking-widest px-1.5 py-0.5"
                  style={{ backgroundColor: post.flair.color, color: post.flair.textColor }}
                >
                  {post.flair.name}
                </span>
              )}
            </h1>

            {/* Body content based on type */}
            {post.type === 'TEXT' && post.content && (
              <div className="mt-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </div>
            )}

            {post.type === 'LINK' && post.linkUrl && (
              <div className="mt-3">
                <a
                  href={post.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  {post.linkUrl}
                </a>
                {post.content && (
                  <p className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                )}
              </div>
            )}

            {post.type === 'IMAGE' && post.images && post.images.length > 0 && (
              <div className="mt-3 space-y-2">
                {post.images.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`${post.title} - Bild ${idx + 1}`}
                    className="max-w-full max-h-[600px] object-contain border border-gray-200"
                    loading="lazy"
                  />
                ))}
                {post.content && (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                )}
              </div>
            )}

            {post.type === 'POLL' && post.pollOptions && (
              <div className="mt-3">
                <PollView
                  postId={post.id}
                  options={post.pollOptions}
                  totalVotes={post.pollTotalVotes ?? 0}
                  userVotedOptionId={post.userPollVoteOptionId}
                />
                {post.content && (
                  <p className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                )}
              </div>
            )}

            {post.type === 'VIDEO' && post.videoUrl && (
              <div className="mt-3">
                {post.videoUrl.includes('youtube.com') || post.videoUrl.includes('youtu.be') ? (
                  <div className="aspect-video">
                    <iframe
                      src={post.videoUrl
                        .replace('watch?v=', 'embed/')
                        .replace('youtu.be/', 'youtube.com/embed/')}
                      className="w-full h-full border border-gray-200"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <video
                    src={post.videoUrl}
                    controls
                    className="max-w-full max-h-[500px] border border-gray-200"
                  />
                )}
                {post.content && (
                  <p className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                )}
              </div>
            )}

            {/* Actions bar */}
            <div className="flex items-center gap-2 md:gap-4 mt-4 pt-3 border-t border-gray-100 text-[10px] text-gray-500 uppercase tracking-widest">
              <span className="flex items-center gap-1 px-2 py-1.5 md:px-0 md:py-0 bg-gray-100 md:bg-transparent">
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{post.commentCount} Kommentare</span>
                <span className="md:hidden">{post.commentCount}</span>
              </span>

              <button
                onClick={toggleSave}
                className={cn(
                  'flex items-center gap-1 hover:text-gray-700 px-2 py-1.5 md:px-0 md:py-0 bg-gray-100 md:bg-transparent',
                  saved && 'text-pink-500',
                )}
              >
                <Bookmark className={cn('h-3.5 w-3.5', saved && 'fill-current')} />
                <span className="hidden md:inline">{saved ? 'Gespeichert' : 'Speichern'}</span>
              </button>

              <div className="relative">
                <button
                  onClick={sharePost}
                  className="flex items-center gap-1 hover:text-gray-700 px-2 py-1.5 md:px-0 md:py-0 bg-gray-100 md:bg-transparent"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Teilen</span>
                </button>
                {shareToast && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[10px] px-3 py-1.5 whitespace-nowrap z-50 shadow-lg">
                    Link kopiert!
                  </div>
                )}
              </div>

              {isAuthenticated && !isAuthor && (
                <button
                  onClick={() => setShowReport(!showReport)}
                  className="flex items-center gap-1 hover:text-red-500 px-2 py-1.5 md:px-0 md:py-0 bg-gray-100 md:bg-transparent"
                >
                  <Flag className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Melden</span>
                </button>
              )}

              {isAuthor && (
                <div className="relative">
                  <button
                    onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                    className="flex items-center gap-1 hover:text-red-600 px-2 py-1.5 md:px-0 md:py-0 bg-gray-100 md:bg-transparent"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Löschen</span>
                  </button>
                  {showDeleteConfirm && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 shadow-lg p-3 z-50 min-w-[220px]">
                      <p className="text-xs text-gray-700 mb-2 normal-case tracking-normal">Beitrag wirklich löschen?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={deletePost}
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
              )}
            </div>

            {/* Report form */}
            {showReport && (
              <div className="mt-3 border border-gray-200 p-3">
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Grund für die Meldung..."
                  className="w-full border border-gray-200 p-2 text-sm min-h-[60px] focus:outline-none focus:border-pink-400"
                  rows={2}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={submitReport}
                    disabled={!reportReason.trim()}
                    className="text-[10px] uppercase tracking-widest bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 disabled:opacity-50"
                  >
                    Melden
                  </button>
                  <button
                    onClick={() => setShowReport(false)}
                    className="text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-700 px-3 py-1.5"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comment input */}
      {isAuthenticated && isMember && !post.isLocked && (
        <CommentForm
          postId={post.id}
          onSuccess={() => router.refresh()}
        />
      )}

      {post.isLocked && (
        <div className="border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700 flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Dieser Beitrag ist gesperrt. Es können keine neuen Kommentare geschrieben werden.
        </div>
      )}

      {/* Comments */}
      <div className="border border-gray-200 bg-white p-4">
        <h2 className="text-xs uppercase tracking-widest text-gray-500 font-light mb-4">
          Kommentare ({post.commentCount})
        </h2>
        <CommentTree
          comments={comments}
          postId={post.id}
          communitySlug={post.community.slug}
          isLocked={post.isLocked}
          onReplyAdded={() => router.refresh()}
        />
      </div>
    </div>
  )
}

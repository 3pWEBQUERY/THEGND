'use client'

import Link from 'next/link'
import { MessageSquare, Bookmark, Share2, Flag, Pin, Lock, ExternalLink, Image as ImageIcon, BarChart2 } from 'lucide-react'
import VoteButtons from './VoteButtons'
import { cn } from '@/lib/utils'
import { formatDistanceToNowStrict } from 'date-fns'
import { de } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export interface PostCardData {
  id: string
  title: string
  content?: string | null
  linkUrl?: string | null
  images?: string | null
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
  author: { id: string; name?: string | null; displayName?: string | null; avatarUrl?: string | null }
  community: { slug: string; name: string; icon?: string | null }
  pollOptions?: { id: string; text: string; _count?: { votes: number } }[]
  pollTotalVotes?: number
}

interface PostCardProps {
  post: PostCardData
  showCommunity?: boolean
  onSave?: (id: string) => void
}

export default function PostCard({ post, showCommunity = true, onSave }: PostCardProps) {
  const authorName = post.author.displayName || post.author.name || 'Anonym'
  const timeAgo = formatDistanceToNowStrict(new Date(post.createdAt), { locale: de, addSuffix: true })

  const parsedImages: string[] = (() => {
    if (!post.images) return []
    try {
      return JSON.parse(post.images)
    } catch {
      return []
    }
  })()

  const typeIcon = () => {
    switch (post.type) {
      case 'LINK':
        return <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
      case 'IMAGE':
        return <ImageIcon className="h-3.5 w-3.5 text-gray-400" />
      case 'POLL':
        return <BarChart2 className="h-3.5 w-3.5 text-gray-400" />
      default:
        return null
    }
  }

  return (
    <div className="border border-gray-200 bg-white hover:border-gray-300 transition-colors">
      <div className="flex">
        {/* Vote column */}
        <div className="flex-shrink-0 w-10 bg-gray-50 flex justify-center pt-3 pb-2">
          <VoteButtons
            targetType="post"
            targetId={post.id}
            initialScore={post.score}
            initialVote={post.userVote}
            vertical
            size="sm"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-2">
          {/* Meta line */}
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1 flex-wrap">
            {showCommunity && (
              <>
                {post.community.icon && (
                  <Avatar className="h-4 w-4">
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
              </>
            )}
            <span>
              von{' '}
              <Link href={`/profile/${post.author.id}`} className="hover:underline">
                {authorName}
              </Link>
            </span>
            <span>·</span>
            <span>{timeAgo}</span>
            {post.isPinned && (
              <>
                <span>·</span>
                <Pin className="h-3 w-3 text-green-600" />
              </>
            )}
            {post.isLocked && (
              <>
                <span>·</span>
                <Lock className="h-3 w-3 text-yellow-600" />
              </>
            )}
          </div>

          {/* Title */}
          <Link
            href={`/community/${post.community.slug}/post/${post.id}`}
            className="block group"
          >
            <h3 className="text-sm font-medium text-gray-900 group-hover:text-pink-600 leading-snug flex items-center gap-1.5">
              {typeIcon()}
              {post.title}
              {post.flair && (
                <span
                  className="inline-block text-[9px] uppercase tracking-widest px-1.5 py-0.5 ml-1"
                  style={{ backgroundColor: post.flair.color, color: post.flair.textColor }}
                >
                  {post.flair.name}
                </span>
              )}
            </h3>
          </Link>

          {/* Preview content */}
          {post.type === 'TEXT' && post.content && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
              {post.content.slice(0, 300)}
            </p>
          )}

          {post.type === 'LINK' && post.linkUrl && (
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-blue-500 hover:underline mt-1 block truncate"
            >
              {post.linkUrl}
            </a>
          )}

          {post.type === 'IMAGE' && parsedImages.length > 0 && (
            <Link href={`/community/${post.community.slug}/post/${post.id}`}>
              <div className="mt-1.5 max-h-64 overflow-hidden">
                <img
                  src={parsedImages[0]}
                  alt={post.title}
                  className="w-full h-auto max-h-64 object-cover"
                  loading="lazy"
                />
              </div>
            </Link>
          )}

          {post.type === 'POLL' && post.pollOptions && (
            <div className="mt-1.5 space-y-1">
              {post.pollOptions.slice(0, 3).map((opt) => (
                <div key={opt.id} className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="h-1.5 bg-gray-200 flex-1 rounded-none overflow-hidden">
                    <div
                      className="h-full bg-pink-400"
                      style={{
                        width: `${post.pollTotalVotes ? ((opt._count?.votes ?? 0) / post.pollTotalVotes) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="truncate max-w-[120px]">{opt.text}</span>
                </div>
              ))}
              {(post.pollOptions.length ?? 0) > 3 && (
                <span className="text-[10px] text-gray-400">
                  +{post.pollOptions.length - 3} weitere
                </span>
              )}
            </div>
          )}

          {/* Actions bar */}
          <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500 uppercase tracking-widest">
            <Link
              href={`/community/${post.community.slug}/post/${post.id}`}
              className="flex items-center gap-1 hover:text-gray-700"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {post.commentCount} Kommentare
            </Link>

            <button
              onClick={() => onSave?.(post.id)}
              className={cn(
                'flex items-center gap-1 hover:text-gray-700',
                post.isSaved && 'text-pink-500',
              )}
            >
              <Bookmark className={cn('h-3.5 w-3.5', post.isSaved && 'fill-current')} />
              Speichern
            </button>

            <button
              onClick={() => {
                navigator.clipboard?.writeText(
                  `${window.location.origin}/community/${post.community.slug}/post/${post.id}`,
                )
              }}
              className="flex items-center gap-1 hover:text-gray-700"
            >
              <Share2 className="h-3.5 w-3.5" />
              Teilen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

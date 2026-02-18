'use client'

import { MessageCircle } from 'lucide-react'
import { formatTimeAgo } from '@/lib/validations'

type Props = {
  posts: any[]
  displayName: string
  avatar?: string | null
}

export default function ProfilePosts({ posts, displayName, avatar }: Props) {
  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="h-16 w-16 mx-auto mb-6 opacity-30 text-gray-400" />
        <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-4">KEINE BEITRÄGE VORHANDEN</h3>
        <div className="w-12 h-px bg-pink-500 mx-auto mb-4"></div>
        <p className="text-sm font-light tracking-wide text-gray-500">Keine Beiträge verfügbar</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {posts.map((post: any) => (
        <div key={post.id} className="bg-gray-50 p-4 sm:p-6">
          <div className="flex items-start space-x-4">
            <div className="h-12 w-12 bg-gray-200 flex items-center justify-center">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-light tracking-widest text-gray-600">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-sm font-light tracking-wide text-gray-800">{displayName}</span>
                <span className="text-xs font-light tracking-wide text-gray-500">
                  {formatTimeAgo(new Date(post.createdAt))}
                </span>
              </div>
              <p className="text-sm font-light tracking-wide text-gray-700 leading-relaxed mb-4">{post.content}</p>
              <div className="flex items-center space-x-6 text-xs font-light tracking-wide text-gray-500">
                <button aria-label="Gefällt mir" className="flex items-center space-x-2 hover:text-pink-500 transition-colors">
                  {/* Icon intentionally omitted for brevity */}
                  <span className="flex items-center gap-1">
                    <span>{post.likes?.length ?? 0}</span>
                    <span className="hidden sm:inline">GEFÄLLT MIR</span>
                  </span>
                </button>
                <button aria-label="Kommentare" className="flex items-center space-x-2 hover:text-pink-500 transition-colors">
                  <MessageCircle className="h-4 w-4" />
                  <span className="flex items-center gap-1">
                    <span>{post.comments?.length ?? 0}</span>
                    <span className="hidden sm:inline">KOMMENTARE</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

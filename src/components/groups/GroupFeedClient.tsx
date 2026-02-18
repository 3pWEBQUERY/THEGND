'use client'

import ProfileFeed, { type ProfileFeedPost } from '@/components/ProfileFeed'

export default function GroupFeedClient({ posts, canAdminDelete }: { posts: ProfileFeedPost[]; canAdminDelete: boolean }) {
  const adminActions = canAdminDelete
    ? (post: ProfileFeedPost) => (
        <button
          className="text-xs px-2 py-1 border border-red-300 text-red-700 hover:bg-red-50"
          onClick={async (e) => {
            e.preventDefault()
            if (!confirm('Beitrag wirklich löschen?')) return
            try {
              const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
              if (res.ok) {
                // Hard reload to reflect deletion; could be optimized to update state
                if (typeof window !== 'undefined') window.location.reload()
              } else {
                const data = await res.json().catch(() => ({}))
                alert(data?.error || 'Löschen fehlgeschlagen')
              }
            } catch (err: any) {
              alert(err?.message || 'Fehler beim Löschen')
            }
          }}
        >
          Löschen
        </button>
      )
    : undefined

  return <ProfileFeed posts={posts} adminActions={adminActions} />
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type ThreadItem = {
  id: string
  title: string
  createdAt: string
  forum: { slug: string; name: string }
  _count: { posts: number }
  views: number
}

type PostItem = {
  id: string
  createdAt: string
  thread: { id: string; title: string; forum: { slug: string; name: string } }
}

type SubscriptionItem = {
  id: string
  createdAt: string
  thread: { id: string; title: string; lastPostAt: string; views: number; _count: { posts: number }; forum: { slug: string; name: string } }
}

export default function ForumDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [threads, setThreads] = useState<ThreadItem[]>([])
  const [posts, setPosts] = useState<PostItem[]>([])
  const [subs, setSubs] = useState<SubscriptionItem[]>([])
  const [totals, setTotals] = useState<{ threadsCount: number; postsCount: number; threadViewsSum: number; threadRepliesSum: number } | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/dashboard/forum/overview', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || 'Fehler beim Laden')
        setThreads(Array.isArray(data?.threads) ? data.threads : [])
        setPosts(Array.isArray(data?.posts) ? data.posts : [])
        setSubs(Array.isArray(data?.subscriptions) ? data.subscriptions : [])
        setTotals(data?.totals ?? null)
      } catch (e: any) {
        setError(e?.message || 'Fehler')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const fmt = (d: string) => new Date(d).toLocaleString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-thin tracking-wider text-gray-800">FORUM</h2>
        <div className="flex items-center gap-2">
          <Link href="/forum" className="px-3 py-1.5 border border-gray-300 text-xs uppercase tracking-widest hover:bg-gray-50">Zum Forum</Link>
        </div>
      </div>

      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 border">
            <div className="text-xl font-thin tracking-wider text-gray-800">{totals.threadsCount}</div>
            <div className="text-xs uppercase tracking-widest text-gray-500">Eigene Themen</div>
          </div>
          <div className="p-4 bg-gray-50 border">
            <div className="text-xl font-thin tracking-wider text-gray-800">{totals.threadViewsSum}</div>
            <div className="text-xs uppercase tracking-widest text-gray-500">Aufrufe (Themen)</div>
          </div>
          <div className="p-4 bg-gray-50 border">
            <div className="text-xl font-thin tracking-wider text-gray-800">{totals.threadRepliesSum}</div>
            <div className="text-xs uppercase tracking-widest text-gray-500">Antworten (Themen)</div>
          </div>
          <div className="p-4 bg-gray-50 border">
            <div className="text-xl font-thin tracking-wider text-gray-800">{totals.postsCount}</div>
            <div className="text-xs uppercase tracking-widest text-gray-500">Eigene Beiträge</div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-sm text-gray-600">Lade Daten...</div>
      )}
      {error && (
        <div className="text-sm text-rose-600">{error}</div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="border border-gray-200 bg-white">
            <div className="px-4 py-3 border-b border-gray-100 text-xs uppercase tracking-widest text-gray-600">Neueste Themen</div>
            <div>
              {threads.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Keine eigenen Themen.</div>
              ) : (
                threads.map(t => (
                  <Link
                    key={t.id}
                    href={`/forum/thread/${t.id}`}
                    className="group block p-4 border-b last:border-b-0 transition-colors hover:bg-pink-50/40 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2 focus:ring-offset-white"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <span className="text-gray-900 group-hover:text-pink-600 font-medium tracking-widest uppercase">
                          {t.title}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          <span className="text-pink-600">{t.forum.name}</span>
                          <span className="mx-2">·</span>
                          {fmt(t.createdAt)}
                          <span className="mx-2">·</span>
                          Aufrufe: {t.views}
                          <span className="mx-2">·</span>
                          Antworten: {Math.max(0, (t._count?.posts ?? 0) - 1)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs uppercase tracking-widest text-gray-500">Beiträge</div>
                        <div className="text-sm text-gray-900">{t._count.posts}</div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="border border-gray-200 bg-white">
            <div className="px-4 py-3 border-b border-gray-100 text-xs uppercase tracking-widest text-gray-600">Neueste Beiträge</div>
            <div>
              {posts.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Keine eigenen Beiträge.</div>
              ) : (
                posts.map(p => (
                  <Link
                    key={p.id}
                    href={`/forum/thread/${p.thread.id}`}
                    className="group block p-4 border-b last:border-b-0 transition-colors hover:bg-pink-50/40 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2 focus:ring-offset-white"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <span className="text-gray-900 group-hover:text-pink-600 font-medium tracking-widest uppercase">
                          {p.thread.title}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          <span className="text-pink-600">{p.thread.forum.name}</span>
                          <span className="mx-2">·</span>
                          {fmt(p.createdAt)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="border border-gray-200 bg-white">
            <div className="px-4 py-3 border-b border-gray-100 text-xs uppercase tracking-widest text-gray-600">Abonnierte Threads</div>
            <div>
              {subs.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Keine Abonnements.</div>
              ) : (
                subs.map(s => (
                  <Link
                    key={s.id}
                    href={`/forum/thread/${s.thread.id}`}
                    className="group block p-4 border-b last:border-b-0 transition-colors hover:bg-pink-50/40 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2 focus:ring-offset-white"
                  >
                    <div className="min-w-0">
                      <span className="text-gray-900 group-hover:text-pink-600 font-medium tracking-widest uppercase">
                        {s.thread.title}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="text-pink-600">{s.thread.forum.name}</span>
                        <span className="mx-2">·</span>
                        Letzte Aktivität: {fmt(s.thread.lastPostAt)}
                        <span className="mx-2">·</span>
                        Aufrufe: {s.thread.views}
                        <span className="mx-2">·</span>
                        Antworten: {Math.max(0, (s.thread._count?.posts ?? 0) - 1)}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

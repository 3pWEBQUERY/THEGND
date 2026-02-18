import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import ForumHero from '@/components/homepage/ForumHero'
import { prisma } from '@/lib/prisma'
import ReplyForm from '@/components/forum/ReplyForm'
import Link from 'next/link'
import InlineReply from '@/components/forum/InlineReply'
import { requireAdmin } from '@/lib/admin'
import PostActions from '@/components/forum/PostActions'
import { renderMarkdownToSafeHtml } from '@/lib/markdown'
import ThreadSubscribeButton from '@/components/forum/ThreadSubscribeButton'
import PostReportButton from '@/components/forum/PostReportButton'
import PostDeleteButton from '@/components/forum/PostDeleteButton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import ThreadDeleteButton from '@/components/forum/ThreadDeleteButton'

export const dynamic = 'force-dynamic'

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const thread = await prisma.forumThread.findUnique({
    where: { id },
    include: {
      forum: true,
      author: { select: { id: true, email: true, profile: { select: { displayName: true, avatar: true } } } },
    },
  })

  if (!thread) {
    return (
      <div className="min-h-screen bg-white">
        <MinimalistNavigation />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="text-2xl font-light tracking-widest text-gray-900">Thema nicht gefunden</h1>
          <div className="mt-4">
            <Link href="/forum" className="text-pink-600 hover:underline">Zurück zur Forenübersicht</Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // increase view count (best-effort)
  await prisma.forumThread.update({ where: { id: thread.id }, data: { views: { increment: 1 } } })

  const t = thread!

  const posts = await prisma.forumPost.findMany({
    where: { threadId: t.id },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { id: true, email: true, profile: { select: { displayName: true, avatar: true } } } },
    },
  })

  // Check admin for moderation controls
  const { isAdmin } = await requireAdmin()

  // Build threaded tree
  type PostNode = (typeof posts)[number] & { children: PostNode[] }
  const map = new Map<string, PostNode>()
  const roots: PostNode[] = []
  posts.forEach((p: any) => map.set(p.id, { ...p, children: [] }))
  posts.forEach((p: any) => {
    const node = map.get(p.id)!
    if (p.parentId && map.has(p.parentId)) {
      map.get(p.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  function formatDateTime(date: Date) {
    return date.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function slugifyName(input: string) {
    return input
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }

  function PostItem({ node, depth }: { node: PostNode; depth: number }) {
    return (
      <div
        className={depth > 0 ? 'relative pl-3 sm:pl-4' : ''}
        style={depth > 0 ? { marginLeft: depth * 12 } : undefined}
      >
        {depth > 0 && <span className="absolute left-0 top-0 bottom-0 w-px bg-pink-200" aria-hidden />}
        <article className="border border-gray-200">
          <header className="px-4 py-4 bg-gray-50 text-xs text-gray-600 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-8 w-8 bg-gray-200">
                {node.author.profile?.avatar ? (
                  <AvatarImage src={node.author.profile.avatar} alt="avatar" />
                ) : (
                  <AvatarFallback className="text-[10px] font-light tracking-widest text-gray-700">
                    {(node.author.profile?.displayName || node.author.email || '?')
                      .split(/\s+/)
                      .map((s: string) => s.charAt(0).toUpperCase())
                      .slice(0, 2)
                      .join('')}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="truncate">
                <div className="text-sm text-gray-900 truncate">
                  {(() => {
                    const dn = node.author.profile?.displayName || node.author.email
                    const slug = slugifyName(dn)
                    return (
                      <Link href={`/user/${node.author.id}/${slug}`} className="hover:underline">
                        {dn}
                      </Link>
                    )
                  })()}
                </div>
                <div className="text-[11px] text-gray-500">{formatDateTime(new Date(node.createdAt))}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {node.editedAt && <span className="text-[11px] text-gray-500">Bearbeitet am {formatDateTime(new Date(node.editedAt))}</span>}
              {isAdmin && <PostDeleteButton postId={node.id} />}
              {!isAdmin && (
                <PostReportButton postId={node.id} authorId={node.author.id} />
              )}
            </div>
          </header>
          <div
            className="p-4 text-sm text-gray-800 break-words"
            dangerouslySetInnerHTML={{ __html: renderMarkdownToSafeHtml(node.content) }}
          />
          <div className="px-4 pb-3">
            <PostActions postId={node.id} authorId={node.author.id} initialContent={node.content} />
          </div>
          <div className="px-4 pb-3">
            <InlineReply
              threadId={t.id}
              parentId={node.id}
              quote={{ author: node.author.profile?.displayName || node.author.email, content: node.content }}
            />
          </div>
        </article>
        {node.children.length > 0 && (
          <div className="mt-2 space-y-2">
            {node.children.map((child) => (
              <PostItem key={child.id} node={child} depth={Math.min(depth + 1, 6)} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <MinimalistNavigation />
      <ForumHero title={t.title} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-2xl font-light tracking-widest text-gray-900">{t.title}</h1>
            <div className="w-24 h-px bg-pink-500 mt-3" />
            <div className="mt-2 text-xs text-gray-600">
              <Link href={`/forum/${t.forum.slug}`} className="text-pink-600 hover:underline">{t.forum.name}</Link>
              <span className="mx-2">·</span>
              Erstellt am {formatDateTime(new Date(t.createdAt))}
              <span className="mx-2">·</span>
              Aufrufe: {t.views}
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <ThreadSubscribeButton threadId={t.id} />
            <Link
              href={`/forum/${t.forum.slug}`}
              className="px-3 py-1.5 border border-gray-300 text-xs uppercase tracking-widest hover:bg-gray-50"
            >
              Zurück zum Forum
            </Link>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {roots.length === 0 ? (
            <div className="text-sm text-gray-500">Noch keine Beiträge.</div>
          ) : (
            roots.map((n) => <PostItem key={n.id} node={n} depth={0} />)
          )}
        </div>

        {!t.forum.isLocked ? (
          <div className="mt-8">
            <ReplyForm threadId={t.id} />
          </div>
        ) : (
          <div className="mt-8 border border-gray-200 p-4 bg-pink-50/40 text-sm text-gray-700">Dieses Forum ist gesperrt.</div>
        )}

        {isAdmin && (
          <div className="mt-8 border border-gray-200 p-4 bg-white">
            <div className="text-xs uppercase tracking-widest text-gray-600 mb-2">Moderation</div>
            <div className="flex items-center gap-3">
              <form action={`/api/acp/forum/threads/${t.id}`} method="post">
                <button formAction={`/api/acp/forum/threads/${t.id}`} className="px-3 py-1.5 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50" name="action" value="toggle_pin">{t.isPinned ? 'Pin entfernen' : 'Anpinnen'}</button>
              </form>
              <form action={`/api/acp/forum/threads/${t.id}`} method="post">
                <button formAction={`/api/acp/forum/threads/${t.id}`} className="px-3 py-1.5 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50" name="action" value="toggle_close">{t.isClosed ? 'Öffnen' : 'Schließen'}</button>
              </form>
              <ThreadDeleteButton threadId={t.id} />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

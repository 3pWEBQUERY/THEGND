import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ActionButton } from '@/components/admin/ActionButton'
import { PromptActionButton } from '@/components/admin/PromptActionButton'

export const dynamic = 'force-dynamic'

async function CreatePostForm() {
  // server component form using action via API - keep simple client component not needed
  return (
    <form action="/api/acp/posts" method="post" className="border border-gray-200 rounded-none p-4 bg-white space-y-3">
      <div className="text-sm font-medium text-gray-800">Neuen Feed erstellen</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input name="authorEmail" type="email" required placeholder="Autor Email" className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm" />
        <input name="content" required placeholder="Inhalt" className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm" />
      </div>
      <button className="px-4 py-2 rounded-none border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">Erstellen</button>
    </form>
  )
}

export default async function AdminFeedsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = (await searchParams) || {}
  const q = typeof sp.q === 'string' ? sp.q : ''
  const author = typeof sp.author === 'string' ? sp.author : ''
  const activeParam = typeof sp.active === 'string' ? sp.active : ''
  const pageParam = typeof sp.page === 'string' ? sp.page : '1'
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)
  const take = 20
  const skip = (page - 1) * take

  const where: any = {}
  if (q) where.content = { contains: q, mode: 'insensitive' }
  if (author) where.author = { is: { email: { contains: author, mode: 'insensitive' } } }
  if (activeParam) where.isActive = activeParam === 'true'

  const [total, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        content: true,
        isActive: true,
        createdAt: true,
        author: { select: { email: true } },
      },
    }),
  ])
  const totalPages = Math.max(1, Math.ceil(total / take))

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-light tracking-wide text-gray-900">Feeds Verwaltung</h1>

      {/* Creation form (fallback to POST fetch if no direct form handling) */}
      {/* This form posts to the API via standard form-submit. The route will accept both JSON and form data. */}
      <CreatePostForm />

      <form action="/acp/feeds" method="get" className="bg-white border border-gray-200 rounded-none p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Suche Inhalt"
          className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm"
        />
        <input
          type="text"
          name="author"
          defaultValue={author}
          placeholder="Autor Email"
          className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm"
        />
        <select name="active" defaultValue={activeParam} className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm">
          <option value="">Status: alle</option>
          <option value="true">Nur aktiv</option>
          <option value="false">Nur inaktiv</option>
        </select>
        <button className="px-4 py-2 rounded-none border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">Filtern</button>
      </form>

      <div className="border border-gray-200 rounded-none overflow-hidden bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Autor</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Inhalt</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Aktiv</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Erstellt</th>
              <th className="text-right px-4 py-2 text-gray-500 font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(p => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-900">{p.author.email}</td>
                <td className="px-4 py-3 text-gray-700 max-w-xl truncate">{p.content}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-none text-xs ${p.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                    {p.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(p.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <PromptActionButton
                      label="Inhalt bearbeiten"
                      endpoint={`/api/acp/posts/${p.id}`}
                      method="PATCH"
                      promptLabel="Neuer Inhalt"
                      field="content"
                    />
                    <ActionButton
                      label={p.isActive ? 'Deaktivieren' : 'Aktivieren'}
                      endpoint={`/api/acp/posts/${p.id}`}
                      method="PATCH"
                      body={{ isActive: !p.isActive }}
                    />
                    <ActionButton
                      label="Löschen"
                      endpoint={`/api/acp/posts/${p.id}`}
                      method="DELETE"
                      confirm="Feed wirklich löschen?"
                      variant="danger"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Seite {page} von {totalPages} • {total} Einträge
        </div>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              href={{ pathname: '/acp/feeds', query: { q, author, active: activeParam, page: String(page - 1) } }}
              className="px-3 py-1 border border-gray-300 rounded-none hover:bg-gray-50"
            >
              Zurück
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={{ pathname: '/acp/feeds', query: { q, author, active: activeParam, page: String(page + 1) } }}
              className="px-3 py-1 border border-gray-300 rounded-none hover:bg-gray-50"
            >
              Weiter
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

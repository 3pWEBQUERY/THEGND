import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { requireModerator } from '@/lib/moderation'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { isAdmin } = await requireAdmin()
  const { isModerator } = await requireModerator()
  if (!isAdmin && !isModerator) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-light tracking-widest text-gray-900">Nicht autorisiert</h1>
      </div>
    )
  }

  const sp = (await searchParams) || {}
  const status = typeof sp.status === 'string' ? sp.status : ''

  type ReportRow = {
    id: string
    status: string
    reporter?: { email?: string | null; profile?: { displayName?: string | null } | null } | null
    post?: {
      id: string
      content?: string | null
      thread?: { id: string; title?: string | null } | null
      author?: { email?: string | null; profile?: { displayName?: string | null } | null } | null
    } | null
  }

  const reports = (await (prisma as any).forumPostReport.findMany({
    where: {
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      reporter: { select: { email: true, profile: { select: { displayName: true } } } },
      post: {
        select: {
          id: true,
          content: true,
          thread: { select: { id: true, title: true } },
          author: { select: { email: true, profile: { select: { displayName: true } } } },
        },
      },
    },
    take: 200,
  })) as ReportRow[]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-light tracking-wide text-gray-900">Meldungen</h1>
        <div className="text-sm">
          <a href="/acp/reports" className={`mr-3 ${!status ? 'text-pink-600' : 'text-gray-600'} hover:underline`}>Alle</a>
          <a href="/acp/reports?status=OPEN" className={`mr-3 ${status === 'OPEN' ? 'text-pink-600' : 'text-gray-600'} hover:underline`}>Offen</a>
          <a href="/acp/reports?status=RESOLVED" className={`${status === 'RESOLVED' ? 'text-pink-600' : 'text-gray-600'} hover:underline`}>Erledigt</a>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Post</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Thread</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Reporter</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Status</th>
              <th className="text-right px-4 py-2 text-gray-500 font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r: ReportRow) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-700">
                  <div className="line-clamp-3 max-w-xl">{r.post?.content || '—'}</div>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  <a href={`/forum/thread/${r.post?.thread?.id}`} className="text-pink-600 hover:underline">{r.post?.thread?.title || r.post?.thread?.id}</a>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {r.reporter?.profile?.displayName || r.reporter?.email || '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs border ${r.status === 'OPEN' ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-green-200 text-green-700 bg-green-50'}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={`/api/acp/reports/${r.id}`} method="post" className="inline-block mr-2">
                    <button name="action" value="resolve" className="text-xs px-2 py-1 border border-gray-300 hover:bg-gray-50">Erledigt</button>
                  </form>
                  <form action={`/api/acp/reports/${r.id}`} method="post" className="inline-block mr-2">
                    <button name="action" value="reopen" className="text-xs px-2 py-1 border border-gray-300 hover:bg-gray-50">Wieder öffnen</button>
                  </form>
                  <form action={`/api/acp/reports/${r.id}`} method="post" className="inline-block">
                    <button name="action" value="delete" className="text-xs px-2 py-1 border border-red-300 text-red-700 hover:bg-red-50">Löschen</button>
                  </form>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500 text-sm">Keine Meldungen.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

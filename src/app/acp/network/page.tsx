import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getAvatarUrl } from '@/utils/avatar'
import { ActionButton } from '@/components/admin/ActionButton'

export const dynamic = 'force-dynamic'

export default async function AdminNetworkPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = (await searchParams) || {}
  const follower = typeof sp.follower === 'string' ? sp.follower : ''
  const following = typeof sp.following === 'string' ? sp.following : ''
  const pageParam = typeof sp.page === 'string' ? sp.page : '1'
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)
  const take = 20
  const skip = (page - 1) * take

  const where: any = {}
  if (follower) where.follower = { is: { email: { contains: follower, mode: 'insensitive' } } }
  if (following) where.following = { is: { email: { contains: following, mode: 'insensitive' } } }

  const [total, follows] = await Promise.all([
    prisma.follow.count({ where }),
    prisma.follow.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        createdAt: true,
        follower: { select: { email: true, userType: true, profile: { select: { avatar: true } } } },
        following: { select: { email: true, userType: true, profile: { select: { avatar: true } } } },
      },
    }),
  ])
  const totalPages = Math.max(1, Math.ceil(total / take))

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-light tracking-wide text-gray-900">Netzwerk Übersicht</h1>

      <form action="/acp/network" method="get" className="bg-white border border-gray-200 rounded-none p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          name="follower"
          defaultValue={follower}
          placeholder="Follower Email"
          className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm"
        />
        <input
          type="text"
          name="following"
          defaultValue={following}
          placeholder="Folgt Email"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <button className="px-4 py-2 rounded-none border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">Filtern</button>
      </form>

      <div className="border border-gray-200 rounded-none overflow-hidden bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Follower</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Folgt</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Seit</th>
              <th className="text-right px-4 py-2 text-gray-500 font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {follows.map(f => (
              <tr key={f.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <img src={getAvatarUrl((f.follower as any).profile?.avatar, (f.follower as any).userType)} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                    <span className="text-gray-900">{f.follower.email}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <img src={getAvatarUrl((f.following as any).profile?.avatar, (f.following as any).userType)} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                    <span className="text-gray-900">{f.following.email}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(f.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <ActionButton
                      label="Entfernen"
                      endpoint={`/api/acp/follows/${f.id}`}
                      method="DELETE"
                      confirm="Follow-Verbindung entfernen?"
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
              href={{ pathname: '/acp/network', query: { follower, following, page: String(page - 1) } }}
              className="px-3 py-1 border border-gray-300 rounded-none hover:bg-gray-50"
            >
              Zurück
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={{ pathname: '/acp/network', query: { follower, following, page: String(page + 1) } }}
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

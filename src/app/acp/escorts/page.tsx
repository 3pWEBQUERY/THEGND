import Link from 'next/link'
import CreateUserForm from '@/components/admin/CreateUserForm'
import { ActionButton } from '@/components/admin/ActionButton'
import { PromptActionButton } from '@/components/admin/PromptActionButton'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminEscortsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = (await searchParams) || {}
  const q = typeof sp.q === 'string' ? sp.q : ''
  const visibility = typeof sp.visibility === 'string' ? sp.visibility : ''
  const activeParam = typeof sp.active === 'string' ? sp.active : ''
  const hasProfile = typeof sp.hasProfile === 'string' ? sp.hasProfile : ''
  const pageParam = typeof sp.page === 'string' ? sp.page : '1'
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)
  const take = 20
  const skip = (page - 1) * take

  const where: any = { userType: 'ESCORT' }
  if (q) {
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { profile: { is: { displayName: { contains: q, mode: 'insensitive' } } } },
    ]
  }
  if (visibility) {
    where.profile = { ...(where.profile || {}), is: { ...(where.profile?.is || {}), visibility } }
  }
  if (activeParam) {
    where.isActive = activeParam === 'true'
  }
  if (hasProfile) {
    if (hasProfile === 'true') where.profile = { ...(where.profile || {}), isNot: null }
    if (hasProfile === 'false') where.profile = { ...(where.profile || {}), is: null }
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        email: true,
        isActive: true,
        createdAt: true,
        profile: true,
      },
    }),
  ])
  const totalPages = Math.max(1, Math.ceil(total / take))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-light tracking-wide text-gray-900">Escort Profile Verwaltung</h1>
      </div>

      <CreateUserForm defaultType="ESCORT" />

      <form action="/acp/escorts" method="get" className="bg-white border border-gray-200 rounded-none p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Suche (Email/Name)"
          className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm"
        />
        <select name="visibility" defaultValue={visibility} className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm">
          <option value="">Sichtbarkeit: alle</option>
          <option value="PUBLIC">PUBLIC</option>
          <option value="PRIVATE">PRIVATE</option>
        </select>
        <select name="active" defaultValue={activeParam} className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm">
          <option value="">Aktiv-Status: alle</option>
          <option value="true">Nur aktive</option>
          <option value="false">Nur gesperrte</option>
        </select>
        <select name="hasProfile" defaultValue={hasProfile} className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm">
          <option value="">Profil: alle</option>
          <option value="true">Nur mit Profil</option>
          <option value="false">Nur ohne Profil</option>
        </select>
        <button className="px-4 py-2 rounded-none border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">Filtern</button>
      </form>

      <div className="border border-gray-200 rounded-none overflow-hidden bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Email</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Profil</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Aktiv</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Erstellt</th>
              <th className="text-right px-4 py-2 text-gray-500 font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-900">{u.email}</td>
                <td className="px-4 py-3 text-gray-700">
                  {u.profile ? (
                    <div className="space-y-0.5">
                      <div className="font-medium text-gray-900">{u.profile.displayName || '—'}</div>
                      <div className="text-xs text-gray-500">{u.profile.visibility}</div>
                    </div>
                  ) : (
                    <span className="text-gray-400">Kein Profil</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-none text-xs ${u.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {u.isActive ? 'Aktiv' : 'Gesperrt'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {!u.profile && (
                      <ActionButton
                        label="Profil anlegen"
                        endpoint={`/api/acp/escorts/${u.id}/profile`}
                        method="POST"
                      />
                    )}
                    {u.profile && (
                      <>
                        <PromptActionButton
                          label="Name ändern"
                          endpoint={`/api/acp/escorts/${u.profile.id}`}
                          method="PATCH"
                          promptLabel="Neuer Anzeigename"
                          field="displayName"
                        />
                        <ActionButton
                          label={u.profile.visibility === 'PRIVATE' ? 'Öffentlich' : 'Privat'}
                          endpoint={`/api/acp/escorts/${u.profile.id}`}
                          method="PATCH"
                          body={{ visibility: u.profile.visibility === 'PRIVATE' ? 'PUBLIC' : 'PRIVATE' }}
                        />
                        <ActionButton
                          label={u.isActive ? 'Sperren' : 'Entsperren'}
                          endpoint={`/api/acp/users/${u.id}`}
                          method="PATCH"
                          body={{ isActive: !u.isActive }}
                        />
                        <ActionButton
                          label="Profil löschen"
                          endpoint={`/api/acp/escorts/${u.profile.id}`}
                          method="DELETE"
                          confirm="Escort-Profil wirklich löschen?"
                          variant="danger"
                        />
                      </>
                    )}
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
              href={{ pathname: '/acp/escorts', query: { q, visibility, active: activeParam, hasProfile, page: String(page - 1) } }}
              className="px-3 py-1 border border-gray-300 rounded-none hover:bg-gray-50"
            >
              Zurück
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={{ pathname: '/acp/escorts', query: { q, visibility, active: activeParam, hasProfile, page: String(page + 1) } }}
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

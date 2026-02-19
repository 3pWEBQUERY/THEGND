import Link from 'next/link'
import CreateUserForm from '@/components/admin/CreateUserForm'
import { ActionButton } from '@/components/admin/ActionButton'
import { EditUserDialog } from '@/components/admin/EditUserDialog'
import { prisma } from '@/lib/prisma'
import { getAvatarUrl } from '@/utils/avatar'
import AdminSelect from '@/components/admin/AdminSelect'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = (await searchParams) || {}
  const q = typeof sp.q === 'string' ? sp.q : ''
  const type = typeof sp.type === 'string' ? sp.type : ''
  const activeParam = typeof sp.active === 'string' ? sp.active : ''
  const pageParam = typeof sp.page === 'string' ? sp.page : '1'
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)
  const take = 20
  const skip = (page - 1) * take

  const where: any = {}
  if (q) {
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (type) {
    where.userType = type
  }
  if (activeParam) {
    where.isActive = activeParam === 'true'
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
        userType: true,
        isActive: true,
        lastSeenAt: true,
        createdAt: true,
        profile: { select: { id: true, avatar: true } },
      },
    }),
  ])
  const totalPages = Math.max(1, Math.ceil(total / take))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-light tracking-wide text-gray-900">User Verwaltung</h1>
      </div>

      <CreateUserForm />

      <form action="/acp/users" method="get" className="bg-white border border-gray-200 rounded-none p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Suche (Email)"
          className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm"
        />
        <AdminSelect
          name="type"
          defaultValue={type}
          options={[
            { value: '', label: 'Alle Typen' },
            { value: 'USER', label: 'USER' },
            { value: 'ESCORT', label: 'ESCORT' },
          ]}
        />
        <AdminSelect
          name="active"
          defaultValue={activeParam}
          options={[
            { value: '', label: 'Aktiv-Status: alle' },
            { value: 'true', label: 'Nur aktive' },
            { value: 'false', label: 'Nur gesperrte' },
          ]}
        />
        <button className="px-4 py-2 rounded-none border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">Filtern</button>
      </form>

      <div className="border border-gray-200 rounded-none overflow-hidden bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 text-gray-500 font-medium w-14"></th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Email</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Typ</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Aktiv</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Erstellt</th>
              <th className="text-right px-4 py-2 text-gray-500 font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const isOnline = u.lastSeenAt ? (Date.now() - new Date(u.lastSeenAt).getTime()) < 5 * 60 * 1000 : false
              return (
              <tr key={u.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <div className="relative w-9 h-9">
                    <img src={getAvatarUrl(u.profile?.avatar, u.userType)} alt="" className="w-9 h-9 rounded-full object-cover" />
                    <span
                      className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                      title={isOnline ? 'Online' : 'Offline'}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-900">{u.email}</td>
                <td className="px-4 py-3 text-gray-700">{u.userType}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-none text-xs ${u.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}> 
                    {u.isActive ? 'Aktiv' : 'Gesperrt'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {u.userType !== 'ESCORT' && (
                      <ActionButton
                        label=""
                        icon="userCog"
                        tooltip="Zu ESCORT"
                        endpoint={`/api/acp/users/${u.id}`}
                        method="PATCH"
                        body={{ userType: 'ESCORT' }}
                      />
                    )}
                    <ActionButton
                      label=""
                      icon={u.isActive ? 'ban' : 'check'}
                      tooltip={u.isActive ? 'Sperren' : 'Entsperren'}
                      endpoint={`/api/acp/users/${u.id}`}
                      method="PATCH"
                      body={{ isActive: !u.isActive }}
                    />
                    <EditUserDialog user={{ id: u.id, email: u.email, userType: u.userType, isActive: u.isActive }} />
                    {u.userType === 'ESCORT' && !u.profile?.id && (
                      <ActionButton
                        label=""
                        icon="plus"
                        tooltip="Profil anlegen"
                        endpoint={`/api/acp/escorts/${u.id}/profile`}
                        method="POST"
                      />
                    )}
                    <ActionButton
                      label=""
                      icon="trash"
                      tooltip="Löschen"
                      endpoint={`/api/acp/users/${u.id}`}
                      method="DELETE"
                      confirm="User wirklich löschen?"
                      variant="danger"
                    />
                  </div>
                </td>
              </tr>
              )
            })}
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
              href={{ pathname: '/acp/users', query: { q, type, active: activeParam, page: String(page - 1) } }}
              className="px-3 py-1 border border-gray-300 rounded-none hover:bg-gray-50"
            >
              Zurück
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={{ pathname: '/acp/users', query: { q, type, active: activeParam, page: String(page + 1) } }}
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

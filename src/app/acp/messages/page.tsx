import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ActionButton } from '@/components/admin/ActionButton'
import { PromptActionButton } from '@/components/admin/PromptActionButton'

export const dynamic = 'force-dynamic'

async function SendMessageForm() {
  return (
    <form action="/api/acp/messages" method="post" className="border border-gray-200 rounded-none p-4 bg-white space-y-3">
      <div className="text-sm font-medium text-gray-800">Admin Nachricht senden</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input name="receiverEmail" type="email" required placeholder="Empfänger Email" className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm" />
        <input name="content" required placeholder="Nachricht" className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm" />
      </div>
      <button className="px-4 py-2 rounded-none border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">Senden</button>
    </form>
  )
}

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = (await searchParams) || {}
  const q = typeof sp.q === 'string' ? sp.q : ''
  const sender = typeof sp.sender === 'string' ? sp.sender : ''
  const receiver = typeof sp.receiver === 'string' ? sp.receiver : ''
  const readParam = typeof sp.read === 'string' ? sp.read : ''
  const pageParam = typeof sp.page === 'string' ? sp.page : '1'
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)
  const take = 20
  const skip = (page - 1) * take

  const where: any = {}
  if (q) where.content = { contains: q, mode: 'insensitive' }
  if (sender) where.sender = { is: { email: { contains: sender, mode: 'insensitive' } } }
  if (receiver) where.receiver = { is: { email: { contains: receiver, mode: 'insensitive' } } }
  if (readParam) where.isRead = readParam === 'true'

  const [total, messages] = await Promise.all([
    prisma.message.count({ where }),
    prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        content: true,
        isRead: true,
        createdAt: true,
        sender: { select: { email: true } },
        receiver: { select: { email: true } },
      },
    }),
  ])
  const totalPages = Math.max(1, Math.ceil(total / take))

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-light tracking-wide text-gray-900">Nachrichten Verwaltung</h1>

      <SendMessageForm />

      <form action="/acp/messages" method="get" className="bg-white border border-gray-200 rounded-none p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Suche Inhalt"
          className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm"
        />
        <input
          type="text"
          name="sender"
          defaultValue={sender}
          placeholder="Von (Email)"
          className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm"
        />
        <input
          type="text"
          name="receiver"
          defaultValue={receiver}
          placeholder="An (Email)"
          className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm"
        />
        <select name="read" defaultValue={readParam} className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm">
          <option value="">Status: alle</option>
          <option value="true">Nur gelesen</option>
          <option value="false">Nur ungelesen</option>
        </select>
        <button className="px-4 py-2 rounded-none border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">Filtern</button>
      </form>

      <div className="border border-gray-200 rounded-none overflow-hidden bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Von</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">An</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Inhalt</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Gelesen</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Erstellt</th>
              <th className="text-right px-4 py-2 text-gray-500 font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {messages.map(m => (
              <tr key={m.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-900">{m.sender.email}</td>
                <td className="px-4 py-3 text-gray-900">{m.receiver.email}</td>
                <td className="px-4 py-3 text-gray-700 max-w-xl truncate">{m.content}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-none text-xs ${m.isRead ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}> 
                    {m.isRead ? 'Gelesen' : 'Ungelesen'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(m.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <ActionButton
                      label={m.isRead ? 'Als ungelesen' : 'Als gelesen'}
                      endpoint={`/api/acp/messages/${m.id}`}
                      method="PATCH"
                      body={{ isRead: !m.isRead }}
                    />
                    <ActionButton
                      label="Löschen"
                      endpoint={`/api/acp/messages/${m.id}`}
                      method="DELETE"
                      confirm="Nachricht wirklich löschen?"
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
              href={{ pathname: '/acp/messages', query: { q, sender, receiver, read: readParam, page: String(page - 1) } }}
              className="px-3 py-1 border border-gray-300 rounded-none hover:bg-gray-50"
            >
              Zurück
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={{ pathname: '/acp/messages', query: { q, sender, receiver, read: readParam, page: String(page + 1) } }}
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

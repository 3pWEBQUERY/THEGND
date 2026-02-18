import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminHomePage() {
  const [users, escorts, posts, messages, follows] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { userType: 'ESCORT' } }),
    prisma.post.count(),
    prisma.message.count(),
    prisma.follow.count(),
  ])

  const cards = [
    { label: 'Registrierte User', value: users, href: '/acp/users' },
    { label: 'Escorts', value: escorts, href: '/acp/escorts' },
    { label: 'Feeds', value: posts, href: '/acp/feeds' },
    { label: 'Nachrichten', value: messages, href: '/acp/messages' },
    { label: 'Netzwerk Follows', value: follows, href: '/acp/network' },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-light tracking-wide text-gray-900">Admin Übersicht</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="border border-gray-200 rounded-none p-6 hover:shadow-sm transition-shadow bg-white">
            <div className="text-sm text-gray-500">{c.label}</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">{c.value}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

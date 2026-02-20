'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  User,
  Rss,
  ShieldCheck,
  Crown,
  UserCog,
  Puzzle,
  Settings,
  Megaphone,
  MessageSquare,
  Share2,
  MessageCircle,
  BookOpen,
  Mail,
  Search,
} from 'lucide-react'

export type LinkItem = { href: string; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }

export const acpLinks: LinkItem[] = [
  { href: '/acp', label: 'Übersicht', Icon: LayoutDashboard },
  { href: '/acp/users', label: 'User', Icon: Users },
  { href: '/acp/escorts', label: 'Escorts', Icon: User },
  { href: '/acp/feeds', label: 'Feeds', Icon: Rss },
  { href: '/acp/blog', label: 'Blog', Icon: BookOpen },
  { href: '/acp/feedback', label: 'Feedback', Icon: MessageSquare },
  { href: '/acp/verifications', label: 'Verifizierungen', Icon: ShieldCheck },
  { href: '/acp/memberships', label: 'Mitgliedschaften', Icon: Crown },
  { href: '/acp/memberships-users', label: 'User-Mitgliedschaften', Icon: UserCog },
  { href: '/acp/addons', label: 'Add-ons', Icon: Puzzle },
  { href: '/acp/seo', label: 'SEO', Icon: Search },
  { href: '/acp/settings', label: 'Einstellungen', Icon: Settings },
  { href: '/acp/marketing', label: 'Marketing', Icon: Megaphone },
  { href: '/acp/messages', label: 'Nachrichten', Icon: MessageSquare },
  { href: '/acp/network', label: 'Netzwerk', Icon: Share2 },
  { href: '/acp/forum', label: 'Forum', Icon: MessageCircle },
  { href: '/acp/communities', label: 'Communities', Icon: Users },
  { href: '/acp/mail', label: 'Mail', Icon: Mail },
]

export default function AcpSidebar() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {acpLinks.map(({ href, label, Icon }) => {
        const active = pathname === href || (href !== '/acp' && pathname.startsWith(href))
        const base = 'group relative flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors'
        const idle = 'text-gray-700 hover:text-pink-600 hover:bg-pink-50'
        const on = 'text-pink-700 bg-pink-50 border border-pink-200'
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`${base} ${active ? on : idle}`}
          >
            {/* Accent bar */}
            <span
              className={`absolute left-0 top-0 h-full w-1 rounded-r bg-pink-600 transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              aria-hidden
            />
            <Icon className="shrink-0" size={16} />
            <span className="truncate">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

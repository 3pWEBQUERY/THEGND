import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import AcpSidebar from '@/components/admin/AcpSidebar'
import AcpMobileSidebar from '@/components/admin/AcpMobileSidebar'
import { getPublicSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) {
    redirect('/')
  }
  const site = await getPublicSettings()

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AcpMobileSidebar />
            <Link href="/" className="text-2xl font-thin tracking-wider text-gray-900 hover:text-pink-600">
              {site.logo.kind === 'image' && site.logo.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={site.logo.imageUrl} alt={site.name} className="h-7 w-auto" />
              ) : (
                <span>{site.logo.text || site.name}</span>
              )}
            </Link>
          </div>
          <div className="text-xs text-gray-500">Admin</div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          <aside className="hidden md:block w-64 shrink-0 sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-auto">
            <AcpSidebar />
          </aside>
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

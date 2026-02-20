import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import CommunityHero from '@/components/community/CommunityHero'
import CommunityCreateForm from '@/components/community/CommunityCreateForm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CommunityCreatePage() {
  const session = await getServerSession(authOptions as any)
  if (!(session as any)?.user?.id) redirect('/auth/signin?callbackUrl=/community/create')

  return (
    <>
      <MinimalistNavigation />
      <CommunityHero title="CREATE COMMUNITY" subtitle="Erstelle deine eigene Community und bringe Gleichgesinnte zusammen." />
      <div className="max-w-xl mx-auto px-4 py-8">
        <Link
          href="/community"
          className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Zurück zu Communities
        </Link>
        <CommunityCreateForm />
      </div>
      <Footer />
    </>
  )
}

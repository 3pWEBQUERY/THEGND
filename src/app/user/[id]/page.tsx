import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import ProfileComponent from '@/components/ProfileComponent'
import ProfilePublicHero from '@/components/homepage/ProfilePublicHero'

export const dynamic = 'force-dynamic'

export default async function PublicUserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="min-h-screen bg-white">
      <MinimalistNavigation />
      {/* Public profile hero (distinct from EscortsHero) */}
      <ProfilePublicHero userId={id} />
      <main>
        <ProfileComponent userId={id} />
      </main>
      <Footer />
    </div>
  )
}

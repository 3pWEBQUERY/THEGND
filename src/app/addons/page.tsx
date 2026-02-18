'use client'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardHeader from '@/components/DashboardHeader'
import Footer from '@/components/homepage/Footer'
import AddonsClient from '@/app/addons/AddonsClient'

export const dynamic = 'force-dynamic'

export default function AddonsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Auth guard (client-side), mirror pattern used in marketing page
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin?callbackUrl=/addons')
    }
  }, [status, router])

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader session={session} activeTab="addons" setActiveTab={() => {}} />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-light tracking-widest text-gray-900">ADD-ONS</h1>
        <p className="mt-2 text-sm text-gray-600">Aktiviere oder deaktiviere optionale Erweiterungen für dein Profil.</p>
        <div className="mt-8">
          <AddonsClient />
        </div>
      </div>
      <Footer />
    </div>
  )
}


'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { X } from 'lucide-react'

export function AuthRequiredModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white w-full max-w-3xl mx-4 overflow-hidden rounded-none grid grid-cols-1 md:grid-cols-2">
        {/* Left promo pane */}
        <div className="bg-black text-white p-8 md:p-10 flex flex-col min-h-[460px]">
          <h3 className="text-xl md:text-2xl font-light tracking-wider">Du bist noch kein Mitglied?</h3>
          <div className="mt-2 text-pink-500 text-lg font-medium">Jetzt kostenlos Mitglied werden!</div>
          <p className="text-sm text-gray-300 mt-4 font-light">Melde dich jetzt an und profitiere als Free Member.</p>
          <Link href="/auth/signup" className="block w-full mt-auto bg-pink-500 hover:bg-pink-600 text-white text-xs font-light tracking-widest px-6 py-3 uppercase text-center">
            Registrieren
          </Link>
        </div>

        {/* Right login prompt */}
        <div className="relative p-8 md:p-10 flex min-h-[460px]">
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            aria-label="Schließen"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="w-full max-w-sm text-left flex flex-col flex-1">
            <div className="text-2xl font-light tracking-widest text-gray-900 mb-6">
              <Link href="/">THEGND</Link>
            </div>
            <h3 className="text-xl font-light tracking-wider text-gray-900 mb-4">Bist du schon Mitglied?</h3>
            <p className="text-sm text-gray-600 mb-6">Melde dich an, um Gruppen beizutreten und zu posten.</p>
            <div className="space-y-3 mt-auto">
              <Link href="/auth/signin" className="block w-full bg-pink-500 hover:bg-pink-600 text-white text-xs font-light tracking-widest px-6 py-3 text-center uppercase">Einloggen</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GroupJoinLeaveButton({ slug, isMember, isAuthenticated }: { slug: string; isMember: boolean; isAuthenticated?: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const onJoin = async () => {
    // If not authenticated, open auth modal instead of calling API
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/groups/${slug}/join`, { method: 'POST' })
      if (res.status === 401 || res.status === 403) {
        setShowAuthModal(true)
        return
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Join fehlgeschlagen')
      router.refresh()
    } catch (e: any) {
      alert(e?.message || 'Fehler')
    } finally { setLoading(false) }
  }

  const onLeave = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/groups/${slug}/leave`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Leave fehlgeschlagen')
      router.refresh()
    } catch (e: any) {
      alert(e?.message || 'Fehler')
    } finally { setLoading(false) }
  }

  return (
    <>
      <button
        onClick={isMember ? onLeave : onJoin}
        disabled={loading}
        className={`px-3 py-2 text-sm border uppercase tracking-widest ${isMember ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
      >
        {loading ? '...' : isMember ? 'GRUPPE VERLASSEN' : 'GRUPPE BEITRETEN'}
      </button>

      <AuthRequiredModal open={!!(showAuthModal && !isAuthenticated)} onClose={() => setShowAuthModal(false)} />
    </>
  )
}

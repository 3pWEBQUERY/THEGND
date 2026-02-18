'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ProfileComponent from '@/components/ProfileComponent'

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Minimalist Navigation */}
      <nav className="absolute top-0 w-full z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="flex items-center text-sm font-light tracking-widest text-gray-600 hover:text-pink-500 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              DASHBOARD
            </Link>
            <div className="text-sm font-light tracking-widest text-gray-600">
              PROFILE
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content with top padding */}
      <div className="pt-20">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-sm font-light tracking-widest text-gray-600">LOADING PROFILE...</div>
          </div>
        }>
          <ProfileComponent />
        </Suspense>
      </div>
    </div>
  )
}
import Footer from '@/components/homepage/Footer'
import React from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function NotificationsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/auth/signin')
  }
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

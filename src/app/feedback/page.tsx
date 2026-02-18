import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import FeedbackFormClient from './FeedbackFormClient'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function FeedbackPage({ searchParams }: { searchParams?: Promise<{ success?: string }> }) {
  const sp = (await searchParams) || {}
  const session = (await getServerSession(authOptions as any)) as any
  const success = sp.success === '1'

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MinimalistNavigation />

      {/* Hero Section (like /blog) */}
      <section className="relative overflow-hidden mb-12 md:mb-16">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/blog.jpg" alt="Hero Background" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/0 to-white/0 md:to-white/0" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-40 pb-24 md:pt-48 md:pb-40">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-light tracking-[0.25em] text-white">FEEDBACK</h1>
            <div className="mt-4 h-[2px] w-24 bg-gradient-to-r from-pink-600/0 via-pink-500/80 to-pink-600/0" />
            <p className="mt-6 text-neutral-200 text-base md:text-lg leading-relaxed">
              Wir freuen uns über dein Feedback. Teile uns mit, was wir verbessern können.
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 pb-16">
          {success && (
            <div className="mb-6 border border-green-200 bg-green-50 text-green-800 px-4 py-3 text-sm tracking-widest">
              Vielen Dank! Dein Feedback wurde übermittelt.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-2">
              <FeedbackFormClient showEmailField={!session?.user?.email} />
            </div>
            <div className="md:col-span-1">
              <Image
                src="/feedback.jpg"
                alt="Feedback"
                width={800}
                height={1200}
                className="w-full h-auto object-cover border border-gray-200"
                priority
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

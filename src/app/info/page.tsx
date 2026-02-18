import type { Metadata } from 'next'
import Link from 'next/link'
import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import Tabs from '@/components/Tabs'
import { Search, Rocket } from 'lucide-react'
import OverviewTab from './tabs/OverviewTab'
import KontenOnboardingTab from './tabs/KontenOnboardingTab'
import SuchenEntdeckenTab from './tabs/SuchenEntdeckenTab'
import ProfileStoriesTab from './tabs/ProfileStoriesTab'
import ForumTab from './tabs/ForumTab'
import MessagesNotificationsTab from './tabs/MessagesNotificationsTab'
import MitgliedschaftPreiseTab from './tabs/MitgliedschaftPreiseTab'
import MarketingTab from './tabs/MarketingTab'
import SicherheitSupportTab from './tabs/SicherheitSupportTab'
import FaqTab from './tabs/FaqTab'

export const metadata: Metadata = {
  title: 'Informationen – THEGND',
  description:
    'Alles über THEGND: Funktionen, Seiten, Mitgliedschaften, Marketing und Sicherheit – elegant erklärt.',
}

export default async function InfoPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[]>> }) {
  const sp = (await searchParams) ?? ({} as Record<string, string | string[]>)
  const initialTabId = typeof sp.tab === 'string' ? sp.tab : undefined

  // New lightweight tabs definition using extracted components
  const tabsFromComponents = [
    { id: 'ueberblick', label: 'Überblick', content: <OverviewTab /> },
    { id: 'konten-onboarding', label: 'Konten & Onboarding', content: <KontenOnboardingTab /> },
    { id: 'suchen-entdecken', label: 'Suchen & Entdecken', content: <SuchenEntdeckenTab /> },
    { id: 'profile-stories', label: 'Profile, Newsfeed & Stories', content: <ProfileStoriesTab /> },
    { id: 'forum', label: 'Forum', content: <ForumTab /> },
    { id: 'messages-notifications', label: 'Nachrichten & Benachrichtigungen', content: <MessagesNotificationsTab /> },
    { id: 'mitgliedschaft-preise', label: 'Mitgliedschaft & Preise', content: <MitgliedschaftPreiseTab /> },
    { id: 'marketing', label: 'Marketing', content: <MarketingTab /> },
    { id: 'sicherheit-support', label: 'Sicherheit & Support', content: <SicherheitSupportTab /> },
    { id: 'faq', label: 'FAQ', content: <FaqTab /> },
  ] as const;

  return (
    <div className="min-h-screen bg-white">
      <MinimalistNavigation />
      {/* Hero Section (styled like /preise, without buttons) */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/info.jpg"
            alt="Hero Background"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/0 to-white/0 md:to-white/0" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-40 pb-24 md:pt-48 md:pb-40">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-light tracking-[0.25em] text-white">INFO</h1>
            <div className="mt-4 h-[2px] w-24 bg-gradient-to-r from-pink-600/0 via-pink-500/80 to-pink-600/0" />
            <p className="mt-6 text-neutral-200 text-base md:text-lg leading-relaxed">
              Alles über THEGND: Funktionen, Seiten, Mitgliedschaften, Marketing und Sicherheit – elegant erklärt.
            </p>
          </div>
        </div>
      </section>
      <main className="max-w-7xl mx-auto px-6 py-8 sm:py-10">
        {/* Quick Actions */}
        <div className="border border-gray-200 bg-white p-4 sm:p-5 mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/auth/signup"
              aria-label="Jetzt kostenlos registrieren"
              className="inline-flex items-center justify-center bg-pink-500 hover:bg-pink-600 text-white text-xs font-light tracking-widest px-6 py-3 uppercase rounded-none"
            >
              <Rocket className="h-4 w-4 mr-2" /> Jetzt starten
            </Link>
            <Link
              href="/preise"
              aria-label="Preise ansehen"
              className="inline-flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-pink-50/40 text-xs font-light tracking-widest px-6 py-3 uppercase rounded-none"
            >
              Preise ansehen
            </Link>
            <Link
              href="/search"
              aria-label="Jetzt entdecken"
              className="inline-flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-pink-50/40 text-xs font-light tracking-widest px-6 py-3 uppercase rounded-none"
            >
              <Search className="h-4 w-4 mr-2" /> Entdecken
            </Link>
          </div>
        </div>
        <Tabs
          tabs={tabsFromComponents as any}
          initialId={initialTabId}
        />
      </main>
      <Footer />
    </div>
  )
}

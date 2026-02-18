'use client'

import DashboardHeader from '@/components/DashboardHeader'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import Tabs from '@/components/Tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MembershipPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  
  // Auth guard: redirect unauthenticated users to sign-in
  useEffect(() => {
    if (status === 'unauthenticated') {
      const cb = encodeURIComponent('/membership')
      router.replace(`/auth/signin?callbackUrl=${cb}`)
    }
  }, [status, router])
  type Choice = { category: 'membership' | 'day' | 'week' | 'month' | 'city'; name: string; price: number; duration?: number }
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null)
  const [weekDuration, setWeekDuration] = useState<'1' | '2'>('1')
  const [monthDuration, setMonthDuration] = useState<'1' | '2'>('1')
  const [dayDuration, setDayDuration] = useState<'1' | '3' | '7'>('1')
  const [cityDuration, setCityDuration] = useState<'7' | '14' | '30'>('7')
  const [bookingState, setBookingState] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({ type: 'idle' })
  const [bookingLoading, setBookingLoading] = useState(false)

  const PRICES = {
    membership: { basis: 19.99, plus: 39.99, premium: 69.99 },
    dayAddon: { 1: 9.99, 3: 19.99, 7: 29.99 },
    weekAddon: { 1: 29.99, 2: 49.99 },
    monthAddon: { 1: 79.99, 2: 139.99 },
    cityBoost: { 7: 24.99, 14: 39.99, 30: 59.99 },
  } as const

  const formatEUR = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })

  // Persist selection locally (no payment integration yet)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('membershipSelection')
      if (saved) setSelectedChoice(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    try {
      if (selectedChoice) localStorage.setItem('membershipSelection', JSON.stringify(selectedChoice))
      else localStorage.removeItem('membershipSelection')
    } catch {}
  }, [selectedChoice])

  const handleBook = async () => {
    if (!selectedChoice) return
    setBookingLoading(true)
    setBookingState({ type: 'idle' })
    try {
      let payload: any = {}
      if (selectedChoice.category === 'membership') {
        const planKey = selectedChoice.name.toUpperCase()
        payload = { type: 'membership', planKey }
      } else {
        const addonKeyMap: Record<string, string> = {
          day: 'ESCORT_OF_DAY',
          week: 'ESCORT_OF_WEEK',
          month: 'ESCORT_OF_MONTH',
          city: 'CITY_BOOST',
        }
        const addonKey = addonKeyMap[selectedChoice.category]
        let durationDays = selectedChoice.duration ?? 1
        if (selectedChoice.category === 'week') durationDays = (selectedChoice.duration ?? 1) * 7
        if (selectedChoice.category === 'month') durationDays = (selectedChoice.duration === 2 ? 60 : 30)
        // 'day' and 'city' already represent days
        payload = { type: 'addon', addonKey, durationDays }
      }

      const res = await fetch('/api/membership/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Fehler bei der Buchung')
      setBookingState({ type: 'success', message: 'Buchung gespeichert.' })
    } catch (e: any) {
      setBookingState({ type: 'error', message: e?.message || 'Konnte Buchung nicht speichern.' })
    } finally {
      setBookingLoading(false)
    }
  }

  const tabs = [
    {
      id: 'mitgliedschaft',
      label: 'Mitgliedschaft',
      content: (
        <div>
          <p className="text-sm text-gray-600">
            Starte oder verwalte deine Mitgliedschaft bei THEGND. Profitiere von höherer Sichtbarkeit, mehr Profil-Features und exklusiven Vorteilen.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`border border-gray-200 p-6 hover:border-pink-300 transition-colors ${selectedChoice?.category === 'membership' && selectedChoice?.name === 'BASIS' ? 'border-pink-500 ring-1 ring-pink-300' : ''}`}>
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">BASIS</h3>
                <div className="text-right">
                  <div className="text-4xl font-semibold text-gray-900">{formatEUR(PRICES.membership.basis)}</div>
                  <div className="text-[11px] uppercase tracking-widest text-gray-500">pro Monat</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600">Ideal für den Einstieg. Präsenz auf THEGND mit Standard-Funktionen.</p>
              <ul className="mt-4 text-sm text-gray-700 space-y-2 list-disc ml-5">
                <li>Standard-Listing in der Suche</li>
                <li>Basis-Profil mit Galerie</li>
                <li>Bis zu 5 Fotos</li>
              </ul>
              <div className="mt-6">
                <Button onClick={() => setSelectedChoice({ category: 'membership', name: 'BASIS', price: PRICES.membership.basis })} className="bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-3 text-sm uppercase rounded-none w-full">Paket auswählen</Button>
              </div>
            </div>
            <div className={`border border-gray-200 p-6 hover:border-pink-300 transition-colors ${selectedChoice?.category === 'membership' && selectedChoice?.name === 'PLUS' ? 'border-pink-500 ring-1 ring-pink-300' : ''}`}>
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">PLUS</h3>
                <div className="text-right">
                  <div className="text-4xl font-semibold text-gray-900">{formatEUR(PRICES.membership.plus)}</div>
                  <div className="text-[11px] uppercase tracking-widest text-gray-500">pro Monat</div>
                </div>
              </div>
              <span className="mt-2 inline-block px-2 py-1 text-[10px] uppercase tracking-widest border border-pink-300 text-pink-600">Empfohlen</span>
              <p className="mt-3 text-sm text-gray-600">Mehr Reichweite, erweiterte Darstellung und priorisierte Listings.</p>
              <ul className="mt-4 text-sm text-gray-700 space-y-2 list-disc ml-5">
                <li>Priorisierung gegenüber BASIS</li>
                <li>Erweiterte Profil-Module</li>
                <li>Bis zu 15 Fotos, 2 Videos</li>
              </ul>
              <div className="mt-6">
                <Button onClick={() => setSelectedChoice({ category: 'membership', name: 'PLUS', price: PRICES.membership.plus })} className="bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-3 text-sm uppercase rounded-none w-full">Paket auswählen</Button>
              </div>
            </div>
            <div className={`border border-gray-200 p-6 hover:border-pink-300 transition-colors ${selectedChoice?.category === 'membership' && selectedChoice?.name === 'PREMIUM' ? 'border-pink-500 ring-1 ring-pink-300' : ''}`}>
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">PREMIUM</h3>
                <div className="text-right">
                  <div className="text-4xl font-semibold text-gray-900">{formatEUR(PRICES.membership.premium)}</div>
                  <div className="text-[11px] uppercase tracking-widest text-gray-500">pro Monat</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600">Maximale Sichtbarkeit, Top-Placement und alle Vorteile.</p>
              <ul className="mt-4 text-sm text-gray-700 space-y-2 list-disc ml-5">
                <li>Top-Placement in den Listen</li>
                <li>Alle Profil-Features freigeschaltet</li>
                <li>Bis zu 30 Fotos, 5 Videos, Stories</li>
              </ul>
              <div className="mt-6">
                <Button onClick={() => setSelectedChoice({ category: 'membership', name: 'PREMIUM', price: PRICES.membership.premium })} className="bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-3 text-sm uppercase rounded-none w-full">Paket auswählen</Button>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'day',
      label: 'Escort of the Day',
      content: (
        <div>
          <p className="text-sm text-gray-600">Buche das Add-on "Escort of the Day" für schnelle, tagesbasierte Sichtbarkeit.</p>
          <div className={`mt-6 border border-gray-200 p-6 ${selectedChoice?.category === 'day' ? 'border-pink-500 ring-1 ring-pink-300' : ''}`}>
            <div className="flex items-end justify-between gap-6 flex-wrap mb-8">
              <div>
                <span className="text-xs font-light tracking-widest text-gray-800 uppercase">DAUER</span>
                <div className="mt-2">
                  <Select value={dayDuration} onValueChange={(v) => setDayDuration(v as '1' | '3' | '7')}>
                    <SelectTrigger className="w-48 border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light bg-transparent">
                      <SelectValue placeholder="Dauer wählen" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border border-gray-200 shadow-none">
                      <SelectItem className="rounded-none" value="1">1 Tag</SelectItem>
                      <SelectItem className="rounded-none" value="3">3 Tage</SelectItem>
                      <SelectItem className="rounded-none" value="7">7 Tage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-xs text-gray-500 uppercase tracking-widest">Preis</span>
                <span className="text-3xl font-semibold text-gray-900">{formatEUR(dayDuration === '1' ? PRICES.dayAddon[1] : dayDuration === '3' ? PRICES.dayAddon[3] : PRICES.dayAddon[7])}</span>
                <div className="text-[11px] uppercase tracking-widest text-gray-500">gesamt</div>
              </div>
            </div>
            <ul className="list-disc ml-5 text-sm text-gray-700 space-y-2">
              <li>Hervorgehobenes Tages-Badge</li>
              <li>Startseiten-Highlight für die gewählte Dauer</li>
              <li>Mehr Sichtbarkeit in Listen</li>
            </ul>
            <div className="mt-6">
              <Button onClick={() => setSelectedChoice({ category: 'day', name: 'Escort of the Day', price: dayDuration === '1' ? PRICES.dayAddon[1] : dayDuration === '3' ? PRICES.dayAddon[3] : PRICES.dayAddon[7], duration: parseInt(dayDuration) })} className="bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-3 text-sm uppercase rounded-none">Add-on auswählen</Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'city',
      label: 'Städte-Boost',
      content: (
        <div>
          <p className="text-sm text-gray-600">Boost für Stadt-Listings: erhöhe deine Sichtbarkeit in deiner Stadt über einen flexiblen Zeitraum.</p>
          <div className={`mt-6 border border-gray-200 p-6 ${selectedChoice?.category === 'city' ? 'border-pink-500 ring-1 ring-pink-300' : ''}`}>
            <div className="flex items-end justify-between gap-6 flex-wrap mb-8">
              <div>
                <span className="text-xs font-light tracking-widest text-gray-800 uppercase">DAUER</span>
                <div className="mt-2">
                  <Select value={cityDuration} onValueChange={(v) => setCityDuration(v as '7' | '14' | '30')}>
                    <SelectTrigger className="w-48 border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light bg-transparent">
                      <SelectValue placeholder="Dauer wählen" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border border-gray-200 shadow-none">
                      <SelectItem className="rounded-none" value="7">7 Tage</SelectItem>
                      <SelectItem className="rounded-none" value="14">14 Tage</SelectItem>
                      <SelectItem className="rounded-none" value="30">30 Tage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-xs text-gray-500 uppercase tracking-widest">Preis</span>
                <span className="text-3xl font-semibold text-gray-900">{formatEUR(cityDuration === '7' ? PRICES.cityBoost[7] : cityDuration === '14' ? PRICES.cityBoost[14] : PRICES.cityBoost[30])}</span>
                <div className="text-[11px] uppercase tracking-widest text-gray-500">gesamt</div>
              </div>
            </div>
            <ul className="list-disc ml-5 text-sm text-gray-700 space-y-2">
              <li>Priorisierte Platzierung in Stadt-Listings</li>
              <li>Städte-Boost Badge</li>
              <li>Mehr Impressionen in deiner Stadt</li>
            </ul>
            <div className="mt-6">
              <Button onClick={() => setSelectedChoice({ category: 'city', name: 'Städte-Boost', price: cityDuration === '7' ? PRICES.cityBoost[7] : cityDuration === '14' ? PRICES.cityBoost[14] : PRICES.cityBoost[30], duration: parseInt(cityDuration) })} className="bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-3 text-sm uppercase rounded-none">Add-on auswählen</Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'week',
      label: 'Escort of the Week',
      content: (
        <div>
          <p className="text-sm text-gray-600">Buche das Add-on "Escort of the Week" für eine Woche Top-Sichtbarkeit auf der Startseite und in den Suchergebnissen.</p>
          <div className={`mt-6 border border-gray-200 p-6 ${selectedChoice?.category === 'week' ? 'border-pink-500 ring-1 ring-pink-300' : ''}`}>
            <div className="flex items-end justify-between gap-6 flex-wrap mb-8">
              <div>
                <span className="text-xs font-light tracking-widest text-gray-800 uppercase">DAUER</span>
                <div className="mt-2">
                  <Select value={weekDuration} onValueChange={(v) => setWeekDuration(v as '1' | '2')}>
                    <SelectTrigger className="w-48 border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light bg-transparent">
                      <SelectValue placeholder="Dauer wählen" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border border-gray-200 shadow-none">
                      <SelectItem className="rounded-none" value="1">1 Woche</SelectItem>
                      <SelectItem className="rounded-none" value="2">2 Wochen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-xs text-gray-500 uppercase tracking-widest">Preis</span>
                <span className="text-3xl font-semibold text-gray-900">{formatEUR(weekDuration === '1' ? PRICES.weekAddon[1] : PRICES.weekAddon[2])}</span>
                <div className="text-[11px] uppercase tracking-widest text-gray-500">gesamt</div>
              </div>
            </div>
            <ul className="list-disc ml-5 text-sm text-gray-700 space-y-2">
              <li>Hervorgehobenes Badge auf deinem Profil</li>
              <li>Priorisierte Platzierung in Listen</li>
              <li>Zusätzliche Impressionen pro Woche</li>
            </ul>
            <div className="mt-6">
              <Button onClick={() => setSelectedChoice({ category: 'week', name: `Escort of the Week`, price: weekDuration === '1' ? PRICES.weekAddon[1] : PRICES.weekAddon[2], duration: parseInt(weekDuration) })} className="bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-3 text-sm uppercase rounded-none">Add-on auswählen</Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'month',
      label: 'Escort of the Month',
      content: (
        <div>
          <p className="text-sm text-gray-600">Buche das Add-on "Escort of the Month" für maximale Sichtbarkeit über einen ganzen Monat.</p>
          <div className={`mt-6 border border-gray-200 p-6 ${selectedChoice?.category === 'month' ? 'border-pink-500 ring-1 ring-pink-300' : ''}`}>
            <div className="flex items-end justify-between gap-6 flex-wrap mb-8">
              <div>
                <span className="text-xs font-light tracking-widest text-gray-800 uppercase">DAUER</span>
                <div className="mt-2">
                  <Select value={monthDuration} onValueChange={(v) => setMonthDuration(v as '1' | '2')}>
                    <SelectTrigger className="w-48 border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light bg-transparent">
                      <SelectValue placeholder="Dauer wählen" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border border-gray-200 shadow-none">
                      <SelectItem className="rounded-none" value="1">1 Monat</SelectItem>
                      <SelectItem className="rounded-none" value="2">2 Monate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-xs text-gray-500 uppercase tracking-widest">Preis</span>
                <span className="text-3xl font-semibold text-gray-900">{formatEUR(monthDuration === '1' ? PRICES.monthAddon[1] : PRICES.monthAddon[2])}</span>
                <div className="text-[11px] uppercase tracking-widest text-gray-500">gesamt</div>
              </div>
            </div>
            <ul className="list-disc ml-5 text-sm text-gray-700 space-y-2">
              <li>Top-Placement für 30 Tage</li>
              <li>Exklusives Badge und besondere Hervorhebung</li>
              <li>Deutlich erhöhte Reichweite</li>
            </ul>
            <div className="mt-6">
              <Button onClick={() => setSelectedChoice({ category: 'month', name: `Escort of the Month`, price: monthDuration === '1' ? PRICES.monthAddon[1] : PRICES.monthAddon[2], duration: parseInt(monthDuration) })} className="bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-3 text-sm uppercase rounded-none">Add-on auswählen</Button>
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <>
      <DashboardHeader session={session} activeTab="membership" setActiveTab={() => {}} />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl font-light tracking-widest text-gray-900">MITGLIEDSCHAFT</h1>
            <div className="w-24 h-px bg-pink-500 mt-3" />
          </div>
          <Link href="/bookings" className="inline-block w-full sm:w-auto">
            <Button className="w-full sm:w-auto max-w-full whitespace-normal break-words bg-transparent text-gray-700 border border-gray-300 hover:bg-pink-50/40 rounded-none px-3 sm:px-4 py-2 h-auto text-[11px] sm:text-xs uppercase tracking-wide sm:tracking-widest leading-4">MEINE BUCHUNGEN</Button>
          </Link>
        </div>
        <p className="text-sm text-gray-600 mt-4">Mitgliedschaft abschließen und Zusätze buchen – alles an einem Ort.</p>

        <div className="mt-8">
          <Tabs tabs={tabs} initialId="mitgliedschaft" />
        </div>
        {selectedChoice && (
          <div className="mt-8 border border-gray-200 p-6 bg-pink-50/40">
            <h2 className="text-sm font-light tracking-widest text-gray-800 uppercase">Auswahl</h2>
            <p className="mt-2 text-sm text-gray-700">
              {selectedChoice.category === 'membership' ? 'Mitgliedschaft' : 'Add-on'}: <span className="font-medium">{selectedChoice.name}</span>
              {selectedChoice.duration ? ` • Dauer: ${selectedChoice.duration} ${
                selectedChoice.category === 'day'
                  ? (selectedChoice.duration === 1 ? 'Tag' : 'Tage')
                  : selectedChoice.category === 'week'
                    ? (selectedChoice.duration === 1 ? 'Woche' : 'Wochen')
                    : selectedChoice.category === 'month'
                      ? (selectedChoice.duration === 1 ? 'Monat' : 'Monate')
                      : 'Tage'
              }` : ''}
              {` • Preis: ${formatEUR(selectedChoice.price)}`}
            </p>
            <p className="mt-2 text-xs text-gray-500">Hinweis: Aktuell ist kein Zahlungsdienst angebunden. Deine Buchung wird in deinem Konto gespeichert.</p>
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={handleBook} disabled={bookingLoading} className="bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-light tracking-widest py-2 px-4 text-xs uppercase rounded-none">
                {bookingLoading ? 'Speichere…' : (selectedChoice.category === 'membership' ? 'Mitgliedschaft buchen' : 'Add-on buchen')}
              </Button>
              <Button onClick={() => setSelectedChoice(null)} className="bg-transparent text-gray-700 border border-gray-300 hover:bg-pink-50/40 rounded-none px-4 py-2 h-auto text-xs uppercase tracking-widest">
                Auswahl zurücksetzen
              </Button>
            </div>
            {bookingState.type !== 'idle' && (
              <p className={bookingState.type === 'success' ? 'mt-2 text-xs text-pink-600' : 'mt-2 text-xs text-red-600'} aria-live="polite">
                {bookingState.message}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  )
}

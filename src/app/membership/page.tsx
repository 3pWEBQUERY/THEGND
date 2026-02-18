'use client'

import DashboardHeader from '@/components/DashboardHeader'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import Tabs from '@/components/Tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { UserType } from '@prisma/client'

type DbPlan = {
  id: string
  key: 'BASIS' | 'PLUS' | 'PREMIUM'
  name: string
  description: string | null
  priceCents: number
  features: string | null
  userType: string | null
  sortOrder?: number
}

export default function MembershipPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const userType = ((session?.user as any)?.userType as UserType) ?? 'MEMBER'

  // Auth guard
  useEffect(() => {
    if (status === 'unauthenticated') {
      const cb = encodeURIComponent('/membership')
      router.replace(`/auth/signin?callbackUrl=${cb}`)
    }
  }, [status, router])

  // ── Plan data from DB ──────────────────────────────────────
  const [dbPlans, setDbPlans] = useState<DbPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)

  useEffect(() => {
    if (status !== 'authenticated') return
    setPlansLoading(true)
    fetch(`/api/memberships?userType=${userType}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setDbPlans(Array.isArray(data) ? data : []))
      .catch(() => setDbPlans([]))
      .finally(() => setPlansLoading(false))
  }, [status, userType])

  // Sort plans by sortOrder / key
  const sortedPlans = useMemo(() => {
    const keyOrder: Record<string, number> = { BASIS: 0, PLUS: 1, PREMIUM: 2 }
    return [...dbPlans].sort((a, b) => (a.sortOrder ?? keyOrder[a.key] ?? 0) - (b.sortOrder ?? keyOrder[b.key] ?? 0))
  }, [dbPlans])

  // Determine which plan is recommended (PLUS if exists)
  const recommendedKey = useMemo(() => {
    if (sortedPlans.some((p) => p.key === 'PLUS')) return 'PLUS'
    return null
  }, [sortedPlans])

  // ── Selection state ────────────────────────────────────────
  type Choice = { category: 'membership' | 'day' | 'week' | 'month' | 'city'; name: string; price: number; duration?: number; planId?: string }
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null)
  const [weekDuration, setWeekDuration] = useState<'1' | '2'>('1')
  const [monthDuration, setMonthDuration] = useState<'1' | '2'>('1')
  const [dayDuration, setDayDuration] = useState<'1' | '3' | '7'>('1')
  const [cityDuration, setCityDuration] = useState<'7' | '14' | '30'>('7')
  const [bookingState, setBookingState] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({ type: 'idle' })
  const [bookingLoading, setBookingLoading] = useState(false)

  const PRICES = {
    dayAddon: { 1: 9.99, 3: 19.99, 7: 29.99 },
    weekAddon: { 1: 29.99, 2: 49.99 },
    monthAddon: { 1: 79.99, 2: 139.99 },
    cityBoost: { 7: 24.99, 14: 39.99, 30: 59.99 },
  } as const

  const formatEUR = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
  const centsToEur = (c: number) => c / 100

  // Persist selection locally
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

  // Parse features from JSON string
  const parseFeatures = (f: string | null): string[] => {
    if (!f) return []
    try {
      const arr = JSON.parse(f)
      return Array.isArray(arr) ? arr : []
    } catch {
      return []
    }
  }

  // ── Account type display name ──────────────────────────────
  const userTypeLabel: Record<string, string> = {
    MEMBER: 'Mitglieder',
    ESCORT: 'Escorts',
    HOBBYHURE: 'Hobbyhuren',
    AGENCY: 'Agenturen',
    CLUB: 'Clubs',
    STUDIO: 'Studios',
  }

  // Show add-on tabs only for ESCORT / HOBBYHURE
  const showAddons = userType === 'ESCORT' || userType === 'HOBBYHURE'

  // ── Tabs definition ────────────────────────────────────────
  const tabs = [
    {
      id: 'mitgliedschaft',
      label: 'Mitgliedschaft',
      content: (
        <div>
          <p className="text-sm text-gray-600">
            Mitgliedschafts-Pläne für <span className="font-medium text-pink-600">{userTypeLabel[userType] ?? userType}</span>. Profitiere von höherer Sichtbarkeit, mehr Profil-Features und exklusiven Vorteilen.
          </p>

          {plansLoading ? (
            <div className="flex justify-center py-16 text-gray-400 text-sm tracking-widest">Lade Pläne…</div>
          ) : sortedPlans.length === 0 ? (
            <div className="flex justify-center py-16 text-gray-400 text-sm tracking-widest">Keine Pläne verfügbar.</div>
          ) : (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {sortedPlans.map((plan) => {
                const features = parseFeatures(plan.features)
                const isSelected = selectedChoice?.category === 'membership' && selectedChoice?.name === plan.key
                const isRecommended = plan.key === recommendedKey

                return (
                  <div
                    key={plan.id}
                    className={`border border-gray-200 p-6 hover:border-pink-300 transition-colors ${isSelected ? 'border-pink-500 ring-1 ring-pink-300' : ''}`}
                  >
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">{plan.key}</h3>
                      <div className="text-right">
                        <div className="text-4xl font-semibold text-gray-900">{formatEUR(centsToEur(plan.priceCents))}</div>
                        <div className="text-[11px] uppercase tracking-widest text-gray-500">pro Monat</div>
                      </div>
                    </div>
                    {isRecommended && (
                      <span className="mt-2 inline-block px-2 py-1 text-[10px] uppercase tracking-widest border border-pink-300 text-pink-600">Empfohlen</span>
                    )}
                    {plan.description && (
                      <p className="mt-3 text-sm text-gray-600">{plan.description}</p>
                    )}
                    {features.length > 0 && (
                      <ul className="mt-4 text-sm text-gray-700 space-y-2 list-disc ml-5">
                        {features.map((f, idx) => (
                          <li key={idx}>{f}</li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-6">
                      <Button
                        onClick={() => setSelectedChoice({ category: 'membership', name: plan.key, price: centsToEur(plan.priceCents), planId: plan.id })}
                        className="bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-3 text-sm uppercase rounded-none w-full"
                      >
                        Paket auswählen
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ),
    },
    ...(showAddons
      ? [
          {
            id: 'day',
            label: 'Escort of the Day',
            content: (
              <div>
                <p className="text-sm text-gray-600">Buche das Add-on &quot;Escort of the Day&quot; für schnelle, tagesbasierte Sichtbarkeit.</p>
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
                <p className="text-sm text-gray-600">Buche das Add-on &quot;Escort of the Week&quot; für eine Woche Top-Sichtbarkeit auf der Startseite und in den Suchergebnissen.</p>
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
                    <Button onClick={() => setSelectedChoice({ category: 'week', name: 'Escort of the Week', price: weekDuration === '1' ? PRICES.weekAddon[1] : PRICES.weekAddon[2], duration: parseInt(weekDuration) })} className="bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-3 text-sm uppercase rounded-none">Add-on auswählen</Button>
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
                <p className="text-sm text-gray-600">Buche das Add-on &quot;Escort of the Month&quot; für maximale Sichtbarkeit über einen ganzen Monat.</p>
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
                    <Button onClick={() => setSelectedChoice({ category: 'month', name: 'Escort of the Month', price: monthDuration === '1' ? PRICES.monthAddon[1] : PRICES.monthAddon[2], duration: parseInt(monthDuration) })} className="bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-3 text-sm uppercase rounded-none">Add-on auswählen</Button>
                  </div>
                </div>
              </div>
            ),
          },
        ]
      : []),
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
        <p className="text-sm text-gray-600 mt-4">
          Mitgliedschaft abschließen und Zusätze buchen – alles an einem Ort.
          {showAddons && ' Add-on-Pakete sind speziell für Escort-Profile verfügbar.'}
        </p>

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

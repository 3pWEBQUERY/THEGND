'use client'

import DashboardHeader from '@/components/DashboardHeader'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Tabs from '@/components/Tabs'
import { Trash2 } from 'lucide-react'

export default function MarketingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  type PlacementKey = 'home_top' | 'home_mid' | 'home_bottom' | 'home_banner' | 'home_tile' | 'results_top' | 'sponsored_post'
  type Duration = 7 | 14 | 30

  // Auth guard: redirect unauthenticated users to sign-in
  // MEMBER users cannot access the marketing page
  useEffect(() => {
    if (status === 'unauthenticated') {
      const cb = encodeURIComponent('/marketing')
      router.replace(`/auth/signin?callbackUrl=${cb}`)
    }
    if (status === 'authenticated' && (session?.user as any)?.userType === 'MEMBER') {
      router.replace('/dashboard')
    }
  }, [status, session, router])

  const PRICES: Record<PlacementKey, Record<Duration, number>> = {
    home_top: { 7: 119.99, 14: 199.99, 30: 349.99 },
    home_mid: { 7: 99.99, 14: 169.99, 30: 299.99 },
    home_bottom: { 7: 79.99, 14: 139.99, 30: 249.99 },
    home_banner: { 7: 149.99, 14: 259.99, 30: 449.99 },
    home_tile: { 7: 89.99, 14: 149.99, 30: 259.99 },
    results_top: { 7: 119.99, 14: 199.99, 30: 349.99 },
    sponsored_post: { 7: 99.99, 14: 169.99, 30: 299.99 },
  }

  const formatCHF = (n: number) => n.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })

  // cart holds selected packages: one entry per placement (can be extended to allow multiples per placement if needed)
  const [cart, setCart] = useState<Partial<Record<PlacementKey, Duration>>>({})
  // draftDuration lets the user choose a duration before adding to the cart
  const [draftDuration, setDraftDuration] = useState<Partial<Record<PlacementKey, Duration>>>({})

  const [bookingState, setBookingState] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({ type: 'idle' })
  const [loading, setLoading] = useState(false)
  // Optional Ziel-URL pro Placement (relevant: home_banner, sidebar (Navigation‑Banner), sponsored_post)
  const [targetUrls, setTargetUrls] = useState<Partial<Record<PlacementKey, string>>>({})

  const durationLabel = useMemo(() => (d: Duration) => {
    if (d === 30) return '1 Monat'
    if (d === 14) return '2 Wochen'
    return '1 Woche'
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('marketingCart')
      if (raw) setCart(JSON.parse(raw))
    } catch {}
  }, [])

  // Load saved target URLs
  useEffect(() => {
    try {
      const raw = localStorage.getItem('marketingTargetUrl')
      if (raw) {
        const obj = JSON.parse(raw)
        if (!obj?.home_banner) obj.home_banner = 'https://'
        if (!obj?.sponsored_post) obj.sponsored_post = 'https://'
        setTargetUrls(obj)
      } else {
        // default prefill for home_banner & sponsored_post
        setTargetUrls((s) => ({
          ...s,
          home_banner: s.home_banner ?? 'https://',
          sponsored_post: s.sponsored_post ?? 'https://',
        }))
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      if (cart && Object.keys(cart).length > 0) localStorage.setItem('marketingCart', JSON.stringify(cart))
      else localStorage.removeItem('marketingCart')
    } catch {}
  }, [cart])

  // Persist target URLs
  useEffect(() => {
    try {
      if (targetUrls && Object.keys(targetUrls).length > 0) localStorage.setItem('marketingTargetUrl', JSON.stringify(targetUrls))
      else localStorage.removeItem('marketingTargetUrl')
    } catch {}
  }, [targetUrls])

  const handleBook = async () => {
    const cartItems = Object.entries(cart) as [PlacementKey, Duration][]
    if (cartItems.length === 0) return
    router.push('/marketing/upload')
  }

  const placementCards: Array<{
    key: PlacementKey
    title: string
    dims: string
    desc: string
    defaultDuration: Duration
  }> = [
    {
      key: 'home_top',
      title: 'Startseite – Anzeige Top',
      dims: 'Empfehlung: 1200×300px',
      desc: 'Banner im oberen Bereich der Startseite – gleich nach dem Hero sichtbar.',
      defaultDuration: 14,
    },
    {
      key: 'home_mid',
      title: 'Startseite – Anzeige Mitte',
      dims: 'Empfehlung: 1200×300px',
      desc: 'Banner in der Mitte der Startseite – im Scrollverlauf platziert.',
      defaultDuration: 14,
    },
    {
      key: 'home_bottom',
      title: 'Startseite – Anzeige Bottom',
      dims: 'Empfehlung: 1200×300px',
      desc: 'Banner am Ende der Startseite – Abschluss mit klarer Botschaft.',
      defaultDuration: 14,
    },
    {
      key: 'home_banner',
      title: 'Startseite – Storie Banner',
      dims: 'Empfehlung: 1080×1920px',
      desc: 'Storie Banner auf der Startseite – maximale Aufmerksamkeit direkt beim Einstieg.',
      defaultDuration: 14,
    },
    {
      key: 'home_tile',
      title: 'Startseite – Featured Tile',
      dims: 'Empfehlung: 800×800px',
      desc: 'Hervorgehobene Kachel im Grid der Startseite – attraktiv im Flow platziert.',
      defaultDuration: 14,
    },
    {
      key: 'results_top',
      title: 'Suche – Top Banner',
      dims: 'Empfehlung: 1200×300px',
      desc: 'Banner oberhalb der Suchergebnisse – sichtbar für Nutzer:innen mit konkreter Absicht.',
      defaultDuration: 14,
    },
    {
      key: 'sponsored_post',
      title: 'Feed – Sponsored Post',
      dims: 'Empfehlung: Titel + Bild 1200×800px',
      desc: 'Native Einbettung in den Newsfeed – wirkt wie redaktioneller Inhalt, klar gekennzeichnet.',
      defaultDuration: 7,
    },
  ]

  const tabs = [
    {
      id: 'placements',
      label: 'Placements',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {placementCards.map((p) => {
            const chosen: Duration = (draftDuration[p.key] ?? cart[p.key] ?? p.defaultDuration) as Duration
            const price = PRICES[p.key][chosen]
            const inCart = typeof cart[p.key] !== 'undefined'
            return (
              <div key={p.key} className={`relative flex flex-col border border-gray-200 p-6 pb-0 hover:border-pink-300 transition-colors bg-white shadow-sm hover:shadow-md ${inCart ? 'border-pink-500 ring-1 ring-pink-300' : ''}`}>
                {/* Ribbon */}
                <div className="pointer-events-none absolute top-0 right-0 w-28 h-28 overflow-hidden">
                  <div className="absolute -right-9 top-4 rotate-45 bg-pink-600 text-white text-[10px] tracking-widest uppercase px-10 py-1 shadow">
                    {durationLabel(chosen)}
                  </div>
                </div>

                {/* Header */}
                <div className="h-40 md:h-44 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium tracking-widest text-pink-600 uppercase">{p.title}</h3>
                    <div className="text-xs text-gray-600 mt-1 uppercase tracking-widest">{durationLabel(chosen)}</div>
                    <div className="text-sm text-gray-900 font-light tracking-widest mt-1 max-h-10 md:max-h-12 overflow-hidden">{p.desc}</div>
                    <div className="text-[11px] uppercase tracking-widest text-gray-500 mt-1">{p.dims}</div>
                  </div>
                </div>

                {/* Mock preview (desktop style only) */}
                <div className="mt-4 border border-gray-200 bg-gray-50 h-56 md:h-60 overflow-hidden">
                  <div className="h-2 bg-black" />
                  <div className="p-3 h-[calc(100%-0.5rem)]">
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-2 space-y-1">
                        <div className="h-4 bg-gray-200" />
                        <div className={`h-20 bg-gray-200`} />
                        <div className="h-4 bg-gray-200" />
                        <div className="h-4 bg-gray-200" />
                      </div>
                      <div className="col-span-8">
                        <div className={`h-16 ${p.key === 'results_top' ? 'bg-pink-400' : 'bg-gray-200'}`} />
                        {p.key === 'home_banner' ? (
                          <div className="mt-2 grid grid-cols-3 gap-2 items-start">
                            <div className="space-y-2">
                              <div className="bg-gray-200 h-12" />
                              <div className="bg-gray-200 h-12" />
                            </div>
                            <div className="bg-pink-400 h-40" />
                            <div className="space-y-2">
                              <div className="bg-gray-200 h-12" />
                              <div className="bg-gray-200 h-12" />
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            <div className="bg-gray-200 h-16" />
                            <div className={`${p.key === 'home_tile' || p.key === 'sponsored_post' ? 'bg-pink-400' : 'bg-gray-200'} h-16`} />
                            <div className="bg-gray-200 h-16" />
                          </div>
                        )}
                      </div>
                      <div className="col-span-2 space-y-1">
                        <div className={`h-24 bg-gray-200`} />
                        <div className="h-8 bg-gray-200" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="mt-6 flex items-end justify-between gap-6 flex-wrap">
                  <div className="flex-1 min-w-52">
                    {(p.key === 'home_banner' || p.key === 'home_top' || p.key === 'home_mid' || p.key === 'home_bottom' || p.key === 'sponsored_post') && (
                      <div className="mb-4">
                        <span className="text-xs font-light tracking-widest text-gray-800 uppercase">Ziel-URL</span>
                        <input
                          type="url"
                          placeholder="https://deine-zielseite.tld/"
                          value={(targetUrls[p.key] ?? 'https://') as string}
                          onChange={(e) => setTargetUrls((s) => ({ ...s, [p.key]: e.target.value }))}
                          className="mt-2 w-full border-0 border-b-2 border-gray-200 rounded-none px-0 py-2 text-sm font-light bg-transparent focus:outline-none focus:ring-0 focus:border-pink-500"
                        />
                        <p className="mt-1 text-[11px] text-gray-500">Wird beim ausgewählten Placement verlinkt (z. B. Story‑Banner, Sponsored Post). Kann später unter „Meine Buchungen“ angepasst werden.</p>
                      </div>
                    )}
                    <span className="text-xs font-light tracking-widest text-gray-800 uppercase">DAUER</span>
                    <div className="mt-2">
                      <Select
                        value={String(chosen) as '7' | '14' | '30'}
                        onValueChange={(v) => setDraftDuration((s) => ({ ...s, [p.key]: parseInt(v, 10) as Duration }))}
                      >
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
                    <Button onClick={() => setCart((s) => ({ ...s, [p.key]: chosen }))} className="bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest px-4 py-3 text-xs uppercase rounded-none">
                      IN DEN WARENKORB LEGEN
                    </Button>
                  </div>
                </div>

                {/* Bottom price strip */}
                <div className="mt-6 -mx-6 bg-gray-100 px-6 py-3 text-right">
                  <span className="text-base font-semibold text-gray-900">{formatCHF(price)}</span>
                </div>
              </div>
            )
          })}
        </div>
      ),
    },
    {
      id: 'guidelines',
      label: 'Richtlinien',
      content: (
        <div className="prose prose-sm max-w-none">
          <p className="text-sm text-gray-600">Bitte beachte unsere Design- und Inhaltsrichtlinien für Werbemittel:</p>
          <ul className="mt-3 text-sm text-gray-700 list-disc ml-5 space-y-1">
            <li>Bildmaterial in hoher Qualität, keine pixeligen oder stark komprimierten Motive.</li>
            <li>Deutliche Kennzeichnung von Werbung – wir fügen einen "Sponsored"-Hinweis hinzu.</li>
            <li>Keine irreführenden Claims, Clickbait oder unerlaubte Inhalte.</li>
            <li>Dateiformate: JPG/PNG für Bilder, MP4 für Videos (Sponsored Post optional).</li>
            <li>Max. Dateigröße pro Asset: 5 MB.</li>
          </ul>
          <p className="mt-4 text-sm text-gray-600">Nach der Buchung erhältst du eine Upload-Möglichkeit für deine Motive. Unser Team prüft jedes Motiv vor der Freigabe.</p>
        </div>
      ),
    },
  ]

  return (
    <>
      <DashboardHeader session={session} activeTab="marketing" setActiveTab={() => {}} />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-light tracking-widest text-gray-900">MARKETING</h1>
            <div className="w-24 h-px bg-pink-500 mt-3" />
          </div>
          <Link href="/bookings" className="inline-block">
            <Button className="bg-transparent text-gray-700 border border-gray-300 hover:bg-pink-50/40 rounded-none px-4 py-2 h-auto text-xs uppercase tracking-widest">MEINE BUCHUNGEN</Button>
          </Link>
        </div>
        <p className="text-sm text-gray-600 mt-4">Buche prominente Werbeplätze auf THEGND – passend zu deinem Ziel: Startseite, Suche oder als Sponsored Post.</p>

        <div className="mt-8">
          <Tabs tabs={tabs} initialId="placements" />
        </div>

        {Object.keys(cart).length > 0 && (
          <div className="mt-8 border border-gray-200 p-6 bg-pink-50/40">
            <h2 className="text-sm font-light tracking-widest text-gray-800 uppercase">Auswahl</h2>
            <ul className="mt-3 space-y-2">
              {(Object.entries(cart) as [PlacementKey, Duration][])?.map(([key, duration]) => {
                const p = placementCards.find((x) => x.key === key)
                const price = PRICES[key][duration]
                if (!p) return null
                return (
                  <li key={key} className="flex items-center justify-between gap-4 bg-white border border-gray-200 px-3 py-2">
                    <div>
                      <div className="text-sm text-gray-800">
                        <span className="uppercase tracking-widest text-gray-900">{p.title}</span>
                      </div>
                      <div className="text-xs text-gray-600">{durationLabel(duration)} • {p.dims}</div>
                      {(key === 'home_banner' || key === 'sponsored_post') && (targetUrls[key]?.trim()) && (
                        <div className="text-[11px] text-gray-500 mt-1">Ziel-URL: {targetUrls[key]}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">{formatCHF(price)}</span>
                      <button
                        onClick={() => setCart((s) => { const n = { ...s }; delete (n as any)[key]; return n })}
                        className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-none"
                        aria-label="Entfernen"
                        title="Entfernen"
                      >
                        <Trash2 size={16} strokeWidth={1.5} />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-700">
                Gesamt:
                <span className="ml-2 font-semibold text-gray-900">
                  {formatCHF((Object.entries(cart) as [PlacementKey, Duration][])?.reduce((sum, [k, d]) => sum + PRICES[k][d], 0))}
                </span>
              </div>
              <div className="flex items-center gap-3 sm:justify-end">
                <Button onClick={() => setCart({})} className="bg-transparent text-gray-700 border border-gray-300 hover:bg-pink-50/40 rounded-none px-4 py-2 h-auto text-xs uppercase tracking-widest">
                  Auswahl zurücksetzen
                </Button>
                <Button onClick={handleBook} disabled={loading || Object.keys(cart).length === 0} className="bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-light tracking-widest py-2 px-4 text-xs uppercase rounded-none">
                  {loading ? 'Speichere…' : 'Werbung buchen'}
                </Button>
              </div>
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

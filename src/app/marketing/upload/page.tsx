'use client'

import DashboardHeader from '@/components/DashboardHeader'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useUploadThing } from '@/utils/uploadthing'
import { useRouter } from 'next/navigation'

// Reuse the same keys as on the marketing selection page
 type PlacementKey = 'home_top' | 'home_mid' | 'home_bottom' | 'home_banner' | 'home_tile' | 'results_top' | 'sidebar' | 'sponsored_post'
 type Duration = 7 | 14 | 30

const PLACEMENTS: Array<{
  key: PlacementKey
  title: string
  dims: string
  desc: string
}> = [
  { key: 'home_top', title: 'Startseite – Anzeige Top', dims: 'Empfehlung: 1200×300px', desc: 'Banner im oberen Bereich der Startseite.' },
  { key: 'home_mid', title: 'Startseite – Anzeige Mitte', dims: 'Empfehlung: 1200×300px', desc: 'Banner in der Mitte der Startseite.' },
  { key: 'home_bottom', title: 'Startseite – Anzeige Bottom', dims: 'Empfehlung: 1200×300px', desc: 'Banner am Ende der Startseite.' },
  { key: 'home_banner', title: 'Startseite – Storie Banner', dims: 'Empfehlung: 1080×1920px', desc: 'Vertikales Storie‑Banner.' },
  { key: 'home_tile', title: 'Startseite – Featured Tile', dims: 'Empfehlung: 800×800px', desc: 'Quadratische Kachel im Startseiten‑Grid.' },
  { key: 'results_top', title: 'Suche – Top Banner', dims: 'Empfehlung: 1200×300px', desc: 'Breites Banner über den Suchergebnissen.' },
  { key: 'sidebar', title: 'Navigation – Menü Banner', dims: 'Empfehlung: 1200×2000px (Hochformat)', desc: 'Großer Banner im Navigations‑Mega‑Menü.' },
  { key: 'sponsored_post', title: 'Feed – Sponsored Post', dims: 'Empfehlung: Titel + Bild 1200×800px', desc: 'Native Einbettung in den Newsfeed.' },
]

export default function MarketingUploadPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Auth guard: redirect unauthenticated users to sign-in
  useEffect(() => {
    if (status === 'unauthenticated') {
      const cb = encodeURIComponent('/marketing/upload')
      router.replace(`/auth/signin?callbackUrl=${cb}`)
    }
  }, [status, router])

  const [cart, setCart] = useState<Partial<Record<PlacementKey, Duration>>>({})
  const [uploads, setUploads] = useState<Partial<Record<PlacementKey, string[]>>>({})
  const [busyKey, setBusyKey] = useState<PlacementKey | null>(null)
  const { startUpload, isUploading } = useUploadThing('adAssets')
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'idle' | 'success' | 'error'; text?: string }>({ type: 'idle' })
  // Ziel-URLs pro Placement (relevant: home_banner, sidebar (Navigation‑Banner), sponsored_post)
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
        if (!obj?.sidebar) obj.sidebar = 'https://'
        if (!obj?.sponsored_post) obj.sponsored_post = 'https://'
        setTargetUrls(obj)
      } else {
        setTargetUrls((s) => ({
          ...s,
          home_banner: s.home_banner ?? 'https://',
          sidebar: s.sidebar ?? 'https://',
          sponsored_post: s.sponsored_post ?? 'https://',
        }))
      }
    } catch {}
  }, [])

  // Persist target URLs
  useEffect(() => {
    try {
      if (targetUrls && Object.keys(targetUrls).length > 0) localStorage.setItem('marketingTargetUrl', JSON.stringify(targetUrls))
    } catch {}
  }, [targetUrls])

  const placementFor = (key: PlacementKey) => PLACEMENTS.find((p) => p.key === key)

  const handleUpload = async (key: PlacementKey, files: FileList | null) => {
    if (!files || files.length === 0) return
    setBusyKey(key)
    try {
      const res = await startUpload(Array.from(files))
      const urls = (res || []).map((r: any) => r?.ufsUrl || r?.url).filter(Boolean) as string[]
      if (urls.length) {
        setUploads((s) => ({ ...s, [key]: [...(s[key] || []), ...urls] }))
      }
    } finally {
      setBusyKey(null)
    }
  }

  const handleRemove = (key: PlacementKey, url: string) => {
    setUploads((s) => ({ ...s, [key]: (s[key] || []).filter((u) => u !== url) }))
  }

  const hasCart = Object.keys(cart).length > 0

  const handleSubmit = async () => {
    if (!hasCart) return
    if (status !== 'authenticated') {
      const cb = encodeURIComponent('/marketing/upload')
      router.replace(`/auth/signin?callbackUrl=${cb}`)
      return
    }
    setSubmitting(true)
    setSubmitMessage({ type: 'idle' })
    try {
      const items = (Object.entries(cart) as [PlacementKey, Duration][])?.map(([key, duration]) => ({
        key,
        duration,
        assets: uploads[key] || [],
        // Include optional targetUrl (home_banner, sponsored_post)
        targetUrl: targetUrls[key],
      }))
      const res = await fetch('/api/marketing/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items }),
      })
      let data: any = {}
      try { data = await res.json() } catch {}
      if (!res.ok) {
        const msg = data?.error || `Buchung fehlgeschlagen (${res.status})`
        throw new Error(msg)
      }
      setSubmitMessage({ type: 'success', text: 'Buchung gespeichert.' })
      // Clean up cart after successful submit
      localStorage.removeItem('marketingCart')
      setCart({})
      if (data?.orderId) {
        try { localStorage.setItem('lastMarketingOrderId', String(data.orderId)) } catch {}
        setTimeout(() => router.push(`/marketing/confirmation?orderId=${encodeURIComponent(String(data.orderId))}`), 400)
      } else {
        setTimeout(() => router.push('/bookings'), 500)
      }
    } catch (e: any) {
      setSubmitMessage({ type: 'error', text: e?.message || 'Konnte Buchung nicht speichern.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <DashboardHeader session={session} activeTab="marketing" setActiveTab={() => {}} />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-light tracking-widest text-gray-900">MARKETING · UPLOADS</h1>
            <div className="w-24 h-px bg-pink-500 mt-3" />
          </div>
          <Link href="/marketing" className="inline-block">
            <Button className="bg-transparent text-gray-700 border border-gray-300 hover:bg-pink-50/40 rounded-none px-4 py-2 h-auto text-xs uppercase tracking-widest">Zurück</Button>
          </Link>
        </div>

        {!hasCart && (
          <div className="mt-8 border border-gray-200 p-6 bg-pink-50/40">
            <p className="text-sm text-gray-700">Keine Auswahl vorhanden. Bitte wähle zuerst Pakete auf der <Link href="/marketing" className="text-pink-600 hover:underline">Marketing‑Seite</Link> aus.</p>
          </div>
        )}

        {hasCart && (
          <div className="mt-8 space-y-8">
            {(Object.entries(cart) as [PlacementKey, Duration][])?.map(([key, duration]) => {
              const p = placementFor(key)
              if (!p) return null
              const files = uploads[key] || []
              return (
                <div key={key} className="border border-gray-200 bg-white shadow-sm">
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-6 flex-wrap">
                      <div>
                        <h2 className="text-lg font-medium tracking-widest text-pink-600 uppercase">{p.title}</h2>
                        <div className="text-xs text-gray-600 mt-1 uppercase tracking-widest">{durationLabel(duration)}</div>
                        <p className="mt-2 text-sm text-gray-700">{p.desc}</p>
                        <div className="mt-1 text-[11px] uppercase tracking-widest text-gray-500">{p.dims}</div>
                      </div>
                      <div className="text-right">
                        <label className="inline-block">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handleUpload(key, e.target.files)}
                          />
                          <span className={`cursor-pointer inline-block bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest px-4 py-3 text-xs uppercase rounded-none ${busyKey === key || isUploading ? 'opacity-60 pointer-events-none' : ''}`}>
                            Dateien hochladen
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Ziel-URL Eingabe für relevante Placements */}
                    {(key === 'home_banner' || key === 'home_top' || key === 'home_mid' || key === 'home_bottom' || key === 'sidebar' || key === 'sponsored_post') && (
                      <div className="mt-4 border border-gray-200 p-4">
                        <label className="block text-[11px] text-gray-600 uppercase tracking-widest">Ziel-URL</label>
                        <input
                          type="url"
                          placeholder="https://deine-zielseite.tld/"
                          value={(targetUrls[key] ?? 'https://') as string}
                          onChange={(e) => setTargetUrls((s) => ({ ...s, [key]: e.target.value }))}
                          className="mt-2 w-full border border-gray-200 px-3 py-2 focus:outline-none focus:ring-0 focus:border-pink-500"
                        />
                        <p className="mt-1 text-[11px] text-gray-500">Wird bei diesem Placement verlinkt. Kann später unter „Meine Buchungen“ angepasst werden.</p>
                      </div>
                    )}

                    {files.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {files.map((url) => (
                          <div key={url} className="relative group border border-gray-200 bg-gray-50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="Ad Asset" className="w-full h-32 object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemove(key, url)}
                              className="absolute top-1 right-1 text-[10px] uppercase tracking-widest bg-white/90 border border-gray-300 px-2 py-0.5 hidden group-hover:block"
                            >
                              Entfernen
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {files.length === 0 && (
                      <p className="mt-4 text-sm text-gray-500">Noch keine Dateien hochgeladen.</p>
                    )}
                  </div>
                </div>
              )
            })}

            <div className="flex items-center justify-end gap-3">
              <Link href="/marketing" className="inline-block">
                <Button className="bg-transparent text-gray-700 border border-gray-300 hover:bg-pink-50/40 rounded-none px-4 py-2 h-auto text-xs uppercase tracking-widest">Zur Auswahl</Button>
              </Link>
              <Button onClick={handleSubmit} disabled={submitting} className="bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-light tracking-widest py-2 px-4 text-xs uppercase rounded-none">{submitting ? 'Sende…' : 'Buchung abschließen'}</Button>
            </div>
            {submitMessage.type !== 'idle' && (
              <p className={submitMessage.type === 'success' ? 'mt-2 text-xs text-pink-600 text-right' : 'mt-2 text-xs text-red-600 text-right'}>{submitMessage.text}</p>
            )}
          </div>
        )}
      </div>
    </>
  )
}

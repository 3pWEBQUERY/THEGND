'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardHeader from '@/components/DashboardHeader'
import Footer from '@/components/homepage/Footer'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export const dynamic = 'force-dynamic'

type AddonState = {
  key: string
  enabled: boolean
  settings?: string | null
}

type PersistPayload = {
  key: 'SEO'
  enabled: boolean
  settings?: {
    metaTitle?: string
    metaDescription?: string
    targetCity?: string
    targetKeywords?: string[]
  } | null
}

type OutlineItem = { level: 'h2' | 'h3'; text: string }

export default function SEOAddonPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [enabled, setEnabled] = useState<boolean>(true)
  const [available, setAvailable] = useState<boolean>(true)
  const [profileText, setProfileText] = useState<string>('')
  const [profileDescription, setProfileDescription] = useState<string>('')
  const [profileMedia, setProfileMedia] = useState<any[]>([])
  const [userType, setUserType] = useState<string>('MEMBER')
  const [city, setCity] = useState<string>('')
  const [keywords, setKeywords] = useState<string>('')
  const [lang, setLang] = useState<'de' | 'en'>('de')

  const [suggesting, setSuggesting] = useState(false)
  const [suggestedTitle, setSuggestedTitle] = useState<string>('')
  const [suggestedDescription, setSuggestedDescription] = useState<string>('')
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([])
  const [outline, setOutline] = useState<OutlineItem[]>([])
  const [lsi, setLsi] = useState<string[]>([])
  const [serpLoading, setSerpLoading] = useState(false)
  const [serpResults, setSerpResults] = useState<Array<{ title: string; url: string; description: string }>>([])
  const [altSaving, setAltSaving] = useState(false)
  const [altSaved, setAltSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'INSIGHTS' | 'PROFIL'>('INSIGHTS')

  // Convert rich HTML (e.g., from onboarding step 3) to plain text for analysis textarea
  const htmlToPlainText = (html: string): string => {
    try {
      const src = (html || '')
        .replace(/<br\s*\/?>(\s*)/gi, '\n')
        .replace(/<\/(div|p)>\s*<\s*(div|p)[^>]*>/gi, '\n')
        .replace(/<\/?(div|p)[^>]*>/gi, '\n')
      const tmp = document.createElement('div')
      tmp.innerHTML = src
      const text = (tmp.textContent || tmp.innerText || '')
      return text
        .replace(/\u00a0/g, ' ')
        .replace(/\s*\n\s*/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    } catch {
      return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    }
  }

  // User type gating: only ESCORT, AGENCY, CLUB, STUDIO may access
  const sessionUserType = (session?.user as any)?.userType as string | undefined
  const allowedUserTypes = ['ESCORT','AGENCY','CLUB','STUDIO']
  const isAllowedUserType = allowedUserTypes.includes((sessionUserType || '').toString()) || allowedUserTypes.includes((userType || '').toString())

  // Auth guard
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin?callbackUrl=/addons/seo')
    }
  }, [status, router])

  // Redirect members (and other disallowed types) away from SEO tools
  useEffect(() => {
    if (status === 'authenticated') {
      const ut = (session?.user as any)?.userType as string | undefined
      if (ut && !allowedUserTypes.includes(ut)) {
        router.replace('/addons')
      }
    }
  }, [status, session?.user, router])

  // Load initial state and profile context
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        // Add-on state
        const res = await fetch('/api/addons/state', { cache: 'no-store' })
        if (!res.ok) throw new Error('failed')
        const data: AddonState[] = await res.json()
        const st = Array.isArray(data) ? data.find(s => s.key === 'SEO') : undefined
        if (st) {
          setEnabled(!!st.enabled)
          try {
            const parsed = st.settings ? JSON.parse(st.settings) : null
            if (parsed) {
              setSuggestedTitle(parsed.metaTitle || '')
              setSuggestedDescription(parsed.metaDescription || '')
              setCity(parsed.targetCity || '')
              setSuggestedKeywords(Array.isArray(parsed.targetKeywords) ? parsed.targetKeywords : [])
              setKeywords((Array.isArray(parsed.targetKeywords) ? parsed.targetKeywords : []).join(', '))
            }
          } catch {}
        }
        // Global availability
        const av = await fetch('/api/addons/available', { cache: 'no-store' })
        if (av.ok) {
          const j = await av.json()
          const keys = Array.isArray(j?.activeKeys) ? j.activeKeys : []
          setAvailable(keys.includes('SEO'))
        }
        // Profile data
        const p = await fetch('/api/profile', { cache: 'no-store' })
        if (p.ok) {
          const j = await p.json()
          const prof = j?.user?.profile || {}
          // Load from onboarding step 3 description only (plain text, no HTML wrappers)
          const onboardingDescription = (prof?.description || '').toString()
          setProfileText(htmlToPlainText(onboardingDescription))
          setProfileDescription(onboardingDescription)
          setProfileMedia(Array.isArray((prof as any)?.media) ? (prof as any).media : [])
          setUserType(j?.user?.userType || 'MEMBER')
          setCity((prof?.city || '').toString())
        }
      } catch {
        setError('Konnte Daten nicht laden')
      } finally {
        setLoading(false)
      }
    }
    if (session?.user?.id) load()
  }, [session?.user?.id])

  const requestSuggestions = async () => {
    try {
      setSuggesting(true)
      setError(null)
      const res = await fetch('/api/addons/seo/suggest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: profileText,
          city,
          userType,
          seedKeywords: keywords,
          lang,
        })
      })
      if (!res.ok) throw new Error('failed')
      const j = await res.json()
      setSuggestedTitle(j?.metaTitle || '')
      setSuggestedDescription(j?.metaDescription || '')
      setSuggestedKeywords(Array.isArray(j?.keywords) ? j.keywords : [])
      setOutline(Array.isArray(j?.outline) ? j.outline.filter((o: any) => o?.text && (o.level === 'h2' || o.level === 'h3')) : [])
      setLsi(Array.isArray(j?.lsi) ? j.lsi : [])
      if (!keywords) setKeywords((Array.isArray(j?.keywords) ? j.keywords : []).join(', '))
    } catch {
      setError('Vorschläge fehlgeschlagen')
    } finally {
      setSuggesting(false)
    }
  }

  // On-Page Checks
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const tokenize = (s: string) => (s || '').toLowerCase().replace(/[\n\r]+/g, ' ').split(/\s+/).filter(Boolean)
  const onPage = useMemo(() => {
    const words = tokenize(profileText)
    const wordCount = words.length
    const kwList = (keywords || '').split(',').map(s => s.trim()).filter(Boolean)
    const kwLower = kwList.map(k => k.toLowerCase())
    const countOccurrences = (txt: string, phrase: string) => {
      if (!phrase) return 0
      try {
        const re = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'gi')
        const matches = txt.match(re)
        return matches ? matches.length : 0
      } catch {
        return 0
      }
    }
    const profileLower = (profileText || '').toLowerCase()
    const titleLower = (suggestedTitle || '').toLowerCase()
    const descLower = (suggestedDescription || '').toLowerCase()
    const cityLower = (city || '').toLowerCase()

    const perKw = kwLower.map(k => ({
      kw: k,
      count: countOccurrences(profileLower, k),
      density: wordCount ? Math.round((countOccurrences(profileLower, k) / wordCount) * 1000) / 10 : 0, // %
    }))

    const titleHasKw = kwLower.some(k => titleLower.includes(k))
    const descHasKw = kwLower.some(k => descLower.includes(k))
    const profileHasTwoKw = perKw.filter(x => x.count > 0).length >= 2

    // Headings detection (markdown style)
    const lines = (profileText || '').split(/\n+/)
    const headings = lines
      .map(l => l.trim())
      .filter(l => l.startsWith('## '))
      .map(l => ({ level: l.startsWith('### ') ? 'h3' : 'h2', text: l.replace(/^#{2,3}\s+/, '') }))
    const headingsWithKw = headings.filter(h => kwLower.some(k => h.text.toLowerCase().includes(k))).length

    // Links count
    const links = (profileText.match(/https?:\/\/[^\s)]+/g) || []).length
    const imageCount = Array.isArray(profileMedia) ? profileMedia.length : 0
    const imagesWithAlt = Array.isArray(profileMedia) ? profileMedia.filter((m: any) => typeof m?.alt === 'string' && m.alt.trim().length > 0).length : 0

    return {
      wordCount,
      perKw,
      titleOkLen: suggestedTitle.length <= 60,
      descOkLen: suggestedDescription.length <= 155,
      titleHasCity: cityLower ? titleLower.includes(cityLower) : true,
      descHasCity: cityLower ? descLower.includes(cityLower) : true,
      profileHasCity: cityLower ? profileLower.includes(cityLower) : true,
      titleHasKw,
      descHasKw,
      profileHasTwoKw,
      headingsCount: headings.length,
      headingsWithKw,
      links,
      imageCount,
      imagesWithAlt,
    }
  }, [profileText, suggestedTitle, suggestedDescription, city, keywords, profileMedia])

  const copyOutline = async () => {
    const md = outline.map(o => (o.level === 'h2' ? `## ${o.text}` : `### ${o.text}`)).join('\n')
    try { await navigator.clipboard.writeText(md) } catch {}
  }

  // Apply outline into profile description
  const [applying, setApplying] = useState<'append' | 'replace' | null>(null)
  const applyOutline = async (mode: 'append' | 'replace') => {
    const md = outline.map(o => (o.level === 'h2' ? `## ${o.text}` : `### ${o.text}`)).join('\n')
    const nextDescription = mode === 'append'
      ? [profileDescription, md].filter(Boolean).join('\n\n')
      : md
    try {
      setApplying(mode)
      const res = await fetch('/api/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileData: { description: nextDescription } })
      })
      if (!res.ok) throw new Error('failed')
      setProfileDescription(nextDescription)
      // Update analysis input with new description
      setProfileText(nextDescription)
    } catch {
      setError('Übernahme ins Profil fehlgeschlagen')
    } finally {
      setApplying(null)
    }
  }

  // SERP loader (component scope)
  const loadSerp = async () => {
    try {
      setSerpLoading(true)
      const res = await fetch('/api/addons/seo/serp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, userType, keywords })
      })
      if (!res.ok) throw new Error('failed')
      const j = await res.json()
      setSerpResults(Array.isArray(j?.results) ? j.results : [])
    } catch {
      setError('SERP Insights konnten nicht geladen werden')
    } finally {
      setSerpLoading(false)
    }
  }

  // Save image alt texts (component scope)
  const saveAlts = async () => {
    try {
      setAltSaving(true)
      setAltSaved(false)
      const updated = Array.isArray(profileMedia) ? profileMedia.map((m: any) => ({ ...m, alt: (m?.alt || '').toString() })) : []
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileData: { media: updated } })
      })
      if (!res.ok) throw new Error('failed')
      setAltSaved(true)
      setTimeout(() => setAltSaved(false), 2500)
    } catch {
      setError('Alt-Texte speichern fehlgeschlagen')
    } finally {
      setAltSaving(false)
    }
  }

  const save = async () => {
    try {
      setSaving(true)
      setSaved(false)
      setError(null)
      const payload: PersistPayload = {
        key: 'SEO',
        enabled: true,
        settings: {
          metaTitle: suggestedTitle,
          metaDescription: suggestedDescription,
          targetCity: city,
          targetKeywords: (keywords || '').split(',').map(s => s.trim()).filter(Boolean),
        }
      }
      const res = await fetch('/api/addons/state', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('failed')
      setSaved(true)
    } catch {
      setError('Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader session={session} activeTab="addons" setActiveTab={() => {}} />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-light tracking-widest text-gray-900">SEO</h1>
          <Link href="/addons" className="text-xs uppercase tracking-widest text-gray-600 hover:text-pink-600">Zurück zu Add-ons</Link>
        </div>
        <p className="mt-2 text-sm text-gray-600 max-w-3xl">
          SEO- & Keyword-Vorschläge, um deine Profiltexte für lokale Suchbegriffe in Google zu optimieren.
        </p>

        {!isAllowedUserType && (
          <div className="mt-6 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Dieses Add-on ist für deinen Kontotyp nicht verfügbar.
          </div>
        )}

        {error && <div className="mt-4 text-sm text-amber-700">{error}</div>}
        {loading ? (
          <div className="mt-6 text-sm text-gray-500">Lade…</div>
        ) : isAllowedUserType ? (
          <div className="mt-6 space-y-8">
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 select-none cursor-pointer">
                <input type="checkbox" className="h-4 w-4" checked={enabled} onChange={e => setEnabled(e.target.checked)} disabled />
                <span className="text-xs uppercase tracking-widest text-gray-700">AKTIV</span>
              </label>
              <span className="text-xs text-gray-500">SEO ist über Add-ons aktiviert</span>
            </div>

            {/* Tabs Header */}
            <div className="mt-4 border-b border-gray-200">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('INSIGHTS')}
                  className={`${activeTab === 'INSIGHTS' ? 'border-pink-600 text-pink-600' : 'border-transparent text-gray-600 hover:text-pink-600'} uppercase tracking-widest text-xs border-b-2 px-2 py-2`}
                >
                  SERP INSIGHTS
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('PROFIL')}
                  className={`${activeTab === 'PROFIL' ? 'border-pink-600 text-pink-600' : 'border-transparent text-gray-600 hover:text-pink-600'} uppercase tracking-widest text-xs border-b-2 px-2 py-2`}
                >
                  PROFIL‑KONTEXT
                </button>
              </div>
            </div>

            {activeTab === 'INSIGHTS' && (
              <>
                {/* SERP INSIGHTS */}
                <div className="border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-light tracking-widest text-gray-900 uppercase">SERP INSIGHTS</h2>
                    <button
                      onClick={loadSerp}
                      disabled={serpLoading}
                      className="px-6 py-3 bg-pink-600 text-white text-xs uppercase tracking-widest hover:bg-pink-700 disabled:opacity-60"
                    >
                      {serpLoading ? 'Lade…' : 'SERP LADEN'}
                    </button>
                  </div>
                  {serpResults.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500">Noch keine Ergebnisse</p>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {serpResults.map((r, i) => (
                        <div key={i} className="border border-gray-100 p-4">
                          <div className="text-[13px] text-[#1a0dab] leading-tight">{r.title}</div>
                          <div className="text-[12px] text-[#006621]">{r.url}</div>
                          <div className="mt-1 text-[12px] text-[#545454]">{r.description}</div>
                          <div className="mt-2 flex items-center gap-3">
                            <button onClick={() => setSuggestedTitle(r.title)} className="text-xs uppercase tracking-widest text-gray-700 hover:text-pink-600">Titel übernehmen</button>
                            <button onClick={() => setSuggestedDescription(r.description)} className="text-xs uppercase tracking-widest text-gray-700 hover:text-pink-600">Description übernehmen</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* BILDER ALT‑TEXTE */}
                {Array.isArray(profileMedia) && profileMedia.length > 0 && (
                  <div className="border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-light tracking-widest text-gray-900 uppercase">BILDER ALT‑TEXTE</h2>
                      <div>
                        <button
                          onClick={saveAlts}
                          disabled={altSaving}
                          className="px-6 py-3 bg-pink-600 text-white text-xs uppercase tracking-widest hover:bg-pink-700 disabled:opacity-60"
                        >
                          {altSaving ? 'Speichere…' : 'ALT‑TEXTE SPEICHERN'}
                        </button>
                        {altSaved && <span className="ml-3 text-sm text-green-600">Gespeichert</span>}
                      </div>
                    </div>
                    <div className="mt-4 space-y-4">
                      {profileMedia.map((m: any, idx: number) => {
                        const src = (m?.url || m?.src || '') as string
                        return (
                          <div key={idx} className="border border-gray-100 p-4">
                            {src ? (
                              <div className="mb-2">
                                <img
                                  src={src}
                                  alt={m?.alt || 'Vorschau'}
                                  className="w-full max-h-96 object-contain bg-gray-50"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                                />
                              </div>
                            ) : null}
                            <div className="text-xs text-gray-500 break-all">{src || 'Bild'}</div>
                            <input
                              value={(m?.alt || '') as string}
                              onChange={(e) => setProfileMedia(pm => pm.map((x: any, i: number) => i === idx ? { ...x, alt: e.target.value } : x))}
                              className="mt-2 w-full border-0 border-b-2 border-gray-200 bg-transparent py-3 text-sm"
                              placeholder="Alt‑Text (kurze Bildbeschreibung)"
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {(!available || !enabled) && (
              <div className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Dieses Feature ist derzeit nicht verfügbar oder für dein Konto nicht aktiviert. Bitte aktiviere <strong>SEO</strong> unter <Link href="/addons" className="underline">Add-ons</Link>.
              </div>
            )}

            {activeTab === 'PROFIL' && (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 p-6">
                <h2 className="text-lg font-light tracking-widest text-gray-900 uppercase">PROFIL‑KONTEXT</h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-800">Sprache</label>
                    <div className="mt-2">
                      <Select value={lang} onValueChange={(v) => setLang(v as 'de' | 'en')}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sprache" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="de">Deutsch</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-800">Ziel‑Stadt</label>
                    <input value={city} onChange={e => setCity(e.target.value)} className="mt-2 w-full border-0 border-b-2 border-gray-200 bg-transparent py-3 text-sm" placeholder="z. B. Berlin" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-800">Keywords (Komma‑getrennt)</label>
                    <input value={keywords} onChange={e => setKeywords(e.target.value)} className="mt-2 w-full border-0 border-b-2 border-gray-200 bg-transparent py-3 text-sm" placeholder="escort, diskret, hotel, 24/7" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-800">Profiltext (nur für Analyse)</label>
                    <textarea value={profileText} onChange={e => setProfileText(e.target.value)} rows={6} className="mt-2 w-full border-0 border-b-2 border-gray-200 bg-transparent py-3 text-sm" placeholder="Dein Profiltext…" />
                  </div>
                  <button onClick={requestSuggestions} disabled={suggesting} className="px-6 py-3 bg-pink-600 text-white text-xs uppercase tracking-widest hover:bg-pink-700 disabled:opacity-60">{suggesting ? 'Analysiere…' : 'Vorschläge erzeugen'}</button>
                </div>
              </div>

              <div className="border border-gray-200 p-6">
                <h2 className="text-lg font-light tracking-widest text-gray-900 uppercase">VORSCHLÄGE</h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-800">Meta‑Title</label>
                    <input value={suggestedTitle} onChange={e => setSuggestedTitle(e.target.value)} className="mt-2 w-full border-0 border-b-2 border-gray-200 bg-transparent py-3 text-sm" />
                    <div className="mt-1 text-[11px] tracking-widest">
                      <span className={(suggestedTitle.length <= 60 ? 'text-green-600' : 'text-amber-600')}>{suggestedTitle.length}</span>
                      <span className="text-gray-500"> / 60 Zeichen empfohlen</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-800">Meta‑Description</label>
                    <textarea value={suggestedDescription} onChange={e => setSuggestedDescription(e.target.value)} rows={4} className="mt-2 w-full border-0 border-b-2 border-gray-200 bg-transparent py-3 text-sm" />
                    <div className="mt-1 text-[11px] tracking-widest">
                      <span className={(suggestedDescription.length <= 155 ? 'text-green-600' : 'text-amber-600')}>{suggestedDescription.length}</span>
                      <span className="text-gray-500"> / 155 Zeichen empfohlen</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-800">Keyword‑Ideen</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {suggestedKeywords.length === 0 ? (
                        <span className="text-xs text-gray-500">Noch keine Vorschläge</span>
                      ) : suggestedKeywords.map((k, i) => (
                        <span key={i} className="text-[11px] uppercase tracking-widest bg-pink-50 text-pink-700 border border-pink-200 px-2 py-1">{k}</span>
                      ))}
                    </div>
                  </div>
                  {lsi.length > 0 && (
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-800">LSI / Ähnliche Begriffe</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {lsi.map((k, i) => {
                          const selected = suggestedKeywords.some(s => s.toLowerCase() === k.toLowerCase())
                          return (
                            <button
                              key={i}
                              onClick={() => {
                                setSuggestedKeywords(prev => prev.some(p => p.toLowerCase() === k.toLowerCase()) ? prev : [...prev, k])
                              }}
                              className={`text-[11px] uppercase tracking-widest px-2 py-1 border ${selected ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-pink-50 hover:border-pink-200'}`}
                              type="button"
                              title={selected ? 'Bereits in Keyword‑Ideen' : 'Zu Keyword‑Ideen hinzufügen'}
                            >
                              {selected ? '✓ ' : '+ '} {k}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  <div className="pt-2">
                    <button onClick={save} disabled={saving} className="px-6 py-3 bg-pink-600 text-white text-xs uppercase tracking-widest hover:bg-pink-700 disabled:opacity-60">Speichern</button>
                    {saved && <span className="ml-3 text-sm text-green-600">Gespeichert</span>}
                  </div>
                  {/* SERP Preview */}
                  <div className="mt-6 border border-gray-100 bg-gray-50 p-4">
                    <div className="text-[13px] text-[#1a0dab] leading-tight">{suggestedTitle || 'Titel-Vorschau'}</div>
                    <div className="text-[12px] text-[#006621]">www.thegnd.com/profil</div>
                    <div className="mt-1 text-[12px] text-[#545454]">{suggestedDescription || 'Beschreibung-Vorschau'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Outline (H2/H3) */}
            {outline.length > 0 && (
              <div className="border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-light tracking-widest text-gray-900 uppercase">GLIEDERUNG</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyOutline}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-xs uppercase tracking-widest border border-gray-200 hover:bg-pink-50 hover:border-pink-200"
                      title="Gliederung in die Zwischenablage kopieren"
                      type="button"
                    >
                      KOPIEREN
                    </button>
                    <button
                      disabled={applying === 'append'}
                      onClick={() => applyOutline('append')}
                      className="px-4 py-2 bg-pink-600 text-white text-xs uppercase tracking-widest hover:bg-pink-700 disabled:opacity-60"
                      title="Gliederung an den Profiltext anhängen"
                      type="button"
                    >
                      ANHÄNGEN
                    </button>
                    <button
                      disabled={applying === 'replace'}
                      onClick={() => applyOutline('replace')}
                      className="px-4 py-2 bg-rose-600 text-white text-xs uppercase tracking-widest hover:bg-rose-700 disabled:opacity-60"
                      title="Profiltext komplett durch die Gliederung ersetzen"
                      type="button"
                    >
                      ERSETZEN
                    </button>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {outline.map((o, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-800">
                      <span className={`inline-block px-2 py-0.5 border ${o.level === 'h2' ? 'border-pink-300 text-pink-700' : 'border-gray-300 text-gray-600'}`}>{o.level.toUpperCase()}</span>
                      <span>{o.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* On-Page Checks */}
            <div className="border border-gray-200 p-6">
              <h2 className="text-lg font-light tracking-widest text-gray-900 uppercase">ON‑PAGE CHECKS</h2>
              <ul className="mt-3 text-sm space-y-1">
                <li className={onPage.titleOkLen ? 'text-green-600' : 'text-rose-600'}>Meta‑Title Länge ≤ 60</li>
                <li className={onPage.descOkLen ? 'text-green-600' : 'text-rose-600'}>Meta‑Description Länge ≤ 155</li>
                <li className={onPage.titleHasCity ? 'text-green-600' : 'text-rose-600'}>Titel enthält Stadt</li>
                <li className={onPage.descHasCity ? 'text-green-600' : 'text-rose-600'}>Description enthält Stadt</li>
                <li className={onPage.titleHasKw ? 'text-green-600' : 'text-rose-600'}>Titel enthält Keyword</li>
                <li className={onPage.descHasKw ? 'text-green-600' : 'text-rose-600'}>Description enthält Keyword</li>
                <li className={onPage.profileHasCity ? 'text-green-600' : 'text-rose-600'}>Profiltext enthält Stadt</li>
                <li className={onPage.profileHasTwoKw ? 'text-green-600' : 'text-rose-600'}>Profiltext enthält ≥ 2 Keywords</li>
                <li className="text-gray-700">Überschriften (##/###): {onPage.headingsCount} (mit Keyword: {onPage.headingsWithKw})</li>
                <li className="text-gray-700">Links im Text: {onPage.links}</li>
                <li className="text-gray-700">Bilder: {onPage.imageCount} (mit Alt-Text: {onPage.imagesWithAlt})</li>
              </ul>
              {onPage.perKw.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs uppercase tracking-widest text-gray-800">Keyword‑Dichte</div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {onPage.perKw.map((k, i) => (
                      <div key={i} className="text-xs text-gray-700 border border-gray-200 p-2">
                        <div className="uppercase tracking-widest text-gray-900">{k.kw}</div>
                        <div className="mt-1">Treffer: {k.count}</div>
                        <div>Dichte: {k.density}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border border-gray-200 p-6">
              <h2 className="text-lg font-light tracking-widest text-gray-900 uppercase">TIPPS</h2>
              <ul className="mt-3 text-sm text-gray-700 list-disc pl-5 space-y-1">
                <li>Nutze die Ziel‑Stadt und 1–2 Haupt‑Keywords im Meta‑Title (≤ 60 Zeichen).</li>
                <li>Meta‑Description prägnant halten (≤ 155 Zeichen) und Vorteile nennen.</li>
                <li>Gliedere den Profiltext mit Überschriften (H2/H3) und lokalen Begriffen.</li>
                <li>Füge interne Links (z. B. zu Stories, Galerie) und Kontakt‑Infos hinzu.</li>
              </ul>
            </div>
          </>
          )}
          </div>
        ) : null}
      </div>
      <Footer />
    </div>
  )
}

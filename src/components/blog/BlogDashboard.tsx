'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PenSquare, Sparkles, CheckCircle, Wand2, PlusCircle, FileText, AlignLeft, Type, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useUploadThing } from '@/utils/uploadthing'
import { renderMarkdownToSafeHtml } from '@/lib/markdown'

interface BlogPostItem {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  coverImage: string | null
  published: boolean
  publishedAt: string | null
  category: string
  createdAt: string
  updatedAt: string
}

export default function BlogDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [posts, setPosts] = useState<BlogPostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'list' | 'create'>('list')
  const IDEAS = [
    'Top 5 Tipps für ein gelungenes Shooting',
    'Hinter den Kulissen: Mein Arbeitsalltag',
    'So bekommst du mehr Anfragen',
    '5 häufige Fragen meiner Kunden (mit Antworten)',
    'Meine Lieblings-Locations für Fotos & Videos',
    'Vorher/Nachher: Profil-Optimierung mit Beispielen',
    'Ausrüstung: Meine Must‑haves und warum',
    'Meine Story: So bin ich gestartet',
    'Sicherheit unterwegs: Tipps & Best Practices',
    'Deine Geschichten: Was dich bewegt',
    'Lustigste Geschichten mit Freiern',
    'Tipps für Einsteiger: So startest du richtig',
  ] as const
  const [ideaIdxM, setIdeaIdxM] = useState(0)
  const [ideaIdxD, setIdeaIdxD] = useState(0)
  const ideaSlidesD = Array.from({ length: Math.ceil(IDEAS.length / 4) }, (_, i) => IDEAS.slice(i * 4, (i + 1) * 4))

  // New post form
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [published, setPublished] = useState(false)
  const [preview, setPreview] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const { startUpload, isUploading } = useUploadThing('postImages')

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [edit, setEdit] = useState<Partial<BlogPostItem>>({})
  const [editPreview, setEditPreview] = useState(false)
  const [editFiles, setEditFiles] = useState<File[]>([])
  const { startUpload: startEditUpload, isUploading: isEditUploading } = useUploadThing('postImages')

  // AI assist (Gemini) state
  const [assistMode, setAssistMode] = useState<'proofread' | 'improve' | 'extend'>('improve')
  const [assistLanguage, setAssistLanguage] = useState<string>('de')
  const [assistSource, setAssistSource] = useState<'content' | 'excerpt' | 'title'>('content')
  const [assistLoading, setAssistLoading] = useState(false)
  const [assistOutput, setAssistOutput] = useState('')
  const ASSIST_MODES = [
    { k: 'proofread', l: 'Korrektur' },
    { k: 'improve', l: 'Verbessern' },
    { k: 'extend', l: 'Verlängern' },
  ] as const

  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/blog/user/posts', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Fehler beim Laden')
      setPosts(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Laden')
    } finally {
      setLoading(false)
    }
  }

  const runAssist = async () => {
    const hasContent = content.trim().length > 0
    const hasExcerpt = excerpt.trim().length > 0
    const willGenerateExcerpt = assistSource === 'excerpt' && !hasExcerpt && hasContent
    const willGenerateTitle = assistSource === 'title' && (hasContent || hasExcerpt)
    const inputText = willGenerateExcerpt
      ? `Erstelle aus dem folgenden Inhalt eine Kurzbeschreibung in ${assistLanguage.toUpperCase()}. Anforderungen: 1–2 Sätze, prägnant, neugierig machend, ohne Emojis.\n\n${content.trim()}`
      : willGenerateTitle
      ? `Erstelle aus dem folgenden ${hasContent ? 'Inhalt' : 'Kurzbeschreibung'} einen prägnanten Blog-Titel in ${assistLanguage.toUpperCase()}. Anforderungen: max. 60 Zeichen, klar, anziehend, ohne Emojis und Anführungszeichen. Nur den Titel zurückgeben.\n\n${hasContent ? content.trim() : excerpt.trim()}`
      : (assistSource === 'content' ? content : assistSource === 'excerpt' ? excerpt : title).trim()
    if (!inputText) return
    try {
      setAssistLoading(true)
      setAssistOutput('')
      const res = await fetch('/api/blog/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, mode: assistMode, language: assistLanguage })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Fehler bei der KI-Verarbeitung')
      setAssistOutput(typeof data?.output === 'string' ? data.output : '')
    } catch (e: any) {
      setAssistOutput(e?.message || 'Fehler bei der KI-Verarbeitung')
    } finally {
      setAssistLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    try {
      const v = searchParams.get('view')
      if (v === 'create' || v === 'new') {
        setTab('create')
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (tab === 'create') {
      try { document.getElementById('blog-create')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch {}
    }
  }, [tab])

  const create = async () => {
    try {
      setSaving(true)
      setError(null)
      // Upload cover if needed
      let cover = coverImage
      if (!cover && files.length > 0) {
        const res = await startUpload([files[0]])
        const url = res && res[0] ? (res[0] as any).ufsUrl || (res[0] as any).url : null
        if (url) cover = url
      }
      const res = await fetch('/api/blog/user/posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug: slug || undefined, excerpt, content, coverImage: cover, published })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Speichern fehlgeschlagen')
      // Reset form and refresh list
      setTitle(''); setSlug(''); setExcerpt(''); setContent(''); setCoverImage(''); setFiles([]); setPublished(false); setPreview(false)
      await load()
      setTab('list')
    } catch (e: any) {
      setError(e?.message || 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  const beginEdit = (p: BlogPostItem) => {
    setEditingId(p.id)
    setEdit({ ...p })
    setEditPreview(false)
    setEditFiles([])
  }

  const saveEdit = async () => {
    if (!editingId) return
    try {
      setSaving(true)
      setError(null)
      let payload: any = { ...edit }
      if (editFiles.length > 0) {
        const resUp = await startEditUpload([editFiles[0]])
        const url = resUp && resUp[0] ? (resUp[0] as any).ufsUrl || (resUp[0] as any).url : null
        if (url) payload = { ...payload, coverImage: url }
      }
      const res = await fetch(`/api/blog/user/posts/${editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Speichern fehlgeschlagen')
      setEditingId(null)
      await load()
    } catch (e: any) {
      setError(e?.message || 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Beitrag wirklich löschen?')) return
    try {
      setSaving(true)
      setError(null)
      const res = await fetch(`/api/blog/user/posts/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Löschen fehlgeschlagen')
      await load()
    } catch (e: any) {
      setError(e?.message || 'Löschen fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-amber-700">{error}</p>}

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200">
        <button
          onClick={() => setTab('list')}
          className={`text-xs md:text-sm font-light tracking-widest uppercase py-3 border-b-2 transition-colors ${
            tab === 'list' ? 'text-pink-500 border-pink-500' : 'text-gray-600 border-transparent hover:text-pink-500'
          }`}
        >
          MEINE BEITRÄGE
        </button>
        <button
          onClick={() => setTab('create')}
          className={`text-xs md:text-sm font-light tracking-widest uppercase py-3 border-b-2 transition-colors ${
            tab === 'create' ? 'text-pink-500 border-pink-500' : 'text-gray-600 border-transparent hover:text-pink-500'
          }`}
        >
          NEUEN BEITRAG ERSTELLEN
        </button>
      </div>

      {/* Create new post */}
      {tab === 'create' && (
      <section id="blog-create" className="border border-gray-200 p-4 max-w-7xl mx-auto w-full">
        <h3 className="sr-only">Neuen Beitrag erstellen</h3>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {/* Left column: form stack */}
          <div className="grid gap-5">
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-800">Titel</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full border-0 border-b-2 border-gray-200 py-2 text-sm bg-transparent outline-none focus:border-pink-500" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-800">Slug (optional)</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className="mt-2 w-full border-0 border-b-2 border-gray-200 py-2 text-sm bg-transparent outline-none focus:border-pink-500" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-800">Kurzbeschreibung</label>
              <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} className="mt-2 w-full border-0 border-b-2 border-gray-200 py-2 text-sm bg-transparent outline-none focus:border-pink-500" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-800">Inhalt (Markdown/HTML)</label>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="mt-2 w-full border-0 border-b-2 border-gray-200 py-2 text-sm bg-transparent outline-none focus:border-pink-500" />
              <div className="mt-2">
                <button type="button" onClick={() => setPreview(v => !v)} className="text-[11px] uppercase tracking-widest text-gray-600 hover:underline">
                  {preview ? 'Vorschau verbergen' : 'Vorschau anzeigen'}
                </button>
              </div>
              {preview && (
                <div className="mt-3 border border-gray-200 p-3 bg-gray-50 text-sm text-gray-800">
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdownToSafeHtml(content) }} />
                </div>
              )}
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-800">Cover Bild</label>
              <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="Bild-URL oder hochladen" className="mt-2 w-full border-0 border-b-2 border-gray-200 py-2 text-sm bg-transparent outline-none focus:border-pink-500" />
              <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <input className="w-full text-sm" type="file" accept="image/*" onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files).slice(0,1) : [])} />
                <button type="button" disabled={isUploading || files.length === 0} onClick={async () => {
                  if (files.length === 0) return
                  const res = await startUpload([files[0]])
                  const url = res && res[0] ? (res[0] as any).ufsUrl || (res[0] as any).url : null
                  if (url) setCoverImage(url)
                }} className="w-full sm:w-auto px-3 py-2 text-xs uppercase tracking-widest border border-gray-300 hover:bg-pink-50/40 disabled:opacity-60">
                  {isUploading ? 'Lade hoch…' : 'Hochladen'}
                </button>
              </div>
              {coverImage && (
                <div className="mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverImage} alt="Cover" className="w-full max-w-md h-40 object-cover border border-gray-200" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gray-800">
                <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Veröffentlichen
              </label>
            </div>
            <div>
              <button disabled={saving || isUploading} onClick={create} className="w-full sm:w-auto px-5 py-3 bg-pink-600 text-white text-xs uppercase tracking-widest rounded-none">{saving || isUploading ? 'Speichere…' : 'Beitrag erstellen'}</button>
            </div>
          </div>

          {/* Right column: AI Assist */}
          <aside className="border border-gray-200 p-4 bg-white">
            <div className="text-[10px] uppercase tracking-widest text-gray-600">KI-ASSISTENT</div>
            <div className="mt-3 grid gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-700">MODUS</label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {ASSIST_MODES.map(m => (
                    <button
                      key={m.k}
                      type="button"
                      onClick={() => setAssistMode(m.k as 'proofread' | 'improve' | 'extend')}
                      className={`w-full py-3 flex flex-col items-center justify-center text-[11px] uppercase tracking-widest border ${assistMode===m.k ? 'bg-pink-600 text-white border-pink-600' : 'border-gray-300 text-gray-800 hover:bg-pink-50/40'}`}
                    >
                      {m.k === 'proofread' ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : m.k === 'improve' ? (
                        <Wand2 className="h-5 w-5" />
                      ) : (
                        <PlusCircle className="h-5 w-5" />
                      )}
                      <span className="mt-1">{m.l}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-700">QUELLE</label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssistSource('content')}
                    className={`w-full py-3 flex flex-col items-center justify-center text-[11px] uppercase tracking-widest border ${assistSource==='content' ? 'bg-pink-600 text-white border-pink-600' : 'border-gray-300 text-gray-800 hover:bg-pink-50/40'}`}
                  >
                    <FileText className="h-5 w-5" />
                    <span className="mt-1 text-[10px] tracking-normal leading-tight text-center">Inhalt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssistSource('excerpt')}
                    className={`w-full py-3 flex flex-col items-center justify-center text-[11px] uppercase tracking-widest border ${assistSource==='excerpt' ? 'bg-pink-600 text-white border-pink-600' : 'border-gray-300 text-gray-800 hover:bg-pink-50/40'}`}
                  >
                    <AlignLeft className="h-5 w-5" />
                    <span className="mt-1 text-[9px] tracking-normal leading-tight text-center break-words">Kurzbeschreibung</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssistSource('title')}
                    className={`w-full py-3 flex flex-col items-center justify-center text-[11px] uppercase tracking-widest border ${assistSource==='title' ? 'bg-pink-600 text-white border-pink-600' : 'border-gray-300 text-gray-800 hover:bg-pink-50/40'}`}
                  >
                    <Type className="h-5 w-5" />
                    <span className="mt-1 text-[10px] tracking-normal leading-tight text-center">Titel</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-700">SPRACHE</label>
                <div className="mt-2 relative inline-block" ref={langRef}>
                  <button
                    type="button"
                    onClick={() => setLangOpen(v => !v)}
                    className="inline-flex items-center justify-between gap-1 w-24 border border-gray-300 bg-white px-2 py-1 text-xs tracking-widest uppercase"
                  >
                    {assistLanguage.toUpperCase()} <ChevronDown className="h-4 w-4" />
                  </button>
                  {langOpen && (
                    <div className="absolute z-10 mt-1 w-28 bg-white border border-gray-200 shadow-sm">
                      {(['de','en','fr','it','es'] as const).map(code => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => { setAssistLanguage(code); setLangOpen(false) }}
                          className={`block w-full text-left px-3 py-1.5 text-xs tracking-widest uppercase hover:bg-pink-50 ${assistLanguage===code ? 'bg-pink-50 text-pink-700' : 'text-gray-800'}`}
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={runAssist} disabled={assistLoading || !(assistSource==='content' ? content.trim() : (assistSource==='excerpt' ? (excerpt.trim() || content.trim()) : (content.trim() || excerpt.trim() || title.trim())))} className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white text-[11px] uppercase tracking-widest rounded-none disabled:opacity-60">
                  {assistLoading ? 'Arbeite…' : 'Text verbessern'}
                </button>
                <button type="button" onClick={() => setAssistOutput('')} className="px-4 py-2 border border-gray-300 text-gray-800 text-[11px] uppercase tracking-widest rounded-none">Leeren</button>
              </div>
              <div className="min-h-32 border border-gray-200 p-3 bg-gray-50 text-sm text-gray-800 whitespace-pre-wrap">
                {assistOutput || 'Noch keine Ausgabe.'}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={!assistOutput} onClick={() => setTitle(assistOutput)} className="px-3 py-2 text-[11px] uppercase tracking-widest border border-gray-300 hover:bg-pink-50/40 disabled:opacity-60">In Titel übernehmen</button>
                <button type="button" disabled={!assistOutput} onClick={() => setContent(assistOutput)} className="px-3 py-2 text-[11px] uppercase tracking-widest border border-gray-300 hover:bg-pink-50/40 disabled:opacity-60">In Inhalt übernehmen</button>
                <button type="button" disabled={!assistOutput} onClick={() => setExcerpt(assistOutput)} className="px-3 py-2 text-[11px] uppercase tracking-widest border border-gray-300 hover:bg-pink-50/40 disabled:opacity-60">In Kurzbeschreibung übernehmen</button>
              </div>
            </div>
          </aside>
        </div>
      </section>
      )}

      {/* List of own posts */}
      {tab === 'list' && (
      <section>
        {/* Mobile header with + NEU action */}
        <div className="sm:hidden p-4 border border-gray-200 border-b-0 bg-white flex items-center justify-between">
          <h3 className="text-base font-thin tracking-wider text-gray-800">MEINE BEITRÄGE</h3>
          <button
            className="text-xs font-light tracking-widest text-pink-500 hover:text-pink-600 transition-colors uppercase"
            onClick={() => { setTab('create'); try { router.push('/dashboard?tab=blog&view=create') } catch {}; try { document.getElementById('blog-create')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch {} }}
          >
            + NEU
          </button>
        </div>
        <h3 className="sr-only">Meine Beiträge</h3>
        {loading ? (
          <p className="text-sm text-gray-500">Lade…</p>
        ) : posts.length === 0 ? (
          <div className="border border-gray-200 bg-white p-6 sm:p-10 text-center max-w-7xl mx-auto px-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-pink-50 text-pink-600">
              <PenSquare className="h-6 w-6" />
            </div>
            <div className="text-sm md:text-base font-medium tracking-widest text-gray-900 uppercase">Jetzt deinen ersten Beitrag erstellen</div>
            <div className="mt-2 text-sm text-gray-600 max-w-xl mx-auto">Teile Stories, Tipps und Erfahrungen mit der Community. Sichtbarkeit erhöhst du mit Titelbild und Veröffentlichung.</div>
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={() => setTab('create')} className="px-5 py-3 bg-pink-600 hover:bg-pink-500 text-white text-xs uppercase tracking-widest rounded-none">Beitrag erstellen</button>
              <button onClick={() => { setTitle(''); setExcerpt(''); setContent(''); setPreview(false); }} className="px-5 py-3 border border-gray-300 text-gray-800 text-xs uppercase tracking-widest rounded-none">Später</button>
            </div>
            <div className="mt-6 md:hidden">
              <div className="border border-gray-200 p-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-gray-700"><Sparkles className="h-4 w-4 text-pink-600"/> Idee</div>
                <div className="mt-1 text-sm text-gray-800">{IDEAS[ideaIdxM]}</div>
              </div>
              <div className="mt-3 flex items-center justify-center gap-3">
                <button aria-label="Zurück" onClick={() => setIdeaIdxM((i) => (i - 1 + IDEAS.length) % IDEAS.length)} className="p-2 border border-gray-300 hover:bg-pink-50/40">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button aria-label="Weiter" onClick={() => setIdeaIdxM((i) => (i + 1) % IDEAS.length)} className="p-2 border border-gray-300 hover:bg-pink-50/40">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-6 hidden md:block">
              <div className="grid gap-2 md:grid-cols-4 text-left">
                {ideaSlidesD[ideaIdxD]?.map((txt, idx) => (
                  <div key={idx} className="border border-gray-200 p-3">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-gray-700"><Sparkles className="h-4 w-4 text-pink-600"/> Idee</div>
                    <div className="mt-1 text-sm text-gray-800">{txt}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-center gap-3">
                <button aria-label="Zurück" onClick={() => setIdeaIdxD((i) => (i - 1 + ideaSlidesD.length) % ideaSlidesD.length)} className="p-2 border border-gray-300 hover:bg-pink-50/40">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button aria-label="Weiter" onClick={() => setIdeaIdxD((i) => (i + 1) % ideaSlidesD.length)} className="p-2 border border-gray-300 hover:bg-pink-50/40">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="hidden sm:flex items-center justify-between border border-gray-200 bg-white p-4">
              <div className="text-base font-thin tracking-wider text-gray-800">MEINE BEITRÄGE</div>
              <button
                className="text-xs font-light tracking-widest text-pink-500 hover:text-pink-600 transition-colors uppercase"
                onClick={() => { setTab('create'); try { router.push('/dashboard?tab=blog&view=create') } catch {}; try { document.getElementById('blog-create')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch {} }}
              >
                + NEU
              </button>
            </div>
            {posts.map((p) => (
              <div key={p.id} className="border border-gray-200">
                {/* Header row becomes grid on mobile so buttons fall below and align right */}
                <div className="p-4 grid gap-4 sm:flex sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    {p.coverImage && (
                      <div className="shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.coverImage} alt={p.title} className="h-20 w-28 sm:h-14 sm:w-20 object-cover border border-gray-200" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium tracking-widest text-gray-900 uppercase truncate">{p.title}</div>
                      <div className="text-[11px] uppercase tracking-widest text-gray-500">
                        {p.published ? 'VERÖFFENTLICHT' : 'ENTWURF'} • {p.category === 'INTERESSANT_HEISSES' ? 'INTERESSANT & HEISSES' : (p.category === 'VON_USER_FUER_USER' ? 'VON USER FÜR USER' : 'AKTUELLES')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 justify-self-end sm:justify-self-auto mt-1 sm:mt-0">
                    <button onClick={() => beginEdit(p)} className="px-3 py-2 text-xs uppercase tracking-widest border border-gray-300 hover:bg-pink-50/40">BEARBEITEN</button>
                    <button onClick={() => remove(p.id)} className="px-3 py-2 text-xs uppercase tracking-widest border border-gray-300 hover:bg-pink-50/40">LÖSCHEN</button>
                  </div>
                </div>
                {editingId === p.id && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50 grid gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-800">Titel</label>
                      <input value={edit.title || ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} className="mt-2 w-full border-0 border-b-2 border-gray-200 py-2 text-sm bg-transparent outline-none focus:border-pink-500" />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-800">Slug</label>
                      <input value={edit.slug || ''} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} className="mt-2 w-full border-0 border-b-2 border-gray-200 py-2 text-sm bg-transparent outline-none focus:border-pink-500" />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-800">Kurzbeschreibung</label>
                      <textarea value={edit.excerpt || ''} onChange={(e) => setEdit({ ...edit, excerpt: e.target.value })} rows={3} className="mt-2 w-full border-0 border-b-2 border-gray-200 py-2 text-sm bg-transparent outline-none focus:border-pink-500" />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-800">Inhalt (Markdown/HTML)</label>
                      <textarea value={edit.content || ''} onChange={(e) => setEdit({ ...edit, content: e.target.value })} rows={8} className="mt-2 w-full border-0 border-b-2 border-gray-200 py-2 text-sm bg-transparent outline-none focus:border-pink-500" />
                      <div className="mt-2">
                        <button type="button" onClick={() => setEditPreview(v => !v)} className="text-[11px] uppercase tracking-widest text-gray-600 hover:underline">
                          {editPreview ? 'Vorschau verbergen' : 'Vorschau anzeigen'}
                        </button>
                      </div>
                      {editPreview && (
                        <div className="mt-3 border border-gray-200 p-3 bg-white text-sm text-gray-800">
                          <div dangerouslySetInnerHTML={{ __html: renderMarkdownToSafeHtml(String(edit.content || '')) }} />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-800">Cover Bild</label>
                      <input value={edit.coverImage || ''} onChange={(e) => setEdit({ ...edit, coverImage: e.target.value })} className="mt-2 w-full border-0 border-b-2 border-gray-200 py-2 text-sm bg-transparent outline-none focus:border-pink-500" />
                      <div className="mt-3 flex items-center gap-3">
                        <input type="file" accept="image/*" onChange={(e) => setEditFiles(e.target.files ? Array.from(e.target.files).slice(0,1) : [])} />
                        <button type="button" disabled={isEditUploading || editFiles.length === 0} onClick={async () => {
                          if (editFiles.length === 0) return
                          const res = await startEditUpload([editFiles[0]])
                          const url = res && res[0] ? (res[0] as any).ufsUrl || (res[0] as any).url : null
                          if (url) setEdit({ ...edit, coverImage: url })
                        }} className="px-3 py-2 text-xs uppercase tracking-widest border border-gray-300 hover:bg-pink-50/40 disabled:opacity-60">
                          {isEditUploading ? 'Lade hoch…' : 'Hochladen'}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gray-800">
                        <input type="checkbox" checked={!!edit.published} onChange={(e) => setEdit({ ...edit, published: e.target.checked })} /> Veröffentlichen
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <button disabled={saving || isEditUploading} onClick={saveEdit} className="px-5 py-3 bg-pink-600 text-white text-xs uppercase tracking-widest rounded-none">{saving || isEditUploading ? 'Speichere…' : 'Speichern'}</button>
                      <button onClick={() => setEditingId(null)} className="px-5 py-3 border border-gray-300 text-gray-800 text-xs uppercase tracking-widest rounded-none">Abbrechen</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      )}
    </div>
  )
}

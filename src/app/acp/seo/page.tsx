'use client'

import { useEffect, useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUploadThing } from '@/utils/uploadthing'
import { Search, Plus, Trash2, Edit2, CheckCircle2, XCircle, ExternalLink, AlertTriangle, Eye, ArrowRight } from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────

type AppSetting = { key: string; value: string }
type PageOverride = {
  id: string; urlPath: string; metaTitle: string | null; metaDescription: string | null
  metaKeywords: string | null; ogTitle: string | null; ogDescription: string | null
  ogImageUrl: string | null; robots: string | null; canonicalUrl: string | null
  priority: number; changeFrequency: string; enabled: boolean
}
type Redirect = {
  id: string; sourcePath: string; targetUrl: string; statusCode: number
  enabled: boolean; hitCount: number; lastHitAt: string | null
}
type StructuredDataEntry = {
  id: string; name: string; schemaType: string; urlPattern: string
  jsonLdTemplate: string; enabled: boolean
}
type AuditResult = {
  url: string; title: string | null; titleLength: number
  description: string | null; descriptionLength: number
  keywords: string | null; robots: string | null; canonical: string | null
  ogTitle: string | null; ogDescription: string | null; ogImage: string | null
  ogType: string | null; hreflang: Record<string, string>
  structuredData: any[]; warnings: string[]
  checks: { label: string; ok: boolean; detail?: string }[]
}

// ─── Helpers ───────────────────────────────────────────────────────────

function useSettingsMap() {
  const [map, setMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const reload = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/acp/settings', { cache: 'no-store' })
      const data = await res.json()
      const next: Record<string, string> = {}
      if (Array.isArray(data)) for (const it of data as AppSetting[]) next[it.key] = it.value ?? ''
      setMap(next)
    } finally { setLoading(false) }
  }
  useEffect(() => { reload() }, [])
  return { loading, map, setMap, reload }
}

async function upsertMany(pairs: Record<string, string>) {
  await Promise.all(Object.entries(pairs).map(([key, value]) =>
    fetch('/api/acp/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) })
  ))
}

// JSON-LD templates per schema type
const JSON_LD_TEMPLATES: Record<string, string> = {
  Organization: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "THEGND",
    "url": "https://thegnd.com",
    "logo": "https://thegnd.com/logo.png",
    "sameAs": []
  }, null, 2),
  LocalBusiness: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "",
    "address": { "@type": "PostalAddress", "streetAddress": "", "addressLocality": "", "addressCountry": "" },
    "telephone": "",
    "openingHours": ""
  }, null, 2),
  WebSite: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "THEGND",
    "url": "https://thegnd.com",
    "potentialAction": { "@type": "SearchAction", "target": "https://thegnd.com/search?q={search_term_string}", "query-input": "required name=search_term_string" }
  }, null, 2),
  FAQPage: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "Frage 1?", "acceptedAnswer": { "@type": "Answer", "text": "Antwort 1." } }
    ]
  }, null, 2),
  BreadcrumbList: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Start", "item": "https://thegnd.com" },
      { "@type": "ListItem", "position": 2, "name": "Seite", "item": "https://thegnd.com/seite" }
    ]
  }, null, 2),
  Article: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "",
    "author": { "@type": "Person", "name": "" },
    "datePublished": "",
    "image": ""
  }, null, 2),
  Person: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "",
    "jobTitle": "",
    "url": ""
  }, null, 2),
}

// ─── Main Component ────────────────────────────────────────────────────

export default function AdminSEOPage() {
  const [activeTab, setActiveTab] = useState('global')

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-light tracking-widest text-gray-900">SEO Management</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="global">Globale Einstellungen</TabsTrigger>
          <TabsTrigger value="pages">Seiten-Overrides</TabsTrigger>
          <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
          <TabsTrigger value="redirects">Redirects</TabsTrigger>
          <TabsTrigger value="structured">Structured Data</TabsTrigger>
          <TabsTrigger value="audit">SEO-Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="global"><GlobalSettingsTab /></TabsContent>
        <TabsContent value="pages"><PageOverridesTab /></TabsContent>
        <TabsContent value="sitemap"><SitemapTab /></TabsContent>
        <TabsContent value="redirects"><RedirectsTab /></TabsContent>
        <TabsContent value="structured"><StructuredDataTab /></TabsContent>
        <TabsContent value="audit"><AuditTab /></TabsContent>
      </Tabs>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Tab 1: Global SEO Settings
// ═══════════════════════════════════════════════════════════════════════

function GlobalSettingsTab() {
  const { map, setMap, reload } = useSettingsMap()
  const [message, setMessage] = useState<string | null>(null)
  const { startUpload, isUploading } = useUploadThing('siteAssets')
  const setField = (key: string, value: string) => setMap((m) => ({ ...m, [key]: value }))

  const save = async () => {
    setMessage(null)
    try {
      await upsertMany({
        'seo.titleTemplate': map['seo.titleTemplate'] || '',
        'seo.metaDescription': map['seo.metaDescription'] || '',
        'seo.keywords': map['seo.keywords'] || '',
        'seo.ogImageUrl': map['seo.ogImageUrl'] || '',
        'seo.robotsIndex': map['seo.robotsIndex'] || 'true',
        'seo.sitemapEnabled': map['seo.sitemapEnabled'] || 'true',
      })
      setMessage('Gespeichert')
      await reload()
    } catch { setMessage('Speichern fehlgeschlagen') }
  }

  const handleUpload = async (targetKey: string, files: FileList | null) => {
    if (!files || files.length === 0) return
    try {
      const res = await startUpload(Array.from(files))
      const url = res?.[0]?.url as string | undefined
      if (url) setField(targetKey, url)
    } catch {}
  }

  return (
    <div className="border border-gray-200 p-6 space-y-6">
      {message && <p className="text-xs text-green-600">{message}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label className="text-xs uppercase tracking-widest text-gray-800">Title Template</Label>
          <Input className="mt-2 border-0 border-b-2 border-gray-200 rounded-none" placeholder="%s | THEGND" value={map['seo.titleTemplate'] || ''} onChange={(e) => setField('seo.titleTemplate', e.target.value)} />
          <p className="text-xs text-gray-500 mt-1">Verwende %s als Platzhalter für den Seitentitel</p>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest text-gray-800">Keywords</Label>
          <Input className="mt-2 border-0 border-b-2 border-gray-200 rounded-none" placeholder="escort, portal, thegnd" value={map['seo.keywords'] || ''} onChange={(e) => setField('seo.keywords', e.target.value)} />
        </div>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-widest text-gray-800">Meta Description</Label>
        <textarea className="mt-2 w-full border-0 border-b-2 border-gray-200 bg-transparent py-3 text-sm" rows={3} placeholder="Globale Meta Description für Suchmaschinen" value={map['seo.metaDescription'] || ''} onChange={(e) => setField('seo.metaDescription', e.target.value)} />
        <p className="text-xs text-gray-500">{(map['seo.metaDescription'] || '').length}/160 Zeichen</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Label className="text-xs uppercase tracking-widest text-gray-800">Open Graph Bild</Label>
          <div className="mt-2 flex items-center gap-4">
            <input type="file" accept="image/*" onChange={(e) => handleUpload('seo.ogImageUrl', e.target.files)} />
            {isUploading && <span className="text-xs text-gray-500">Lädt…</span>}
          </div>
          {map['seo.ogImageUrl'] && (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={map['seo.ogImageUrl']} alt="OG" className="h-16" />
            </div>
          )}
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest text-gray-800">Indexierung</Label>
          <div className="mt-2">
            <Select value={map['seo.robotsIndex'] || 'true'} onValueChange={(v) => setField('seo.robotsIndex', v)}>
              <SelectTrigger className="w-full rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="true">Erlauben (index, follow)</SelectItem>
                <SelectItem value="false">Verbieten (noindex, nofollow)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Label className="text-xs uppercase tracking-widest text-gray-800">Sitemap</Label>
          <div className="mt-2">
            <Select value={map['seo.sitemapEnabled'] || 'true'} onValueChange={(v) => setField('seo.sitemapEnabled', v)}>
              <SelectTrigger className="w-full rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="true">Aktiv</SelectItem>
                <SelectItem value="false">Inaktiv</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Button onClick={save} className="bg-pink-500 hover:bg-pink-600 text-white rounded-none">Speichern</Button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Tab 2: Page Overrides
// ═══════════════════════════════════════════════════════════════════════

function PageOverridesTab() {
  const [pages, setPages] = useState<PageOverride[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<PageOverride | null>(null)

  const load = async () => {
    const res = await fetch(`/api/acp/seo/pages?q=${encodeURIComponent(search)}`, { cache: 'no-store' })
    setPages(await res.json())
  }
  useEffect(() => { load() }, [search])

  const handleDelete = async (id: string) => {
    if (!confirm('Wirklich löschen?')) return
    await fetch(`/api/acp/seo/pages/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input className="pl-10 border-0 border-b-2 border-gray-200 rounded-none" placeholder="URL-Pfad suchen…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true) }} className="bg-pink-500 hover:bg-pink-600 text-white rounded-none">
          <Plus size={16} className="mr-1" /> Neu
        </Button>
      </div>

      {showForm && <PageOverrideForm initial={editing} onSave={() => { setShowForm(false); load() }} onCancel={() => setShowForm(false)} />}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-widest text-gray-500">
              <th className="py-2 pr-4">URL-Pfad</th>
              <th className="py-2 pr-4">Meta Title</th>
              <th className="py-2 pr-4">Robots</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 pr-4 font-mono text-xs">{p.urlPath}</td>
                <td className="py-2 pr-4 truncate max-w-[200px]">{p.metaTitle || <span className="text-gray-400">–</span>}</td>
                <td className="py-2 pr-4 text-xs">{p.robots || <span className="text-gray-400">Standard</span>}</td>
                <td className="py-2 pr-4">
                  <span className={`inline-flex items-center gap-1 text-xs ${p.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                    {p.enabled ? <CheckCircle2 size={12} /> : <XCircle size={12} />} {p.enabled ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="py-2 text-right space-x-2">
                  <button onClick={() => { setEditing(p); setShowForm(true) }} className="text-gray-600 hover:text-pink-600"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-gray-600 hover:text-red-600"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400">Keine Overrides vorhanden</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PageOverrideForm({ initial, onSave, onCancel }: { initial: PageOverride | null; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    urlPath: initial?.urlPath || '',
    metaTitle: initial?.metaTitle || '',
    metaDescription: initial?.metaDescription || '',
    metaKeywords: initial?.metaKeywords || '',
    ogTitle: initial?.ogTitle || '',
    ogDescription: initial?.ogDescription || '',
    ogImageUrl: initial?.ogImageUrl || '',
    robots: initial?.robots || '',
    canonicalUrl: initial?.canonicalUrl || '',
    priority: String(initial?.priority ?? 0.6),
    changeFrequency: initial?.changeFrequency || 'daily',
    enabled: initial?.enabled !== false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setSaving(true); setError('')
    try {
      const url = initial ? `/api/acp/seo/pages/${initial.id}` : '/api/acp/seo/pages'
      const method = initial ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Fehler') }
      onSave()
    } catch (e: any) { setError(e.message) } finally { setSaving(false) }
  }

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <div className="border border-pink-200 bg-pink-50/30 p-4 space-y-4">
      <h3 className="text-sm font-semibold">{initial ? 'Override bearbeiten' : 'Neues Override erstellen'}</h3>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs uppercase tracking-widest text-gray-800">URL-Pfad *</Label>
          <Input className="mt-1 border-0 border-b-2 border-gray-200 rounded-none" placeholder="/escorts" value={form.urlPath} onChange={(e) => set('urlPath', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest text-gray-800">Meta Title</Label>
          <Input className="mt-1 border-0 border-b-2 border-gray-200 rounded-none" value={form.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} />
          <p className="text-xs text-gray-500 mt-0.5">{form.metaTitle.length}/60</p>
        </div>
      </div>
      <div>
        <Label className="text-xs uppercase tracking-widest text-gray-800">Meta Description</Label>
        <textarea className="mt-1 w-full border-0 border-b-2 border-gray-200 bg-transparent py-2 text-sm" rows={2} value={form.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} />
        <p className="text-xs text-gray-500">{form.metaDescription.length}/160</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs uppercase tracking-widest text-gray-800">Keywords</Label>
          <Input className="mt-1 border-0 border-b-2 border-gray-200 rounded-none" value={form.metaKeywords} onChange={(e) => set('metaKeywords', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest text-gray-800">Robots</Label>
          <Select value={form.robots || '__DEFAULT__'} onValueChange={(v) => set('robots', v === '__DEFAULT__' ? '' : v)}>
            <SelectTrigger className="mt-1 w-full rounded-none"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="__DEFAULT__">Standard (erbt global)</SelectItem>
              <SelectItem value="index,follow">index, follow</SelectItem>
              <SelectItem value="noindex,follow">noindex, follow</SelectItem>
              <SelectItem value="index,nofollow">index, nofollow</SelectItem>
              <SelectItem value="noindex,nofollow">noindex, nofollow</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest text-gray-800">Canonical URL</Label>
          <Input className="mt-1 border-0 border-b-2 border-gray-200 rounded-none" placeholder="https://..." value={form.canonicalUrl} onChange={(e) => set('canonicalUrl', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs uppercase tracking-widest text-gray-800">OG Title</Label>
          <Input className="mt-1 border-0 border-b-2 border-gray-200 rounded-none" value={form.ogTitle} onChange={(e) => set('ogTitle', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest text-gray-800">OG Description</Label>
          <Input className="mt-1 border-0 border-b-2 border-gray-200 rounded-none" value={form.ogDescription} onChange={(e) => set('ogDescription', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest text-gray-800">OG Image URL</Label>
          <Input className="mt-1 border-0 border-b-2 border-gray-200 rounded-none" value={form.ogImageUrl} onChange={(e) => set('ogImageUrl', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs uppercase tracking-widest text-gray-800">Sitemap Priority</Label>
          <Input className="mt-1 border-0 border-b-2 border-gray-200 rounded-none" type="number" step="0.1" min="0" max="1" value={form.priority} onChange={(e) => set('priority', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest text-gray-800">Change Frequency</Label>
          <Select value={form.changeFrequency} onValueChange={(v) => set('changeFrequency', v)}>
            <SelectTrigger className="mt-1 w-full rounded-none"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="always">always</SelectItem>
              <SelectItem value="hourly">hourly</SelectItem>
              <SelectItem value="daily">daily</SelectItem>
              <SelectItem value="weekly">weekly</SelectItem>
              <SelectItem value="monthly">monthly</SelectItem>
              <SelectItem value="yearly">yearly</SelectItem>
              <SelectItem value="never">never</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.enabled} onChange={(e) => set('enabled', e.target.checked)} />
            Aktiv
          </label>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={save} disabled={saving} className="bg-pink-500 hover:bg-pink-600 text-white rounded-none">{saving ? 'Speichern…' : 'Speichern'}</Button>
        <Button onClick={onCancel} variant="outline" className="rounded-none">Abbrechen</Button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Tab 3: Sitemap Management
// ═══════════════════════════════════════════════════════════════════════

function SitemapTab() {
  const { map, setMap, reload } = useSettingsMap()
  const [message, setMessage] = useState<string | null>(null)
  const [sitemapPreview, setSitemapPreview] = useState<{ count: number; sample: string[] } | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  const setField = (key: string, value: string) => setMap((m) => ({ ...m, [key]: value }))

  const save = async () => {
    setMessage(null)
    try {
      await upsertMany({
        'seo.sitemapEnabled': map['seo.sitemapEnabled'] || 'true',
        'seo.sitemapEscorts': map['seo.sitemapEscorts'] || 'true',
        'seo.sitemapAgencies': map['seo.sitemapAgencies'] || 'true',
        'seo.sitemapClubs': map['seo.sitemapClubs'] || 'true',
        'seo.sitemapBlog': map['seo.sitemapBlog'] || 'true',
        'seo.sitemapForum': map['seo.sitemapForum'] || 'true',
      })
      setMessage('Gespeichert')
      await reload()
    } catch { setMessage('Speichern fehlgeschlagen') }
  }

  const loadPreview = async () => {
    setLoadingPreview(true)
    try {
      const res = await fetch('/sitemap.xml')
      const text = await res.text()
      const urls = text.match(/<loc>(.*?)<\/loc>/g)?.map((m) => m.replace(/<\/?loc>/g, '')) || []
      setSitemapPreview({ count: urls.length, sample: urls.slice(0, 20) })
    } catch { setSitemapPreview(null) } finally { setLoadingPreview(false) }
  }

  const sitemapTypes = [
    { key: 'seo.sitemapEscorts', label: 'Escort-Profile', desc: '/escorts/[id]/[slug]' },
    { key: 'seo.sitemapAgencies', label: 'Agenturen', desc: '/agency/[id]/[slug]' },
    { key: 'seo.sitemapClubs', label: 'Clubs & Studios', desc: '/club-studio/[id]/[slug]' },
    { key: 'seo.sitemapBlog', label: 'Blog-Posts', desc: '/blog/[slug]' },
    { key: 'seo.sitemapForum', label: 'Forum-Threads', desc: '/forum/[slug]/[id]' },
  ]

  return (
    <div className="border border-gray-200 p-6 space-y-6">
      {message && <p className="text-xs text-green-600">{message}</p>}

      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs uppercase tracking-widest text-gray-800">Sitemap Status</Label>
          <p className="text-sm mt-1">
            {(map['seo.sitemapEnabled'] || 'true') === 'true' ? (
              <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={14} /> Aktiv</span>
            ) : (
              <span className="text-gray-400 flex items-center gap-1"><XCircle size={14} /> Inaktiv</span>
            )}
          </p>
        </div>
        <select className="border-0 border-b-2 border-gray-200 bg-transparent py-2 text-sm" value={map['seo.sitemapEnabled'] || 'true'} onChange={(e) => setField('seo.sitemapEnabled', e.target.value)}>
          <option value="true">Aktiv</option>
          <option value="false">Inaktiv</option>
        </select>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-widest text-gray-800 mb-3 block">Dynamische URL-Typen</Label>
        <div className="space-y-3">
          {sitemapTypes.map((st) => (
            <div key={st.key} className="flex items-center justify-between border border-gray-100 p-3">
              <div>
                <p className="text-sm font-medium">{st.label}</p>
                <p className="text-xs text-gray-500 font-mono">{st.desc}</p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={(map[st.key] || 'true') === 'true'}
                  onChange={(e) => setField(st.key, e.target.checked ? 'true' : 'false')}
                />
                Aktiv
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={save} className="bg-pink-500 hover:bg-pink-600 text-white rounded-none">Speichern</Button>
        <Button onClick={loadPreview} variant="outline" className="rounded-none" disabled={loadingPreview}>
          <Eye size={14} className="mr-1" /> {loadingPreview ? 'Lädt…' : 'Vorschau'}
        </Button>
        <a href="/sitemap.xml" target="_blank" rel="noopener" className="inline-flex items-center gap-1 px-3 py-1 text-sm border border-gray-200 hover:bg-gray-50">
          <ExternalLink size={14} /> sitemap.xml öffnen
        </a>
      </div>

      {sitemapPreview && (
        <div className="border border-gray-200 p-4 space-y-2 bg-gray-50">
          <p className="text-sm font-medium">{sitemapPreview.count} URLs in der Sitemap</p>
          <ul className="text-xs font-mono space-y-0.5 max-h-64 overflow-y-auto">
            {sitemapPreview.sample.map((u, i) => (
              <li key={i} className="text-gray-600">{u}</li>
            ))}
            {sitemapPreview.count > 20 && <li className="text-gray-400">… und {sitemapPreview.count - 20} weitere</li>}
          </ul>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Tab 4: Redirects
// ═══════════════════════════════════════════════════════════════════════

function RedirectsTab() {
  const [redirects, setRedirects] = useState<Redirect[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Redirect | null>(null)

  const load = async () => {
    const res = await fetch(`/api/acp/seo/redirects?q=${encodeURIComponent(search)}`, { cache: 'no-store' })
    setRedirects(await res.json())
  }
  useEffect(() => { load() }, [search])

  const handleDelete = async (id: string) => {
    if (!confirm('Wirklich löschen?')) return
    await fetch(`/api/acp/seo/redirects/${id}`, { method: 'DELETE' })
    load()
  }

  const toggleEnabled = async (r: Redirect) => {
    await fetch(`/api/acp/seo/redirects/${r.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !r.enabled }),
    })
    load()
  }

  return (
    <div className="border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input className="pl-10 border-0 border-b-2 border-gray-200 rounded-none" placeholder="Quell-Pfad suchen…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true) }} className="bg-pink-500 hover:bg-pink-600 text-white rounded-none">
          <Plus size={16} className="mr-1" /> Neu
        </Button>
      </div>

      {showForm && <RedirectForm initial={editing} onSave={() => { setShowForm(false); load() }} onCancel={() => setShowForm(false)} />}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-widest text-gray-500">
              <th className="py-2 pr-4">Quelle</th>
              <th className="py-2 pr-4">Ziel</th>
              <th className="py-2 pr-4">Code</th>
              <th className="py-2 pr-4">Hits</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {redirects.map((r) => (
              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 pr-4 font-mono text-xs">{r.sourcePath}</td>
                <td className="py-2 pr-4 text-xs truncate max-w-[200px] flex items-center gap-1">
                  <ArrowRight size={12} className="text-gray-400 shrink-0" /> {r.targetUrl}
                </td>
                <td className="py-2 pr-4">
                  <span className={`text-xs font-mono px-1.5 py-0.5 ${r.statusCode === 301 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                    {r.statusCode}
                  </span>
                </td>
                <td className="py-2 pr-4 text-xs text-gray-500">{r.hitCount}</td>
                <td className="py-2 pr-4">
                  <button onClick={() => toggleEnabled(r)} className={`inline-flex items-center gap-1 text-xs ${r.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                    {r.enabled ? <CheckCircle2 size={12} /> : <XCircle size={12} />} {r.enabled ? 'Aktiv' : 'Inaktiv'}
                  </button>
                </td>
                <td className="py-2 text-right space-x-2">
                  <button onClick={() => { setEditing(r); setShowForm(true) }} className="text-gray-600 hover:text-pink-600"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(r.id)} className="text-gray-600 hover:text-red-600"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {redirects.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-gray-400">Keine Redirects vorhanden</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RedirectForm({ initial, onSave, onCancel }: { initial: Redirect | null; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    sourcePath: initial?.sourcePath || '',
    targetUrl: initial?.targetUrl || '',
    statusCode: String(initial?.statusCode || 301),
    enabled: initial?.enabled !== false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setSaving(true); setError('')
    try {
      const url = initial ? `/api/acp/seo/redirects/${initial.id}` : '/api/acp/seo/redirects'
      const method = initial ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Fehler') }
      onSave()
    } catch (e: any) { setError(e.message) } finally { setSaving(false) }
  }

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <div className="border border-pink-200 bg-pink-50/30 p-4 space-y-4">
      <h3 className="text-sm font-semibold">{initial ? 'Redirect bearbeiten' : 'Neuen Redirect erstellen'}</h3>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs uppercase tracking-widest text-gray-800">Quell-Pfad *</Label>
          <Input className="mt-1 border-0 border-b-2 border-gray-200 rounded-none" placeholder="/alte-seite" value={form.sourcePath} onChange={(e) => set('sourcePath', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest text-gray-800">Ziel-URL *</Label>
          <Input className="mt-1 border-0 border-b-2 border-gray-200 rounded-none" placeholder="/neue-seite oder https://..." value={form.targetUrl} onChange={(e) => set('targetUrl', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest text-gray-800">Status-Code</Label>
          <Select value={form.statusCode} onValueChange={(v) => set('statusCode', v)}>
            <SelectTrigger className="mt-1 w-full rounded-none"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="301">301 (Permanent)</SelectItem>
              <SelectItem value="302">302 (Temporär)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.enabled} onChange={(e) => set('enabled', e.target.checked)} />
          Aktiv
        </label>
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={save} disabled={saving} className="bg-pink-500 hover:bg-pink-600 text-white rounded-none">{saving ? 'Speichern…' : 'Speichern'}</Button>
        <Button onClick={onCancel} variant="outline" className="rounded-none">Abbrechen</Button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Tab 5: Structured Data (JSON-LD)
// ═══════════════════════════════════════════════════════════════════════

function StructuredDataTab() {
  const [entries, setEntries] = useState<StructuredDataEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<StructuredDataEntry | null>(null)

  const load = async () => {
    const res = await fetch('/api/acp/seo/structured-data', { cache: 'no-store' })
    setEntries(await res.json())
  }
  useEffect(() => { load() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Wirklich löschen?')) return
    await fetch(`/api/acp/seo/structured-data/${id}`, { method: 'DELETE' })
    load()
  }

  const toggleEnabled = async (sd: StructuredDataEntry) => {
    await fetch(`/api/acp/seo/structured-data/${sd.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !sd.enabled }),
    })
    load()
  }

  return (
    <div className="border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">JSON-LD Snippets die in den Quellcode eingebettet werden</p>
        <Button onClick={() => { setEditing(null); setShowForm(true) }} className="bg-pink-500 hover:bg-pink-600 text-white rounded-none">
          <Plus size={16} className="mr-1" /> Neu
        </Button>
      </div>

      {showForm && <StructuredDataForm initial={editing} onSave={() => { setShowForm(false); load() }} onCancel={() => setShowForm(false)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.map((sd) => (
          <div key={sd.id} className={`border p-4 space-y-2 ${sd.enabled ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">{sd.name}</h4>
                <p className="text-xs text-gray-500">{sd.schemaType} — <span className="font-mono">{sd.urlPattern}</span></p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleEnabled(sd)} className={`text-xs ${sd.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                  {sd.enabled ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                </button>
                <button onClick={() => { setEditing(sd); setShowForm(true) }} className="text-gray-600 hover:text-pink-600"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(sd.id)} className="text-gray-600 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>
            <pre className="text-xs bg-gray-50 p-2 overflow-x-auto max-h-32 font-mono">{(() => { try { return JSON.stringify(JSON.parse(sd.jsonLdTemplate), null, 2) } catch { return sd.jsonLdTemplate } })()}</pre>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="col-span-2 py-8 text-center text-gray-400">Keine Structured Data Snippets vorhanden</div>
        )}
      </div>
    </div>
  )
}

function StructuredDataForm({ initial, onSave, onCancel }: { initial: StructuredDataEntry | null; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    schemaType: initial?.schemaType || 'Organization',
    urlPattern: initial?.urlPattern || '/',
    jsonLdTemplate: initial?.jsonLdTemplate || JSON_LD_TEMPLATES['Organization'] || '',
    enabled: initial?.enabled !== false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [jsonError, setJsonError] = useState('')

  const handleSchemaTypeChange = (type: string) => {
    const tmpl = JSON_LD_TEMPLATES[type]
    setForm((f) => ({
      ...f,
      schemaType: type,
      // only auto-fill template if creating new, not editing
      ...(!initial && tmpl ? { jsonLdTemplate: tmpl, name: type } : {}),
    }))
  }

  const validateJson = (json: string) => {
    try {
      JSON.parse(json)
      setJsonError('')
      return true
    } catch (e: any) {
      setJsonError(e.message)
      return false
    }
  }

  const save = async () => {
    if (!validateJson(form.jsonLdTemplate)) return
    setSaving(true); setError('')
    try {
      const url = initial ? `/api/acp/seo/structured-data/${initial.id}` : '/api/acp/seo/structured-data'
      const method = initial ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Fehler') }
      onSave()
    } catch (e: any) { setError(e.message) } finally { setSaving(false) }
  }

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }))

  const schemaTypes = ['Organization', 'LocalBusiness', 'WebSite', 'FAQPage', 'BreadcrumbList', 'Article', 'Person']

  return (
    <div className="border border-pink-200 bg-pink-50/30 p-4 space-y-4">
      <h3 className="text-sm font-semibold">{initial ? 'Snippet bearbeiten' : 'Neues Snippet erstellen'}</h3>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs uppercase tracking-widest text-gray-800">Name *</Label>
          <Input className="mt-1 border-0 border-b-2 border-gray-200 rounded-none" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest text-gray-800">Schema-Typ *</Label>
          <Select value={form.schemaType} onValueChange={handleSchemaTypeChange}>
            <SelectTrigger className="mt-1 w-full rounded-none"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-none">
              {schemaTypes.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest text-gray-800">URL-Pattern *</Label>
          <Input className="mt-1 border-0 border-b-2 border-gray-200 rounded-none" placeholder="/ oder /escorts/*" value={form.urlPattern} onChange={(e) => set('urlPattern', e.target.value)} />
          <p className="text-xs text-gray-500 mt-0.5">* = Wildcard, z.B. /escorts/*</p>
        </div>
      </div>
      <div>
        <Label className="text-xs uppercase tracking-widest text-gray-800">JSON-LD Template *</Label>
        <textarea
          className={`mt-1 w-full border-2 bg-gray-50 p-3 text-xs font-mono ${jsonError ? 'border-red-300' : 'border-gray-200'}`}
          rows={12}
          value={form.jsonLdTemplate}
          onChange={(e) => { set('jsonLdTemplate', e.target.value); validateJson(e.target.value) }}
        />
        {jsonError && <p className="text-xs text-red-600 mt-1">Ungültiges JSON: {jsonError}</p>}
      </div>
      <div className="flex items-center gap-4">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.enabled} onChange={(e) => set('enabled', e.target.checked)} />
          Aktiv
        </label>
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={save} disabled={saving} className="bg-pink-500 hover:bg-pink-600 text-white rounded-none">{saving ? 'Speichern…' : 'Speichern'}</Button>
        <Button onClick={onCancel} variant="outline" className="rounded-none">Abbrechen</Button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Tab 6: SEO Audit & SERP Preview
// ═══════════════════════════════════════════════════════════════════════

function AuditTab() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AuditResult | null>(null)
  const [error, setError] = useState('')

  const analyze = async () => {
    if (!url) return
    setLoading(true); setError(''); setResult(null)
    try {
      const targetUrl = url.startsWith('http') ? url : `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`
      const res = await fetch('/api/acp/seo/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Fehler') }
      setResult(await res.json())
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="border border-gray-200 p-6 space-y-6">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            className="pl-10 border-0 border-b-2 border-gray-200 rounded-none"
            placeholder="URL eingeben, z.B. /escorts oder http://localhost:3000/escorts"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && analyze()}
          />
        </div>
        <Button onClick={analyze} disabled={loading} className="bg-pink-500 hover:bg-pink-600 text-white rounded-none">
          {loading ? 'Analysiert…' : 'Analysieren'}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className="space-y-6">
          {/* SERP Preview */}
          <div>
            <Label className="text-xs uppercase tracking-widest text-gray-800 mb-3 block">Google SERP Vorschau</Label>
            <div className="border border-gray-200 p-4 bg-white max-w-[600px]">
              <p className="text-lg text-[#1a0dab] leading-tight truncate">{result.title || 'Kein Title-Tag'}</p>
              <p className="text-sm text-[#006621] truncate mt-0.5">{result.url}</p>
              <p className="text-sm text-[#545454] mt-1 line-clamp-2">{result.description || 'Keine Meta Description vorhanden.'}</p>
            </div>
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 space-y-1">
              {result.warnings.map((w, i) => (
                <p key={i} className="text-sm text-amber-800 flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" /> {w}
                </p>
              ))}
            </div>
          )}

          {/* Checklist */}
          <div>
            <Label className="text-xs uppercase tracking-widest text-gray-800 mb-3 block">SEO-Checkliste</Label>
            <div className="space-y-1">
              {result.checks.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    {c.ok ? <CheckCircle2 size={14} className="text-green-600" /> : <XCircle size={14} className="text-red-500" />}
                    <span className="text-sm">{c.label}</span>
                  </div>
                  {c.detail && <span className="text-xs text-gray-500 truncate max-w-[300px]">{c.detail}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Meta Tags Detail */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-xs uppercase tracking-widest text-gray-800 mb-2 block">Meta-Tags</Label>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-xs text-gray-500">Title</dt><dd className="font-mono text-xs">{result.title || '–'} <span className="text-gray-400">({result.titleLength} Zeichen)</span></dd></div>
                <div><dt className="text-xs text-gray-500">Description</dt><dd className="font-mono text-xs">{result.description || '–'} <span className="text-gray-400">({result.descriptionLength} Zeichen)</span></dd></div>
                <div><dt className="text-xs text-gray-500">Keywords</dt><dd className="font-mono text-xs">{result.keywords || '–'}</dd></div>
                <div><dt className="text-xs text-gray-500">Robots</dt><dd className="font-mono text-xs">{result.robots || 'nicht gesetzt (= erlaubt)'}</dd></div>
                <div><dt className="text-xs text-gray-500">Canonical</dt><dd className="font-mono text-xs">{result.canonical || '–'}</dd></div>
              </dl>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-gray-800 mb-2 block">Open Graph</Label>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-xs text-gray-500">og:title</dt><dd className="font-mono text-xs">{result.ogTitle || '–'}</dd></div>
                <div><dt className="text-xs text-gray-500">og:description</dt><dd className="font-mono text-xs">{result.ogDescription || '–'}</dd></div>
                <div><dt className="text-xs text-gray-500">og:type</dt><dd className="font-mono text-xs">{result.ogType || '–'}</dd></div>
                <div><dt className="text-xs text-gray-500">og:image</dt><dd className="font-mono text-xs break-all">{result.ogImage || '–'}</dd></div>
              </dl>
              {result.ogImage && (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result.ogImage} alt="OG Image" className="h-16 border" />
                </div>
              )}
            </div>
          </div>

          {/* Hreflang */}
          {Object.keys(result.hreflang).length > 0 && (
            <div>
              <Label className="text-xs uppercase tracking-widest text-gray-800 mb-2 block">Hreflang Tags</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(result.hreflang).map(([lang, href]) => (
                  <span key={lang} className="text-xs bg-gray-100 px-2 py-1 font-mono">{lang}: {href}</span>
                ))}
              </div>
            </div>
          )}

          {/* Structured Data */}
          {result.structuredData.length > 0 && (
            <div>
              <Label className="text-xs uppercase tracking-widest text-gray-800 mb-2 block">Structured Data (JSON-LD)</Label>
              <div className="space-y-2">
                {result.structuredData.map((sd, i) => (
                  <pre key={i} className="text-xs bg-gray-50 border p-3 overflow-x-auto max-h-40 font-mono">{JSON.stringify(sd, null, 2)}</pre>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

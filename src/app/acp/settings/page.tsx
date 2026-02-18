'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUploadThing } from '@/utils/uploadthing'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type AppSetting = { key: string; value: string }

function useSettingsMap() {
  const [map, setMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const reload = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/acp/settings', { cache: 'no-store' })
      const data = await res.json()
      const next: Record<string, string> = {}
      if (Array.isArray(data)) {
        for (const it of data as AppSetting[]) next[it.key] = it.value ?? ''
      }
      setMap(next)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { reload() }, [])
  return { loading, map, setMap, reload }
}

async function upsertMany(pairs: Record<string, string>) {
  const entries = Object.entries(pairs)
  await Promise.all(entries.map(([key, value]) => fetch('/api/acp/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) })))
}

export default function AdminSettingsPage() {
  const { loading, map, setMap, reload } = useSettingsMap()
  const [message, setMessage] = useState<string | null>(null)
  const [locales, setLocales] = useState<string[]>([])
  const { startUpload, isUploading } = useUploadThing('siteAssets')

  const timezones = useMemo(() => {
    const anyIntl: any = Intl as any
    const tz = typeof anyIntl.supportedValuesOf === 'function' ? (anyIntl.supportedValuesOf('timeZone') as string[]) : []
    if (tz && tz.length > 0) return tz
    return ['UTC', 'Europe/Berlin', 'Europe/Vienna', 'Europe/Zurich', 'Europe/Paris', 'Europe/Amsterdam', 'America/New_York']
  }, [])

  const dateFormats = ['DD.MM.YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/locales', { cache: 'no-store' })
        const data = await res.json()
        setLocales(Array.isArray(data?.codes) ? data.codes : [])
      } catch {}
    })()
  }, [])

  const setField = (key: string, value: string) => setMap((m) => ({ ...m, [key]: value }))

  const saveGeneral = async () => {
    setMessage(null)
    try {
      await upsertMany({
        'site.name': map['site.name'] || '',
        'site.tagline': map['site.tagline'] || '',
        'site.titleSeparator': map['site.titleSeparator'] || ' | ',
        'site.logo.kind': map['site.logo.kind'] || 'text',
        'site.logo.text': map['site.logo.text'] || '',
        'site.logo.imageUrl': map['site.logo.imageUrl'] || '',
        'site.faviconUrl': map['site.faviconUrl'] || '',
        'site.primaryLocale': map['site.primaryLocale'] || 'en',
        'site.timezone': map['site.timezone'] || 'UTC',
        'site.dateFormat': map['site.dateFormat'] || 'DD.MM.YYYY',
      })
      setMessage('Gespeichert')
      await reload()
    } catch {
      setMessage('Speichern fehlgeschlagen')
    }
  }

  const saveSEO = async () => {
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
    } catch {
      setMessage('Speichern fehlgeschlagen')
    }
  }

  const handleUploadTo = async (targetKey: string, files: FileList | null) => {
    if (!files || files.length === 0) return
    try {
      const res = await startUpload(Array.from(files))
      const url = res?.[0]?.url as string | undefined
      if (url) setField(targetKey, url)
    } catch {}
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-light tracking-widest text-gray-900">Einstellungen</h1>
      </div>
      {message && <p className="text-xs text-gray-600">{message}</p>}

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">Allgemein</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="tab3">TAB 3</TabsTrigger>
          <TabsTrigger value="tab4">TAB 4</TabsTrigger>
          <TabsTrigger value="tab5">TAB 5</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="border border-gray-200 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-xs uppercase tracking-widest text-gray-800">Website Name</Label>
                <Input className="mt-2 border-0 border-b-2 border-gray-200 rounded-none" value={map['site.name'] || ''} onChange={(e) => setField('site.name', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-gray-800">Tagline</Label>
                <Input className="mt-2 border-0 border-b-2 border-gray-200 rounded-none" value={map['site.tagline'] || ''} onChange={(e) => setField('site.tagline', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-xs uppercase tracking-widest text-gray-800">Titel‑Separator</Label>
                <div className="mt-2">
                  <Select value={map['site.titleSeparator'] || ' | '} onValueChange={(v) => setField('site.titleSeparator', v)}>
                    <SelectTrigger className="w-full rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value=" | ">| (Leerzeichen | Leerzeichen)</SelectItem>
                      <SelectItem value=" - ">- (Leerzeichen - Leerzeichen)</SelectItem>
                      <SelectItem value=" — ">— (Geviertstrich)</SelectItem>
                      <SelectItem value=" · ">· (Mittelpunkt)</SelectItem>
                      <SelectItem value=" • ">• (Bullet)</SelectItem>
                      <SelectItem value=": ">: (Doppelpunkt)</SelectItem>
                      <SelectItem value=" :: ">:: (Doppelte Doppelpunkte)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-xs uppercase tracking-widest text-gray-800">Logo Typ</Label>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="logoKind" value="text" checked={(map['site.logo.kind'] || 'text') === 'text'} onChange={(e) => setField('site.logo.kind', e.target.value)} />
                    <span>Text</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="logoKind" value="image" checked={map['site.logo.kind'] === 'image'} onChange={(e) => setField('site.logo.kind', e.target.value)} />
                    <span>Bild</span>
                  </label>
                </div>
              </div>
              {(map['site.logo.kind'] || 'text') === 'text' && (
                <div className="md:col-span-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-800">Logo Text</Label>
                  <Input className="mt-2 border-0 border-b-2 border-gray-200 rounded-none" value={map['site.logo.text'] || ''} onChange={(e) => setField('site.logo.text', e.target.value)} />
                </div>
              )}
              {(map['site.logo.kind'] || 'text') === 'image' && (
                <div className="md:col-span-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-800">Logo Bild</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <input type="file" accept="image/*" onChange={(e) => handleUploadTo('site.logo.imageUrl', e.target.files)} />
                    {isUploading && <span className="text-xs text-gray-500">Lädt…</span>}
                  </div>
                  {map['site.logo.imageUrl'] && (
                    <div className="mt-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={map['site.logo.imageUrl']} alt="Logo" className="h-12" />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-xs uppercase tracking-widest text-gray-800">Favicon</Label>
                <div className="mt-2 flex items-center gap-4">
                  <input type="file" accept="image/*" onChange={(e) => handleUploadTo('site.faviconUrl', e.target.files)} />
                  {isUploading && <span className="text-xs text-gray-500">Lädt…</span>}
                </div>
                {map['site.faviconUrl'] && (
                  <div className="mt-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={map['site.faviconUrl']} alt="Favicon" className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-gray-800">Hauptsprache</Label>
                <div className="mt-2">
                  <Select value={map['site.primaryLocale'] || ''} onValueChange={(v) => setField('site.primaryLocale', v)}>
                    <SelectTrigger className="w-full rounded-none">
                      <SelectValue placeholder="– wählen –" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="">– wählen –</SelectItem>
                      {locales.map((c) => (
                        <SelectItem key={c} value={c}>{c.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-gray-800">Zeitzone</Label>
                <div className="mt-2">
                  <Select value={map['site.timezone'] || ''} onValueChange={(v) => setField('site.timezone', v)}>
                    <SelectTrigger className="w-full rounded-none">
                      <SelectValue placeholder="– wählen –" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none max-h-72">
                      <SelectItem value="">– wählen –</SelectItem>
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-xs uppercase tracking-widest text-gray-800">Datumformat</Label>
                <div className="mt-2">
                  <Select value={map['site.dateFormat'] || ''} onValueChange={(v) => setField('site.dateFormat', v)}>
                    <SelectTrigger className="w-full rounded-none">
                      <SelectValue placeholder="– wählen –" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="">– wählen –</SelectItem>
                      {dateFormats.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={saveGeneral} className="bg-pink-500 hover:bg-pink-600 text-white rounded-none">Speichern</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="seo">
          <div className="border border-gray-200 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-xs uppercase tracking-widest text-gray-800">Title Template</Label>
                <Input className="mt-2 border-0 border-b-2 border-gray-200 rounded-none" value={map['seo.titleTemplate'] || ''} onChange={(e) => setField('seo.titleTemplate', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-gray-800">Keywords</Label>
                <Input className="mt-2 border-0 border-b-2 border-gray-200 rounded-none" value={map['seo.keywords'] || ''} onChange={(e) => setField('seo.keywords', e.target.value)} />
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-widest text-gray-800">Meta Description</Label>
              <textarea className="mt-2 w-full border-0 border-b-2 border-gray-200 bg-transparent py-3 text-sm" rows={3} value={map['seo.metaDescription'] || ''} onChange={(e) => setField('seo.metaDescription', e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Label className="text-xs uppercase tracking-widest text-gray-800">Open Graph Bild</Label>
                <div className="mt-2 flex items-center gap-4">
                  <input type="file" accept="image/*" onChange={(e) => handleUploadTo('seo.ogImageUrl', e.target.files)} />
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
                <select className="mt-2 w-full border-0 border-b-2 border-gray-200 bg-transparent py-2 text-sm" value={map['seo.robotsIndex'] || 'true'} onChange={(e) => setField('seo.robotsIndex', e.target.value)}>
                  <option value="true">Erlauben (index, follow)</option>
                  <option value="false">Verbieten (noindex, nofollow)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-xs uppercase tracking-widest text-gray-800">Sitemap</Label>
                <select className="mt-2 w-full border-0 border-b-2 border-gray-200 bg-transparent py-2 text-sm" value={map['seo.sitemapEnabled'] || 'true'} onChange={(e) => setField('seo.sitemapEnabled', e.target.value)}>
                  <option value="true">Aktiv</option>
                  <option value="false">Inaktiv</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={saveSEO} className="bg-pink-500 hover:bg-pink-600 text-white rounded-none">Speichern</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tab3">
          <div className="border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Platzhalter</p>
          </div>
        </TabsContent>

        <TabsContent value="tab4">
          <div className="border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Platzhalter</p>
          </div>
        </TabsContent>

        <TabsContent value="tab5">
          <div className="border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Platzhalter</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

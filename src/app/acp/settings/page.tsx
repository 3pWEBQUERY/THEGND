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
                  <Select value={map['site.primaryLocale'] || '__NONE__'} onValueChange={(v) => setField('site.primaryLocale', v === '__NONE__' ? '' : v)}>
                    <SelectTrigger className="w-full rounded-none">
                      <SelectValue placeholder="– wählen –" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="__NONE__">– wählen –</SelectItem>
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
                  <Select value={map['site.timezone'] || '__NONE__'} onValueChange={(v) => setField('site.timezone', v === '__NONE__' ? '' : v)}>
                    <SelectTrigger className="w-full rounded-none">
                      <SelectValue placeholder="– wählen –" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none max-h-72">
                      <SelectItem value="__NONE__">– wählen –</SelectItem>
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
                  <Select value={map['site.dateFormat'] || '__NONE__'} onValueChange={(v) => setField('site.dateFormat', v === '__NONE__' ? '' : v)}>
                    <SelectTrigger className="w-full rounded-none">
                      <SelectValue placeholder="– wählen –" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="__NONE__">– wählen –</SelectItem>
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
          <div className="border border-gray-200 p-6 space-y-4">
            <p className="text-sm text-gray-700">Die SEO-Verwaltung wurde in einen eigenen Bereich verschoben.</p>
            <a href="/acp/seo" className="inline-flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white text-sm px-4 py-2 rounded-none transition-colors">
              Zum SEO-Manager →
            </a>
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

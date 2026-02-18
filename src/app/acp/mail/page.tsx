'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getWelcomePresets, buildWelcomeEmailHtml, buildWelcomeEmailText } from '@/lib/emailTemplates'

 type MailSettings = {
  enabled?: boolean
  from?: string
  logoUrl?: string
}

 type MailTemplates = {
  welcome?: {
    subject?: string
    html?: string
    text?: string
  }
}

export default function AcpMailPage() {
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [savingTemplates, setSavingTemplates] = useState(false)
  const appUrl = useMemo(() => process.env.NEXT_PUBLIC_APP_URL || 'https://thegnd.net', [])

  const [settings, setSettings] = useState<MailSettings>({ enabled: true, from: '', logoUrl: '' })
  const [welcomeSubject, setWelcomeSubject] = useState('Willkommen bei THEGND')
  const [welcomeHtml, setWelcomeHtml] = useState('')
  const [welcomeText, setWelcomeText] = useState('')
  const [selectedPresetId, setSelectedPresetId] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')

  const presets = useMemo(() => getWelcomePresets(appUrl, settings.logoUrl || ''), [appUrl, settings.logoUrl])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [sRes, tRes] = await Promise.all([
          fetch('/api/acp/settings?key=mail_settings', { cache: 'no-store' }),
          fetch('/api/acp/settings?key=mail_templates', { cache: 'no-store' }),
        ])
        const sJson = await sRes.json().catch(() => null)
        const tJson = await tRes.json().catch(() => null)
        if (sJson?.value) {
          try {
            const v = JSON.parse(sJson.value)
            if (!cancelled) setSettings({ enabled: v?.enabled ?? true, from: v?.from ?? '', logoUrl: v?.logoUrl ?? '' })
          } catch {}
        }
        if (tJson?.value) {
          try {
            const v = JSON.parse(tJson.value) as MailTemplates
            if (!cancelled) {
              setWelcomeSubject(v?.welcome?.subject || 'Willkommen bei THEGND')
              const fallbackHtml = buildWelcomeEmailHtml({ appUrl, userType: 'MEMBER', displayName: null, logoUrl: settings.logoUrl || null })
              const fallbackText = buildWelcomeEmailText(appUrl, 'MEMBER', null)
              setWelcomeHtml(v?.welcome?.html || fallbackHtml)
              setWelcomeText(v?.welcome?.text || fallbackText)
            }
          } catch {}
        } else {
          const fallbackHtml = buildWelcomeEmailHtml({ appUrl, userType: 'MEMBER', displayName: null, logoUrl: settings.logoUrl || null })
          const fallbackText = buildWelcomeEmailText(appUrl, 'MEMBER', null)
          if (!cancelled) {
            setWelcomeHtml(fallbackHtml)
            setWelcomeText(fallbackText)
          }
        }
      } catch (e) {
        if (!cancelled) setError('Konnte aktuelle Einstellungen nicht laden.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const saveSettings = async () => {
    setSavingSettings(true)
    setMessage('')
    setError('')
    try {
      const res = await fetch('/api/acp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'mail_settings', value: JSON.stringify(settings) }),
      })
      if (!res.ok) throw new Error('save_failed')
      setMessage('Einstellungen gespeichert.')
    } catch (e) {
      setError('Speichern der Einstellungen fehlgeschlagen.')
    } finally {
      setSavingSettings(false)
    }
  }

  const saveTemplates = async () => {
    setSavingTemplates(true)
    setMessage('')
    setError('')
    try {
      const payload: MailTemplates = {
        welcome: {
          subject: welcomeSubject,
          html: welcomeHtml,
          text: welcomeText,
        },
      }
      const res = await fetch('/api/acp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'mail_templates', value: JSON.stringify(payload) }),
      })
      if (!res.ok) throw new Error('save_failed')
      setMessage('Templates gespeichert.')
    } catch (e) {
      setError('Speichern der Templates fehlgeschlagen.')
    } finally {
      setSavingTemplates(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-light tracking-widest text-gray-900">Mail</h1>
        <div className="w-24 h-px bg-pink-500" />
        <div className="text-sm text-gray-500">Lade…</div>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-light tracking-widest text-gray-900">Mail</h1>
        <div className="w-24 h-px bg-pink-500 mt-2" />
      </div>

      {message && <div className="text-sm text-pink-700 bg-pink-50 border border-pink-200 px-3 py-2">{message}</div>}
      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2">{error}</div>}

      {/* Einstellungen */}
      <section className="bg-white border border-gray-200 p-6">
        <h2 className="text-sm font-light tracking-widest text-gray-800 uppercase">Einstellungen</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={!!settings.enabled}
              onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
            />
            <span className="text-sm text-gray-800">Versand aktiviert</span>
          </label>
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-700">Absender (From)</label>
            <input
              type="text"
              placeholder="THEGND <noreply@thegnd.net>"
              value={settings.from || ''}
              onChange={(e) => setSettings((s) => ({ ...s, from: e.target.value }))}
              className="mt-2 w-full border-0 border-b-2 border-gray-200 rounded-none px-0 py-2 text-sm font-light bg-transparent focus:outline-none focus:ring-0 focus:border-pink-500"
            />
            <p className="mt-1 text-[11px] text-gray-500">Wenn leer, wird die Standard-Adresse aus den Umgebungsvariablen verwendet.</p>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-700">Logo URL (E-Mail)</label>
            <input
              type="text"
              placeholder="https://…/logo-email.png"
              value={settings.logoUrl || ''}
              onChange={(e) => setSettings((s) => ({ ...s, logoUrl: e.target.value }))}
              className="mt-2 w-full border-0 border-b-2 border-gray-200 rounded-none px-0 py-2 text-sm font-light bg-transparent focus:outline-none focus:ring-0 focus:border-pink-500"
            />
            <p className="mt-1 text-[11px] text-gray-500">Optional. Wenn gesetzt, wird dieses Logo oben in der Mail angezeigt. Keine runden Ecken werden verwendet.</p>
          </div>
        </div>
        <div className="mt-6 text-right">
          <Button onClick={saveSettings} disabled={savingSettings} className="bg-pink-500 hover:bg-pink-600 rounded-none text-xs uppercase tracking-widest px-4 py-2">
            {savingSettings ? 'Speichere…' : 'Einstellungen speichern'}
          </Button>
        </div>
      </section>

      {/* Templates */}
      <section className="bg-white border border-gray-200 p-6">
        <h2 className="text-sm font-light tracking-widest text-gray-800 uppercase">Templates</h2>
        <div className="mt-4 space-y-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-gray-700">Vorlage auswählen</div>
            <div className="mt-2 w-full max-w-md">
              <Select
                value={selectedPresetId}
                onValueChange={(v) => {
                  setSelectedPresetId(v)
                  const p = presets.find((x) => x.id === v)
                  if (p) {
                    setWelcomeSubject(p.subject)
                    setWelcomeHtml(p.html)
                    setWelcomeText(p.text)
                  }
                }}
              >
                <SelectTrigger className="w-full border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light bg-transparent">
                  <SelectValue placeholder="Vorlage wählen" />
                </SelectTrigger>
                <SelectContent className="rounded-none border border-gray-200 shadow-none">
                  {presets.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="rounded-none">{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-gray-700">Welcome – Betreff</div>
            <input
              type="text"
              value={welcomeSubject}
              onChange={(e) => setWelcomeSubject(e.target.value)}
              className="mt-2 w-full border-0 border-b-2 border-gray-200 rounded-none px-0 py-2 text-sm font-light bg-transparent focus:outline-none focus:ring-0 focus:border-pink-500"
            />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-gray-700">Welcome – HTML</div>
            <textarea
              value={welcomeHtml}
              onChange={(e) => setWelcomeHtml(e.target.value)}
              rows={10}
              className="mt-2 w-full border border-gray-200 px-3 py-2 text-sm font-light bg-white focus:outline-none focus:ring-0 focus:border-pink-500"
            />
            <p className="mt-1 text-[11px] text-gray-500">Wenn leer, wird das Standard‑Template aus dem Code verwendet.</p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-gray-700">Welcome – Text</div>
            <textarea
              value={welcomeText}
              onChange={(e) => setWelcomeText(e.target.value)}
              rows={6}
              className="mt-2 w-full border border-gray-200 px-3 py-2 text-sm font-light bg-white focus:outline-none focus:ring-0 focus:border-pink-500"
            />
            <p className="mt-1 text-[11px] text-gray-500">Plain‑Text Version für bessere Zustellbarkeit. Wenn leer, wird automatisch generiert.</p>
          </div>
        </div>
        <div className="mt-6 text-right">
          <Button onClick={saveTemplates} disabled={savingTemplates} className="bg-pink-500 hover:bg-pink-600 rounded-none text-xs uppercase tracking-widest px-4 py-2">
            {savingTemplates ? 'Speichere…' : 'Templates speichern'}
          </Button>
        </div>
      </section>
    </div>
  )
}

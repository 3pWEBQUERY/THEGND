'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Trash2, Globe, Link as LinkIcon } from 'lucide-react'
import { SiInstagram, SiWhatsapp, SiTelegram, SiOnlyfans, SiX, SiSnapchat, SiTiktok, SiFacebook, SiLinkedin, SiSignal } from 'react-icons/si'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { businessOnboardingStep6Schema } from '@/lib/validations'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'

type Step6Form = z.infer<typeof businessOnboardingStep6Schema>

type SocialEntry = { platform: string; url: string }

const SOCIAL_PRESETS: { value: string; label: string; placeholder?: string }[] = [
  { value: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
  { value: 'whatsapp', label: 'WhatsApp', placeholder: '+491701234567' },
  { value: 'telegram', label: 'Telegram', placeholder: 'https://t.me/username' },
  { value: 'onlyfans', label: 'OnlyFans', placeholder: 'https://onlyfans.com/username' },
  { value: 'x', label: 'X (Twitter)', placeholder: 'https://x.com/username' },
  { value: 'snapchat', label: 'Snapchat', placeholder: 'https://www.snapchat.com/add/username' },
  { value: 'tiktok', label: 'TikTok', placeholder: 'https://www.tiktok.com/@username' },
  { value: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/username' },
  { value: 'linkedin', label: 'LinkedIn', placeholder: 'https://www.linkedin.com/company/username' },
  { value: 'signal', label: 'Signal', placeholder: 'https://signal.me/#eu/...' },
  { value: 'website', label: 'Agentur-Website', placeholder: 'https://example.com' },
]

function platformIcon(name: string) {
  const n = name.toLowerCase()
  switch (n) {
    case 'instagram': return <SiInstagram className="h-4 w-4" />
    case 'facebook': return <SiFacebook className="h-4 w-4" />
    case 'linkedin': return <SiLinkedin className="h-4 w-4" />
    case 'x': case 'twitter': return <SiX className="h-4 w-4" />
    case 'telegram': return <SiTelegram className="h-4 w-4" />
    case 'whatsapp': return <SiWhatsapp className="h-4 w-4" />
    case 'signal': return <SiSignal className="h-4 w-4" />
    case 'website': return <Globe className="h-4 w-4" />
    case 'tiktok': return <SiTiktok className="h-4 w-4" />
    case 'snapchat': return <SiSnapchat className="h-4 w-4" />
    case 'onlyfans': return <SiOnlyfans className="h-4 w-4" />
    default: return <LinkIcon className="h-4 w-4" />
  }
}

export default function AgencyOnboardingStep5() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get('edit') === '1'
  const addEditParam = (href: string) => (isEditMode ? `${href}?edit=1` : href)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors }, reset } = useForm<Step6Form>({
    resolver: zodResolver(businessOnboardingStep6Schema),
    defaultValues: { phone: '', website: undefined, socialMedia: undefined }
  })

  const [socials, setSocials] = useState<SocialEntry[]>([])
  const [newPlatform, setNewPlatform] = useState<string>('instagram')
  const [customPlatformName, setCustomPlatformName] = useState<string>('')
  const [newUrl, setNewUrl] = useState<string>('')

  // Pre-fill
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/onboarding/agency/step-6')
        if (!res.ok) return
        const data = await res.json()
        if (!active) return
        const phone = data?.phone ?? ''
        const website = data?.website ?? undefined
        const socialMedia: Record<string, string> | undefined = data?.socialMedia
        reset({ phone, website })
        if (socialMedia && typeof socialMedia === 'object') {
          setSocials(Object.entries(socialMedia).map(([platform, url]) => ({ platform, url })))
        }
      } catch {}
    })()
    return () => { active = false }
  }, [reset])

  const phoneRegex = /^\+?[1-9]\d{7,14}$/
  const cleanPhone = (v: string) => v.replace(/[\s().-]/g, '')

  const platformLabel = useMemo(() => {
    const map = new Map(SOCIAL_PRESETS.map(p => [p.value, p.label] as const))
    return (p: string) => map.get(p) ?? p
  }, [])

  const addSocial = () => {
    if (!newPlatform || !newUrl) return
    const platformKey = newPlatform === 'custom' ? customPlatformName.trim() : newPlatform
    if (newPlatform === 'custom' && platformKey.length < 2) {
      setError('Bitte gib einen Namen für die Plattform an (mind. 2 Zeichen).')
      return
    }
    let valueToStore = newUrl
    const isOverride = socials.some(s => s.platform === platformKey)
    if (!isOverride && socials.length >= 10) { setError('Maximal 10 Social-Links erlaubt.'); return }

    if (platformKey.toLowerCase() === 'whatsapp') {
      const cleaned = cleanPhone(newUrl)
      if (!phoneRegex.test(cleaned)) { setError('WhatsApp erfordert eine gültige Telefonnummer (z. B. +491701234567).'); return }
      valueToStore = cleaned
    } else {
      try { new URL(newUrl) } catch { setError('Bitte gib eine gültige URL für den Social-Link ein.'); return }
    }

    setError('')
    setSocials(prev => {
      const exists = prev.some(s => s.platform === platformKey)
      if (exists) return prev.map(s => s.platform === platformKey ? { platform: platformKey, url: valueToStore } : s)
      return [...prev, { platform: platformKey, url: valueToStore }]
    })
    setNewUrl('')
    setCustomPlatformName('')
  }

  const removeSocial = (platform: string) => setSocials(prev => prev.filter(s => s.platform !== platform))

  const onSubmit = async (data: Step6Form) => {
    setIsLoading(true)
    setError('')
    try {
      const socialRecord: Record<string, string> | undefined = socials.length ? Object.fromEntries(socials.map(s => [s.platform, s.url])) : undefined
      const website = data.website && data.website.trim() !== '' ? data.website : undefined
      const phone = (data.phone || '').replace(/[\s().-]/g, '')

      const res = await fetch('/api/onboarding/agency/step-6', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, website, socialMedia: socialRecord })
      })
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j?.error ?? 'Fehler beim Speichern') }
      router.push(addEditParam('/onboarding/agency/step-6'))
    } catch (e: any) {
      setError(e?.message ?? 'Unbekannter Fehler')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="absolute top-0 w-full z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <Link href={addEditParam('/onboarding')} className="flex items-center text-sm font-light tracking-widest text-gray-600 hover:text-pink-500 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              ZURÜCK ZUM ONBOARDING
            </Link>
            <div className="text-sm font-light tracking-widest text-gray-600">AGENTUR-EINRICHTUNG – SCHRITT 5/6</div>
          </div>
        </div>
      </nav>

      <div className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-thin tracking-wider text-gray-800 mb-6">KONTAKT</h1>
            <div className="w-24 h-px bg-pink-500 mx-auto mb-8"></div>
            <p className="text-lg font-light tracking-wide text-gray-600 max-w-md mx-auto mb-4">Telefon, Website & Social – Schritt 5 von 6</p>
            <div className="flex justify-center"><Badge className="bg-pink-500 text-white font-light tracking-widest px-4 py-1 rounded-none">SCHRITT 5/6</Badge></div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div>
              <Label htmlFor="phone" className="text-xs font-light tracking-widest text-gray-700">TELEFONNUMMER</Label>
              <Input id="phone" placeholder="z.B. +49 170 1234567" className="rounded-none mt-2" {...register('phone')} />
              {errors.phone && <p className="text-xs font-light text-red-600 mt-1">{errors.phone.message as string}</p>}
              <p className="text-xs text-gray-500 mt-1">Wird zur direkten Kontaktaufnahme angezeigt.</p>
            </div>

            <div>
              <Label htmlFor="website" className="text-xs font-light tracking-widest text-gray-700">WEBSITE (OPTIONAL)</Label>
              <Input id="website" placeholder="https://meine-agentur.de" className="rounded-none mt-2" {...register('website', { setValueAs: (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v) })} />
              {errors.website && <p className="text-xs font-light text-red-600 mt-1">{errors.website.message as string}</p>}
            </div>

            <div>
              <Label className="text-xs font-light tracking-widest text-gray-700">SOCIAL LINKS</Label>
              <div className="mt-3 flex flex-col gap-3 border p-3 bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={newPlatform} onValueChange={setNewPlatform}>
                    <SelectTrigger className="rounded-none flex-[0.7]"><SelectValue placeholder="Plattform wählen" /></SelectTrigger>
                    <SelectContent>
                      {SOCIAL_PRESETS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          <span className="flex items-center gap-2">{platformIcon(p.value)}{p.label}</span>
                        </SelectItem>
                      ))}
                      <SelectSeparator />
                      <SelectItem value="custom"><span className="flex items-center gap-2"><LinkIcon className="h-4 w-4" />Andere (eigener Name)</span></SelectItem>
                    </SelectContent>
                  </Select>
                  {newPlatform === 'custom' && (
                    <Input placeholder="Plattformname (z.B. WeChat, Line, VK)" value={customPlatformName} onChange={(e) => setCustomPlatformName(e.target.value)} className="rounded-none flex-1" />
                  )}
                  <Input placeholder={newPlatform === 'whatsapp' ? '+491701234567' : (SOCIAL_PRESETS.find(p => p.value === newPlatform)?.placeholder || 'https://...')} value={newUrl} onChange={(e) => setNewUrl(e.target.value)} className="rounded-none flex-1" />
                  <Button type="button" onClick={addSocial} className="rounded-none bg-pink-500 hover:bg-pink-600 text-white"><Plus className="h-4 w-4 mr-1" /> Hinzufügen</Button>
                </div>
                <p className="text-xs text-gray-500">Hinweis: Für WhatsApp bitte eine Telefonnummer (z. B. +491701234567) eingeben. Für alle anderen Plattformen eine URL.</p>
                {error && <p className="text-xs font-light text-red-600">{error}</p>}
                {socials.length > 0 && (
                  <div className="flex flex-col divide-y">
                    {socials.map((s) => (
                      <div key={s.platform} className="flex items-center gap-3 py-2">
                        <div className="text-sm text-gray-700 w-44 truncate flex items-center gap-2" title={platformLabel(s.platform)}>
                          {platformIcon(s.platform)}{platformLabel(s.platform)}
                        </div>
                        <div className="text-sm text-gray-500 flex-1 truncate" title={s.url}>{s.url}</div>
                        <Button type="button" variant="outline" onClick={() => removeSocial(s.platform)} className="rounded-none border-gray-300 text-gray-600 hover:text-pink-600 hover:border-pink-600"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                )}
                {socials.length === 0 && (<p className="text-xs text-gray-500">Noch keine Social-Links hinzugefügt.</p>)}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push(addEditParam('/onboarding/agency/step-4'))} className="flex-1 border-gray-300 text-gray-600 font-light tracking-widest py-4 text-sm uppercase hover:border-pink-500 hover:text-pink-500 rounded-none">Zurück</Button>
              <Button type="submit" disabled={isLoading} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-4 text-sm uppercase rounded-none">{isLoading ? 'Speichern ...' : 'Weiter zu Schritt 6'}</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

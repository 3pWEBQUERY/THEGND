'use client'

import DashboardHeader from '@/components/DashboardHeader'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [tab, setTab] = useState<string>('profil')
  const detailsRef = useRef<HTMLDivElement>(null)
  const [displayName, setDisplayName] = useState<string>('')
  const [city, setCity] = useState<string>('')
  const [country, setCountry] = useState<string>('')
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false)
  const [savingProfile, setSavingProfile] = useState<boolean>(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' })
  const [visibility, setVisibility] = useState<'PUBLIC' | 'VERIFIED' | 'PRIVATE'>('PUBLIC')
  const [notificationPref, setNotificationPref] = useState<'ALL' | 'IMPORTANT' | 'NONE'>('ALL')
  const [savingPrivacy, setSavingPrivacy] = useState<boolean>(false)
  const [privacyMessage, setPrivacyMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' })

  // Account state (email & password)
  const [email, setEmail] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [currentPassword, setCurrentPassword] = useState<string>('')
  const [savingAccount, setSavingAccount] = useState<boolean>(false)
  const [loadingAccount, setLoadingAccount] = useState<boolean>(false)
  const [accountMessage, setAccountMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' })

  // Billing state
  type SubscriptionInfo = {
    status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'none'
    planName?: string
    amount?: number
    currency?: string
    currentPeriodEnd?: string | null
    cancelAt?: string | null
  }

  const handleSaveAccount = async () => {
    try {
      setSavingAccount(true)
      setAccountMessage({ type: null, text: '' })
      const body: any = {}
      if (email) body.email = email
      if (newPassword || confirmPassword) {
        if (!currentPassword) {
          setAccountMessage({ type: 'error', text: 'Bitte aktuelles Passwort angeben.' })
          setSavingAccount(false)
          return
        }
        body.password = newPassword
        body.passwordConfirm = confirmPassword
        body.currentPassword = currentPassword
      }
      const res = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Fehler beim Speichern')
      }
      setAccountMessage({ type: 'success', text: 'Konto aktualisiert.' })
      setNewPassword('')
      setConfirmPassword('')
      setCurrentPassword('')
    } catch (e: any) {
      setAccountMessage({ type: 'error', text: e?.message || 'Speichern fehlgeschlagen' })
    } finally {
      setSavingAccount(false)
    }
  }

  type PaymentMethod = {
    id: string
    brand: string
    last4: string
    expMonth: number
    expYear: number
    isDefault?: boolean
  }

  type Invoice = {
    id: string
    amount: number
    currency: string
    status: string
    date: string
    hostedInvoiceUrl?: string
    pdf?: string
  }

  const [billingLoading, setBillingLoading] = useState<boolean>(false)
  const [billingError, setBillingError] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionInfo>({ status: 'none' })
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [portalLoading, setPortalLoading] = useState<boolean>(false)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' })

  const go = (value: string) => {
    setTab(value)
    // smooth scroll to details section
    requestAnimationFrame(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  // Lazy-load billing data when the ABOS tab is opened
  useEffect(() => {
    if (tab !== 'abos') return
    let active = true
    const loadBilling = async () => {
      try {
        setBillingLoading(true)
        setBillingError(null)
        const res = await fetch('/api/billing/overview')
        if (!res.ok) throw new Error('failed')
        const data = await res.json()
        if (!active) return
        setSubscription(data?.subscription ?? { status: 'none' })
        setPaymentMethods(data?.paymentMethods ?? [])
        setInvoices(data?.invoices ?? [])
      } catch (e) {
        if (!active) return
        setBillingError('Konnte Abo-Daten nicht laden.')
        setSubscription((s) => s ?? { status: 'none' })
      } finally {
        if (active) setBillingLoading(false)
      }
    }
    loadBilling()
    return () => { active = false }
  }, [tab])

  // Load account email when KONTO tab opens
  useEffect(() => {
    if (tab !== 'konto') return
    let active = true
    const loadAccount = async () => {
      try {
        setLoadingAccount(true)
        setAccountMessage({ type: null, text: '' })
        const res = await fetch('/api/account')
        if (!res.ok) throw new Error('failed')
        const data = await res.json()
        if (!active) return
        setEmail(data?.email ?? '')
      } catch (e) {
        if (!active) return
        setAccountMessage({ type: 'error', text: 'Konnte Konto-Daten nicht laden.' })
      } finally {
        if (active) setLoadingAccount(false)
      }
    }
    loadAccount()
    return () => { active = false }
  }, [tab])

  const handleOpenPortal = async () => {
    try {
      setPortalLoading(true)
      setActionMessage({ type: null, text: '' })
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      if (data?.url) {
        window.location.href = data.url as string
      } else {
        throw new Error('no_url')
      }
    } catch (e) {
      setActionMessage({ type: 'error', text: 'Konnte Kundenportal nicht öffnen.' })
    } finally {
      setPortalLoading(false)
    }
  }

  const handleSavePrivacy = async () => {
    try {
      setSavingPrivacy(true)
      setPrivacyMessage({ type: null, text: '' })
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileData: {
          visibility,
          notificationPreference: notificationPref,
        } })
      })
      if (!res.ok) throw new Error('Failed')
      setPrivacyMessage({ type: 'success', text: 'Privatsphäre gespeichert' })
    } catch (e) {
      setPrivacyMessage({ type: 'error', text: 'Speichern fehlgeschlagen' })
    } finally {
      setSavingPrivacy(false)
    }
  }

  // Load current user's profile to prefill display name, city and country
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoadingProfile(true)
        const res = await fetch('/api/profile', { credentials: 'include' as RequestCredentials })
        if (res.status === 401) {
          if (typeof window !== 'undefined') {
            const cb = window.location.pathname
            window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(cb)}`
          }
          return
        }
        if (!res.ok) return
        const data = await res.json()
        if (active) {
          setDisplayName(data?.user?.profile?.displayName ?? '')
          setCity(data?.user?.profile?.city ?? '')
          setCountry(data?.user?.profile?.country ?? '')
          setVisibility((data?.user?.profile?.visibility as 'PUBLIC' | 'VERIFIED' | 'PRIVATE') ?? 'PUBLIC')
          setNotificationPref((data?.user?.profile?.notificationPreference as 'ALL' | 'IMPORTANT' | 'NONE') ?? 'ALL')
        }
      } catch (e) {
        // ignore
      } finally {
        if (active) setLoadingProfile(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true)
      setSaveMessage({ type: null, text: '' })
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileData: { 
          displayName: displayName?.trim() || null,
          city: city?.trim() || null,
          country: country?.trim() || null,
        } })
      })
      if (!res.ok) throw new Error('Failed')
      setSaveMessage({ type: 'success', text: 'Profil gespeichert' })
    } catch (e) {
      setSaveMessage({ type: 'error', text: 'Speichern fehlgeschlagen' })
    } finally {
      setSavingProfile(false)
    }
  }
  return (
    <>
      <DashboardHeader session={session} activeTab="settings" setActiveTab={() => {}} />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-light tracking-widest text-gray-900">EINSTELLUNGEN</h1>
        <div className="w-24 h-px bg-pink-500 mt-3" />
        <p className="text-sm text-gray-600 mt-4">Verwalte dein Profil, Konto und Privatsphäre.</p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className="border border-gray-200 p-6 cursor-pointer hover:bg-pink-50/40 hover:border-pink-200 transition-colors"
            role="button"
            tabIndex={0}
            onClick={() => go('profil')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go('profil') } }}
            aria-controls="settings-details"
          >
            <h2 className="text-sm font-light tracking-widest text-gray-800">PROFIL</h2>
            <p className="text-xs text-gray-500 mt-2">Profilangaben, Avatar und Details bearbeiten.</p>
          </div>
          <div
            className="border border-gray-200 p-6 cursor-pointer hover:bg-pink-50/40 hover:border-pink-200 transition-colors"
            role="button"
            tabIndex={0}
            onClick={() => go('konto')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go('konto') } }}
            aria-controls="settings-details"
          >
            <h2 className="text-sm font-light tracking-widest text-gray-800">KONTO</h2>
            <p className="text-xs text-gray-500 mt-2">E-Mail, Passwort und Sicherheit.</p>
          </div>
          <div
            className="border border-gray-200 p-6 cursor-pointer hover:bg-pink-50/40 hover:border-pink-200 transition-colors"
            role="button"
            tabIndex={0}
            onClick={() => go('privatsphaere')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go('privatsphaere') } }}
            aria-controls="settings-details"
          >
            <h2 className="text-sm font-light tracking-widest text-gray-800">PRIVATSPHÄRE</h2>
            <p className="text-xs text-gray-500 mt-2">Sichtbarkeit und Benachrichtigungen steuern.</p>
          </div>
          <div
            className="border border-gray-200 p-6 cursor-pointer hover:bg-pink-50/40 hover:border-pink-200 transition-colors"
            role="button"
            tabIndex={0}
            onClick={() => go('abos')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go('abos') } }}
            aria-controls="settings-details"
          >
            <h2 className="text-sm font-light tracking-widest text-gray-800">ABOS & ZAHLUNGEN</h2>
            <p className="text-xs text-gray-500 mt-2">Abo-Status und Rechnungen.</p>
          </div>
        </div>

        {/* Detail-Einstellungen */}
        <div className="mt-12" id="settings-details" ref={detailsRef}>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsContent value="profil" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="displayName" className="text-xs font-light tracking-widest text-gray-800 uppercase">ANZEIGENAME</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="z. B. Anna, Maria, ..."
                    className="mt-2 border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent"
                  />
                </div>
                <div>
                  <Label htmlFor="city" className="text-xs font-light tracking-widest text-gray-800 uppercase">STADT</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="z. B. Berlin"
                    className="mt-2 border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent"
                  />
                </div>
                <div>
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">LAND</Label>
                  <div className="mt-2">
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger className="w-full border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 bg-transparent"><SelectValue placeholder="Land wählen" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Deutschland">Deutschland</SelectItem>
                        <SelectItem value="Österreich">Österreich</SelectItem>
                        <SelectItem value="Schweiz">Schweiz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Button
                  onClick={handleSaveProfile}
                  disabled={savingProfile || loadingProfile}
                  className="bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-3 text-sm uppercase rounded-none disabled:opacity-60"
                >
                  {savingProfile ? 'Speichern…' : 'Speichern'}
                </Button>
                {saveMessage.type && (
                  <p className={saveMessage.type === 'success' ? 'mt-2 text-xs text-pink-600' : 'mt-2 text-xs text-red-600'} aria-live="polite">
                    {saveMessage.text}
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="konto" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="email" className="text-xs font-light tracking-widest text-gray-800 uppercase">E-MAIL</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loadingAccount}
                    className="mt-2 border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-xs font-light tracking-widest text-gray-800 uppercase">NEUES PASSWORT</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-2 border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent"
                  />
                </div>
                <div>
                  <Label htmlFor="currentPassword" className="text-xs font-light tracking-widest text-gray-800 uppercase">AKTUELLES PASSWORT</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-2 border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent"
                  />
                </div>
                <div>
                  <Label htmlFor="password2" className="text-xs font-light tracking-widest text-gray-800 uppercase">PASSWORT BESTÄTIGEN</Label>
                  <Input
                    id="password2"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-2 border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent"
                  />
                </div>
              </div>
              <div className="mt-6">
                <Button
                  onClick={handleSaveAccount}
                  disabled={savingAccount || loadingAccount}
                  className="bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-3 text-sm uppercase rounded-none disabled:opacity-60"
                >
                  {savingAccount ? 'Speichern…' : 'Änderungen speichern'}
                </Button>
                {accountMessage.type && (
                  <p className={accountMessage.type === 'success' ? 'mt-2 text-xs text-pink-600' : 'mt-2 text-xs text-red-600'} aria-live="polite">
                    {accountMessage.text}
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="privatsphaere" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">SICHTBARKEIT</Label>
                  <div className="mt-2">
                    <Select value={visibility} onValueChange={(v) => setVisibility(v as 'PUBLIC' | 'VERIFIED' | 'PRIVATE')}>
                      <SelectTrigger className="w-full border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 bg-transparent"><SelectValue placeholder="Sichtbarkeit wählen" /></SelectTrigger>
                      <SelectContent className="rounded-none border border-gray-200 shadow-none">
                        <SelectItem className="rounded-none" value="PUBLIC">Öffentlich</SelectItem>
                        <SelectItem className="rounded-none" value="VERIFIED">Nur verifiziert</SelectItem>
                        <SelectItem className="rounded-none" value="PRIVATE">Privat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">BENACHRICHTIGUNGEN</Label>
                  <div className="mt-2">
                    <Select value={notificationPref} onValueChange={(v) => setNotificationPref(v as 'ALL' | 'IMPORTANT' | 'NONE')}>
                      <SelectTrigger className="w-full border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 bg-transparent"><SelectValue placeholder="Benachrichtigungen" /></SelectTrigger>
                      <SelectContent className="rounded-none border border-gray-200 shadow-none">
                        <SelectItem className="rounded-none" value="ALL">Alle</SelectItem>
                        <SelectItem className="rounded-none" value="IMPORTANT">Nur wichtige</SelectItem>
                        <SelectItem className="rounded-none" value="NONE">Keine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Button onClick={handleSavePrivacy} disabled={savingPrivacy || loadingProfile} className="bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-3 text-sm uppercase rounded-none disabled:opacity-60">{savingPrivacy ? 'Speichern…' : 'Speichern'}</Button>
                {privacyMessage.type && (
                  <p className={privacyMessage.type === 'success' ? 'mt-2 text-xs text-pink-600' : 'mt-2 text-xs text-red-600'} aria-live="polite">
                    {privacyMessage.text}
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="abos" className="mt-6">
              <p className="text-sm text-gray-600">Hier verwaltest du dein Abo, Rechnungen und Zahlungsmethoden.</p>
              {/* Status / Plan */}
              <div className="mt-6 border border-gray-200 p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-sm font-light tracking-widest text-gray-800">ABO-STATUS</h3>
                    {billingLoading ? (
                      <p className="mt-2 text-sm text-gray-500">Lade…</p>
                    ) : billingError ? (
                      <p className="mt-2 text-sm text-red-600">{billingError}</p>
                    ) : (
                      <div className="mt-2 text-sm text-gray-700">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="px-2 py-1 text-xs uppercase tracking-widest border border-gray-300 text-gray-700">{subscription.status === 'none' ? 'Kein Abo' : subscription.status}</span>
                          {subscription.planName && (
                            <span className="text-xs text-gray-500">{subscription.planName}{subscription.amount ? ` • ${(subscription.amount / 100).toLocaleString('de-DE', { style: 'currency', currency: subscription.currency || 'EUR' })}` : ''}</span>
                          )}
                        </div>
                        {subscription.currentPeriodEnd && (
                          <p className="mt-2 text-xs text-gray-500">Nächste Verlängerung: {new Date(subscription.currentPeriodEnd).toLocaleDateString('de-DE')}</p>
                        )}
                        {subscription.cancelAt && (
                          <p className="mt-1 text-xs text-gray-500">Kündigt am: {new Date(subscription.cancelAt).toLocaleDateString('de-DE')}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button onClick={handleOpenPortal} disabled={portalLoading} className="bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-3 text-sm uppercase rounded-none disabled:opacity-60">
                      {portalLoading ? 'Öffnen…' : 'Abo verwalten'}
                    </Button>
                  </div>
                </div>
                {actionMessage.type && (
                  <p className={actionMessage.type === 'success' ? 'mt-3 text-xs text-pink-600' : 'mt-3 text-xs text-red-600'} aria-live="polite">{actionMessage.text}</p>
                )}
              </div>

              {/* Zahlungsmethoden */}
              <div className="mt-6 border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-light tracking-widest text-gray-800">ZAHLUNGSMETHODEN</h3>
                  <Button onClick={handleOpenPortal} className="bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-2 text-xs uppercase rounded-none">Hinzufügen / Ändern</Button>
                </div>
                <div className="mt-4">
                  {billingLoading ? (
                    <p className="text-sm text-gray-500">Lade…</p>
                  ) : paymentMethods.length === 0 ? (
                    <p className="text-sm text-gray-500">Keine Zahlungsmethode hinterlegt.</p>
                  ) : (
                    <ul className="space-y-3">
                      {paymentMethods.map((pm) => (
                        <li key={pm.id} className="flex items-center justify-between border border-gray-200 px-4 py-3">
                          <div className="text-sm text-gray-700">
                            <span className="uppercase tracking-widest text-xs text-gray-500">{pm.brand}</span>
                            <span className="ml-2">•••• {pm.last4}</span>
                            <span className="ml-2 text-xs text-gray-500">{String(pm.expMonth).padStart(2, '0')}/{pm.expYear}</span>
                            {pm.isDefault && <span className="ml-2 px-2 py-0.5 text-[10px] uppercase tracking-widest border border-gray-300">Standard</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button onClick={handleOpenPortal} className="bg-transparent text-gray-700 border border-gray-300 hover:bg-pink-50/40 rounded-none px-3 py-1 h-auto text-xs">Verwalten</Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Rechnungen */}
              <div className="mt-6 border border-gray-200 p-6">
                <h3 className="text-sm font-light tracking-widest text-gray-800">RECHNUNGEN</h3>
                <div className="mt-4">
                  {billingLoading ? (
                    <p className="text-sm text-gray-500">Lade…</p>
                  ) : invoices.length === 0 ? (
                    <p className="text-sm text-gray-500">Noch keine Rechnungen.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-gray-500">
                            <th className="py-2 pr-4 font-normal">Datum</th>
                            <th className="py-2 pr-4 font-normal">Betrag</th>
                            <th className="py-2 pr-4 font-normal">Status</th>
                            <th className="py-2 pr-4 font-normal">Aktion</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map((inv) => (
                            <tr key={inv.id} className="border-t border-gray-200">
                              <td className="py-3 pr-4">{new Date(inv.date).toLocaleDateString('de-DE')}</td>
                              <td className="py-3 pr-4">{(inv.amount / 100).toLocaleString('de-DE', { style: 'currency', currency: inv.currency || 'EUR' })}</td>
                              <td className="py-3 pr-4">{inv.status}</td>
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-2">
                                  {inv.hostedInvoiceUrl && (
                                    <a href={inv.hostedInvoiceUrl} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline">Anzeigen</a>
                                  )}
                                  {inv.pdf && (
                                    <a href={inv.pdf} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline">PDF</a>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}

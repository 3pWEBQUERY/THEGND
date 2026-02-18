'use client'

import { useState, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function ResetPasswordPageInner() {
  const router = useRouter()
  const search = useSearchParams()
  const emailFromQuery = useMemo(() => (search.get('email') || '').trim().toLowerCase(), [search])
  const tokenFromQuery = useMemo(() => search.get('token') || '', [search])

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const submit = async () => {
    setError('')
    setSuccess('')
    const email = emailFromQuery
    const token = tokenFromQuery
    if (!email || !token) {
      setError('Ungültiger Link')
      return
    }
    if (!password || !passwordConfirm) {
      setError('Bitte beide Felder ausfüllen')
      return
    }
    if (password !== passwordConfirm) {
      setError('Passwörter stimmen nicht überein')
      return
    }
    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password, passwordConfirm })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Fehler beim Aktualisieren')
      } else {
        setSuccess('Passwort wurde aktualisiert. Du kannst dich jetzt anmelden.')
        setTimeout(() => router.push('/auth/signin'), 1500)
      }
    } catch {
      setError('Serverfehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="absolute top-0 w-full z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center text-sm font-light tracking-widest text-gray-600 hover:text-pink-500 transition-colors">
              ZURÜCK ZUR STARTSEITE
            </Link>
            <div className="text-sm font-light tracking-widest text-gray-600">
              PASSWORT ZURÜCKSETZEN
            </div>
          </div>
        </div>
      </nav>

      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-thin tracking-wider text-gray-800 mb-4">PASSWORT ZURÜCKSETZEN</h1>
            <div className="w-16 h-px bg-pink-500 mx-auto mb-6"></div>
            <p className="text-sm font-light tracking-wide text-gray-600">
              Neues Passwort vergeben
            </p>
          </div>

          {error ? (
            <div className="p-4 text-sm font-light text-red-600 bg-red-50 border border-red-200 mb-6">{error}</div>
          ) : null}
          {success ? (
            <div className="p-4 text-sm font-light text-emerald-700 bg-emerald-50 border border-emerald-200 mb-6">{success}</div>
          ) : null}

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Neues Passwort</Label>
              <Input
                type="password"
                placeholder="Neues Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Passwort bestätigen</Label>
              <Input
                type="password"
                placeholder="Neues Passwort bestätigen"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent"
              />
            </div>

            <div>
              <Button
                type="button"
                onClick={submit}
                disabled={loading}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-3 text-sm uppercase rounded-none"
              >
                {loading ? 'Aktualisiere…' : 'Passwort setzen'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}> 
      <ResetPasswordPageInner />
    </Suspense>
  )
}

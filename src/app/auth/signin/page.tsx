'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInSchema } from '@/lib/validations'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type SignInForm = z.infer<typeof signInSchema>

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMessage, setForgotMessage] = useState('')
  const [forgotError, setForgotError] = useState('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema)
  })

  const onSubmit = async (data: SignInForm) => {
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false
      })

      if (result?.error) {
        setError('Ungültige Anmeldedaten')
        return
      }

      // Check user's onboarding status and redirect accordingly
      const session = await getSession()
      if (session?.user?.onboardingStatus === 'NOT_STARTED' || session?.user?.onboardingStatus === 'IN_PROGRESS') {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimalist Navigation */}
      <nav className="absolute top-0 w-full z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center text-sm font-light tracking-widest text-gray-600 hover:text-pink-500 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              ZURÜCK ZUR STARTSEITE
            </Link>
            <div className="text-sm font-light tracking-widest text-gray-600">
              ANMELDEN
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-thin tracking-wider text-gray-800 mb-4">ANMELDEN</h1>
            <div className="w-16 h-px bg-pink-500 mx-auto mb-6"></div>
            <p className="text-sm font-light tracking-wide text-gray-600">
              Willkommen zurück in deinem Konto
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {error && (
              <div className="p-4 text-sm font-light text-red-600 bg-red-50 border border-red-200">
                {error}
              </div>
            )}
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">E-Mail-Adresse</Label>
                <Input
                  type="email"
                  placeholder="thegnd@thegnd.net"
                  {...register('email')}
                  className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                />
                {errors.email && (
                  <p className="text-xs font-light text-red-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Passwort</Label>
                <Input
                  type="password"
                  placeholder="Gib dein Passwort ein"
                  {...register('password')}
                  className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent ${
                    errors.password ? 'border-red-500' : ''
                  }`}
                />
                {errors.password && (
                  <p className="text-xs font-light text-red-600 mt-1">{errors.password.message}</p>
                )}
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => { setForgotOpen(true); setForgotError(''); setForgotMessage(''); setForgotEmail('') }}
                    className="text-xs font-light tracking-widest text-pink-600 hover:text-pink-700 uppercase"
                  >
                    PASSWORT VERGESSEN
                  </button>
                </div>
              </div>
            </div>
            
            <div className="space-y-6 pt-4">
              <Button 
                type="submit" 
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-3 text-sm uppercase rounded-none"
                disabled={isLoading}
              >
                {isLoading ? 'Anmeldung läuft...' : 'Anmelden'}
              </Button>
              
              <div className="text-center">
                <span className="text-sm font-light text-gray-600 tracking-wide">
                  Noch kein Konto?{' '}
                </span>
                <Link href="/auth/signup" className="text-sm font-light tracking-wide text-pink-500 hover:text-pink-600 transition-colors">
                  Konto erstellen
                </Link>
              </div>
            </div>
          </form>

          {/* Passwort vergessen Dialog */}
          <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
            <DialogContent className="rounded-none border-gray-200" showCloseButton>
              <DialogHeader>
                <DialogTitle className="text-lg font-thin tracking-wider text-gray-800">PASSWORT VERGESSEN</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {forgotMessage ? (
                  <div className="p-3 text-sm font-light text-emerald-700 bg-emerald-50 border border-emerald-200">{forgotMessage}</div>
                ) : null}
                {forgotError ? (
                  <div className="p-3 text-sm font-light text-red-700 bg-red-50 border border-red-200">{forgotError}</div>
                ) : null}
                <div className="space-y-2">
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">E-Mail-Adresse</Label>
                  <Input
                    type="email"
                    placeholder="thegnd@thegnd.net"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent"
                  />
                </div>
                <div>
                  <Button
                    type="button"
                    onClick={async () => {
                      setForgotError('')
                      setForgotMessage('')
                      const email = (forgotEmail || '').trim().toLowerCase()
                      if (!email) {
                        setForgotError('Bitte E-Mail-Adresse angeben')
                        return
                      }
                      setForgotLoading(true)
                      try {
                        const res = await fetch('/api/auth/password/forgot', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email })
                        })
                        const data = await res.json().catch(() => ({}))
                        if (!res.ok) {
                          setForgotError(data?.error || 'Fehler beim Senden')
                        } else {
                          setForgotMessage('Wenn ein Konto existiert, wurde eine E-Mail gesendet.')
                        }
                      } catch (e) {
                        setForgotError('Serverfehler')
                      } finally {
                        setForgotLoading(false)
                      }
                    }}
                    disabled={forgotLoading}
                    className="w-full bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-3 text-sm uppercase rounded-none"
                  >
                    {forgotLoading ? 'Senden…' : 'Link senden'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
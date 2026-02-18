'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signUpSchema } from '@/lib/validations'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'

type SignUpForm = z.infer<typeof signUpSchema>

const userTypes = [
  { value: 'MEMBER', label: 'Mitglied', description: 'Für Privatnutzer' },
  { value: 'ESCORT', label: 'Escort', description: 'Für Escort-Dienstleister' },
  { value: 'HOBBYHURE', label: 'Hobbyhure', description: 'Für private Anbieterinnen' },
  { value: 'AGENCY', label: 'Agentur', description: 'Für Escort-Agenturen' },
  { value: 'CLUB', label: 'Club', description: 'Für Gentlemen Clubs' },
  { value: 'STUDIO', label: 'Studio', description: 'Für Studios' }
]

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema)
  })

  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Ein Fehler ist aufgetreten')
        return
      }

      setSuccess('Registrierung erfolgreich! Weiterleitung...')
      
      // Redirect to sign in page after successful registration
      setTimeout(() => {
        router.push('/auth/signin')
      }, 2000)
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
              REGISTRIEREN
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-thin tracking-wider text-gray-800 mb-4">REGISTRIEREN</h1>
            <div className="w-16 h-px bg-pink-500 mx-auto mb-6"></div>
            <p className="text-sm font-light tracking-wide text-gray-600">
              Erstelle dein exklusives Konto
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {error && (
              <div className="p-4 text-sm font-light text-red-600 bg-red-50 border border-red-200">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-4 text-sm font-light text-green-600 bg-green-50 border border-green-200">
                {success}
              </div>
            )}
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">E-Mail-Adresse</Label>
                <Input
                  type="email"
                  placeholder="thegndnet"
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
                  placeholder="Mindestens 6 Zeichen"
                  {...register('password')}
                  className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent ${
                    errors.password ? 'border-red-500' : ''
                  }`}
                />
                {errors.password && (
                  <p className="text-xs font-light text-red-600 mt-1">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Kontotyp</Label>
                <Controller
                  name="userType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent ${
                        errors.userType ? 'border-red-500' : ''
                      }`}>
                        <SelectValue placeholder="Wähle deinen Kontotyp" />
                      </SelectTrigger>
                      <SelectContent>
                        {userTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex flex-col">
                              <span className="font-light tracking-wide">{type.label}</span>
                              <span className="text-xs text-gray-500 font-light">{type.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.userType && (
                  <p className="text-xs font-light text-red-600 mt-1">{errors.userType.message}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-6 pt-4">
              <Button 
                type="submit" 
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-3 text-sm uppercase rounded-none"
                disabled={isLoading || success !== ''}
              >
                {isLoading ? 'Konto wird erstellt...' : 'Konto erstellen'}
              </Button>
              
              <div className="text-center">
                <span className="text-sm font-light text-gray-600 tracking-wide">
                  Bereits ein Konto?{' '}
                </span>
                <Link href="/auth/signin" className="text-sm font-light tracking-wide text-pink-500 hover:text-pink-600 transition-colors">
                  Anmelden
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { memberOnboardingSchema } from '@/lib/validations'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'

type MemberOnboardingForm = z.infer<typeof memberOnboardingSchema>

const genderOptions = [
  { value: 'MALE', label: 'Männlich' },
  { value: 'FEMALE', label: 'Weiblich' },
  { value: 'NON_BINARY', label: 'Non-Binary' },
  { value: 'OTHER', label: 'Andere' }
]

export default function MemberOnboardingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get('edit') === '1'
  const addEditParam = (href: string) => (isEditMode ? `${href}?edit=1` : href)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<MemberOnboardingForm>({
    resolver: zodResolver(memberOnboardingSchema)
  })

  const onSubmit = async (data: MemberOnboardingForm) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/onboarding/member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const result = await response.json()
        setError(result.error || 'Ein Fehler ist aufgetreten')
        return
      }

      router.push(addEditParam('/onboarding'))
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
            <Link href={addEditParam('/onboarding')} className="flex items-center text-sm font-light tracking-widest text-gray-600 hover:text-pink-500 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              ZURÜCK ZUM ONBOARDING
            </Link>
            <div className="text-sm font-light tracking-widest text-gray-600">
              MITGLIED-EINRICHTUNG
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-thin tracking-wider text-gray-800 mb-6">MITGLIED-PROFIL</h1>
            <div className="w-24 h-px bg-pink-500 mx-auto mb-8"></div>
            <p className="text-lg font-light tracking-wide text-gray-600 max-w-md mx-auto">
              Vervollständige dein Profil, um das Beste aus GND herauszuholen
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
            {error && (
              <div className="p-4 text-sm font-light text-red-600 bg-red-50 border border-red-200">
                {error}
              </div>
            )}
            
            <div className="space-y-8">
              <div className="space-y-3">
                <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Anzeigename (optional)</Label>
                <Input
                  id="displayName"
                  placeholder="Dein öffentlicher Name"
                  {...register('displayName')}
                  className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent ${
                    errors.displayName ? 'border-red-500' : ''
                  }`}
                />
                {errors.displayName && (
                  <p className="text-xs font-light text-red-600 mt-1">{errors.displayName.message}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Alter (optional)</Label>
                  <Input
                    id="age"
                    type="number"
                    min="18"
                    max="100"
                    placeholder="Dein Alter"
                    {...register('age', { valueAsNumber: true })}
                    className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent ${
                      errors.age ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.age && (
                    <p className="text-xs font-light text-red-600 mt-1">{errors.age.message}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Geschlecht (optional)</Label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 bg-transparent ${
                          errors.gender ? 'border-red-500' : ''
                        }`}>
                          <SelectValue placeholder="Geschlecht wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {genderOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.gender && (
                    <p className="text-xs font-light text-red-600 mt-1">{errors.gender.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Ort (optional)</Label>
                <Input
                  id="location"
                  placeholder="Stadt, Land"
                  {...register('location')}
                  className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent ${
                    errors.location ? 'border-red-500' : ''
                  }`}
                />
                {errors.location && (
                  <p className="text-xs font-light text-red-600 mt-1">{errors.location.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Über mich (optional)</Label>
                <Textarea
                  id="bio"
                  placeholder="Erzähle uns etwas über dich..."
                  rows={4}
                  {...register('bio')}
                  className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent resize-none ${
                    errors.bio ? 'border-red-500' : ''
                  }`}
                />
                {errors.bio && (
                  <p className="text-xs font-light text-red-600 mt-1">{errors.bio.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Vorlieben/Interessen (optional)</Label>
                <Textarea
                  id="preferences"
                  placeholder="Deine Vorlieben und Interessen..."
                  rows={3}
                  {...register('preferences')}
                  className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent resize-none ${
                    errors.preferences ? 'border-red-500' : ''
                  }`}
                />
                {errors.preferences && (
                  <p className="text-xs font-light text-red-600 mt-1">{errors.preferences.message}</p>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 pt-8">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-4 text-sm uppercase rounded-none"
              >
                {isLoading ? 'Speichern...' : 'Profil abschließen'}
              </Button>
              
              <Button 
                type="button"
                variant="outline"
                onClick={() => router.push(addEditParam('/onboarding'))}
                className="flex-1 border-gray-300 text-gray-600 font-light tracking-widest py-4 text-sm uppercase hover:border-pink-500 hover:text-pink-500 rounded-none"
              >
                Zurück
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
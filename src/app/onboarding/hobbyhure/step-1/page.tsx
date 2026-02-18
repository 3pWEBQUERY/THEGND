'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { escortOnboardingStep1Schema } from '@/lib/validations'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import MultiSelect from '@/components/ui/multi-select'
import { COUNTRIES_DE } from '@/data/countries.de'
import { LANGUAGES_DE } from '@/data/languages.de'

type HobbyhureStep1Form = z.infer<typeof escortOnboardingStep1Schema>

const genderOptions = [
  { value: 'MALE', label: 'Männlich' },
  { value: 'FEMALE', label: 'Weiblich' },
  { value: 'NON_BINARY', label: 'Non-Binary' },
  { value: 'OTHER', label: 'Andere' }
]

export default function HobbyhureOnboardingStep1() {
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
    setValue,
    formState: { errors }
  } = useForm<HobbyhureStep1Form>({
    resolver: zodResolver(escortOnboardingStep1Schema),
    defaultValues: {
      languages: [],
      nationality: []
    }
  })

  useEffect(() => {
    let ignore = false
    const prefill = async () => {
      if (!isEditMode) return
      try {
        const res = await fetch('/api/profile')
        if (!res.ok) return
        const data = await res.json()
        const p = data?.user?.profile || {}
        if (ignore) return
        const defaults: Partial<HobbyhureStep1Form> = {
          displayName: p.displayName || '',
          slogan: p.slogan || '',
          age: typeof p.age === 'number' ? p.age : undefined,
          gender: p.gender || undefined,
          languages: Array.isArray(p.languages) ? p.languages : [],
          nationality: Array.isArray(p.nationality)
            ? p.nationality
            : (typeof p.nationality === 'string' && p.nationality ? [p.nationality] : [])
        }
        Object.entries(defaults).forEach(([key, value]) => {
          if (value !== undefined) {
            ;(setValue as any)(key, value)
          }
        })
      } catch {
        // ignore
      }
    }
    prefill()
    return () => {
      ignore = true
    }
  }, [isEditMode])

  const onSubmit = async (data: HobbyhureStep1Form) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/onboarding/hobbyhure/step-1', {
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

      router.push(addEditParam('/onboarding/hobbyhure/step-2'))
    } catch (error) {
      setError('Ein Fehler ist aufgetreten')
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
            <div className="text-sm font-light tracking-widest text-gray-600">
              HOBBYHURE-EINRICHTUNG – SCHRITT 1/7
            </div>
          </div>
        </div>
      </nav>

      <div className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-thin tracking-wider text-gray-800 mb-6">HOBBYHURE-PROFIL</h1>
            <div className="w-24 h-px bg-pink-500 mx-auto mb-8"></div>
            <p className="text-lg font-light tracking-wide text-gray-600 max-w-md mx-auto mb-4">
              Basisinformationen – Schritt 1 von 7
            </p>
            <div className="flex justify-center">
              <Badge className="bg-pink-500 text-white font-light tracking-widest px-4 py-1 rounded-none">SCHRITT 1/7</Badge>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
            {error && (
              <div className="p-4 text-sm font-light text-red-600 bg-red-50 border border-red-200">
                {error}
              </div>
            )}
            
            <div className="space-y-8">
              <div className="space-y-3">
                <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Anzeigename *</Label>
                <Input
                  id="displayName"
                  placeholder="Dein professioneller Anzeigename"
                  {...register('displayName')}
                  className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent ${
                    errors.displayName ? 'border-red-500' : ''
                  }`}
                />
                {errors.displayName && (
                  <p className="text-xs font-light text-red-600 mt-1">{errors.displayName.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Slogan (optional)</Label>
                <Input
                  id="slogan"
                  placeholder="Ein kurzer, einprägsamer Slogan"
                  {...register('slogan')}
                  className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent ${
                    errors.slogan ? 'border-red-500' : ''
                  }`}
                />
                {errors.slogan && (
                  <p className="text-xs font-light text-red-600 mt-1">{errors.slogan?.message}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Alter *</Label>
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
                    <p className="text-xs font-light text-red-600 mt-1">{errors.age?.message}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Geschlecht *</Label>
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
                <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Nationalität *</Label>
                <Controller
                  name="nationality"
                  control={control}
                  render={({ field }) => (
                    <MultiSelect
                      options={COUNTRIES_DE}
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="Wähle deine Nationalität(en)"
                      searchPlaceholder="Nach Ländern suchen..."
                      className="w-full"
                    />
                  )}
                />
                {errors.nationality && (
                  <p className="text-xs font-light text-red-600 mt-1">{errors.nationality?.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Sprachen *</Label>
                <Controller
                  name="languages"
                  control={control}
                  render={({ field }) => (
                    <MultiSelect
                      options={LANGUAGES_DE}
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="Wähle deine Sprache(n)"
                      searchPlaceholder="Nach Sprachen suchen..."
                      className="w-full"
                    />
                  )}
                />
                {errors.languages && (
                  <p className="text-xs font-light text-red-600 mt-1">{errors.languages?.message as string}</p>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 pt-8">
              <Button 
                type="button"
                variant="outline"
                onClick={() => router.push(addEditParam('/onboarding'))}
                className="flex-1 border-gray-300 text-gray-600 font-light tracking-widest py-4 text-sm uppercase hover:border-pink-500 hover:text-pink-500 rounded-none"
              >
                Zurück
              </Button>
              
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-4 text-sm uppercase rounded-none"
              >
                {isLoading ? 'Speichern...' : 'Weiter zu Schritt 2'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

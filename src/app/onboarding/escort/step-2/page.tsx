'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import MultiSelect from '@/components/ui/multi-select'
import { escortOnboardingStep2Schema } from '@/lib/validations'
import { ArrowLeft } from 'lucide-react'

type EscortStep2Form = z.infer<typeof escortOnboardingStep2Schema>

const bodyTypeOptions = [
  { value: 'SLIM', label: 'Schlank' },
  { value: 'ATHLETIC', label: 'Sportlich' },
  { value: 'CURVY', label: 'Kurvig' },
  { value: 'FIT', label: 'Durchtrainiert' },
  { value: 'AVERAGE', label: 'Durchschnittlich' }
]

const hairColorOptions = [
  { value: 'BLOND', label: 'Blond' },
  { value: 'BROWN', label: 'Braun' },
  { value: 'BLACK', label: 'Schwarz' },
  { value: 'RED', label: 'Rot' },
  { value: 'GREY', label: 'Grau' },
  { value: 'DYED', label: 'Gefärbt' }
]

const hairLengthOptions = [
  { value: 'SHORT', label: 'Kurz' },
  { value: 'MEDIUM', label: 'Mittel' },
  { value: 'LONG', label: 'Lang' }
]

const eyeColorOptions = [
  { value: 'BLUE', label: 'Blau' },
  { value: 'GREEN', label: 'Grün' },
  { value: 'BROWN', label: 'Braun' },
  { value: 'HAZEL', label: 'Haselnuss' },
  { value: 'GREY', label: 'Grau' },
  { value: 'BLACK', label: 'Schwarz' }
]

const breastTypeOptions = [
  { value: 'NATURAL', label: 'Natürlich' },
  { value: 'IMPLANTS', label: 'Silikon' }
]

const breastSizeOptions = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'G', label: 'G' }
]

const intimateAreaOptions = [
  { value: 'SHAVED', label: 'Rasiert' },
  { value: 'TRIMMED', label: 'Teilrasiert' },
  { value: 'NATURAL', label: 'Natürlich' }
]

const piercingOptions = [
  { value: 'EARS', label: 'Ohren' },
  { value: 'NOSE', label: 'Nase' },
  { value: 'NAVEL', label: 'Bauchnabel' },
  { value: 'BREAST', label: 'Brust' },
  { value: 'INTIMATE', label: 'Intim' }
]

const tattooOptions = [
  { value: 'ARM', label: 'Arm' },
  { value: 'LEG', label: 'Bein' },
  { value: 'BACK', label: 'Rücken' },
  { value: 'CHEST', label: 'Brust' },
  { value: 'SHOULDER', label: 'Schulter' },
  { value: 'HAND', label: 'Hand' },
  { value: 'FOOT', label: 'Fuß' },
  { value: 'NECK', label: 'Nacken' }
]

const clothingStyleOptions = [
  { value: 'ELEGANT', label: 'Elegant' },
  { value: 'CASUAL', label: 'Casual' },
  { value: 'SEXY', label: 'Sexy' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'SPORTY', label: 'Sportlich' }
]

const shoeSizeOptions = Array.from({ length: 12 }).map((_, i) => {
  const size = 34 + i
  return { value: String(size), label: String(size) }
})

export default function EscortOnboardingStep2() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get('edit') === '1'
  const addEditParam = (href: string) => (isEditMode ? `${href}?edit=1` : href)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<EscortStep2Form>({
    resolver: zodResolver(escortOnboardingStep2Schema),
    defaultValues: {
      piercings: [],
      tattoos: []
    }
  })

  // Prefill existing values in edit mode
  useEffect(() => {
    let active = true
    const load = async () => {
      if (!isEditMode) return
      try {
        const res = await fetch('/api/onboarding/escort/step-2')
        if (!res.ok) return
        const data = await res.json()
        if (!active || !data) return
        const defaults: Partial<EscortStep2Form> = {
          height: data.height ?? undefined,
          weight: data.weight ?? undefined,
          bodyType: data.bodyType ?? undefined,
          hairColor: data.hairColor ?? undefined,
          hairLength: data.hairLength ?? undefined,
          eyeColor: data.eyeColor ?? undefined,
          breastType: data.breastType ?? undefined,
          breastSize: data.breastSize ?? undefined,
          intimateArea: data.intimateArea ?? undefined,
          piercings: Array.isArray(data.piercings) ? data.piercings : [],
          tattoos: Array.isArray(data.tattoos) ? data.tattoos : [],
          clothingStyle: data.clothingStyle ?? undefined,
          clothingSize: data.clothingSize ?? undefined,
          shoeSize: data.shoeSize ?? undefined
        }
        reset(defaults)
      } catch {
        // ignore optional prefill
      }
    }
    load()
    return () => { active = false }
  }, [isEditMode, reset])

  const onSubmit = async (data: EscortStep2Form) => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/onboarding/escort/step-2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const result = await response.json()
        setError(result.error || 'Ein Fehler ist aufgetreten')
        return
      }

      router.push(addEditParam('/onboarding/escort/step-3'))
    } catch (e) {
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
              ESCORT-EINRICHTUNG – SCHRITT 2/7
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-thin tracking-wider text-gray-800 mb-6">KÖRPERLICHE BESCHREIBUNG</h1>
            <div className="w-24 h-px bg-pink-500 mx-auto mb-8"></div>
            <p className="text-lg font-light tracking-wide text-gray-600 max-w-md mx-auto mb-4">
              Aussehen & Merkmale – Schritt 2 von 7
            </p>
            <div className="flex justify-center">
              <Badge className="bg-pink-500 text-white font-light tracking-widest px-4 py-1 rounded-none">SCHRITT 2/7</Badge>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
            {error && (
              <div className="p-4 text-sm font-light text-red-600 bg-red-50 border border-red-200">{error}</div>
            )}

            <div className="space-y-8">
              {/* Größe & Gewicht */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Größe (cm)</Label>
                  <Input
                    id="height"
                    placeholder="z. B. 170"
                    {...register('height')}
                    className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent ${errors.height ? 'border-red-500' : ''}`}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Gewicht (kg)</Label>
                  <Input
                    id="weight"
                    placeholder="z. B. 55"
                    {...register('weight')}
                    className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent ${errors.weight ? 'border-red-500' : ''}`}
                  />
                </div>
              </div>

              {/* Körperbau, Haarfarbe, Haarlänge */}
              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Körperbau</Label>
                  <Controller
                    name="bodyType"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 bg-transparent ${errors.bodyType ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Wählen" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {bodyTypeOptions.map((o) => (
                            <SelectItem className="rounded-none" key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Haarfarbe</Label>
                  <Controller
                    name="hairColor"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 bg-transparent ${errors.hairColor ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Wählen" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {hairColorOptions.map((o) => (
                            <SelectItem className="rounded-none" key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Haarlänge</Label>
                  <Controller
                    name="hairLength"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 bg-transparent ${errors.hairLength ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Wählen" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {hairLengthOptions.map((o) => (
                            <SelectItem className="rounded-none" key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              {/* Augenfarbe */}
              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Augenfarbe</Label>
                  <Controller
                    name="eyeColor"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 bg-transparent ${errors.eyeColor ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Wählen" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {eyeColorOptions.map((o) => (
                            <SelectItem className="rounded-none" key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              {/* Brusttyp & Brustgröße & Intimbereich */}
              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Brusttyp</Label>
                  <Controller
                    name="breastType"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 bg-transparent ${errors.breastType ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Wählen" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {breastTypeOptions.map((o) => (
                            <SelectItem className="rounded-none" key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Brustgröße</Label>
                  <Controller
                    name="breastSize"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 bg-transparent ${errors.breastSize ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Wählen" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {breastSizeOptions.map((o) => (
                            <SelectItem className="rounded-none" key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Intimbereich</Label>
                  <Controller
                    name="intimateArea"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 bg-transparent ${errors.intimateArea ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Wählen" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {intimateAreaOptions.map((o) => (
                            <SelectItem className="rounded-none" key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              {/* Piercings & Tattoos (MultiSelect) */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Piercings</Label>
                  <Controller
                    name="piercings"
                    control={control}
                    render={({ field }) => (
                      <MultiSelect
                        options={piercingOptions}
                        value={field.value || []}
                        onChange={field.onChange}
                        placeholder="Wähle Piercing-Stellen"
                        searchPlaceholder="Suchen..."
                        className="w-full"
                      />
                    )}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Tätowierungen</Label>
                  <Controller
                    name="tattoos"
                    control={control}
                    render={({ field }) => (
                      <MultiSelect
                        options={tattooOptions}
                        value={field.value || []}
                        onChange={field.onChange}
                        placeholder="Wähle Tattoo-Bereiche"
                        searchPlaceholder="Suchen..."
                        className="w-full"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Kleidungsstil, Kleidergröße, Schuhgröße */}
              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Kleidungsstil</Label>
                  <Controller
                    name="clothingStyle"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 bg-transparent ${errors.clothingStyle ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Wählen" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {clothingStyleOptions.map((o) => (
                            <SelectItem className="rounded-none" key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Kleidergröße</Label>
                  <Input
                    id="clothingSize"
                    placeholder="z. B. S / 36"
                    {...register('clothingSize')}
                    className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent ${errors.clothingSize ? 'border-red-500' : ''}`}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Schuhgröße (EU)</Label>
                  <Controller
                    name="shoeSize"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 bg-transparent ${errors.shoeSize ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Wählen" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {shoeSizeOptions.map((o) => (
                            <SelectItem className="rounded-none" key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
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
                {isLoading ? 'Speichern...' : 'Weiter zu Schritt 3'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

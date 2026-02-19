'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import MultiSelect from '@/components/ui/multi-select'
import { AGENCY_SERVICES_DE } from '@/data/business-services.de'
import { businessOnboardingStep5Schema } from '@/lib/validations'
import { ArrowLeft } from 'lucide-react'

type Step5Form = z.infer<typeof businessOnboardingStep5Schema>

export default function AgencyOnboardingStep4() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get('edit') === '1'
  const addEditParam = (href: string) => (isEditMode ? `${href}?edit=1` : href)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { control, handleSubmit, formState: { errors }, watch, reset } = useForm<Step5Form>({
    resolver: zodResolver(businessOnboardingStep5Schema),
    defaultValues: { services: [] }
  })

  const labelByValue = useMemo(() => {
    const m = new Map<string, string>()
    AGENCY_SERVICES_DE.forEach(o => m.set(o.value, o.label))
    return m
  }, [])

  const selectedValues = watch('services') || []

  // Prefill from API
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/onboarding/agency/step-5')
        if (!res.ok) return
        const data = await res.json()
        if (!active) return
        if (Array.isArray(data?.services)) {
          reset({ services: data.services })
        }
      } catch {
        // ignore
      }
    })()
    return () => { active = false }
  }, [reset])

  const onSubmit = async (data: Step5Form) => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/onboarding/agency/step-5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const result = await res.json().catch(() => ({}))
        setError(result.error || 'Ein Fehler ist aufgetreten')
        return
      }
      router.push(addEditParam('/onboarding/agency/step-5'))
    } catch (e) {
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
              AGENTUR-EINRICHTUNG – SCHRITT 4/6
            </div>
          </div>
        </div>
      </nav>

      <div className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-thin tracking-wider text-gray-800 mb-6">LEISTUNGEN</h1>
            <div className="w-24 h-px bg-pink-500 mx-auto mb-8"></div>
            <p className="text-lg font-light tracking-wide text-gray-600 max-w-md mx-auto mb-4">Services – Schritt 4 von 6</p>
            <div className="flex justify-center">
              <Badge className="bg-pink-500 text-white font-light tracking-widest px-4 py-1 rounded-none">SCHRITT 4/6</Badge>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
            {error && (
              <div className="p-4 text-sm font-light text-red-600 bg-red-50 border border-red-200">{error}</div>
            )}

            <div className="space-y-3">
              <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Leistungen & Services (Mehrfachauswahl) *</Label>
              <Controller
                name="services"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    options={AGENCY_SERVICES_DE}
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder="Wähle, was eure Agentur anbietet (z. B. Outcall, Dinner-Date, GFE)"
                    searchPlaceholder="Nach Leistungen suchen..."
                    className="w-full"
                  />
                )}
              />
              {errors.services && (
                <p className="text-xs font-light text-red-600 mt-1">{errors.services.message as string}</p>
              )}
              <p className="text-xs text-gray-500">Du kannst mehrere Optionen wählen. Die Liste ist erweiterbar.</p>

              {selectedValues.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedValues.map((val) => (
                    <span
                      key={val}
                      className="px-2 py-1 text-xs font-light border border-gray-200 text-gray-700 rounded-none"
                    >
                      {labelByValue.get(val) ?? val}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-6 pt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(addEditParam('/onboarding/agency/step-3'))}
                className="flex-1 border-gray-300 text-gray-600 font-light tracking-widest py-4 text-sm uppercase hover:border-pink-500 hover:text-pink-500 rounded-none"
              >
                Zurück
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-4 text-sm uppercase rounded-none"
              >
                {isLoading ? 'Speichern...' : 'Weiter zu Schritt 5'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { escortOnboardingStep3Schema } from '@/lib/validations'
import RichTextEditor from '@/components/ui/rich-text-editor'
import { useEffect, useState } from 'react'

type EscortStep3Form = z.infer<typeof escortOnboardingStep3Schema>

export default function EscortOnboardingStep3() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get('edit') === '1'
  const addEditParam = (href: string) => (isEditMode ? `${href}?edit=1` : href)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { control, handleSubmit, reset, formState: { errors } } = useForm<EscortStep3Form>({
    resolver: zodResolver(escortOnboardingStep3Schema),
    defaultValues: {
      description: ''
    }
  })

  // Prefill in edit mode
  useEffect(() => {
    let active = true
    const load = async () => {
      if (!isEditMode) return
      try {
        const res = await fetch('/api/onboarding/escort/step-3')
        if (!res.ok) return
        const data = await res.json()
        if (!active) return
        reset({ description: data?.description || '' })
      } catch {
        // optional prefill
      }
    }
    load()
    return () => { active = false }
  }, [isEditMode, reset])

  const onSubmit = async (data: EscortStep3Form) => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/onboarding/escort/step-3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const result = await res.json().catch(() => ({}))
        setError(result.error || 'Ein Fehler ist aufgetreten')
        return
      }
      router.push(addEditParam('/onboarding/escort/step-4'))
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
              ESCORT-EINRICHTUNG – SCHRITT 3/7
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-thin tracking-wider text-gray-800 mb-6">BESCHREIBUNG</h1>
            <div className="w-24 h-px bg-pink-500 mx-auto mb-8"></div>
            <p className="text-lg font-light tracking-wide text-gray-600 max-w-md mx-auto mb-4">
              Über dich – Schritt 3 von 7
            </p>
            <div className="flex justify-center">
              <Badge className="bg-pink-500 text-white font-light tracking-widest px-4 py-1 rounded-none">SCHRITT 3/7</Badge>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
            {error && (
              <div className="p-4 text-sm font-light text-red-600 bg-red-50 border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <label className="text-xs font-light tracking-widest text-gray-800 uppercase">Beschreibung *</label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Beschreibe dich, deine Persönlichkeit und was dich besonders macht…"
                    className="w-full"
                  />
                )}
              />
              {errors.description && (
                <p className="text-xs font-light text-red-600 mt-1">{errors.description.message as string}</p>
              )}
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
                {isLoading ? 'Speichern…' : 'Weiter zu Schritt 4'}
              </Button>
            </div>
          </form>

          {/* Actions moved into form */}
        </div>
      </div>
    </div>
  )
}

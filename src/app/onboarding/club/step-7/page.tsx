'use client'

import Link from 'next/link'
import Script from 'next/script'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { businessOnboardingStep7Schema } from '@/lib/validations'

type Step7Form = z.infer<typeof businessOnboardingStep7Schema>

export default function ClubOnboardingStep7() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get('edit') === '1'
  const addEditParam = (href: string) => (isEditMode ? `${href}?edit=1` : href)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [mapsReady, setMapsReady] = useState(false)

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<Step7Form>({
    resolver: zodResolver(businessOnboardingStep7Schema),
    defaultValues: { address: '', city: '', country: '', zipCode: '', location: undefined }
  })

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const autocompleteRef = useRef<any>(null)
  const addressInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!isEditMode) return
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/onboarding/club/step-7')
        if (!res.ok) return
        const data = await res.json()
        if (!active) return
        reset({
          address: data.address || '',
          city: data.city || '',
          country: data.country || '',
          zipCode: data.zipCode || '',
          location: data.location || undefined,
        })
        if (data?.location && mapsReady) {
          initMap(data.location.lat, data.location.lng)
        }
      } catch {}
    })()
    return () => { active = false }
  }, [reset, mapsReady, isEditMode])

  const onMapsLoaded = () => {
    setMapsReady(true)
    initAutocomplete()
  }

  function initMap(lat: number, lng: number) {
    if (!mapContainerRef.current) return
    const center = { lat, lng }
    const g = (window as any).google
    const usesAdvancedMarker = !!g?.maps?.marker?.AdvancedMarkerElement
    if (!mapRef.current) {
      mapRef.current = new g.maps.Map(mapContainerRef.current, { center, zoom: 14, mapId: 'onboarding-club-step7', disableDefaultUI: true })
    } else {
      mapRef.current.setCenter(center)
    }
    if (usesAdvancedMarker) {
      if (markerRef.current) markerRef.current.map = null as any
      markerRef.current = new g.maps.marker.AdvancedMarkerElement({ map: mapRef.current, position: center })
    } else {
      // @ts-ignore
      const _ = new g.maps.Marker({ position: center, map: mapRef.current })
    }
  }

  function initAutocomplete() {
    if (!addressInputRef.current || !(window as any).google?.maps?.places) return
    if (autocompleteRef.current) return
    const g = (window as any).google
    const ac = new g.maps.places.Autocomplete(addressInputRef.current as HTMLInputElement, { fields: ['formatted_address', 'geometry', 'place_id', 'address_components'] })
    autocompleteRef.current = ac
    ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      if (!place || !place.geometry || !place.geometry.location) return
      const location = place.geometry.location
      const comps = place.address_components || []
      let city = ''
      let zip = ''
      let country = ''
      for (const c of comps) {
        if (c.types.includes('locality')) city = c.long_name
        else if (c.types.includes('postal_town')) city = c.long_name
        else if (c.types.includes('administrative_area_level_2') && !city) city = c.long_name
        if (c.types.includes('postal_code')) zip = c.long_name
        if (c.types.includes('country')) country = c.long_name
      }
      const lat = typeof location.lat === 'function' ? location.lat() : (location as any).lat
      const lng = typeof location.lng === 'function' ? location.lng() : (location as any).lng
      setValue('address', place.formatted_address || addressInputRef.current?.value || '')
      setValue('city', city)
      setValue('zipCode', zip)
      setValue('country', country)
      setValue('location', { lat, lng, placeId: place.place_id, formattedAddress: place.formatted_address })
      initMap(lat, lng)
    })
  }

  async function onSubmit(values: Step7Form) {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/onboarding/club/step-7', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Speichern fehlgeschlagen')
      }
      router.push(addEditParam('/onboarding'))
    } catch (e: any) {
      setError(e.message || 'Unbekannter Fehler')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <Script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,marker&language=de`} strategy="afterInteractive" onLoad={onMapsLoaded} />
      )}
      <nav className="absolute top-0 w-full z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <Link href={addEditParam('/onboarding')} className="flex items-center text-sm font-light tracking-widest text-gray-600 hover:text-pink-500 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              ZURÜCK ZUM ONBOARDING
            </Link>
            <div className="text-sm font-light tracking-widest text-gray-600">CLUB-EINRICHTUNG – SCHRITT 7/7</div>
          </div>
        </div>
      </nav>

      <div className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-thin tracking-wider text-gray-800 mb-6">STANDORT</h1>
            <div className="w-24 h-px bg-pink-500 mx-auto mb-8"></div>
            <p className="text-lg font-light tracking-wide text-gray-600 max-w-md mx-auto mb-4">Adresse, Stadt, Land – Schritt 7 von 7</p>
            <div className="flex justify-center"><Badge className="bg-pink-500 text-white font-light tracking-widest px-4 py-1 rounded-none">SCHRITT 7/7</Badge></div>
          </div>

          <form id="club-step7-form" onSubmit={handleSubmit(onSubmit)} className="p-6 border bg-gray-50 text-sm text-gray-700">
            <div className="grid gap-4">
              <div>
                <Label className="text-xs font-light tracking-widest text-gray-700">ADRESSE</Label>
                <Input
                  {...register('address')}
                  ref={(el) => { addressInputRef.current = el; /* @ts-ignore */ register('address').ref?.(el) }}
                  placeholder="Straße, Hausnummer, Ort"
                  className="rounded-none mt-2"
                />
                {errors.address && (<p className="text-xs font-light text-red-600 mt-1">{errors.address.message as string}</p>)}
                {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (<p className="text-xs text-amber-600 mt-1">Hinweis: Setze NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local, um Autocomplete zu aktivieren.</p>)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-light tracking-widest text-gray-700">STADT</Label>
                  <Input {...register('city')} placeholder="z. B. Berlin" className="rounded-none mt-2" />
                  {errors.city && <p className="text-xs font-light text-red-600 mt-1">{errors.city.message as string}</p>}
                </div>
                <div>
                  <Label className="text-xs font-light tracking-widest text-gray-700">PLZ</Label>
                  <Input {...register('zipCode')} placeholder="z. B. 10115" className="rounded-none mt-2" />
                  {errors.zipCode && <p className="text-xs font-light text-red-600 mt-1">{errors.zipCode.message as string}</p>}
                </div>
                <div>
                  <Label className="text-xs font-light tracking-widest text-gray-700">LAND</Label>
                  <Input {...register('country')} placeholder="z. B. Deutschland" className="rounded-none mt-2" />
                  {errors.country && <p className="text-xs font-light text-red-600 mt-1">{errors.country.message as string}</p>}
                </div>
              </div>

              <div>
                <Label className="text-xs font-light tracking-widest text-gray-700">KARTE</Label>
                <div ref={mapContainerRef} className="mt-2 h-64 w-full border bg-white" />
                <p className="text-xs font-light text-gray-500 mt-2">Wähle eine Adresse über die Suche aus, um die Karte zu zentrieren.</p>
              </div>

              {error && (<div className="text-xs font-light text-red-600 mt-2">{error}</div>)}
            </div>
          </form>

          <div className="flex flex-col sm:flex-row gap-6 pt-8">
            <Button type="button" variant="outline" onClick={() => router.push(addEditParam('/onboarding'))} className="flex-1 border-gray-300 text-gray-600 font-light tracking-widest py-4 text-sm uppercase hover:border-pink-500 hover:text-pink-500 rounded-none">Zur Übersicht</Button>
            <Button type="submit" form="club-step7-form" disabled={isLoading} className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-light tracking-widest py-4 text-sm uppercase rounded-none">{isLoading ? 'Speichern …' : 'Fertig & Zur Übersicht'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

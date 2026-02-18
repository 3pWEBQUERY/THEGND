"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { EscortItem } from '@/types/escort'

export type EscortsResultsMapProps = {
  items: EscortItem[] | null
  loading: boolean
  total: number | null
}

// Load Google Maps JS API dynamically using NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
function useGoogleMaps() {
  const [ready, setReady] = useState(false)
  const hasKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!(hasKey)) return
    if ((window as any).google?.maps) {
      setReady(true)
      return
    }
    const id = 'google-maps-js'
    if (document.getElementById(id)) {
      // Already loading; wait until available
      const check = setInterval(() => {
        if ((window as any).google?.maps) {
          clearInterval(check)
          setReady(true)
        }
      }, 200)
      return () => clearInterval(check)
    }
    const script = document.createElement('script')
    script.id = id
    script.async = true
    script.defer = true
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    script.onload = () => setReady(true)
    script.onerror = () => setReady(false)
    document.body.appendChild(script)
  }, [hasKey])

  return { ready, hasKey }
}

export default function EscortsResultsMap({ items, loading, total }: EscortsResultsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { ready: mapsReady, hasKey } = useGoogleMaps()
  const coords = useMemo(() => (items || []).filter((e) => Number.isFinite(e.latitude) && Number.isFinite(e.longitude)) as Array<EscortItem & { latitude: number, longitude: number }>, [items])

  useEffect(() => {
    if (!mapsReady) return
    if (!containerRef.current) return
    const google = (window as any).google
    if (!google?.maps) return

    // Clean up any previous map instance
    // @ts-ignore
    if (containerRef.current._gm_map) {
      try {
        // @ts-ignore
        containerRef.current._gm_map = null
        containerRef.current.innerHTML = ''
      } catch {}
    }

    const defaultCenter = { lat: 51.1657, lng: 10.4515 } // Germany
    const map = new google.maps.Map(containerRef.current, {
      center: defaultCenter,
      zoom: coords.length > 0 ? 6 : 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    })
    // @ts-ignore
    containerRef.current._gm_map = map

    const markers: any[] = []
    const bounds = new google.maps.LatLngBounds()
    if (coords.length > 0) {
      coords.forEach((e) => {
        const position = { lat: e.latitude, lng: e.longitude }
        const marker = new google.maps.Marker({ position, map })
        const slug = (e.name || 'escort').toString().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
        const href = `/escorts/${e.id}/${slug}`
        const imgHtml = e.image
          ? `<div style="margin-bottom:8px;"><img src="${e.image}" alt="${(e.name || '').toString()}" style="width:160px;height:120px;object-fit:cover;border:1px solid #e5e7eb;" /></div>`
          : ''
        const content = `<div style="font: 12px system-ui, -apple-system;max-width:180px;">
          ${imgHtml}
          <div style="font-weight:600;letter-spacing:0.08em;">${(e.name || '').toString().toUpperCase()}</div>
          <div style="color:#374151;">${e.locationFormatted || e.city || e.country || ''}</div>
          <div style="margin-top:6px;"><a href="${href}" style="color:#db2777;text-decoration:underline;">Profil ansehen</a></div>
        </div>`
        const info = new google.maps.InfoWindow({ content })
        marker.addListener('click', () => {
          info.open({ anchor: marker, map })
        })
        markers.push(marker)
        bounds.extend(position)
      })
      try {
        if (coords.length === 1) {
          // One marker: focus closer on it
          map.setCenter(bounds.getCenter())
          map.setZoom(14)
        } else {
          // Multiple markers: fit, but not too far; smaller padding and higher max zoom
          map.fitBounds(bounds, { top: 20, right: 20, bottom: 20, left: 20 })
          const MAX_ZOOM = 14
          const once = map.addListener('idle', () => {
            try {
              if (typeof map.getZoom === 'function' && map.getZoom() > MAX_ZOOM) {
                map.setZoom(MAX_ZOOM)
              }
            } finally {
              // remove this one-time listener
              // @ts-ignore
              if (once && typeof once.remove === 'function') once.remove()
            }
          })
        }
      } catch {}
    }

    return () => {
      try { markers.forEach((m) => m.setMap(null)) } catch {}
    }
  }, [mapsReady, coords])

  return (
    <section className="py-6 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-light tracking-widest text-gray-800">ERGEBNISSE (MAP)</h2>
          {typeof total === 'number' && (
            <span className="text-xs text-gray-500">{total} Treffer</span>
          )}
        </div>
        {!hasKey && (
          <div className="text-sm text-rose-600 mb-3">
            Google Maps API Key fehlt. Bitte setze <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in deiner Umgebung.
          </div>
        )}
        {!loading && coords.length === 0 && (
          <div className="text-sm text-gray-600 mb-4">
            Für die aktuelle Auswahl sind keine Koordinaten hinterlegt. Wechsle zur Listen- oder Grid-Ansicht.
          </div>
        )}
        <div className="-mx-6 md:mx-0">
          <div ref={containerRef} className="w-full h-[60vh] border border-gray-200" />
        </div>
      </div>
    </section>
  )
}

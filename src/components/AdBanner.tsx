"use client"

import { useEffect, useMemo, useState } from 'react'

type Props = {
  placement?: string
  className?: string
}

type ActiveAsset = { id: string; url: string; targetUrl?: string | null }

export default function AdBanner({ placement = 'default', className }: Props) {
  const [adFree, setAdFree] = useState<boolean | null>(null)
  const [asset, setAsset] = useState<ActiveAsset | null>(null)

  // Map local placement to API enum key
  const apiPlacement = useMemo(() => {
    const p = (placement || '').toUpperCase()
    if (p === 'HOME_TOP') return 'HOME_TOP'
    if (p === 'HOME_MID') return 'HOME_MID'
    if (p === 'HOME_BOTTOM') return 'HOME_BOTTOM'
    if (p === 'HOME_BANNER') return 'HOME_BANNER'
    if (p === 'HOME_TILE') return 'HOME_TILE'
    if (p === 'RESULTS_TOP') return 'RESULTS_TOP'
    if (p === 'SIDEBAR') return 'SIDEBAR'
    if (p === 'SPONSORED_POST') return 'SPONSORED_POST'
    // Common aliases
    if (placement === 'home_top') return 'HOME_TOP'
    if (placement === 'home_mid') return 'HOME_MID'
    if (placement === 'home_bottom') return 'HOME_BOTTOM'
    return 'HOME_BANNER'
  }, [placement])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/perks/me/active?perk=AD_FREE_30D&days=30`, { cache: 'no-store' })
        if (!res.ok) { if (!cancelled) setAdFree(false); return }
        const data = await res.json()
        if (!cancelled) setAdFree(!!data?.active)
      } catch {
        if (!cancelled) setAdFree(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // Only fetch if not ad-free
        if (adFree) { setAsset(null); return }
        const url = `/api/marketing/active?placement=${encodeURIComponent(apiPlacement)}&limit=1`
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) { if (!cancelled) setAsset(null); return }
        const data = await res.json().catch(() => ({}))
        const first = Array.isArray(data?.assets) && data.assets.length > 0 ? data.assets[0] : null
        if (!cancelled) setAsset(first ? { id: first.id, url: first.url, targetUrl: first.targetUrl ?? null } : null)
      } catch {
        if (!cancelled) setAsset(null)
      }
    })()
    return () => { cancelled = true }
  }, [apiPlacement, adFree])

  if (adFree === null) return null
  if (adFree) return null

  // Render active asset if available
  if (asset) {
    return (
      <div className={className}>
        <div className="relative">
          {asset.targetUrl ? (
            <a href={asset.targetUrl} target="_blank" rel="noopener noreferrer" className="group block border border-gray-200 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset.url} alt="Anzeige" className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset.url} alt="Anzeige" className="w-full h-auto object-cover border border-gray-200" />
          )}
          <div className="pointer-events-none absolute top-2 left-2 z-10">
            <span className="inline-block bg-pink-500 text-white text-[10px] uppercase tracking-widest px-2 py-0.5">WERBUNG</span>
          </div>
        </div>
      </div>
    )
  }

  // Placeholder ad block
  return (
    <div className={className}>
      <div className="w-full border border-gray-200 bg-gray-50 py-8 text-center text-sm text-gray-600 tracking-widest">
        ANZEIGE • PLATZIERUNG: {placement}
        <div className="mt-2 text-xs tracking-normal text-gray-500">
          Hier könnte Ihre Werbung stehen. <a href="/auth/signup" className="text-pink-600 hover:underline">Jetzt registrieren</a>, um Werbeplätze zu buchen.
        </div>
      </div>
    </div>
  )
}

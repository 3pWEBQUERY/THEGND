import { useEffect, useState } from 'react'

export type PublicSettings = {
  name: string
  tagline: string
  logo: { kind: 'text' | 'image'; text: string; imageUrl: string }
  faviconUrl: string
  primaryLocale: string
  timezone: string
  dateFormat: string
  seo: {
    titleTemplate: string
    metaDescription: string
    keywords: string
    ogImageUrl: string
    robotsIndex: boolean
    sitemapEnabled: boolean
  }
}

let cached: PublicSettings | null = null
let inflight: Promise<PublicSettings | null> | null = null

async function fetchPublicSettings(): Promise<PublicSettings | null> {
  try {
    const res = await fetch('/api/settings/public', { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export function usePublicSettings() {
  const [data, setData] = useState<PublicSettings | null>(cached)

  useEffect(() => {
    let mounted = true
    if (cached) {
      setData(cached)
      return
    }
    if (!inflight) inflight = fetchPublicSettings()
    inflight.then((val) => {
      if (!mounted) return
      cached = val
      setData(val)
      inflight = null
    })
    return () => {
      mounted = false
    }
  }, [])

  return data
}

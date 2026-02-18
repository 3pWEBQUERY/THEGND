'use client'

import React, { createContext, useContext, useMemo, useState } from 'react'

export type PublicSettings = {
  name: string
  tagline: string
  titleSeparator: string
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

const Ctx = createContext<PublicSettings | null>(null)

export function usePublicSettingsCtx() {
  return useContext(Ctx)
}

export default function PublicSettingsProvider({ initial, children }: { initial: PublicSettings; children: React.ReactNode }) {
  const [value] = useState<PublicSettings>(initial)
  const memo = useMemo(() => value, [value])
  return <Ctx.Provider value={memo}>{children}</Ctx.Provider>
}

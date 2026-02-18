"use client"

import React from 'react'

export default function ProfileHero({ heroUrl, mobileLayout = 'cover' }: { heroUrl?: string | null; mobileLayout?: 'cover' | 'half' | 'compact' }) {
  if (!heroUrl) return null
  const heroHeightClass = (() => {
    switch (mobileLayout) {
      case 'half':
        return 'h-[35vh] min-h-[240px] sm:h-[50vh] sm:min-h-[320px]'
      case 'compact':
        return 'h-[28vh] min-h-[200px] sm:h-[45vh] sm:min-h-[300px]'
      default:
        return 'h-[50vh] min-h-[300px] sm:h-[60vh] sm:min-h-[360px]'
    }
  })()
  return (
    <section className={`relative ${heroHeightClass}`}>
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroUrl} alt="Profil Hero" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/30" />
      </div>
      <div className="relative z-10 h-full flex items-end justify-start px-6">
        {/* optional caption */}
      </div>
    </section>
  )
}

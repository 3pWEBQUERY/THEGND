import React from 'react'
import { prisma } from '@/lib/prisma'

export default async function ProfilePublicHero({ userId }: { userId: string }) {
  // Read optional banner URL from DB
  let bannerUrl: string | null = null
  let name: string | null = null
  let city: string | null = null
  let country: string | null = null
  try {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { profile: { select: { preferences: true, displayName: true, city: true, country: true } } } })
    const prefsRaw = (u as any)?.profile?.preferences
    if (prefsRaw) {
      const prefs = typeof prefsRaw === 'string' ? JSON.parse(prefsRaw) : prefsRaw
      const url = prefs?.publicHero?.imageUrl
      if (typeof url === 'string' && url.trim()) bannerUrl = url.trim()
    }
    name = (u as any)?.profile?.displayName || null
    city = (u as any)?.profile?.city || null
    country = (u as any)?.profile?.country || null
  } catch {}

  // Match escorts detail hero height: mobile full viewport, md ~50vh
  return (
    <section className={`relative h-screen h-[100svh] md:h-[50vh] md:min-h-[400px]`}> 
      {/* Optional background image */}
      {bannerUrl && (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bannerUrl} alt="Profil Banner" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Foreground content */}
      <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
        <div>
          <h1 className="text-5xl md:text-6xl font-thin tracking-wider text-white">{(name ? (name.toUpperCase?.() ?? name) : 'PROFIL')}</h1>
          {(city || country) && (
            <p className="text-sm text-gray-200">{city || country}</p>
          )}
          <div className="w-24 h-px bg-pink-500 mx-auto mt-3" />
        </div>
      </div>
    </section>
  )
}

'use client'

import { useState } from 'react'
import { uploadFiles } from '@/utils/uploadthing'

export function useHeroPreferences(
  profile: any,
  heroMobileLayout: 'cover' | 'half' | 'compact',
  setHeroMobileLayout: (v: 'cover' | 'half' | 'compact') => void,
  setProfileData: (updater: any) => void
) {
  const [savingHeroPrefs, setSavingHeroPrefs] = useState(false)
  const [heroUploads, setHeroUploads] = useState<string[]>([])
  const [uploadingHero, setUploadingHero] = useState(false)

  const heroUrl: string | null = ((profile as any)?.preferences?.hero?.imageUrl) || null

  const handleSetHeroImage = async (url: string) => {
    if (!profile) return
    try {
      const currentPrefs = ((profile as any)?.preferences) || {}
      const nextPrefs = { ...currentPrefs, hero: { ...(currentPrefs.hero || {}), imageUrl: url } }
      const resp = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileData: { preferences: nextPrefs } }),
      })
      if (!resp.ok) {
        console.error('Fehler beim Setzen des Hero-Bilds')
        return
      }
      setProfileData((prev: any) => {
        if (!prev) return prev
        const next = {
          ...prev,
          user: {
            ...prev.user,
            profile: { ...(prev.user.profile as any), preferences: nextPrefs } as any,
          },
        }
        return next
      })
    } catch (e) {
      console.error('Hero-Bild setzen fehlgeschlagen:', e)
    }
  }

  const handleUploadHero = async (file: File) => {
    try {
      setUploadingHero(true)
      const res = await uploadFiles('postImages', { files: [file] })
      const url = Array.isArray(res) ? (res[0]?.url as string | undefined) : undefined
      if (url) {
        setHeroUploads((prev: string[]) => [url, ...prev])
        await handleSetHeroImage(url)
      }
    } catch (e) {
      console.error('Hero-Upload fehlgeschlagen:', e)
    } finally {
      setUploadingHero(false)
    }
  }

  const handleSaveHeroPrefs = async () => {
    if (!profile) return
    try {
      setSavingHeroPrefs(true)
      const currentPrefs = ((profile as any)?.preferences) || {}
      const nextPrefs = {
        ...currentPrefs,
        hero: { ...(currentPrefs.hero || {}), mobileLayout: heroMobileLayout },
      }
      const resp = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileData: { preferences: nextPrefs } }),
      })
      if (!resp.ok) {
        console.error('Fehler beim Speichern der Ansicht-Einstellungen')
        return
      }
      setProfileData((prev: any) => {
        if (!prev) return prev
        const next = {
          ...prev,
          user: {
            ...prev.user,
            profile: { ...(prev.user.profile as any), preferences: nextPrefs } as any,
          },
        }
        return next
      })
    } catch (e) {
      console.error('Speichern fehlgeschlagen:', e)
    } finally {
      setSavingHeroPrefs(false)
    }
  }

  return {
    heroUrl,
    heroUploads,
    setHeroUploads,
    uploadingHero,
    savingHeroPrefs,
    handleSetHeroImage,
    handleUploadHero,
    handleSaveHeroPrefs,
    heroMobileLayout,
    setHeroMobileLayout,
  }
}

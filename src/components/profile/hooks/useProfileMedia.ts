'use client'

import { useCallback, useMemo, useState } from 'react'

export function useProfileMedia(profile: any, reload: () => Promise<void>) {
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)
  const [settingAvatarUrl, setSettingAvatarUrl] = useState<string | null>(null)

  const mediaItems = useMemo(() => {
    const rawMedia = (profile as any)?.media ?? []
    const rawGallery = profile?.gallery ?? []
    const normalizedFromMedia = Array.isArray(rawMedia)
      ? rawMedia
          .map((item: any) => {
            if (!item) return null
            if (typeof item === 'string') return { type: 'image', url: item, source: 'media' as const }
            if (item.url) {
              const isVideo =
                item.type === 'video' ||
                !!item.video ||
                (typeof item.url === 'string' && /\.(mp4|webm|ogg)$/i.test(item.url))
              return {
                type: isVideo ? 'video' : 'image',
                url: item.url,
                title: item.title,
                description: item.description,
                thumbnail: item.thumbnail,
                source: 'media' as const,
              }
            }
            if (item.image) return { type: 'image', url: item.image, source: 'media' as const }
            if (item.video) return { type: 'video', url: item.video, thumbnail: item.thumbnail, source: 'media' as const }
            return null
          })
          .filter(Boolean)
      : []
    const normalizedFromGallery = Array.isArray(rawGallery)
      ? (rawGallery as string[]).map((url) => ({ type: 'image' as const, url, source: 'gallery' as const }))
      : []
    return [...(normalizedFromMedia as any[]), ...normalizedFromGallery]
  }, [profile])

  const handleDeleteMedia = useCallback(
    async (item: any, index: number) => {
      if (!profile) return
      setDeletingIndex(index)
      try {
        const currentMediaRaw = Array.isArray((profile as any).media) ? [...(profile as any).media] : []
        const currentGalleryRaw = Array.isArray(profile.gallery) ? [...profile.gallery] : []

        let newMediaRaw = currentMediaRaw
        let newGalleryRaw = currentGalleryRaw

        if (item.source === 'media') {
          newMediaRaw = currentMediaRaw.filter((m: any) => {
            if (!m) return false
            if (typeof m === 'string') return m !== item.url
            if (m.url) return m.url !== item.url
            if (m.image) return m.image !== item.url
            if (m.video) return m.video !== item.url
            return true
          })
        } else if (item.source === 'gallery') {
          newGalleryRaw = currentGalleryRaw.filter((url: string) => url !== item.url)
        }

        const resp = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileData: { media: newMediaRaw, gallery: newGalleryRaw } }),
        })

        if (!resp.ok) {
          console.error('Fehler beim Aktualisieren des Profils')
          return
        }

        await reload()
      } catch (err) {
        console.error('Löschen fehlgeschlagen:', err)
      } finally {
        setDeletingIndex(null)
      }
    },
    [profile, reload]
  )

  const handleSetAvatar = useCallback(
    async (url: string) => {
      if (!profile) return
      try {
        setSettingAvatarUrl(url)
        const resp = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileData: { avatar: url } }),
        })
        if (!resp.ok) {
          console.error('Fehler beim Setzen des Avatars')
          return
        }
      } catch (e) {
        console.error('Avatar-Update fehlgeschlagen:', e)
      } finally {
        setSettingAvatarUrl(null)
      }
    },
    [profile]
  )

  return { mediaItems, deletingIndex, settingAvatarUrl, handleDeleteMedia, handleSetAvatar }
}

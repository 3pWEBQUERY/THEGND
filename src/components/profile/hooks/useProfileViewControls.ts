'use client'

import { useState } from 'react'

export function useProfileViewControls(selectedView: 'STANDARD' | 'ALT1' | 'ALT2' | 'FULL_SIDE' | null) {
  const [savingView, setSavingView] = useState(false)
  const [savedViewAt, setSavedViewAt] = useState<number | null>(null)

  const handleSaveProfileView = async () => {
    if (!selectedView) return
    try {
      setSavingView(true)
      const resp = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileData: { profileView: selectedView } }),
      })
      if (!resp.ok) {
        console.error('Fehler beim Speichern der Profilansicht')
        return
      }
      setSavedViewAt(Date.now())
    } catch (e) {
      console.error('Profilansicht speichern fehlgeschlagen:', e)
    } finally {
      setSavingView(false)
    }
  }

  return { savingView, savedViewAt, handleSaveProfileView }
}

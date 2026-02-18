'use client'

import React from 'react'
import ProfileVisitorsModal from '@/components/profile/ProfileVisitorsModal'
import ProfileMediaLightbox from '@/components/profile/ProfileMediaLightbox'

export default function ProfileOverlays(props: {
  showVisitors: boolean
  onCloseVisitors: () => void
  visitors: { id: string; displayName: string; avatar: string | null; visitedAt: string }[] | null
  anonCount: number
  loadingVisitors: boolean
  visitorDays: number
  onDaysChange: (n: number) => void
  lightboxIndex: number | null
  mediaItems: any[]
  onCloseLightbox: () => void
}) {
  const {
    showVisitors,
    onCloseVisitors,
    visitors,
    anonCount,
    loadingVisitors,
    visitorDays,
    onDaysChange,
    lightboxIndex,
    mediaItems,
    onCloseLightbox,
  } = props

  return (
    <>
      <ProfileVisitorsModal
        open={showVisitors}
        onClose={onCloseVisitors}
        visitors={visitors}
        anonCount={anonCount}
        loading={loadingVisitors}
        days={visitorDays}
        onDaysChange={onDaysChange}
      />
      <ProfileMediaLightbox
        open={lightboxIndex !== null && !!mediaItems[lightboxIndex]}
        item={lightboxIndex !== null && mediaItems[lightboxIndex] ? {
          type: (mediaItems[lightboxIndex] as any).type,
          url: (mediaItems[lightboxIndex] as any).url,
          thumbnail: (mediaItems[lightboxIndex] as any).thumbnail,
        } : null}
        onClose={onCloseLightbox}
      />
    </>
  )
}

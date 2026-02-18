'use client'

import React from 'react'
import ProfileVisitorsModal from '@/components/profile/ProfileVisitorsModal'

export default function ProfileNotFound(props: {
  showVisitors: boolean
  onCloseVisitors: () => void
  visitors: { id: string; displayName: string; avatar: string | null; visitedAt: string }[] | null
  anonCount: number
  loading: boolean
  days: number
  onDaysChange: (n: number) => void
}) {
  const { showVisitors, onCloseVisitors, visitors, anonCount, loading, days, onDaysChange } = props
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="text-sm font-light tracking-widest text-red-600">PROFIL NICHT GEFUNDEN</div>
      <ProfileVisitorsModal
        open={showVisitors}
        onClose={onCloseVisitors}
        visitors={visitors}
        anonCount={anonCount}
        loading={loading}
        days={days}
        onDaysChange={onDaysChange}
      />
    </div>
  )
}

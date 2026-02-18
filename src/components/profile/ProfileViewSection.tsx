'use client'

import React from 'react'
import ProfileViewSelector from '@/components/profile/ProfileViewSelector'

export default function ProfileViewSection(props: {
  isOwnProfile: boolean
  userType: string
  selectedView: 'STANDARD' | 'ALT1' | 'ALT2' | 'FULL_SIDE' | null
  onChange: (v: 'STANDARD' | 'ALT1' | 'ALT2' | 'FULL_SIDE') => void
  onSave: () => Promise<void> | void
  saving: boolean
  savedAt: number | null
  onEdit?: () => void
}) {
  const { isOwnProfile, userType, selectedView, onChange, onSave, saving, savedAt, onEdit } = props
  if (!isOwnProfile || userType === 'MEMBER') return null
  return (
    <ProfileViewSelector
      selected={selectedView}
      onChange={(v) => onChange(v)}
      onSave={onSave}
      saving={saving}
      savedAt={savedAt}
      onEdit={onEdit}
    />
  )
}

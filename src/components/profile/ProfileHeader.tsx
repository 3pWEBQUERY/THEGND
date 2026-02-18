"use client"

import React from 'react'
import ProfileHeaderLeft from '@/components/profile/ProfileHeaderLeft'
import ProfileIdentity from '@/components/profile/ProfileIdentity'
import ProfileStats from '@/components/profile/ProfileStats'

export default function ProfileHeader(props: {
  isOwnProfile: boolean
  avatarUrl?: string
  displayName: string
  avatarSize: number | null
  onEdit: () => void
  onOpenVisitors: () => void
  editBtnRef: React.RefObject<HTMLButtonElement | null>
  userTypeLabel: string
  profile: any
  formattedLocation: string
  postsCount: number
  followersCount: number
  followingCount: number
  storiesCount: number
  showBannerButton?: boolean
  onOpenBanner?: () => void
}) {
  const {
    isOwnProfile,
    avatarUrl,
    displayName,
    avatarSize,
    onEdit,
    onOpenVisitors,
    editBtnRef,
    userTypeLabel,
    profile,
    formattedLocation,
    postsCount,
    followersCount,
    followingCount,
    storiesCount,
    showBannerButton,
    onOpenBanner,
  } = props

  return (
    <div className="bg-white border border-gray-100 rounded-none">
      <div className="p-4 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Avatar and Basic Info */}
          <ProfileHeaderLeft
            isOwnProfile={isOwnProfile}
            avatarUrl={avatarUrl}
            displayName={displayName}
            avatarSize={avatarSize}
            onEdit={onEdit}
            onOpenVisitors={onOpenVisitors}
            editBtnRef={editBtnRef}
            showBannerButton={showBannerButton}
            onOpenBanner={onOpenBanner}
          />

          {/* Profile Details */}
          <ProfileIdentity
            displayName={displayName}
            userTypeLabel={userTypeLabel}
            profile={profile}
            formattedLocation={formattedLocation}
            isOwnProfile={isOwnProfile}
          />

          <ProfileStats
            postsCount={postsCount}
            followersCount={followersCount}
            followingCount={followingCount}
            storiesCount={storiesCount}
          />
        </div>
      </div>
    </div>
  )
}

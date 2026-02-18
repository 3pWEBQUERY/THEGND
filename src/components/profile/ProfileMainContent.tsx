'use client'

import React, { useEffect, useState } from 'react'
import ProfileHeader from '@/components/profile/ProfileHeader'
import ProfileOrgConnections from '@/components/profile/ProfileOrgConnections'
import ProfileViewSection from '@/components/profile/ProfileViewSection'
import ProfileTabs from '@/components/profile/ProfileTabs'
import ProfileOverlays from '@/components/profile/ProfileOverlays'
import ProfileBannerDrawer from '@/components/profile/ProfileBannerDrawer'
 

export default function ProfileMainContent(props: {

  // header basics
  isOwnProfile: boolean
  profile: any
  user: { posts: any[]; followers: any[]; following: any[]; stories: any[] }
  userType: string
  displayName: string
  formattedLocation: string
  avatarSize: number | null
  editBtnRef: React.RefObject<HTMLButtonElement | null>
  onEdit: () => void
  onOpenVisitors: () => void
  userTypeLabel: string

  // org connections
  showOrgSection: boolean
  joinCode: string
  setJoinCode: (v: string) => void
  joining: boolean
  onSubmitJoin: () => void
  loadingMyOrgs: boolean
  myOrgs: Array<{ id: string; userType: string; name: string; avatar: string | null; city: string | null; country: string | null }> | null
  unlinking: string | null
  onUnlink: (orgId: string) => void

  // view section
  selectedView: 'STANDARD' | 'ALT1' | 'ALT2' | 'FULL_SIDE' | null
  onChangeView: (v: 'STANDARD' | 'ALT1' | 'ALT2' | 'FULL_SIDE') => void
  onSaveView: () => Promise<void> | void
  savingView: boolean
  savedViewAt: number | null

  // tabs
  activeTab: string
  onChangeTab: (key: string) => void
  mediaItems: any[]
  settingAvatarUrl: string | null
  deletingIndex: number | null
  onSetAvatar: (url: string) => void
  onDeleteMedia: (item: any, index: number) => void
  onOpenLightbox: (index: number) => void
  visitors: any[]

  // overlays
  showVisitors: boolean
  onCloseVisitors: () => void
  anonCount: number
  loadingVisitors: boolean
  visitorDays: number
  onDaysChange: (n: number) => void
  lightboxIndex: number | null
  onCloseLightbox: () => void
}) {
  const {
    isOwnProfile,
    profile,
    user,
    userType,
    displayName,
    formattedLocation,
    avatarSize,
    editBtnRef,
    onEdit,
    onOpenVisitors,
    userTypeLabel,
    showOrgSection,
    joinCode,
    setJoinCode,
    joining,
    onSubmitJoin,
    loadingMyOrgs,
    myOrgs,
    unlinking,
    onUnlink,
    selectedView,
    onChangeView,
    onSaveView,
    savingView,
    savedViewAt,
    activeTab,
    onChangeTab,
    mediaItems,
    settingAvatarUrl,
    deletingIndex,
    onSetAvatar,
    onDeleteMedia,
    onOpenLightbox,
    visitors,
    showVisitors,
    onCloseVisitors,
    anonCount,
    loadingVisitors,
    visitorDays,
    onDaysChange,
    lightboxIndex,
    onCloseLightbox,
  } = props
  const [bannerOpen, setBannerOpen] = useState(false)
  const [avail, setAvail] = useState<boolean | null>(null)
  const [savingAvail, setSavingAvail] = useState(false)

  useEffect(() => {
    if (!isOwnProfile || userType !== 'ESCORT') return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/availability', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json().catch(() => ({}))
        if (!cancelled) setAvail(!!data?.available)
      } catch {}
    })()
    return () => { cancelled = true }
  }, [isOwnProfile, userType])

  const setAvailability = async (v: boolean) => {
    if (!isOwnProfile || userType !== 'ESCORT') return
    setSavingAvail(true)
    try {
      const res = await fetch('/api/availability', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ available: v }) })
      if (res.ok) {
        setAvail(v)
      }
    } catch {}
    setSavingAvail(false)
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto space-y-8 overflow-x-hidden">
        <ProfileHeader
          isOwnProfile={isOwnProfile}
          avatarUrl={profile?.avatar}
          displayName={displayName}
          avatarSize={avatarSize}
          onEdit={onEdit}
          onOpenVisitors={onOpenVisitors}
          editBtnRef={editBtnRef}
          userTypeLabel={userTypeLabel}
          profile={profile}
          formattedLocation={formattedLocation}
          postsCount={user.posts.length}
          followersCount={user.followers.length}
          followingCount={user.following.length}
          storiesCount={user.stories.length}
          showBannerButton={isOwnProfile && userType === 'MEMBER'}
          onOpenBanner={() => setBannerOpen(true)}
        />
        {showOrgSection && (
          <ProfileOrgConnections
            joinCode={joinCode}
            onChangeJoinCode={setJoinCode}
            joining={joining}
            onSubmitJoin={onSubmitJoin}
            loadingMyOrgs={loadingMyOrgs}
            myOrgs={myOrgs}
            unlinking={unlinking}
            onUnlink={onUnlink}
          />
        )}

        {isOwnProfile && userType === 'ESCORT' && (
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-4">VERFÜGBARKEIT</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAvailability(true)}
                disabled={savingAvail}
                className={`px-3 py-2 text-xs uppercase tracking-widest border ${avail ? 'border-emerald-600 text-emerald-700' : 'border-gray-300 text-gray-700'} hover:border-pink-500 hover:text-pink-600 disabled:opacity-50`}
              >
                VERFÜGBAR
              </button>
              <button
                onClick={() => setAvailability(false)}
                disabled={savingAvail}
                className={`px-3 py-2 text-xs uppercase tracking-widest border ${avail === false ? 'border-rose-600 text-rose-700' : 'border-gray-300 text-gray-600'} hover:border-pink-500 hover:text-pink-600 disabled:opacity-50`}
              >
                NICHT VERFÜGBAR
              </button>
            </div>
          </div>
        )}

        <ProfileViewSection
          isOwnProfile={isOwnProfile}
          userType={userType}
          selectedView={selectedView}
          onChange={onChangeView}
          onSave={onSaveView}
          saving={savingView}
          savedAt={savedViewAt}
        />

        <ProfileTabs
          active={activeTab}
          onChange={onChangeTab}
          profile={profile}
          userType={userType}
          user={user}
          displayName={displayName}
          avatar={profile?.avatar}
          mediaItems={mediaItems as any}
          isOwnProfile={isOwnProfile}
          settingAvatarUrl={settingAvatarUrl}
          deletingIndex={deletingIndex}
          onSetAvatar={onSetAvatar}
          onDelete={onDeleteMedia}
          onOpenLightbox={onOpenLightbox}
          visitors={visitors || []}
        />

        <ProfileOverlays
          showVisitors={showVisitors}
          onCloseVisitors={onCloseVisitors}
          visitors={visitors}
          anonCount={anonCount}
          loadingVisitors={loadingVisitors}
          visitorDays={visitorDays}
          onDaysChange={onDaysChange}
          lightboxIndex={lightboxIndex}
          mediaItems={mediaItems as any[]}
          onCloseLightbox={onCloseLightbox}
        />
        <ProfileBannerDrawer open={bannerOpen} onOpenChange={setBannerOpen} />
      </div>
    </div>
  )
}

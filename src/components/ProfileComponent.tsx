'use client'

import { useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getUserTypeDisplayName } from '@/lib/validations'
// removed unused prisma type imports
import { formatLocation } from '@/lib/utils'
// Sheet moved into ProfileHeroEditSheet component
import { useToast } from '@/components/ui/toast'
import ProfileLoading from '@/components/profile/ProfileLoading'
import { useProfileVisitors } from '@/components/profile/hooks/useProfileVisitors'
import { useProfileMedia } from '@/components/profile/hooks/useProfileMedia'
import { useProfileData } from '@/components/profile/hooks/useProfileData'
import { useOrgConnections } from '@/components/profile/hooks/useOrgConnections'
import ProfileNotFound from '@/components/profile/ProfileNotFound'
import type { ProfileData as ProfileDataType } from '@/components/profile/hooks/useProfileData'
import { useAvatarSize } from '@/components/profile/hooks/useAvatarSize'
import ProfileMainContent from '@/components/profile/ProfileMainContent'

// ProfileData type is imported from useProfileData

export default function ProfileComponent({ userId }: { userId?: string }) {
  const { data: session } = useSession()
  const router = useRouter()
  const { profileData, setProfileData, loading, fetchProfile, selectedView, setSelectedView } = useProfileData(userId)
  const [activeTab, setActiveTab] = useState('about')
  const editBtnRef = useRef<HTMLButtonElement | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [savingView, setSavingView] = useState(false)
  const [savedViewAt, setSavedViewAt] = useState<number | null>(null)
  // Visitors popup state
  const [showVisitors, setShowVisitors] = useState(false)
  const { visitors, anonCount, loadingVisitors, visitorDays, setVisitorDays } = useProfileVisitors(showVisitors, 30)
  // Escort join-with-code
  const { show } = useToast()


  const isOwnProfile = !userId || userId === session?.user?.id

  // ProfileData loading handled by useProfileData hook

  // Org connections hook
  const {
    joinCode,
    setJoinCode,
    joining,
    myOrgs,
    loadingMyOrgs,
    unlinking,
    handleSubmitJoin,
    unlinkOrg,
  } = useOrgConnections(!!profileData && isOwnProfile && profileData.user.userType === 'ESCORT', show)

  // Visitors logic moved to useProfileVisitors hook

  // Avatar-Größe per Hook ermitteln
  const avatarSize = useAvatarSize(isOwnProfile, profileData, editBtnRef)

  // fetchProfile now provided by useProfileData hook

  // Prepare profile for child hooks (must be before any early returns)
  const rawProfile = profileData?.user?.profile as any

  // Media logic hook (must be unconditional for stable hook order)
  const { mediaItems, deletingIndex, settingAvatarUrl, handleDeleteMedia, handleSetAvatar } = useProfileMedia(rawProfile, fetchProfile)

  // No inner hero anymore

  if (loading) {
    return <ProfileLoading />
  }

  if (!profileData) {
    return (
      <ProfileNotFound
        showVisitors={showVisitors}
        onCloseVisitors={() => setShowVisitors(false)}
        visitors={visitors}
        anonCount={anonCount}
        loading={loadingVisitors}
        days={visitorDays}
        onDaysChange={(n) => setVisitorDays(n)}
      />
    )
  }

  const { user } = profileData
  const profile = user.profile
  const userType = user.userType
  const displayName = profile?.displayName || user.email
  const formattedLocation = formatLocation(profile)
  

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
  // media and hero hooks already initialized above to keep hooks order stable

  // Deletion handled by hook; adjust lightbox index after deletion
  const onDeleteMedia = async (item: any, index: number) => {
    await handleDeleteMedia(item, index)
    setLightboxIndex((prev) => {
      if (prev === null) return prev
      if (prev === index) return null
      if (prev > index) return prev - 1
      return prev
    })
  }

  // Avatar setzen über Hook; lokale Optimierung weiterhin hier
  const onSetAvatar = async (url: string) => {
    await handleSetAvatar(url)
    setProfileData((prev) => {
      if (!prev) return prev
      const next: ProfileDataType = {
        ...prev,
        user: {
          ...prev.user,
          profile: { ...(prev.user.profile as any), avatar: url } as any,
        },
      }
      return next
    })
  }

  return (
    <ProfileMainContent
      // header basics
      isOwnProfile={isOwnProfile}
      profile={profile}
      user={user}
      userType={userType as any}
      displayName={displayName}
      formattedLocation={formattedLocation}
      avatarSize={avatarSize}
      editBtnRef={editBtnRef}
      onEdit={() => router.push('/onboarding?edit=1')}
      onOpenVisitors={() => setShowVisitors(true)}
      userTypeLabel={getUserTypeDisplayName(userType as any)}

      // org connections
      showOrgSection={isOwnProfile && userType === 'ESCORT'}
      joinCode={joinCode}
      setJoinCode={setJoinCode}
      joining={joining}
      onSubmitJoin={handleSubmitJoin}
      loadingMyOrgs={loadingMyOrgs}
      myOrgs={myOrgs as any}
      unlinking={unlinking}
      onUnlink={unlinkOrg}

      // view section
      selectedView={selectedView}
      onChangeView={(v) => setSelectedView(v)}
      onSaveView={handleSaveProfileView}
      savingView={savingView}
      savedViewAt={savedViewAt}

      // tabs
      activeTab={activeTab}
      onChangeTab={(key: string) => setActiveTab(key)}
      mediaItems={mediaItems as any}
      settingAvatarUrl={settingAvatarUrl}
      deletingIndex={deletingIndex}
      onSetAvatar={onSetAvatar}
      onDeleteMedia={onDeleteMedia}
      onOpenLightbox={(index: number) => setLightboxIndex(index)}
      visitors={visitors || []}

      // overlays
      showVisitors={showVisitors}
      onCloseVisitors={() => setShowVisitors(false)}
      anonCount={anonCount}
      loadingVisitors={loadingVisitors}
      visitorDays={visitorDays}
      onDaysChange={(n: number) => setVisitorDays(n)}
      lightboxIndex={lightboxIndex}
      onCloseLightbox={() => setLightboxIndex(null)}
    />
  )
}

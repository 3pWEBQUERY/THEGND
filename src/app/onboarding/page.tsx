'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getUserTypeDisplayName } from '@/lib/validations'
import { UserType } from '@prisma/client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import MemberSteps from '@/components/onboarding/MemberSteps'
import EscortSteps from '@/components/onboarding/EscortSteps'
import HobbyhureSteps from '@/components/onboarding/HobbyhureSteps'
import BusinessSteps from '@/components/onboarding/BusinessSteps'
import OnboardingHeader from '@/components/onboarding/OnboardingHeader'
import OnboardingCTA from '@/components/onboarding/OnboardingCTA'

export default function OnboardingPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isSkipping, setIsSkipping] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get('edit') === '1'
  const addEditParam = (href: string) => (isEditMode ? `${href}?edit=1` : href)

  useEffect(() => {
    const fetchProfileData = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/profile', { cache: 'no-store' })
          if (response.ok) {
            const data = await response.json()
            setProfileData(data)
          }
        } catch (error) {
          console.error('Error fetching profile:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    if (session?.user?.id) fetchProfileData()
    else if (status !== 'loading') setIsLoading(false)
  }, [session?.user?.id, status])

  const isPersonalDetailsCompleted = profileData?.user?.profile && (
    profileData.user.profile.displayName ||
    profileData.user.profile.age ||
    profileData.user.profile.gender ||
    profileData.user.profile.location ||
    profileData.user.profile.bio ||
    profileData.user.profile.preferences
  )
  const isProfileMediaCompleted = !!(
    profileData?.user?.profile?.avatar ||
    (Array.isArray(profileData?.user?.profile?.gallery) && profileData.user.profile.gallery.length > 0)
  )

  const handleContinueToMedia = () => router.push(addEditParam('/onboarding/member/media'))

  const handleCompleteOnboarding = async () => {
    try {
      const response = await fetch('/api/user/complete-onboarding', { method: 'POST' })
      if (response.ok) {
        await update?.({ user: { onboardingStatus: 'COMPLETED' } })
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
    else if (!isEditMode && (session?.user?.onboardingStatus === 'COMPLETED' || session?.user?.onboardingStatus === 'SKIPPED')) {
      router.push('/dashboard')
    }
  }, [session, status, router, isEditMode])

  const handleStartOnboarding = () => {
    if (!session?.user?.userType) return
    const userType = session.user.userType as any
    if (userType === 'MEMBER') router.push('/onboarding/member')
    else if (userType === 'ESCORT') router.push('/onboarding/escort/step-1')
    else if (userType === 'HOBBYHURE') router.push('/onboarding/hobbyhure/step-1')
    else if (userType === 'AGENCY') router.push('/onboarding/agency/step-1')
    else if (userType === 'CLUB') router.push('/onboarding/club/step-1')
    else if (userType === 'STUDIO') router.push('/onboarding/studio/step-1')
  }

  const handleSkipOnboarding = async () => {
    setIsSkipping(true)
    try {
      const response = await fetch('/api/user/skip-onboarding', { method: 'POST' })
      if (response.ok) {
        await update?.({ user: { onboardingStatus: 'SKIPPED' } })
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error skipping onboarding:', error)
    } finally {
      setIsSkipping(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-sm font-light tracking-widest text-gray-600">LÄDT...</div>
      </div>
    )
  }
  if (!session) return null

  const userTypeDisplay = getUserTypeDisplayName(session.user.userType as UserType)

  // Escort completions
  const escortProfile = profileData?.user?.profile as any
  const escortStep1Completed = !!(escortProfile?.displayName && escortProfile?.age && escortProfile?.gender)
  const escortStep2Completed = !!(escortProfile?.height && escortProfile?.weight && escortProfile?.bodyType && escortProfile?.hairColor && escortProfile?.eyeColor)
  const escortStep3Completed = !!(escortProfile?.description && String(escortProfile.description).trim().length > 0)
  const escortStep4Completed = !!((Array.isArray(escortProfile?.gallery) && escortProfile.gallery.length > 0) || (Array.isArray(escortProfile?.media) && escortProfile.media.length > 0))
  const escortStep5Completed = (() => { try { const raw = escortProfile?.services; const arr = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []); return Array.isArray(arr) && arr.length > 0 } catch { return false } })()
  const hasAnySocial = (() => { const sm = escortProfile?.socialMedia; if (!sm || typeof sm !== 'object') return false; return Object.values(sm).some((v: any) => !!v) })()
  const escortStep6Completed = !!(escortProfile?.phone || escortProfile?.website || hasAnySocial)
  const escortStep7Completed = !!((escortProfile?.latitude != null && escortProfile?.longitude != null) || (escortProfile?.address && escortProfile?.city && escortProfile?.country))
  const escortAllCompleted = (escortStep1Completed && escortStep2Completed && escortStep3Completed && escortStep4Completed && escortStep5Completed && escortStep6Completed && escortStep7Completed)

  // Agency/Business completions
  const agencyProfile = profileData?.user?.profile as any
  const agencyStep1Completed = !!(agencyProfile?.companyName && agencyProfile?.businessType)
  const agencyStep2Completed = !!(agencyProfile?.description && String(agencyProfile.description).trim().length > 0)
  const agencyStep4Completed = !!(agencyProfile?.avatar || (Array.isArray(agencyProfile?.gallery) && agencyProfile.gallery.length > 0) || (Array.isArray(agencyProfile?.media) && agencyProfile.media.length > 0))
  const agencyStep5Completed = (() => { try { const raw = agencyProfile?.services; const arr = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []); return Array.isArray(arr) && arr.length > 0 } catch { return false } })()
  const agencyHasAnySocial = (() => { const sm = agencyProfile?.socialMedia; if (!sm || typeof sm !== 'object') return false; return Object.values(sm).some((v: any) => !!v) })()
  const agencyStep6Completed = !!(agencyProfile?.phone || agencyProfile?.website || agencyHasAnySocial)
  const agencyStep7Completed = !!((agencyProfile?.latitude != null && agencyProfile?.longitude != null) || (agencyProfile?.address && agencyProfile?.city && agencyProfile?.country))
  const businessStep1Completed = agencyStep1Completed
  const businessStep2Completed = !!(agencyProfile?.address && agencyProfile?.city && agencyProfile?.country && agencyProfile?.phone)
  const businessStep3Completed = agencyStep2Completed
  const agencyAllCompleted = (agencyStep1Completed && agencyStep2Completed && agencyStep4Completed && agencyStep5Completed && agencyStep6Completed && agencyStep7Completed)
  const clubStudioAllCompleted = (businessStep1Completed && businessStep2Completed && businessStep3Completed && agencyStep4Completed && agencyStep5Completed && agencyStep6Completed && agencyStep7Completed)

  return (
    <div className="min-h-screen bg-white">
      <nav className="absolute top-0 w-full z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="flex items-center text-sm font-light tracking-widest text-gray-600 hover:text-pink-500 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              ZUM DASHBOARD
            </Link>
            <div className="text-sm font-light tracking-widest text-gray-600">EINRICHTUNG</div>
          </div>
        </div>
      </nav>

      <div className="min-h-screen flex items-center justify-center px-6 pt-24 sm:pt-28">
        <div className="w-full max-w-2xl">
          <OnboardingHeader userTypeDisplay={userTypeDisplay} />

          <div className="mb-16">
            <h2 className="text-2xl font-thin tracking-wider text-gray-800 mb-8 text-center">EINRICHTUNGSPROZESS</h2>
            <div className="space-y-6">
              {session.user.userType === 'MEMBER' && (
                <MemberSteps
                  isPersonalDetailsCompleted={!!isPersonalDetailsCompleted}
                  isProfileMediaCompleted={!!isProfileMediaCompleted}
                  onStartMember={() => router.push(addEditParam('/onboarding/member'))}
                  onContinueToMedia={handleContinueToMedia}
                />
              )}

              {session.user.userType === 'ESCORT' && (
                <EscortSteps
                  escortStep1Completed={escortStep1Completed}
                  escortStep2Completed={escortStep2Completed}
                  escortStep3Completed={escortStep3Completed}
                  escortStep4Completed={escortStep4Completed}
                  escortStep5Completed={escortStep5Completed}
                  escortStep6Completed={escortStep6Completed}
                  escortStep7Completed={escortStep7Completed}
                  addEditParam={addEditParam}
                />
              )}

              {session.user.userType === 'HOBBYHURE' && (
                <HobbyhureSteps
                  escortStep1Completed={escortStep1Completed}
                  escortStep2Completed={escortStep2Completed}
                  escortStep3Completed={escortStep3Completed}
                  escortStep4Completed={escortStep4Completed}
                  escortStep5Completed={escortStep5Completed}
                  escortStep6Completed={escortStep6Completed}
                  escortStep7Completed={escortStep7Completed}
                  addEditParam={addEditParam}
                />
              )}

              {['AGENCY', 'CLUB', 'STUDIO'].includes(session.user.userType) && (
                (() => {
                  const base = session.user.userType === 'AGENCY' ? 'agency' : session.user.userType === 'CLUB' ? 'club' : 'studio'
                  return (
                    <BusinessSteps
                      base={base as 'agency' | 'club' | 'studio'}
                      agencyStep1Completed={agencyStep1Completed}
                      businessStep1Completed={businessStep1Completed}
                      businessStep2Completed={businessStep2Completed}
                      agencyStep2Completed={agencyStep2Completed}
                      agencyStep4Completed={agencyStep4Completed}
                      agencyStep5Completed={agencyStep5Completed}
                      agencyStep6Completed={agencyStep6Completed}
                      agencyStep7Completed={agencyStep7Completed}
                      addEditParam={addEditParam}
                    />
                  )
                })()
              )}
            </div>
          </div>

          {!isEditMode && (
            <OnboardingCTA
              userType={session.user.userType as any}
              isEditMode={isEditMode}
              isSkipping={isSkipping}
              escortAllCompleted={escortAllCompleted}
              agencyAllCompleted={agencyAllCompleted}
              clubStudioAllCompleted={clubStudioAllCompleted}
              isPersonalDetailsCompleted={!!isPersonalDetailsCompleted}
              isProfileMediaCompleted={!!isProfileMediaCompleted}
              onStartOnboarding={handleStartOnboarding}
              onSkipOnboarding={handleSkipOnboarding}
              onCompleteOnboarding={handleCompleteOnboarding}
              onContinueToMedia={handleContinueToMedia}
            />
          )}
        </div>
      </div>
    </div>
  )
}

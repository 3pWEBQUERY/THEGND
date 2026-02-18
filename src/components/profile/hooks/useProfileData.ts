'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export interface ProfileData {
  user: any
}

export function useProfileData(userId?: string) {
  const { data: session } = useSession()
  const router = useRouter()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'STANDARD' | 'ALT1' | 'ALT2' | 'FULL_SIDE' | null>(null)
  const [heroMobileLayout, setHeroMobileLayout] = useState<'cover' | 'half' | 'compact'>('cover')

  const fetchProfile = async () => {
    try {
      const isOwnProfile = !userId || userId === session?.user?.id
      const isPublicView = !!userId && userId !== session?.user?.id
      const response = await fetch(isPublicView ? `/api/profile/public?id=${encodeURIComponent(userId as string)}` : '/api/profile', { cache: 'no-store', credentials: isPublicView ? 'omit' as RequestCredentials : 'include' as RequestCredentials })
      if (!response.ok) {
        if (isOwnProfile && response.status === 401) {
          try {
            const cb = typeof window !== 'undefined' ? window.location.pathname : '/profile'
            router.push(`/auth/signin?callbackUrl=${encodeURIComponent(cb)}`)
          } catch {
            if (typeof window !== 'undefined') {
              const cb = window.location.pathname
              window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(cb)}`
            }
          }
        }
        return
      }
      const data = await response.json()
      if (data?.user) {
        setProfileData(data)
        const pv = data?.user?.profile?.profileView as any
        if (pv === 'STANDARD' || pv === 'ALT1' || pv === 'ALT2' || pv === 'FULL_SIDE') {
          setSelectedView(pv)
        } else {
          setSelectedView('STANDARD')
        }
        try {
          const prefs = (data?.user?.profile as any)?.preferences || {}
          const mobile = prefs?.hero?.mobileLayout
          if (mobile === 'cover' || mobile === 'half' || mobile === 'compact') {
            setHeroMobileLayout(mobile)
          } else {
            setHeroMobileLayout('cover')
          }
        } catch {}
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return { profileData, setProfileData, loading, fetchProfile, selectedView, setSelectedView, heroMobileLayout, setHeroMobileLayout }
}

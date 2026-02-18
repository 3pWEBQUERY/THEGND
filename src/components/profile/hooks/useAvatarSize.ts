'use client'

import { useLayoutEffect, useState } from 'react'

export function useAvatarSize(isOwnProfile: boolean, profileData: any, editBtnRef: React.RefObject<HTMLButtonElement | null>) {
  const [avatarSize, setAvatarSize] = useState<number | null>(null)

  useLayoutEffect(() => {
    if (!isOwnProfile) return
    const btn = editBtnRef.current
    if (!btn) return

    const measureNow = () => setAvatarSize(btn.getBoundingClientRect().width)
    const rafMeasure = () => requestAnimationFrame(measureNow)

    // initial
    measureNow()
    const rafId = requestAnimationFrame(measureNow)

    // fonts ready (if available)
    // @ts-ignore
    if (document && (document as any).fonts?.ready) {
      // @ts-ignore
      ;(document as any).fonts.ready.then(() => rafMeasure())
    }

    // fallback delayed measure
    const t = setTimeout(measureNow, 150)

    const ro = new ResizeObserver(() => {
      if (btn) setAvatarSize(btn.getBoundingClientRect().width)
    })
    ro.observe(btn)

    const onResize = () => measureNow()
    window.addEventListener('resize', onResize)

    return () => {
      ro.disconnect()
      clearTimeout(t)
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
    }
  }, [isOwnProfile, profileData, editBtnRef])

  return avatarSize
}

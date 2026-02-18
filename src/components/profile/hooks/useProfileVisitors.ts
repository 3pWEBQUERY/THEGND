import { useEffect, useState } from 'react'

export function useProfileVisitors(show: boolean, initialDays = 30) {
  const [visitors, setVisitors] = useState<{ id: string; displayName: string; avatar: string | null; visitedAt: string }[] | null>(null)
  const [anonCount, setAnonCount] = useState<number>(0)
  const [loadingVisitors, setLoadingVisitors] = useState(false)
  const [visitorDays, setVisitorDays] = useState<number>(initialDays)

  useEffect(() => {
    if (!show) return
    let cancelled = false
    ;(async () => {
      try {
        setLoadingVisitors(true)
        const res = await fetch(`/api/visitors?limit=32&days=${visitorDays}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        setVisitors(data?.visitors || [])
        setAnonCount(Number(data?.anonCount || 0))
      } catch {
        // ignore
      } finally {
        setLoadingVisitors(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [show, visitorDays])

  return { visitors, anonCount, loadingVisitors, visitorDays, setVisitorDays }
}

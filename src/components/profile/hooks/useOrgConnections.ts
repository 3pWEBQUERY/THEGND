import { useCallback, useEffect, useState } from 'react'

export function useOrgConnections(enabled: boolean, showToast: (msg: string, opts?: { variant?: 'success' | 'error' | 'info' }) => void) {
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [myOrgs, setMyOrgs] = useState<Array<{ id: string; userType: string; name: string; avatar: string | null; city: string | null; country: string | null }> | null>(null)
  const [loadingMyOrgs, setLoadingMyOrgs] = useState(false)
  const [unlinking, setUnlinking] = useState<string | null>(null)

  const loadMyOrgs = useCallback(async () => {
    try {
      setLoadingMyOrgs(true)
      const res = await fetch('/api/girls/my-orgs', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Fehler beim Laden')
      setMyOrgs(Array.isArray(data?.items) ? data.items : [])
    } catch (e) {
      setMyOrgs([])
    } finally {
      setLoadingMyOrgs(false)
    }
  }, [])

  const unlinkOrg = useCallback(
    async (orgId: string) => {
      try {
        if (typeof window !== 'undefined') {
          const ok = window.confirm('Verknüpfung wirklich entfernen?')
          if (!ok) return
        }
        setUnlinking(orgId)
        const res = await fetch('/api/girls/my-orgs', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orgId }) })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || 'Fehler beim Entfernen')
        showToast('Verbindung entfernt', { variant: 'success' })
        await loadMyOrgs()
      } catch (e: any) {
        showToast(e?.message || 'Fehler', { variant: 'error' })
      } finally {
        setUnlinking(null)
      }
    },
    [loadMyOrgs, showToast]
  )

  const handleSubmitJoin = useCallback(
    async () => {
      const code = joinCode.trim().toUpperCase()
      if (!code) {
        showToast('Bitte Code eingeben', { variant: 'error' })
        return
      }
      setJoining(true)
      try {
        const res = await fetch('/api/girls/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || 'Fehler beim Verbinden')
        showToast('Erfolgreich verbunden', { variant: 'success' })
        setJoinCode('')
        await loadMyOrgs()
      } catch (e: any) {
        showToast(e?.message || 'Fehler', { variant: 'error' })
      } finally {
        setJoining(false)
      }
    },
    [joinCode, loadMyOrgs, showToast]
  )

  useEffect(() => {
    if (!enabled) return
    loadMyOrgs()
  }, [enabled, loadMyOrgs])

  return { joinCode, setJoinCode, joining, myOrgs, loadingMyOrgs, unlinking, handleSubmitJoin, unlinkOrg }
}

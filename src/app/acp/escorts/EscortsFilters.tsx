'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export default function EscortsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentVisibility = searchParams.get('visibility') || ''
  const currentActive = searchParams.get('active') || ''
  const currentHasProfile = searchParams.get('hasProfile') || ''

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === '_all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete('page')
    const qs = params.toString()
    router.push(`/acp/escorts${qs ? `?${qs}` : ''}`)
  }

  return (
    <>
      <Select value={currentVisibility || '_all'} onValueChange={(v) => applyFilter('visibility', v)}>
        <SelectTrigger className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm bg-white">
          <SelectValue placeholder="Sichtbarkeit: alle" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">Sichtbarkeit: alle</SelectItem>
          <SelectItem value="PUBLIC">PUBLIC</SelectItem>
          <SelectItem value="PRIVATE">PRIVATE</SelectItem>
        </SelectContent>
      </Select>

      <Select value={currentActive || '_all'} onValueChange={(v) => applyFilter('active', v)}>
        <SelectTrigger className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm bg-white">
          <SelectValue placeholder="Aktiv-Status: alle" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">Aktiv-Status: alle</SelectItem>
          <SelectItem value="true">Nur aktive</SelectItem>
          <SelectItem value="false">Nur gesperrte</SelectItem>
        </SelectContent>
      </Select>

      <Select value={currentHasProfile || '_all'} onValueChange={(v) => applyFilter('hasProfile', v)}>
        <SelectTrigger className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm bg-white">
          <SelectValue placeholder="Profil: alle" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">Profil: alle</SelectItem>
          <SelectItem value="true">Nur mit Profil</SelectItem>
          <SelectItem value="false">Nur ohne Profil</SelectItem>
        </SelectContent>
      </Select>
    </>
  )
}

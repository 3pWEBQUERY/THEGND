'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export default function FeedsStatusFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('active') || ''

  function handleChange(v: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (v === '_all') {
      params.delete('active')
    } else {
      params.set('active', v)
    }
    params.delete('page')
    const qs = params.toString()
    router.push(`/acp/feeds${qs ? `?${qs}` : ''}`)
  }

  return (
    <Select value={current || '_all'} onValueChange={handleChange}>
      <SelectTrigger className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm bg-white">
        <SelectValue placeholder="Status: alle" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="_all">Status: alle</SelectItem>
        <SelectItem value="true">Nur aktiv</SelectItem>
        <SelectItem value="false">Nur inaktiv</SelectItem>
      </SelectContent>
    </Select>
  )
}

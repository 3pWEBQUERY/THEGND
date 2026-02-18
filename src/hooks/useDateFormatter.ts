"use client"

import { useMemo } from 'react'
import { usePublicSettingsCtx } from '@/components/providers/public-settings-provider'
import { formatDateByPattern, formatDateTimeByPattern, type DatePattern } from '@/lib/date'

export function useDateFormatter() {
  const s = usePublicSettingsCtx()
  const pattern = (s?.dateFormat || 'DD.MM.YYYY') as DatePattern
  const timeZone = s?.timezone || 'UTC'

  return useMemo(() => {
    return {
      pattern,
      timeZone,
      format: (input: Date | string | number) => formatDateByPattern(input, pattern, timeZone),
      formatDateTime: (input: Date | string | number) => formatDateTimeByPattern(input, pattern, timeZone),
    }
  }, [pattern, timeZone])
}

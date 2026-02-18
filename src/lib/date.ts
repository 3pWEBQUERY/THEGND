export type DatePattern = 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'

function toDate(input: Date | string | number): Date {
  if (input instanceof Date) return input
  const d = new Date(input)
  return isNaN(d.getTime()) ? new Date() : d
}

export function formatDateByPattern(input: Date | string | number, pattern: DatePattern, timeZone: string): string {
  const date = toDate(input)
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = dtf.formatToParts(date).reduce<Record<string, string>>((acc, p) => {
    if (p.type === 'year' || p.type === 'month' || p.type === 'day') acc[p.type] = p.value
    return acc
  }, {})
  const y = parts.year || '0000'
  const m = parts.month || '01'
  const d = parts.day || '01'
  switch (pattern) {
    case 'DD.MM.YYYY':
      return `${d}.${m}.${y}`
    case 'MM/DD/YYYY':
      return `${m}/${d}/${y}`
    case 'YYYY-MM-DD':
      return `${y}-${m}-${d}`
    default:
      return `${d}.${m}.${y}`
  }
}

export function formatDateTimeByPattern(input: Date | string | number, pattern: DatePattern, timeZone: string): string {
  const date = toDate(input)
  const dateStr = formatDateByPattern(date, pattern, timeZone)
  const timeStr = new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', minute: '2-digit' }).format(date)
  return `${dateStr} ${timeStr}`
}

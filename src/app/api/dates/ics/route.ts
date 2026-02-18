import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function fmtICS(dt: Date) {
  const y = dt.getUTCFullYear()
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const d = String(dt.getUTCDate()).padStart(2, '0')
  const hh = String(dt.getUTCHours()).padStart(2, '0')
  const mm = String(dt.getUTCMinutes()).padStart(2, '0')
  const ss = String(dt.getUTCSeconds()).padStart(2, '0')
  return `${y}${m}${d}T${hh}${mm}${ss}Z`
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return new NextResponse('Missing id', { status: 400 })
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT dr.id, dr.starts_at as "startsAt", dr.ends_at as "endsAt", dr.city, dr.place_label as "placeLabel", dr.location as "location", p."displayName" as name
       FROM date_requests dr
       JOIN users u ON u.id = dr.escort_id
       LEFT JOIN profiles p ON p."userId" = u.id
       WHERE dr.id = $1`,
      id
    )
    const r = rows?.[0]
    if (!r) return new NextResponse('Not found', { status: 404 })
    const dtStart = new Date(r.startsAt)
    const dtEnd = new Date(r.endsAt)
    const summary = `Date mit ${r.name || 'Escort'}`
    const location = r.location || [r.placeLabel, r.city].filter(Boolean).join(', ')
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//THEGND//Dates//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${r.id}@thegnd`,
      `DTSTAMP:${fmtICS(new Date())}`,
      `DTSTART:${fmtICS(dtStart)}`,
      `DTEND:${fmtICS(dtEnd)}`,
      `SUMMARY:${summary}`,
      location ? `LOCATION:${location}` : '',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n')
    return new NextResponse(ics, { status: 200, headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': `attachment; filename="date-${r.id}.ics"` } })
  } catch {
    return new NextResponse('Server error', { status: 500 })
  }
}

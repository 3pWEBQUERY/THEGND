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
    const { searchParams, origin } = new URL(req.url)
    const token = (searchParams.get('token') || '').trim()
    if (!token) return new NextResponse('Missing token', { status: 400 })

    // Lookup userId by token in app_settings
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT key FROM app_settings WHERE value = $1 AND key LIKE 'dates:icsToken:%' LIMIT 1`,
      token
    )
    const r = rows?.[0]
    if (!r?.key) return new NextResponse('Invalid token', { status: 404 })
    const userId = String(r.key).replace('dates:icsToken:', '')

    // Pull upcoming dates where the user is escort or member; include ACCEPTED and PENDING
    const now = new Date()
    const items = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, escort_id as "escortId", member_id as "memberId", starts_at as "startsAt", ends_at as "endsAt", place_label as "placeLabel", city, location, place_id as "placeId", status
       FROM date_requests
       WHERE (escort_id = $1 OR member_id = $1) AND ends_at >= $2 AND status IN ('ACCEPTED','PENDING')
       ORDER BY starts_at ASC
       LIMIT 1000`,
      userId,
      now
    )

    const lines: string[] = []
    lines.push('BEGIN:VCALENDAR')
    lines.push('VERSION:2.0')
    lines.push('PRODID:-//THEGND//DatesFeed//EN')
    lines.push('CALSCALE:GREGORIAN')

    for (const it of items) {
      const s = new Date(it.startsAt)
      const e = new Date(it.endsAt)
      const where = it.location || [it.placeLabel, it.city].filter(Boolean).join(', ')
      const summary = `Date (${it.status})`
      lines.push('BEGIN:VEVENT')
      lines.push(`UID:${it.id}@thegnd`)
      lines.push(`DTSTAMP:${fmtICS(new Date())}`)
      lines.push(`DTSTART:${fmtICS(s)}`)
      lines.push(`DTEND:${fmtICS(e)}`)
      lines.push(`SUMMARY:${summary}`)
      if (where) lines.push(`LOCATION:${where}`)
      if (it.placeId) lines.push('DESCRIPTION:Adresse aus Vorschlag gewählt')
      else lines.push('DESCRIPTION:Adresse manuell eingegeben')
      lines.push('END:VEVENT')
    }

    lines.push('END:VCALENDAR')
    const ics = lines.join('\r\n')
    return new NextResponse(ics, { status: 200, headers: { 'Content-Type': 'text/calendar; charset=utf-8' } })
  } catch (e) {
    return new NextResponse('Server error', { status: 500 })
  }
}

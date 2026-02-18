import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function ensureTables() {
  try {
    // Ensure pgcrypto for gen_random_uuid()
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pgcrypto`)
  } catch {}
  try {
    await prisma.$executeRawUnsafe(`DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'date_request_status') THEN
        CREATE TYPE date_request_status AS ENUM ('PENDING','ACCEPTED','DECLINED','CANCELED');
      END IF;
    END$$;`)
  } catch {}
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS date_requests (
      id text PRIMARY KEY,
      escort_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      member_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      starts_at timestamptz NOT NULL,
      ends_at timestamptz NOT NULL,
      duration_minutes int,
      price_cents int,
      currency text DEFAULT 'EUR',
      extras jsonb,
      place_key text,
      place_label text,
      outfit_key text,
      outfit_label text,
      city text,
      location text,
      lat double precision,
      lng double precision,
      place_id text,
      note text,
      status date_request_status NOT NULL DEFAULT 'PENDING',
      created_at timestamptz DEFAULT now()
    );`)
    // Backfill columns in case table existed from an older version
    await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS duration_minutes int`)
    await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS price_cents int`)
    await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS currency text`)
    await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS extras jsonb`)
    await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS place_key text`)
    await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS place_label text`)
    await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS outfit_key text`)
    await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS outfit_label text`)
    await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS city text`)
    await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS location text`)
    await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS note text`)
    await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS lat double precision`)
    await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS lng double precision`)
    await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS place_id text`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_date_requests_escort ON date_requests(escort_id, status, starts_at)`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_date_requests_member ON date_requests(member_id, status, starts_at)`)
  } catch {}
}

function parseDateTimeLocal(date: string, time: string): Date | null {
  try {
    // Expect date 'YYYY-MM-DD' and time 'HH:mm'
    if (!date || !time) return null
    const [y, m, d] = date.split('-').map(Number)
    const [hh, mm] = time.split(':').map(Number)
    // Construct a local-time Date so the stored timestamptz reflects the user's local input
    const dt = new Date(y, m - 1, d, hh, mm)
    return dt
  } catch { return null }
}

export async function POST(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json().catch(() => ({}))
    const escortId = String(body?.escortId || '')
    const date = String(body?.date || '')
    const time = String(body?.time || '')
    const durationMinutes = Number(body?.durationMinutes || 0)
    const extras = Array.isArray(body?.extras) ? body.extras : []
    const place = body?.place || null
    const outfit = body?.outfit || null
    const city = typeof body?.city === 'string' ? body.city : null
    const address = typeof body?.address === 'string' ? body.address : null
    const lat = typeof body?.lat === 'number' ? body.lat : (body?.lat ? Number(body.lat) : null)
    const lng = typeof body?.lng === 'number' ? body.lng : (body?.lng ? Number(body.lng) : null)
    const placeId = typeof body?.placeId === 'string' ? body.placeId : null
    const note = typeof body?.note === 'string' ? body.note : null

    if (!escortId || !date || !time || !durationMinutes) {
      return NextResponse.json({ error: 'Fehlende Felder' }, { status: 400 })
    }

    await ensureTables()

    const startsAt = parseDateTimeLocal(date, time)
    if (!startsAt) return NextResponse.json({ error: 'Ungültiges Datum/Zeit' }, { status: 400 })
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60000)

    // Load escort settings for pricing (must exist in DB)
    const key = `dates:settings:${escortId}`
    const row = await (prisma as any).appSetting.findUnique({ where: { key } })
    const settings = (() => { try { return row?.value ? JSON.parse(row.value) : null } catch { return null } })()
    if (!settings) {
      return NextResponse.json({ error: 'Preise sind nicht konfiguriert.' }, { status: 400 })
    }

    const duration = (Array.isArray(settings?.durations) ? settings.durations : []).find((d: any) => Number(d?.minutes) === durationMinutes)
    if (!duration) {
      return NextResponse.json({ error: 'Ausgewählte Dauer ist nicht konfiguriert.' }, { status: 400 })
    }
    const base = Number(duration?.priceCents || 0)
    let sum = base
    const selectedExtras = [] as any[]
    const knownExtras = Array.isArray(settings?.extras) ? settings.extras : []
    for (const k of extras) {
      const ex = knownExtras.find((e: any) => e?.key === k)
      if (ex) { sum += Number(ex?.priceCents || 0); selectedExtras.push(ex) }
    }
    const currency = settings?.currency || 'EUR'

    const placeKey = place?.key || null
    const placeLabel = place?.label || null
    const outfitKey = outfit?.key || null
    const outfitLabel = outfit?.label || null

    // Prevent overlapping requests for the same ESCORT (conflicts with PENDING/ACCEPTED)
    try {
      const conflict = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM date_requests
         WHERE escort_id = $1 AND status IN ('PENDING','ACCEPTED')
           AND starts_at < $3 AND ends_at > $2
         LIMIT 1`,
        escortId,
        startsAt,
        endsAt,
      )
      if (conflict && conflict[0]) {
        return NextResponse.json({ error: 'Zeitfenster ist bereits belegt.' }, { status: 409 })
      }
    } catch {}

    // Insert row (with fallback if gen_random_uuid() default isn't available)
    let inserted: any[] | null = null
    try {
      inserted = await prisma.$queryRawUnsafe<any[]>(
        `INSERT INTO date_requests (escort_id, member_id, starts_at, ends_at, duration_minutes, price_cents, currency, extras, place_key, place_label, outfit_key, outfit_label, city, location, lat, lng, place_id, note, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'PENDING') RETURNING id`,
        escortId,
        (session as any).user.id,
        startsAt,
        endsAt,
        durationMinutes,
        sum,
        currency,
        JSON.stringify(selectedExtras.map((e: any) => ({ key: e.key, label: e.label, priceCents: e.priceCents }))),
        placeKey,
        placeLabel,
        outfitKey,
        outfitLabel,
        city,
        address,
        lat,
        lng,
        placeId,
        note,
      )
    } catch (e) {
      try {
        const manualId = (globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36)
        inserted = await prisma.$queryRawUnsafe<any[]>(
          `INSERT INTO date_requests (id, escort_id, member_id, starts_at, ends_at, duration_minutes, price_cents, currency, extras, place_key, place_label, outfit_key, outfit_label, city, location, lat, lng, place_id, note, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,'PENDING') RETURNING id`,
          manualId,
          escortId,
          (session as any).user.id,
          startsAt,
          endsAt,
          durationMinutes,
          sum,
          currency,
          JSON.stringify(selectedExtras.map((e: any) => ({ key: e.key, label: e.label, priceCents: e.priceCents }))),
          placeKey,
          placeLabel,
          outfitKey,
          outfitLabel,
          city,
          address,
          lat,
          lng,
          placeId,
          note,
        )
      } catch (e2) {
        console.error('dates/request insert failed', e, e2)
        throw e2
      }
    }
    const reqId = inserted?.[0]?.id || null

    // Create a notification for the escort
    try {
      await (prisma as any).notification.create({
        data: {
          userId: escortId,
          type: 'message',
          title: 'Neue Date-Anfrage',
          message: `Du hast eine Date-Anfrage von [uid:${(session as any).user.id}] erhalten.`,
          isRead: false,
        }
      })
    } catch {}

    return NextResponse.json({ ok: true, id: reqId })
  } catch (e) {
    console.error('dates/request error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

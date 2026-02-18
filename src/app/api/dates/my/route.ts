import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // Ensure table exists (first-run safety)
    try {
      await prisma.$executeRawUnsafe(`DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'date_request_status') THEN
        CREATE TYPE date_request_status AS ENUM ('PENDING','ACCEPTED','DECLINED','CANCELED');
      END IF;
    END$$;`)
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
      // Backfill columns for older tables
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
    } catch {}
    const { searchParams } = new URL(req.url)
    const scope = (searchParams.get('scope') || 'member').toUpperCase()
    const status = (searchParams.get('status') || '').toUpperCase()

    const whereCol = scope === 'ESCORT' ? 'escort_id' : 'member_id'
    const params: any[] = [session.user.id]
    let query = `SELECT id, escort_id as "escortId", member_id as "memberId", starts_at as "startsAt", ends_at as "endsAt", duration_minutes as "durationMinutes", price_cents as "priceCents", currency, extras, place_key as "placeKey", place_label as "placeLabel", outfit_key as "outfitKey", outfit_label as "outfitLabel", city, location, lat, lng, note, status, created_at as "createdAt" FROM date_requests WHERE ${whereCol} = $1`

    if (status) {
      query += ` AND status = $2::date_request_status`
      params.push(status)
    }
    query += ' ORDER BY starts_at DESC LIMIT 500'

    const rows = await prisma.$queryRawUnsafe<any[]>(query, ...params)
    return NextResponse.json({ requests: rows || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> } | any) {
  try {
    const session: any = await getServerSession(authOptions as any)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await ctx?.params
    const body = await req.json().catch(() => ({}))
    const status = String(body?.status || '').toUpperCase()
    if (!['PENDING','ACCEPTED','DECLINED','CANCELED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Ensure enum exists (first-run safety)
    try {
      await prisma.$executeRawUnsafe(`DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'date_request_status') THEN
          CREATE TYPE date_request_status AS ENUM ('PENDING','ACCEPTED','DECLINED','CANCELED');
        END IF;
      END$$;`)
    } catch {}

    // Ensure table/columns exist (defensive)
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
        city text,
        location text,
        lat double precision,
        lng double precision,
        place_id text,
        note text,
        status date_request_status NOT NULL DEFAULT 'PENDING',
        created_at timestamptz DEFAULT now()
      );`)
      await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS duration_minutes int`)
      await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS price_cents int`)
      await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS currency text`)
      await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS extras jsonb`)
      await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS place_key text`)
      await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS place_label text`)
      await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS city text`)
      await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS location text`)
      await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS note text`)
      await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS lat double precision`)
      await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS lng double precision`)
      await prisma.$executeRawUnsafe(`ALTER TABLE date_requests ADD COLUMN IF NOT EXISTS place_id text`)
    } catch {}

    // Only escort or member involved can update; escorts typically accept/decline
    const row = await prisma.$queryRawUnsafe<any[]>(
      'SELECT escort_id as "escortId", member_id as "memberId" FROM date_requests WHERE id = $1 LIMIT 1',
      id,
    )
    const dr = row?.[0]
    if (!dr) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (dr.escortId !== session.user.id && dr.memberId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.$executeRawUnsafe('UPDATE date_requests SET status = $2::date_request_status WHERE id = $1', id, status)

    // Notify the other party about the status change
    try {
      const targetUserId = (session as any).user.id === dr.escortId ? dr.memberId : dr.escortId
      if (targetUserId) {
        const statusMap: Record<string, string> = {
          PENDING: 'OFFEN',
          ACCEPTED: 'AKZEPTIERT',
          DECLINED: 'ABGELEHNT',
          CANCELED: 'STORNIERT',
          EXPIRED: 'ABGELAUFEN',
        }
        const statusLabel = statusMap[status] || status
        await (prisma as any).notification.create({
          data: {
            userId: targetUserId,
            type: 'message',
            title: 'Date-Anfrage aktualisiert',
            message: `Status: ${statusLabel} · von [uid:${(session as any).user.id}]`,
            isRead: false,
          }
        })
      }
    } catch {}
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

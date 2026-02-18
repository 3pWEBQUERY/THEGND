import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    if (session.user.userType !== 'ESCORT') return NextResponse.json({ error: 'Nur für Escorts' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const memberId = String(body.memberId || '')
    const action = String(body.action || '').toUpperCase()

    if (!memberId || (action !== 'LIKE' && action !== 'PASS'))
      return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

    // Validate target exists and is a MEMBER
    const member = await prisma.user.findUnique({ where: { id: memberId } })
    if (!member || member.userType !== 'MEMBER') {
      return NextResponse.json({ error: 'Mitglied nicht gefunden' }, { status: 404 })
    }

    // Simple rate limiting to avoid abuse
    try {
      const rateRows = await prisma.$queryRaw<{ c: number }[]>`
        SELECT COUNT(*)::int AS c
        FROM "escort_match_actions"
        WHERE "escortId" = ${session.user.id}
          AND "createdAt" > NOW() - INTERVAL '30 seconds'
      `
      const count = Array.isArray(rateRows) && rateRows[0] ? rateRows[0].c : 0
      if (count >= 40) {
        return NextResponse.json({ error: 'Zu viele Aktionen. Bitte kurz warten.' }, { status: 429 })
      }
    } catch {}

    const id = (globalThis as any)?.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
    const upsert = async () => {
      const rows = await prisma.$queryRaw<{ action: 'LIKE' | 'PASS' }[]>`
        INSERT INTO "escort_match_actions" ("id", "escortId", "memberId", "action")
        VALUES (${id}, ${session.user.id}, ${memberId}, ${action}::"MatchActionType")
        ON CONFLICT ("escortId", "memberId") DO UPDATE
        SET "action" = EXCLUDED."action", "createdAt" = CURRENT_TIMESTAMP
        RETURNING "action";
      `
      return Array.isArray(rows) && rows[0] ? rows[0].action : action
    }

    try {
      const ret = await upsert()
      // Notifications
      if (ret === 'LIKE') {
        try {
          // Notify member about like from escort
          const escortUser = await prisma.user.findUnique({ where: { id: session.user.id }, include: { profile: true } })
          const escortName = escortUser?.profile?.displayName ?? escortUser?.email?.split('@')[0] ?? 'Escort'
          await prisma.notification.create({
            data: {
              userId: memberId,
              type: 'like',
              title: 'Neues Like',
              message: `${escortName} hat dich geliked [uid:${session.user.id}]`,
            }
          })
        } catch {}

        // If member already liked escort -> mutual match, notify both
        try {
          const mutualRows = await prisma.$queryRaw<{ exists: boolean }[]>`
            SELECT EXISTS(
              SELECT 1 FROM "member_match_actions"
              WHERE "memberId" = ${memberId} AND "escortId" = ${session.user.id} AND action = 'LIKE'
            ) as exists
          `
          const isMutual = Array.isArray(mutualRows) && mutualRows[0]?.exists
          if (isMutual) {
            const escortUser = await prisma.user.findUnique({ where: { id: session.user.id }, include: { profile: true } })
            const memberUser = await prisma.user.findUnique({ where: { id: memberId }, include: { profile: true } })
            const escortName = escortUser?.profile?.displayName ?? escortUser?.email?.split('@')[0] ?? 'Escort'
            const memberName = memberUser?.profile?.displayName ?? memberUser?.email?.split('@')[0] ?? 'Mitglied'
            await prisma.notification.create({ data: { userId: memberId, type: 'like', title: 'Match', message: `Es ist ein Match mit ${escortName} [uid:${session.user.id}]` } })
            await prisma.notification.create({ data: { userId: session.user.id, type: 'like', title: 'Match', message: `Es ist ein Match mit ${memberName} [uid:${memberId}]` } })

            // Auto-message on MATCH (from member to escort) if enabled in member preferences
            try {
              let shouldSend = false
              let content = 'Hallo! Ich habe dich geliked und würde dich gerne kennenlernen und treffen. Schreib mir gerne zurück!'
              try {
                const pref = memberUser?.profile?.preferences ? JSON.parse(memberUser.profile.preferences) : {}
                if (pref && pref.autoMessageOnMatch === true && typeof pref.autoLikeMessage === 'string' && pref.autoLikeMessage.trim()) {
                  content = pref.autoLikeMessage
                  shouldSend = true
                }
              } catch {}
              if (shouldSend) {
                const recent = await prisma.message.findFirst({
                  where: { senderId: memberId, receiverId: session.user.id },
                  orderBy: { createdAt: 'desc' }
                })
                if (!recent || recent.content !== content) {
                  await prisma.message.create({ data: { senderId: memberId, receiverId: session.user.id, content } })
                }
              }
            } catch {}
          }
        } catch {}
      }
      return NextResponse.json({ ok: true, action: ret }, { status: 200 })
    } catch (e: any) {
      // Attempt to create table idempotently and retry once
      try {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "escort_match_actions" (
            "id" TEXT PRIMARY KEY,
            "escortId" TEXT NOT NULL,
            "memberId" TEXT NOT NULL,
            "action" "MatchActionType" NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `)
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'escort_match_actions_escortId_memberId_key'
          ) THEN ALTER TABLE "escort_match_actions" ADD CONSTRAINT "escort_match_actions_escortId_memberId_key" UNIQUE ("escortId","memberId"); END IF; END $$;
        `)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "escort_match_actions_escortId_idx" ON "escort_match_actions" ("escortId");`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "escort_match_actions_memberId_idx" ON "escort_match_actions" ("memberId");`)
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'escort_match_actions_escortId_fkey'
          ) THEN ALTER TABLE "escort_match_actions" ADD CONSTRAINT "escort_match_actions_escortId_fkey" FOREIGN KEY ("escortId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;
        `)
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'escort_match_actions_memberId_fkey'
          ) THEN ALTER TABLE "escort_match_actions" ADD CONSTRAINT "escort_match_actions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;
        `)
        const ret = await upsert()
        // Notifications after retry as well
        if (ret === 'LIKE') {
          try {
            const escortUser = await prisma.user.findUnique({ where: { id: session.user.id }, include: { profile: true } })
            const escortName = escortUser?.profile?.displayName ?? escortUser?.email?.split('@')[0] ?? 'Escort'
            await prisma.notification.create({ data: { userId: memberId, type: 'like', title: 'Neues Like', message: `${escortName} hat dich geliked [uid:${session.user.id}]` } })
          } catch {}
          try {
            const mutualRows = await prisma.$queryRaw<{ exists: boolean }[]>`
              SELECT EXISTS(
                SELECT 1 FROM "member_match_actions"
                WHERE "memberId" = ${memberId} AND "escortId" = ${session.user.id} AND action = 'LIKE'
              ) as exists
            `
            const isMutual = Array.isArray(mutualRows) && mutualRows[0]?.exists
            if (isMutual) {
              const escortUser = await prisma.user.findUnique({ where: { id: session.user.id }, include: { profile: true } })
              const memberUser = await prisma.user.findUnique({ where: { id: memberId }, include: { profile: true } })
              const escortName = escortUser?.profile?.displayName ?? escortUser?.email?.split('@')[0] ?? 'Escort'
              const memberName = memberUser?.profile?.displayName ?? memberUser?.email?.split('@')[0] ?? 'Mitglied'
              await prisma.notification.create({ data: { userId: memberId, type: 'like', title: 'Match', message: `Es ist ein Match mit ${escortName} [uid:${session.user.id}]` } })
              await prisma.notification.create({ data: { userId: session.user.id, type: 'like', title: 'Match', message: `Es ist ein Match mit ${memberName} [uid:${memberId}]` } })
            }
          } catch {}
        }
        return NextResponse.json({ ok: true, action: ret }, { status: 200 })
      } catch (e2: any) {
        return NextResponse.json({ ok: false, error: 'Fehler beim Speichern der Aktion' }, { status: 500 })
      }
    }
  } catch (e) {
    return NextResponse.json({ error: 'Server Fehler beim Speichern der Aktion' }, { status: 500 })
  }
}

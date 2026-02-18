import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const escortId = String(body.escortId || '')
    const action = String(body.action || '').toUpperCase()

    if (!escortId || (action !== 'LIKE' && action !== 'PASS'))
      return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

    // Validate target exists and is an ESCORT
    const escort = await prisma.user.findUnique({ where: { id: escortId } })
    if (!escort || escort.userType !== 'ESCORT')
      return NextResponse.json({ error: 'Escort nicht gefunden' }, { status: 404 })

    // Simple rate limiting to avoid abuse
    try {
      const rateRows = await prisma.$queryRaw<{ c: number }[]>`
        SELECT COUNT(*)::int AS c
        FROM "member_match_actions"
        WHERE "memberId" = ${session.user.id}
          AND "createdAt" > NOW() - INTERVAL '30 seconds'
      `
      const count = Array.isArray(rateRows) && rateRows[0] ? rateRows[0].c : 0
      if (count >= 40) {
        return NextResponse.json({ error: 'Zu viele Aktionen. Bitte kurz warten.' }, { status: 429 })
      }
    } catch {}

    // Upsert via raw SQL to avoid local Prisma client mismatch
    const id = (globalThis as any)?.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
    try {
      const rows = await prisma.$queryRaw<{ action: 'LIKE' | 'PASS' }[]>`
        INSERT INTO "member_match_actions" ("id", "memberId", "escortId", "action")
        VALUES (${id}, ${session.user.id}, ${escortId}, ${action}::"MatchActionType")
        ON CONFLICT ("memberId", "escortId") DO UPDATE
        SET "action" = EXCLUDED."action", "createdAt" = CURRENT_TIMESTAMP
        RETURNING "action";
      `
      const ret = Array.isArray(rows) && rows[0] ? rows[0].action : action
      if (ret === 'LIKE') {
        try {
          // Notify ESCORT about like
          const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { profile: true } })
          try {
            const senderName = me?.profile?.displayName ?? me?.email?.split('@')[0] ?? 'Ein Mitglied'
            await prisma.notification.create({
              data: {
                userId: escortId,
                type: 'like',
                title: 'Neues Like',
                message: `${senderName} hat dich geliked [uid:${session.user.id}]`,
              }
            })
          } catch {}

          // Check mutual match and handle notifications + optional auto-message
          try {
            const mutualRows = await prisma.$queryRaw<{ exists: boolean }[]>`
              SELECT EXISTS(
                SELECT 1 FROM "escort_match_actions"
                WHERE "escortId" = ${escortId} AND "memberId" = ${session.user.id} AND action = 'LIKE'
              ) as exists
            `
            const isMutual = Array.isArray(mutualRows) && mutualRows[0]?.exists
            if (isMutual) {
              const escortUser = await prisma.user.findUnique({ where: { id: escortId }, include: { profile: true } })
              const escortName = escortUser?.profile?.displayName ?? escortUser?.email?.split('@')[0] ?? 'Escort'
              const memberName = me?.profile?.displayName ?? me?.email?.split('@')[0] ?? 'Mitglied'
              const slug = (escortName || 'escort').toLowerCase().replace(/[^a-z0-9]+/g, '-')
              const msgLink = 'http://localhost:3000/dashboard?tab=messages'
              const profileLink = `http://localhost:3000/escorts/${escortId}/${slug}`
              await prisma.notification.create({ data: { userId: session.user.id, type: 'like', title: 'Match', message: `Es ist ein Match mit ${escortName}. Nachrichten: ${msgLink} • Profil: ${profileLink} [uid:${escortId}]` } })
              await prisma.notification.create({ data: { userId: escortId, type: 'like', title: 'Match', message: `Es ist ein Match mit ${memberName}. Nachrichten: ${msgLink} [uid:${session.user.id}]` } })

              // Auto-message on MATCH (from member to escort) if enabled
              let shouldSend = false
              let content = 'Hallo! Ich habe dich geliked und würde dich gerne kennenlernen und treffen. Schreib mir gerne zurück!'
              try {
                const pref = me?.profile?.preferences ? JSON.parse(me.profile.preferences) : {}
                if (pref && pref.autoMessageOnMatch === true && typeof pref.autoLikeMessage === 'string' && pref.autoLikeMessage.trim()) {
                  content = pref.autoLikeMessage
                  shouldSend = true
                }
              } catch {}
              if (shouldSend) {
                try {
                  const recent = await prisma.message.findFirst({
                    where: { senderId: session.user.id, receiverId: escortId },
                    orderBy: { createdAt: 'desc' }
                  })
                  if (!recent || recent.content !== content) {
                    await prisma.message.create({ data: { senderId: session.user.id, receiverId: escortId, content } })
                  }
                } catch {}
              }
            }
          } catch {}
        } catch {}
      }
      return NextResponse.json({ ok: true, action: ret }, { status: 200 })
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: 'Fehler beim Speichern der Aktion' }, { status: 500 })
    }
  } catch (e) {
    return NextResponse.json({ error: 'Server Fehler beim Speichern der Aktion' }, { status: 500 })
  }
}

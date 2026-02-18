import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session: any = await getServerSession(authOptions as any)
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      let closed = false
      const send = (event: any) => {
        if (closed) return
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      const tick = async () => {
        try {
          const userId = session.user.id
          const userType = session.user.userType

          let likes = 0
          let mutual = 0
          try {
            if (userType === 'MEMBER') {
              const rows = await prisma.$queryRaw<{ c: number }[]>`
                SELECT COUNT(*)::int AS c
                FROM "member_match_actions" mma
                JOIN "escort_match_actions" ema
                  ON ema."memberId" = mma."memberId" AND ema."escortId" = mma."escortId" AND ema.action = 'LIKE'
                WHERE mma."memberId" = ${userId} AND mma.action = 'LIKE'
              `
              mutual = Array.isArray(rows) && rows[0] ? rows[0].c : 0
            } else if (userType === 'ESCORT' || userType === 'HOBBYHURE') {
              const likesRows = await prisma.$queryRaw<{ c: number }[]>`
                SELECT COUNT(*)::int AS c
                FROM "member_match_actions"
                WHERE "escortId" = ${userId} AND action = 'LIKE'
              `
              likes = Array.isArray(likesRows) && likesRows[0] ? likesRows[0].c : 0
              try {
                const rows = await prisma.$queryRaw<{ c: number }[]>`
                  SELECT COUNT(*)::int AS c
                  FROM "escort_match_actions" ema
                  JOIN "member_match_actions" mma
                    ON mma."memberId" = ema."memberId" AND mma."escortId" = ema."escortId" AND mma.action = 'LIKE'
                  WHERE ema."escortId" = ${userId} AND ema.action = 'LIKE'
                `
                mutual = Array.isArray(rows) && rows[0] ? rows[0].c : 0
              } catch {}
            }
          } catch {}

          let unread = 0
          try {
            const uc = await prisma.notification.count({ where: { userId: userId, isRead: false } })
            unread = uc
          } catch {}

          send({ type: 'update', likes, mutual, unread })
        } catch (e) {
          // ignore
        }
      }

      // initial send and then interval
      tick()
      const interval = setInterval(tick, 10000)

      const close = () => {
        if (!closed) {
          closed = true
          clearInterval(interval)
          try { controller.close() } catch {}
        }
      }

      // close on client abort
      // @ts-ignore
      req.signal?.addEventListener('abort', close)
    }
  })

  return new Response(stream, { headers })
}

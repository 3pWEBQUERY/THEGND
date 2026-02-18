import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user
    if (!user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    if (user.userType !== 'MEMBER') return NextResponse.json({ error: 'Nur Mitglieder können Tickets einlösen' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const code = String(body?.code || '').trim().toUpperCase()
    const content = String(body?.content || '').trim()
    const rating = typeof body?.rating === 'number' ? Math.max(1, Math.min(5, Math.floor(body.rating))) : undefined

    if (!code) return NextResponse.json({ error: 'Code erforderlich' }, { status: 400 })
    if (!content) return NextResponse.json({ error: 'Kommentar erforderlich' }, { status: 400 })

    const ticket = await prisma.reviewTicket.findUnique({ where: { code } })
    if (!ticket) return NextResponse.json({ error: 'Ungültiger Code' }, { status: 404 })
    if (ticket.expiresAt && ticket.expiresAt < new Date()) return NextResponse.json({ error: 'Code abgelaufen' }, { status: 400 })
    if (ticket.usedCount >= ticket.maxUses) return NextResponse.json({ error: 'Code bereits verwendet' }, { status: 400 })

    const created = await prisma.$transaction(async (tx) => {
      const updated = await tx.reviewTicket.update({
        where: { id: ticket.id },
        data: {
          usedCount: { increment: 1 },
          redeemedById: ticket.redeemedById ?? user.id,
          redeemedAt: ticket.redeemedAt ?? new Date(),
        },
      })
      if (updated.usedCount > updated.maxUses) {
        throw new Error('Code bereits verwendet')
      }

      const comment = await tx.comment.create({
        data: {
          content,
          targetUserId: ticket.targetUserId,
          authorId: user.id,
          rating: rating ?? undefined,
          verifiedByTicket: true,
          reviewTicketId: ticket.id,
        } as any,
        include: {
          author: { select: { email: true, profile: { select: { displayName: true, avatar: true } } } },
        },
      })

      return comment
    })

    return NextResponse.json({ message: 'Bewertung erstellt', comment: created }, { status: 201 })
  } catch (e: any) {
    const msg = String(e?.message || '')
    if (msg.includes('bereits verwendet')) {
      return NextResponse.json({ error: 'Code bereits verwendet' }, { status: 400 })
    }
    console.error('Redeem ticket error', e)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}

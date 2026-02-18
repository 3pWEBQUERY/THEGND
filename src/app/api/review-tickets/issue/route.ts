import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function generateCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < length; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user
    if (!user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    if (user.userType !== 'ESCORT') return NextResponse.json({ error: 'Nur ESCORTS' }, { status: 403 })

    // Optional: allow custom expiry/maxUses from body later
    const expiresInDays = 30
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)

    // Ensure unique code
    let code = ''
    for (let i = 0; i < 5; i++) {
      const c = generateCode(8)
      const exists = await prisma.reviewTicket.findUnique({ where: { code: c } })
      if (!exists) { code = c; break }
    }
    if (!code) return NextResponse.json({ error: 'Konnte Code nicht generieren' }, { status: 500 })

    const created = await prisma.reviewTicket.create({
      data: {
        code,
        targetUserId: user.id,
        issuedById: user.id,
        expiresAt,
        maxUses: 1,
      },
      select: { id: true, code: true, expiresAt: true }
    })

    return NextResponse.json({ ticket: created })
  } catch (e) {
    console.error('Issue ticket error', e)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}

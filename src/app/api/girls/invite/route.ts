import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function randomCode(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export async function POST() {
  try {
    const session: any = await getServerSession(authOptions as any)
    const uid = session?.user?.id as string | undefined
    const userType = session?.user?.userType as string | undefined
    if (!uid) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    if (!['AGENCY','CLUB','STUDIO'].includes(userType || '')) return NextResponse.json({ error: 'Nur für Agenturen/Clubs/Studios' }, { status: 403 })

    // Generate a unique code
    let code = ''
    for (let i = 0; i < 5; i++) {
      code = randomCode(8)
      const exists = await (prisma as any).appSetting.findUnique({ where: { key: `girls:code:${code}` }, select: { key: true } })
      if (!exists) break
      code = ''
    }
    if (!code) {
      return NextResponse.json({ error: 'Code-Generierung fehlgeschlagen' }, { status: 500 })
    }

    const payload = { orgId: uid, createdAt: new Date().toISOString(), active: true, usedCount: 0, maxUses: 50 }
    await (prisma as any).appSetting.create({ data: { key: `girls:code:${code}`, value: JSON.stringify(payload) } })

    return NextResponse.json({ code })
  } catch (e) {
    console.error('POST /api/girls/invite error:', e)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

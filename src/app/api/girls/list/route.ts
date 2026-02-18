import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session: any = await getServerSession(authOptions as any)
    const uid = session?.user?.id as string | undefined
    const userType = session?.user?.userType as string | undefined
    if (!uid) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    if (!['AGENCY','CLUB','STUDIO'].includes(userType || '')) return NextResponse.json({ error: 'Nur für Agenturen/Clubs/Studios' }, { status: 403 })

    const setting = await (prisma as any).appSetting.findUnique({ where: { key: `girls:org:${uid}:members` } })
    const ids: string[] = (() => { try { return setting?.value ? JSON.parse(setting.value) : [] } catch { return [] } })()

    if (!ids || ids.length === 0) return NextResponse.json({ items: [] })

    const users = await (prisma as any).user.findMany({
      where: { id: { in: ids } },
      include: { profile: true },
    })

    const items = users.map((u: any) => ({
      id: u.id,
      email: u.email,
      profile: u.profile ? {
        displayName: u.profile.displayName ?? null,
        avatar: u.profile.avatar ?? null,
        city: u.profile.city ?? null,
        country: u.profile.country ?? null,
      } : null,
    }))
    return NextResponse.json({ items })
  } catch (e) {
    console.error('GET /api/girls/list error:', e)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

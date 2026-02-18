import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const id: string | undefined = typeof body?.id === 'string' ? body.id : undefined
    const ids: string[] | undefined = Array.isArray(body?.ids) ? body.ids.filter((x: any) => typeof x === 'string') : undefined
    const markAll: boolean = body?.all === true

    let updated = 0
    if (markAll) {
      const res = await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      })
      updated = res.count
    } else if (ids && ids.length > 0) {
      const res = await prisma.notification.updateMany({
        where: { userId: session.user.id, id: { in: ids } },
        data: { isRead: true },
      })
      updated = res.count
    } else if (id) {
      const res = await prisma.notification.updateMany({
        where: { userId: session.user.id, id },
        data: { isRead: true },
      })
      updated = res.count
    } else {
      return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
    }

    const unread = await prisma.notification.count({ where: { userId: session.user.id, isRead: false } })

    return NextResponse.json({ ok: true, updated, unread }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ error: 'Server Fehler' }, { status: 500 })
  }
}

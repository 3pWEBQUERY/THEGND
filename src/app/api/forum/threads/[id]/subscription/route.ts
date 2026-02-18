import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const session = await getServerSession(authOptions as any)
    const userId = (session as any)?.user?.id as string | undefined
    if (!userId) return NextResponse.json({ subscribed: false })
    const sub = await (prisma as any).threadSubscription.findUnique({ where: { userId_threadId: { userId, threadId: id } } })
    return NextResponse.json({ subscribed: !!sub })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const session = await getServerSession(authOptions as any)
    const userId = (session as any)?.user?.id as string | undefined
    if (!userId) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const action = typeof body?.action === 'string' ? body.action : ''

    if (action === 'subscribe') {
      await (prisma as any).threadSubscription.upsert({
        where: { userId_threadId: { userId, threadId: id } },
        create: { userId, threadId: id },
        update: {},
      })
      return NextResponse.json({ ok: true, subscribed: true })
    }
    if (action === 'unsubscribe') {
      await (prisma as any).threadSubscription.deleteMany({ where: { userId, threadId: id } })
      return NextResponse.json({ ok: true, subscribed: false })
    }

    return NextResponse.json({ error: 'Ungültige Aktion' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

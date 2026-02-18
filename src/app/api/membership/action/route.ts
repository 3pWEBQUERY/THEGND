import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any)
  const userId = (session as any)?.user?.id as string | undefined
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const action = body?.action as 'pause_membership' | 'resume_membership' | 'cancel_membership' | 'cancel_addon'

  try {
    if (action === 'pause_membership') {
      const id = body?.id as string
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
      const mem = await prisma.userMembership.findFirst({ where: { id, userId } })
      if (!mem) return NextResponse.json({ error: 'membership not found' }, { status: 404 })
      const updated = await prisma.userMembership.update({ where: { id }, data: { status: 'PAUSED' } })
      return NextResponse.json({ ok: true, membership: updated })
    }

    if (action === 'resume_membership') {
      const id = body?.id as string
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
      const mem = await prisma.userMembership.findFirst({ where: { id, userId } })
      if (!mem) return NextResponse.json({ error: 'membership not found' }, { status: 404 })
      const updated = await prisma.userMembership.update({ where: { id }, data: { status: 'ACTIVE' } })
      return NextResponse.json({ ok: true, membership: updated })
    }

    if (action === 'cancel_membership') {
      const id = body?.id as string
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
      const mem = await prisma.userMembership.findFirst({ where: { id, userId } })
      if (!mem) return NextResponse.json({ error: 'membership not found' }, { status: 404 })
      const now = new Date()
      const updated = await prisma.userMembership.update({ where: { id }, data: { status: 'CANCELED', endedAt: now } })
      return NextResponse.json({ ok: true, membership: updated })
    }

    if (action === 'cancel_addon') {
      const id = body?.id as string
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
      const booking = await prisma.userAddonBooking.findFirst({ where: { id, userId } })
      if (!booking) return NextResponse.json({ error: 'booking not found' }, { status: 404 })
      const now = new Date()
      const updated = await prisma.userAddonBooking.update({ where: { id }, data: { status: 'CANCELED', endsAt: now } })
      return NextResponse.json({ ok: true, booking: updated })
    }

    return NextResponse.json({ error: 'invalid action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 400 })
  }
}

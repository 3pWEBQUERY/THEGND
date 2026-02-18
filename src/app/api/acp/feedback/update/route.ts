import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  try {
    const body = await req.json().catch(() => ({})) as { id?: string; status?: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' }
    const id = body.id?.trim()
    const status = body.status
    if (!id || !status) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })

    await prisma.feedback.update({ where: { id }, data: { status } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

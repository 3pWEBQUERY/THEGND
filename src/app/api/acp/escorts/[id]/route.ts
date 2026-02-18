import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { id } = await params
  try {
    const payload = await req.json()
    const data: any = {}
    const allowed = ['displayName', 'bio', 'visibility', 'phone', 'website']
    for (const k of allowed) if (k in payload) data[k] = payload[k]
    const profile = await prisma.profile.update({ where: { id }, data })
    return NextResponse.json({ ok: true, profile })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Fehler' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { id } = await params
  try {
    await prisma.profile.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Fehler' }, { status: 500 })
  }
}

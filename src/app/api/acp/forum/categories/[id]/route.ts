import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  try {
    const { id } = await params
    const body = await req.json()
    const data: any = {}
    if (typeof body.name === 'string') data.name = body.name
    if (typeof body.description === 'string') data.description = body.description
    if (typeof body.sortOrder === 'number') data.sortOrder = body.sortOrder

    const updated = await prisma.forumCategory.update({ where: { id }, data, select: { id: true } })
    return NextResponse.json({ ok: true, id: updated.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  try {
    const { id } = await params
    await prisma.forumCategory.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

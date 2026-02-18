import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  const { id } = await params
  try {
    const existing = await prisma.profile.findUnique({ where: { userId: id } })
    if (existing) return NextResponse.json({ error: 'Profil existiert bereits' }, { status: 400 })

    const created = await prisma.profile.create({
      data: {
        userId: id,
        visibility: 'PUBLIC',
      },
    })
    return NextResponse.json({ ok: true, profile: created })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Fehler' }, { status: 500 })
  }
}

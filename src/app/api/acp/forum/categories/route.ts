import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  try {
    const body = await req.json()
    const { name, description, sortOrder } = body || {}
    if (!name) return NextResponse.json({ error: 'name erforderlich' }, { status: 400 })
    const cat = await prisma.forumCategory.create({
      data: {
        name: String(name),
        description: description ? String(description) : null,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      },
    })
    return NextResponse.json({ ok: true, id: cat.id }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

export async function GET(_req: NextRequest) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  try {
    const categories = await prisma.forumCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        forums: {
          where: { parentId: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            children: { orderBy: { sortOrder: 'asc' } },
            _count: { select: { threads: true } },
          },
        },
      },
    })
    return NextResponse.json({ categories })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

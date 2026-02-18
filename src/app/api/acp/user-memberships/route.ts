import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export async function GET(req: Request) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') as any | null
  const take = Number(searchParams.get('take') || 50)
  const items = await prisma.userMembership.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    take,
    include: {
      user: { select: { id: true, email: true } },
      plan: { select: { id: true, name: true, key: true } },
    },
  })
  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { id, status, cancelAt, endedAt, note } = body || {}
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const saved = await prisma.userMembership.update({
      where: { id },
      data: { status, cancelAt: cancelAt ? new Date(cancelAt) : undefined, endedAt: endedAt ? new Date(endedAt) : undefined, note },
    })
    return NextResponse.json(saved)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 400 })
  }
}

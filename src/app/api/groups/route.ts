import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))
    const skip = (page - 1) * limit

    const where: any = q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] } : {}

    const [total, groups] = await Promise.all([
      (prisma as any).feedGroup.count({ where }),
      (prisma as any).feedGroup.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { _count: { select: { members: true, posts: true } }, owner: { select: { email: true, profile: { select: { displayName: true } } } } }
      })
    ])

    return NextResponse.json({ total, page, limit, groups })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    const userId = (session as any)?.user?.id as string | undefined
    if (!userId) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const name = String(body?.name || '').trim()
    const description = typeof body?.description === 'string' ? body.description.trim() : null
    const privacy = (String(body?.privacy || 'PUBLIC').toUpperCase() === 'PRIVATE') ? 'PRIVATE' : 'PUBLIC'
    const cover = typeof body?.cover === 'string' && body.cover.trim() ? String(body.cover).trim() : null
    if (!name) return NextResponse.json({ error: 'Name erforderlich' }, { status: 400 })

    let base = slugify(name)
    if (!base) base = `gruppe-${Date.now()}`
    let slug = base
    let i = 1
    while (await (prisma as any).feedGroup.findUnique({ where: { slug } })) {
      slug = `${base}-${i++}`
    }

    const group = await (prisma as any).feedGroup.create({
      data: { name, slug, description: description || undefined, privacy: privacy as any, ownerId: userId, ...(cover ? { cover } : {}) }
    })
    await (prisma as any).feedGroupMember.create({ data: { groupId: group.id, userId, role: 'ADMIN' } })

    return NextResponse.json({ ok: true, group })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

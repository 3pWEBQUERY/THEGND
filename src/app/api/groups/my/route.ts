import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    const userId = (session as any)?.user?.id as string | undefined
    if (!userId) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10))
    const skip = (page - 1) * limit

    const where: any = {
      members: { some: { userId } },
      ...(q
        ? { OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ]
          }
        : {}),
    }

    const [total, groups] = await Promise.all([
      (prisma as any).feedGroup.count({ where }),
      (prisma as any).feedGroup.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { _count: { select: { members: true, posts: true } } },
      }),
    ])

    return NextResponse.json({ groups, total, page, limit })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

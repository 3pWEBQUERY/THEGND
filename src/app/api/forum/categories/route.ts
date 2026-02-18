import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const categories = await prisma.forumCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        forums: {
          where: { parentId: null, isHidden: false },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            sortOrder: true,
            isLocked: true,
            isHidden: true,
            createdAt: true,
            updatedAt: true,
            children: {
              where: { isHidden: false },
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                sortOrder: true,
                isLocked: true,
                isHidden: true,
                createdAt: true,
                updatedAt: true,
                _count: { select: { threads: true } },
              },
            },
            _count: { select: { threads: true } },
          },
        },
      },
    })
    return NextResponse.json({ categories })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load categories' }, { status: 500 })
  }
}

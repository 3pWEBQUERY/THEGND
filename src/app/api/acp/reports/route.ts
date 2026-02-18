import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { requireModerator } from '@/lib/moderation'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { isAdmin } = await requireAdmin()
  const { isModerator } = await requireModerator()
  if (!isAdmin && !isModerator) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  try {
    const url = new URL(req.url)
    const status = url.searchParams.get('status') || undefined

    const reports = await (prisma as any).forumPostReport.findMany({
      where: {
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { email: true, profile: { select: { displayName: true } } } },
        post: {
          select: {
            id: true,
            content: true,
            thread: { select: { id: true, title: true } },
            author: { select: { email: true, profile: { select: { displayName: true } } } },
          },
        },
      },
      take: 200,
    })
    return NextResponse.json({ reports })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

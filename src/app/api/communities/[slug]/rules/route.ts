import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isModerator, logModAction } from '@/lib/community'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/communities/[slug]/rules */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const community = await prisma.community.findUnique({ where: { slug }, select: { id: true } })
    if (!community) return NextResponse.json({ error: 'Community nicht gefunden' }, { status: 404 })

    const rules = await prisma.communityRule.findMany({
      where: { communityId: community.id },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ rules })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

/** POST /api/communities/[slug]/rules — Create rule */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const userId = await requireAuth()
    const { slug } = await params

    const community = await prisma.community.findUnique({ where: { slug }, select: { id: true } })
    if (!community) return NextResponse.json({ error: 'Community nicht gefunden' }, { status: 404 })

    if (!await isModerator(community.id, userId)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const title = String(body?.title || '').trim().slice(0, 200)
    if (!title) return NextResponse.json({ error: 'Titel erforderlich' }, { status: 400 })

    const description = typeof body?.description === 'string' ? body.description.trim().slice(0, 1000) : null
    const maxSort = await prisma.communityRule.aggregate({
      where: { communityId: community.id },
      _max: { sortOrder: true },
    })

    const rule = await prisma.communityRule.create({
      data: {
        communityId: community.id,
        title,
        description: description || undefined,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    })

    await logModAction({ communityId: community.id, moderatorId: userId, action: 'EDIT_RULES', metadata: { added: title } })

    return NextResponse.json({ ok: true, rule }, { status: 201 })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

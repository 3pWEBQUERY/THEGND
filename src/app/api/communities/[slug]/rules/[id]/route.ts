import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isModerator, logModAction } from '@/lib/community'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** PATCH /api/communities/[slug]/rules/[id] — Update rule */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string; id: string }> }) {
  try {
    const userId = await requireAuth()
    const { slug, id } = await params

    const community = await prisma.community.findUnique({ where: { slug }, select: { id: true } })
    if (!community) return NextResponse.json({ error: 'Community nicht gefunden' }, { status: 404 })

    if (!await isModerator(community.id, userId)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const rule = await prisma.communityRule.findUnique({ where: { id } })
    if (!rule || rule.communityId !== community.id) return NextResponse.json({ error: 'Regel nicht gefunden' }, { status: 404 })

    const body = await req.json().catch(() => ({}))
    const data: any = {}
    if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim().slice(0, 200)
    if (typeof body.description === 'string') data.description = body.description.trim().slice(0, 1000)
    if (typeof body.sortOrder === 'number') data.sortOrder = body.sortOrder

    const updated = await prisma.communityRule.update({ where: { id }, data })
    return NextResponse.json({ ok: true, rule: updated })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

/** DELETE /api/communities/[slug]/rules/[id] — Delete rule */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string; id: string }> }) {
  try {
    const userId = await requireAuth()
    const { slug, id } = await params

    const community = await prisma.community.findUnique({ where: { slug }, select: { id: true } })
    if (!community) return NextResponse.json({ error: 'Community nicht gefunden' }, { status: 404 })

    if (!await isModerator(community.id, userId)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const rule = await prisma.communityRule.findUnique({ where: { id } })
    if (!rule || rule.communityId !== community.id) return NextResponse.json({ error: 'Regel nicht gefunden' }, { status: 404 })

    await prisma.communityRule.delete({ where: { id } })
    await logModAction({ communityId: community.id, moderatorId: userId, action: 'EDIT_RULES', metadata: { removed: rule.title } })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

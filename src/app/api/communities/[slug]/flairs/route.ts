import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isModerator } from '@/lib/community'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/communities/[slug]/flairs */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const community = await prisma.community.findUnique({ where: { slug }, select: { id: true } })
    if (!community) return NextResponse.json({ error: 'Community nicht gefunden' }, { status: 404 })

    const flairs = await prisma.communityFlair.findMany({
      where: { communityId: community.id },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ flairs })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

/** POST /api/communities/[slug]/flairs — Create flair */
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
    const name = String(body?.name || '').trim().slice(0, 50)
    if (!name) return NextResponse.json({ error: 'Name erforderlich' }, { status: 400 })

    const color = typeof body?.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(body.color) ? body.color : '#6B7280'
    const textColor = typeof body?.textColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(body.textColor) ? body.textColor : '#FFFFFF'

    const flair = await prisma.communityFlair.create({
      data: { communityId: community.id, name, color, textColor },
    })

    return NextResponse.json({ ok: true, flair }, { status: 201 })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status })
  }
}

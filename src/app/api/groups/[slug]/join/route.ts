import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getServerSession(authOptions as any)
    const userId = (session as any)?.user?.id as string | undefined
    if (!userId) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const { slug } = await params
    const group = await (prisma as any).feedGroup.findUnique({ where: { slug } })
    if (!group) return NextResponse.json({ error: 'Gruppe nicht gefunden' }, { status: 404 })

    await (prisma as any).feedGroupMember.upsert({
      where: { groupId_userId: { groupId: group.id, userId } },
      update: {},
      create: { groupId: group.id, userId, role: 'MEMBER' as any },
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { requireModerator } from '@/lib/moderation'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await requireAdmin()
  const { isModerator } = await requireModerator()
  if (!isAdmin && !isModerator) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  try {
    const { id } = await params
    const contentType = req.headers.get('content-type') || ''
    let action: string | null = null
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}))
      action = body?.action || null
    } else {
      const fd = await req.formData()
      action = (fd.get('action') as string) || null
    }

    if (!action) return NextResponse.json({ error: 'action erforderlich' }, { status: 400 })

    if (action === 'resolve') {
      const updated = await (prisma as any).forumPostReport.update({ where: { id }, data: { status: 'RESOLVED', resolvedAt: new Date() } })
      return NextResponse.json({ ok: true, status: updated.status })
    }
    if (action === 'reopen') {
      const updated = await (prisma as any).forumPostReport.update({ where: { id }, data: { status: 'OPEN', resolvedAt: null } })
      return NextResponse.json({ ok: true, status: updated.status })
    }
    if (action === 'delete') {
      await (prisma as any).forumPostReport.delete({ where: { id } })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unbekannte Aktion' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

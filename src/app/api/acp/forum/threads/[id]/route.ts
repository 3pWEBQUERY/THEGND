import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { awardEvent } from '@/lib/gamification'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin, session } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
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

    const thread = await prisma.forumThread.findUnique({ where: { id } })
    if (!thread) return NextResponse.json({ error: 'Thread nicht gefunden' }, { status: 404 })

    if (action === 'toggle_pin') {
      const updated = await prisma.forumThread.update({ where: { id }, data: { isPinned: !thread.isPinned } })
      return NextResponse.json({ ok: true, isPinned: updated.isPinned })
    }

    if (action === 'toggle_close') {
      const updated = await prisma.forumThread.update({ where: { id }, data: { isClosed: !thread.isClosed } })
      // Gamification: award small points to acting admin for moderation action
      try {
        if (session?.user?.id) {
          const type = updated.isClosed ? 'FORUM_THREAD_CLOSE' : 'FORUM_THREAD_OPEN'
          await awardEvent(session.user.id, type as any, 5, { threadId: id })
        }
      } catch {}
      return NextResponse.json({ ok: true, isClosed: updated.isClosed })
    }

    if (action === 'delete') {
      await prisma.forumThread.delete({ where: { id } })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unbekannte Aktion' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

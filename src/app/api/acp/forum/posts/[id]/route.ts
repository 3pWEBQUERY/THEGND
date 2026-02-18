import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await requireAdmin()
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

    // For simplicity we treat any POST here as delete when not specified
    if (!action || action === 'delete') {
      await prisma.forumPost.delete({ where: { id } })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unbekannte Aktion' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}

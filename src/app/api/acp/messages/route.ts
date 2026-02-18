import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

function isFormContentType(req: NextRequest) {
  const ct = req.headers.get('content-type') || ''
  return ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')
}

export async function POST(req: NextRequest) {
  const { isAdmin, session } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  try {
    let receiverEmail: string | null = null
    let content: string | null = null

    if (isFormContentType(req)) {
      const fd = await req.formData()
      receiverEmail = String(fd.get('receiverEmail') || '')
      content = String(fd.get('content') || '')
    } else {
      const body = await req.json().catch(() => ({}))
      receiverEmail = body.receiverEmail || null
      content = body.content || null
    }

    if (!receiverEmail || !content) {
      return NextResponse.json({ error: 'receiverEmail und content erforderlich' }, { status: 400 })
    }

    const receiver = await prisma.user.findUnique({ where: { email: receiverEmail } })
    if (!receiver) return NextResponse.json({ error: 'Empfänger nicht gefunden' }, { status: 404 })

    const senderId = session?.user?.id
    if (!senderId) return NextResponse.json({ error: 'Absender unbekannt' }, { status: 400 })

    const msg = await prisma.message.create({ data: { senderId, receiverId: receiver.id, content } })
    return NextResponse.json({ ok: true, message: msg })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Fehler' }, { status: 500 })
  }
}

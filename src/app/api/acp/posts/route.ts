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
    let authorEmail: string | null = null
    let content: string | null = null

    if (isFormContentType(req)) {
      const fd = await req.formData()
      authorEmail = String(fd.get('authorEmail') || '')
      content = String(fd.get('content') || '')
    } else {
      const body = await req.json().catch(() => ({}))
      authorEmail = body.authorEmail || session?.user?.email || null
      content = body.content || null
    }

    if (!authorEmail || !content) {
      return NextResponse.json({ error: 'authorEmail und content erforderlich' }, { status: 400 })
    }

    const author = await prisma.user.findUnique({ where: { email: authorEmail } })
    if (!author) return NextResponse.json({ error: 'Autor nicht gefunden' }, { status: 404 })

    const post = await prisma.post.create({ data: { authorId: author.id, content } })
    return NextResponse.json({ ok: true, post })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Fehler' }, { status: 500 })
  }
}

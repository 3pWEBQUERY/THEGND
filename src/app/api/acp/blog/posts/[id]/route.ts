import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const post = await (prisma as any).blogPost.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(post)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const body = await req.json()
    const data: any = {}
    if (typeof body.title === 'string') data.title = body.title.trim()
    if (typeof body.slug === 'string') data.slug = body.slug.trim()
    if (typeof body.excerpt === 'string' || body.excerpt === null) data.excerpt = body.excerpt
    if (typeof body.content === 'string' || body.content === null) data.content = body.content
    if (typeof body.coverImage === 'string' || body.coverImage === null) data.coverImage = body.coverImage
    if (typeof body.category === 'string') {
      const catValues = ['AKTUELLES', 'INTERESSANT_HEISSES', 'VON_USER_FUER_USER']
      if (catValues.includes(body.category)) data.category = body.category
    }
    if (typeof body.published === 'boolean') {
      data.published = body.published
      data.publishedAt = body.published ? new Date() : null
    }
    const updated = await (prisma as any).blogPost.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  await (prisma as any).blogPost.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

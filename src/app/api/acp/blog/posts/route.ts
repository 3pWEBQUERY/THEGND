import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export async function GET(req: NextRequest) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const searchParams = req.nextUrl.searchParams
  const q = (searchParams.get('q') || '').trim().toLowerCase()
  const posts = await (prisma as any).blogPost.findMany({
    where: q ? { OR: [
      { title: { contains: q, mode: 'insensitive' } },
      { slug: { contains: q, mode: 'insensitive' } },
      { excerpt: { contains: q, mode: 'insensitive' } },
    ] } : undefined,
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, slug: true, published: true, blocked: true, publishedAt: true, createdAt: true, updatedAt: true }
  })
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  const { isAdmin, session } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const {
      title,
      slug,
      excerpt,
      content,
      coverImage,
      published,
      category,
    } = body || {}
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'title required' }, { status: 400 })
    }
    const s = (typeof slug === 'string' && slug.trim()) ? slug.trim() : slugify(title)
    const exists = await (prisma as any).blogPost.findUnique({ where: { slug: s } })
    if (exists) return NextResponse.json({ error: 'slug already exists' }, { status: 409 })

    const now = new Date()
    const catValues = ['AKTUELLES', 'INTERESSANT_HEISSES', 'VON_USER_FUER_USER']
    const cat = (typeof category === 'string' && catValues.includes(category)) ? category : 'AKTUELLES'
    const post = await (prisma as any).blogPost.create({
      data: {
        title: title.trim(),
        slug: s,
        excerpt: typeof excerpt === 'string' ? excerpt : null,
        content: typeof content === 'string' ? content : null,
        coverImage: typeof coverImage === 'string' ? coverImage : null,
        published: !!published,
        publishedAt: !!published ? now : null,
        category: cat,
        authorId: session?.user?.id as string,
      },
      select: { id: true, title: true, slug: true, published: true, blocked: true, publishedAt: true, createdAt: true, updatedAt: true }
    })
    return NextResponse.json(post, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}

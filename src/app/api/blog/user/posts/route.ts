import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { awardEvent } from '@/lib/gamification'

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export async function GET(_req: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const posts = await (prisma as any).blogPost.findMany({
    where: { authorId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { title, slug, excerpt, content, coverImage, published } = body || {}
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'title required' }, { status: 400 })
    }
    const s = (typeof slug === 'string' && slug.trim()) ? slug.trim() : slugify(title)
    const exists = await (prisma as any).blogPost.findUnique({ where: { slug: s } })
    if (exists) return NextResponse.json({ error: 'slug already exists' }, { status: 409 })

    const now = new Date()
    const post = await (prisma as any).blogPost.create({
      data: {
        title: title.trim(),
        slug: s,
        excerpt: typeof excerpt === 'string' ? excerpt : null,
        content: typeof content === 'string' ? content : null,
        coverImage: typeof coverImage === 'string' ? coverImage : null,
        published: !!published,
        publishedAt: !!published ? now : null,
        category: 'VON_USER_FUER_USER',
        authorId: session.user.id,
      },
    })
    // Gamification: award points for creating a user blog post
    try {
      await awardEvent(session.user.id, 'BLOG_POST' as any, 20, { postId: post.id })
    } catch {}
    return NextResponse.json(post, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}

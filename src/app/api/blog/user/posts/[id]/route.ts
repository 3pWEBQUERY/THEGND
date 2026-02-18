import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { awardEvent } from '@/lib/gamification'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await getServerSession(authOptions as any)) as any
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const post = await (prisma as any).blogPost.findUnique({ where: { id } })
  if (!post || post.authorId !== session.user.id) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(post)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await getServerSession(authOptions as any)) as any
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const existing = await (prisma as any).blogPost.findUnique({ where: { id } })
    if (!existing || existing.authorId !== session.user.id) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const body = await req.json()
    const data: any = {}
    if (typeof body.title === 'string') data.title = body.title.trim()
    if (typeof body.slug === 'string') data.slug = body.slug.trim()
    if (typeof body.excerpt === 'string' || body.excerpt === null) data.excerpt = body.excerpt
    if (typeof body.content === 'string' || body.content === null) data.content = body.content
    if (typeof body.coverImage === 'string' || body.coverImage === null) data.coverImage = body.coverImage
    if (typeof body.published === 'boolean') {
      data.published = body.published
      data.publishedAt = body.published ? new Date() : null
    }
    // Force user posts to stay in VON_USER_FUER_USER category
    data.category = 'VON_USER_FUER_USER'
    const updated = await (prisma as any).blogPost.update({ where: { id }, data })
    // Gamification: if transitioned to published, award points
    try {
      const wasPublished = !!existing.published
      const isPublished = !!updated.published
      if (!wasPublished && isPublished) {
        await awardEvent(session.user.id, 'BLOG_PUBLISH' as any, 10, { postId: id })
      }
    } catch {}

    // Gamification: major update detection (content changed significantly)
    try {
      const oldContent = String(existing.content || '')
      const newContent = String(updated.content || '')
      const changed = oldContent !== newContent
      if (changed) {
        const lenOld = oldContent.length
        const lenNew = newContent.length
        const lenDiff = Math.abs(lenNew - lenOld)
        const percentChange = lenOld > 0 ? (lenDiff / lenOld) : 1
        const largeNow = lenNew >= 1200
        const significant = lenDiff >= 500 || percentChange >= 0.35 || (largeNow && lenNew - lenOld >= 300)
        if (significant) {
          // Cooldown: 12h per post
          const since = new Date(Date.now() - 12 * 60 * 60 * 1000)
          const recentMajor = await (prisma as any).gamificationEvent.findFirst({
            where: {
              userId: session.user.id,
              type: 'BLOG_UPDATE_MAJOR',
              createdAt: { gt: since },
              // metadata contains postId
              OR: [
                { metadata: { contains: `"postId":"${id}"` } },
                { metadata: { contains: `"postId": "${id}"` } },
              ],
            },
          })
          if (!recentMajor) {
            await awardEvent(session.user.id, 'BLOG_UPDATE_MAJOR' as any, 8, { postId: id, lenOld, lenNew })
          }
        }
      }
    } catch {}
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await getServerSession(authOptions as any)) as any
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await (prisma as any).blogPost.findUnique({ where: { id } })
  if (!existing || existing.authorId !== session.user.id) return NextResponse.json({ error: 'not found' }, { status: 404 })
  await (prisma as any).blogPost.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

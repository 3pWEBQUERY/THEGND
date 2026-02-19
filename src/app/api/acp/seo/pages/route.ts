import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { revalidatePath } from 'next/cache'

export async function GET(req: Request) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('q') || ''
  const where = search ? { urlPath: { contains: search, mode: 'insensitive' as const } } : {}
  const pages = await prisma.seoPageOverride.findMany({
    where,
    orderBy: { urlPath: 'asc' },
  })
  return NextResponse.json(pages)
}

export async function POST(req: Request) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { urlPath, metaTitle, metaDescription, metaKeywords, ogTitle, ogDescription, ogImageUrl, robots, canonicalUrl, priority, changeFrequency, enabled } = body
    if (!urlPath) return NextResponse.json({ error: 'urlPath required' }, { status: 400 })
    const page = await prisma.seoPageOverride.create({
      data: {
        urlPath,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        metaKeywords: metaKeywords || null,
        ogTitle: ogTitle || null,
        ogDescription: ogDescription || null,
        ogImageUrl: ogImageUrl || null,
        robots: robots || null,
        canonicalUrl: canonicalUrl || null,
        priority: priority != null ? parseFloat(priority) : 0.6,
        changeFrequency: changeFrequency || 'daily',
        enabled: enabled !== false,
      },
    })
    try { revalidatePath(urlPath) } catch {}
    return NextResponse.json(page)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 400 })
  }
}

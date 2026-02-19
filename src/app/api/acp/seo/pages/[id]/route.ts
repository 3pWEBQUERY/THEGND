import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { revalidatePath } from 'next/cache'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const body = await req.json()
    const { urlPath, metaTitle, metaDescription, metaKeywords, ogTitle, ogDescription, ogImageUrl, robots, canonicalUrl, priority, changeFrequency, enabled } = body
    const page = await prisma.seoPageOverride.update({
      where: { id },
      data: {
        ...(urlPath !== undefined ? { urlPath } : {}),
        metaTitle: metaTitle ?? null,
        metaDescription: metaDescription ?? null,
        metaKeywords: metaKeywords ?? null,
        ogTitle: ogTitle ?? null,
        ogDescription: ogDescription ?? null,
        ogImageUrl: ogImageUrl ?? null,
        robots: robots ?? null,
        canonicalUrl: canonicalUrl ?? null,
        ...(priority != null ? { priority: parseFloat(priority) } : {}),
        ...(changeFrequency ? { changeFrequency } : {}),
        ...(enabled !== undefined ? { enabled } : {}),
      },
    })
    try { revalidatePath(urlPath || page.urlPath) } catch {}
    return NextResponse.json(page)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 400 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const page = await prisma.seoPageOverride.delete({ where: { id } })
    try { revalidatePath(page.urlPath) } catch {}
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 400 })
  }
}

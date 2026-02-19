import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { invalidateRedirectCache } from '@/lib/seo'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const body = await req.json()
    const { sourcePath, targetUrl, statusCode, enabled } = body
    const redirect = await prisma.seoRedirect.update({
      where: { id },
      data: {
        ...(sourcePath !== undefined ? { sourcePath } : {}),
        ...(targetUrl !== undefined ? { targetUrl } : {}),
        ...(statusCode !== undefined ? { statusCode: parseInt(statusCode, 10) } : {}),
        ...(enabled !== undefined ? { enabled } : {}),
      },
    })
    invalidateRedirectCache()
    return NextResponse.json(redirect)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 400 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    await prisma.seoRedirect.delete({ where: { id } })
    invalidateRedirectCache()
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 400 })
  }
}

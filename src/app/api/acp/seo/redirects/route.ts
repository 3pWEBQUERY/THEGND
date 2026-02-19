import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { invalidateRedirectCache } from '@/lib/seo'

export async function GET(req: Request) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('q') || ''
  const where = search ? { sourcePath: { contains: search, mode: 'insensitive' as const } } : {}
  const redirects = await prisma.seoRedirect.findMany({
    where,
    orderBy: { sourcePath: 'asc' },
  })
  return NextResponse.json(redirects)
}

export async function POST(req: Request) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { sourcePath, targetUrl, statusCode, enabled } = body
    if (!sourcePath || !targetUrl) return NextResponse.json({ error: 'sourcePath and targetUrl required' }, { status: 400 })
    const redirect = await prisma.seoRedirect.create({
      data: {
        sourcePath,
        targetUrl,
        statusCode: statusCode ? parseInt(statusCode, 10) : 301,
        enabled: enabled !== false,
      },
    })
    invalidateRedirectCache()
    return NextResponse.json(redirect)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 400 })
  }
}

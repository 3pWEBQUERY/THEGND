import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Quick action via GET: /api/acp/users/:id/visibility?value=VERIFIED|PUBLIC|PRIVATE
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.redirect(new URL('/', req.url))
  const { id } = await params
  const value = new URL(req.url).searchParams.get('value') as any
  if (!id || !value) return NextResponse.redirect(new URL('/acp/users', req.url))
  try {
    await prisma.$executeRaw`
      UPDATE "profiles" SET "visibility" = ${value}::"ProfileVisibility" WHERE "userId" = ${id}
    `
  } catch {}
  return NextResponse.redirect(new URL('/acp/users', req.url))
}

// JSON API via PATCH: { value: 'VERIFIED' | 'PUBLIC' | 'PRIVATE' }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { id } = await params
  const body = await req.json().catch(() => ({})) as { value?: 'VERIFIED' | 'PUBLIC' | 'PRIVATE' }
  const value = body?.value
  if (!id || !value) return NextResponse.json({ error: 'INVALID' }, { status: 400 })
  try {
    await prisma.$executeRaw`
      UPDATE "profiles" SET "visibility" = ${value}::"ProfileVisibility" WHERE "userId" = ${id}
    `
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'UPDATE_FAILED' }, { status: 500 })
  }
}

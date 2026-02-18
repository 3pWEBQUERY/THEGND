import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { revalidatePath } from 'next/cache'

export async function GET(req: Request) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')
  if (key) {
    const setting = await prisma.appSetting.findUnique({ where: { key } })
    return NextResponse.json(setting)
  }
  const all = await prisma.appSetting.findMany({ orderBy: { key: 'asc' } })
  return NextResponse.json(all)
}

export async function POST(req: Request) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { key, value } = body || {}
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })
    const saved = await prisma.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
    try {
      revalidatePath('/')
      revalidatePath('/robots.txt')
      revalidatePath('/sitemap.xml')
      revalidatePath('/manifest.webmanifest')
    } catch {}
    return NextResponse.json(saved)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { key } = body
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })
  await prisma.appSetting.delete({ where: { key } })
  try {
    revalidatePath('/')
    revalidatePath('/robots.txt')
    revalidatePath('/sitemap.xml')
    revalidatePath('/manifest.webmanifest')
  } catch {}
  return NextResponse.json({ ok: true })
}

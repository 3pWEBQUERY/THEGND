import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { revalidatePath } from 'next/cache'

export async function GET(req: Request) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const all = await prisma.seoStructuredData.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(all)
}

export async function POST(req: Request) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { name, schemaType, urlPattern, jsonLdTemplate, enabled } = body
    if (!name || !schemaType || !urlPattern || !jsonLdTemplate) {
      return NextResponse.json({ error: 'name, schemaType, urlPattern, jsonLdTemplate required' }, { status: 400 })
    }
    // Validate JSON
    try { JSON.parse(jsonLdTemplate) } catch {
      return NextResponse.json({ error: 'jsonLdTemplate must be valid JSON' }, { status: 400 })
    }
    const sd = await prisma.seoStructuredData.create({
      data: { name, schemaType, urlPattern, jsonLdTemplate, enabled: enabled !== false },
    })
    try { revalidatePath(urlPattern === '*' || urlPattern === '/*' ? '/' : urlPattern.replace(/\*/g, '')) } catch {}
    return NextResponse.json(sd)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 400 })
  }
}

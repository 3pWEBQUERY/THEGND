import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export async function GET() {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const addons = await prisma.addon.findMany({ orderBy: { sortOrder: 'asc' }, include: { options: { orderBy: { sortOrder: 'asc' } } } })
  return NextResponse.json(addons)
}

export async function POST(req: Request) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { id, key, name, description, active, sortOrder } = body || {}
    const allowedKeys = ['ESCORT_OF_DAY','ESCORT_OF_WEEK','ESCORT_OF_MONTH','CITY_BOOST','PROFILE_ANALYTICS','COUNTRY_BLOCK','SEO']
    if (!key || !allowedKeys.includes(String(key))) {
      return NextResponse.json({ error: 'Ungültiger Add-on Key' }, { status: 400 })
    }
    let result
    if (id) {
      result = await prisma.addon.update({ where: { id }, data: { key, name, description, active, sortOrder } })
    } else {
      // Upsert by key to avoid duplicate-key errors when the addon already exists
      const existing = await prisma.addon.findUnique({ where: { key } as any })
      if (existing) {
        result = await prisma.addon.update({
          where: { id: existing.id },
          data: {
            key,
            name,
            description,
            active: typeof active === 'boolean' ? active : existing.active,
            sortOrder: typeof sortOrder === 'number' ? sortOrder : existing.sortOrder,
          },
        })
      } else {
        result = await prisma.addon.create({ data: { key, name, description, active: active ?? true, sortOrder: sortOrder ?? 0 } })
      }
    }
    return NextResponse.json(result)
  } catch (e: any) {
    // Prisma P2002 unique constraint, P2000 enum/validation errors etc.
    const msg = e?.code === 'P2002' ? 'Ein Add-on mit diesem Key existiert bereits' : (e?.message || 'failed')
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

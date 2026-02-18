import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createRentalSchema = z.object({
  title: z.string().min(3).max(120),
  shortDesc: z.string().min(10).max(260),
  description: z.string().min(20).max(8000),
  category: z.enum(['APARTMENT','ROOM','STUDIO','EVENT_SPACE']),
  location: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  priceInfo: z.string().optional(),
  contactInfo: z.string().optional(),
  media: z.array(z.string().url()).max(10).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const category = (searchParams.get('category') || '').trim().toUpperCase()
    const city = (searchParams.get('city') || '').trim()
    const country = (searchParams.get('country') || '').trim()
    const mine = searchParams.get('mine') === '1'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limitRaw = parseInt(searchParams.get('limit') || '12', 10) || 12
    const limit = Math.min(50, Math.max(1, limitRaw))

    let userId: string | null = null
    if (mine) {
      const session = await getServerSession(authOptions)
      userId = session?.user?.id || null
      if (!userId) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const where: any = { isActive: true }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { shortDesc: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (category && ['APARTMENT','ROOM','STUDIO','EVENT_SPACE'].includes(category)) {
      where.category = category as any
    }
    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (country) where.country = { contains: country, mode: 'insensitive' }
    if (userId) where.postedById = userId

    const rentals = await (prisma as any).rental.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { postedBy: { include: { profile: true } } },
    })

    const items = (rentals as any[]).map((r: any) => ({
      id: r.id,
      title: r.title,
      shortDesc: r.shortDesc,
      description: r.description,
      category: r.category,
      location: r.location,
      city: r.city,
      country: r.country,
      priceInfo: r.priceInfo,
      contactInfo: r.contactInfo,
      media: (() => { try { const a = r.media ? JSON.parse(r.media) : []; return Array.isArray(a) ? a : [] } catch { return [] } })(),
      isActive: r.isActive,
      createdAt: r.createdAt,
      postedBy: {
        id: r.postedById,
        userType: (r as any).postedBy.userType,
        displayName: (r as any).postedBy.profile?.displayName ?? null,
        avatar: (r as any).postedBy.profile?.avatar ?? null,
        companyName: (r as any).postedBy.profile?.companyName ?? null,
      },
    }))

    return NextResponse.json({ items, page, limit })
  } catch (e) {
    console.error('GET /api/rentals error:', e)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }
    const user = await (prisma as any).user.findUnique({ where: { id: session.user.id }, select: { userType: true } })
    if (!user || !['AGENCY','CLUB','STUDIO'].includes(user.userType as any)) {
      return NextResponse.json({ error: 'Nur Agenturen, Clubs oder Studios können Mieten erstellen' }, { status: 403 })
    }

    const json = await request.json().catch(() => null)
    const parsed = createRentalSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Daten', details: parsed.error.issues }, { status: 400 })
    }
    const data = parsed.data

    const rental = await (prisma as any).rental.create({
      data: {
        title: data.title,
        shortDesc: data.shortDesc,
        description: data.description,
        category: data.category as any,
        location: data.location,
        city: data.city,
        country: data.country,
        priceInfo: data.priceInfo,
        contactInfo: data.contactInfo,
        media: data.media ? JSON.stringify(data.media) : null,
        isActive: data.isActive ?? true,
        postedById: session.user.id,
      },
    })

    return NextResponse.json({ ok: true, id: (rental as any).id })
  } catch (e) {
    console.error('POST /api/rentals error:', e)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

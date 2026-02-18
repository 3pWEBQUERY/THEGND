import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'

const createJobSchema = z.object({
  title: z.string().min(3).max(120),
  shortDesc: z.string().min(10).max(260),
  description: z.string().min(20).max(8000),
  category: z.enum(['ESCORT','CLEANING','SECURITY','HOUSEKEEPING']),
  location: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  salaryInfo: z.string().optional(),
  contactInfo: z.string().optional(),
  media: z.array(z.string().url()).max(6).optional(),
  isActive: z.boolean().optional().default(true),
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

    const where: any = {
      isActive: true,
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { shortDesc: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (category && ['ESCORT','CLEANING','SECURITY','HOUSEKEEPING'].includes(category)) {
      where.category = category as any
    }
    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (country) where.country = { contains: country, mode: 'insensitive' }
    if (userId) where.postedById = userId

    const jobs = await (prisma as any).job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        postedBy: { include: { profile: true } },
      },
    })

    const items = (jobs as any[]).map((j: any) => ({
      id: j.id,
      title: j.title,
      shortDesc: j.shortDesc,
      description: j.description,
      category: j.category,
      location: j.location,
      city: j.city,
      country: j.country,
      salaryInfo: j.salaryInfo,
      contactInfo: j.contactInfo,
      media: (() => { try { return j.media ? JSON.parse(j.media) : [] } catch { return [] } })(),
      isActive: j.isActive,
      createdAt: j.createdAt,
      postedBy: {
        id: j.postedById,
        userType: (j as any).postedBy.userType,
        displayName: (j as any).postedBy.profile?.displayName ?? null,
        avatar: (j as any).postedBy.profile?.avatar ?? null,
        companyName: (j as any).postedBy.profile?.companyName ?? null,
      },
    }))

    return NextResponse.json({ items, page, limit })
  } catch (e) {
    console.error('GET /api/jobs error:', e)
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
      return NextResponse.json({ error: 'Nur Agenturen, Clubs oder Studios können Jobs erstellen' }, { status: 403 })
    }

    const json = await request.json().catch(() => null)
    const parsed = createJobSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Daten', details: parsed.error.issues }, { status: 400 })
    }
    const data = parsed.data

    const job = await (prisma as any).job.create({
      data: {
        title: data.title,
        shortDesc: data.shortDesc,
        description: data.description,
        category: data.category as any,
        location: data.location,
        city: data.city,
        country: data.country,
        salaryInfo: data.salaryInfo,
        contactInfo: data.contactInfo,
        media: data.media ? JSON.stringify(data.media) : null,
        isActive: data.isActive ?? true,
        postedById: session.user.id,
      },
    })

    return NextResponse.json({ id: job.id }, { status: 201 })
  } catch (e) {
    console.error('POST /api/jobs error:', e)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

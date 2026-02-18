import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const rental = await (prisma as any).rental.findUnique({
      where: { id },
      include: { postedBy: { include: { profile: true } } },
    })
    if (!rental) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

    const data = {
      id: rental.id,
      title: rental.title,
      shortDesc: rental.shortDesc,
      description: rental.description,
      category: rental.category,
      location: rental.location,
      city: rental.city,
      country: rental.country,
      priceInfo: rental.priceInfo,
      contactInfo: rental.contactInfo,
      media: (() => { try { return rental.media ? JSON.parse(rental.media) : [] } catch { return [] } })(),
      isActive: rental.isActive,
      createdAt: rental.createdAt,
      postedBy: {
        id: rental.postedById,
        userType: (rental as any).postedBy.userType,
        displayName: (rental as any).postedBy.profile?.displayName ?? null,
        avatar: (rental as any).postedBy.profile?.avatar ?? null,
        companyName: (rental as any).postedBy.profile?.companyName ?? null,
      },
    }

    return NextResponse.json(data)
  } catch (e) {
    console.error('GET /api/rentals/[id] error:', e)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  title: z.string().min(3).max(120).optional(),
  shortDesc: z.string().min(10).max(260).optional(),
  description: z.string().min(20).max(8000).optional(),
  category: z.enum(['APARTMENT','ROOM','STUDIO','EVENT_SPACE']).optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  priceInfo: z.string().optional(),
  contactInfo: z.string().optional(),
  media: z.array(z.string().url()).max(10).optional(),
})

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const { id } = await ctx.params
    const rental = await (prisma as any).rental.findUnique({ where: { id }, select: { postedById: true } })
    if (!rental) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
    if (rental.postedById !== session.user.id) return NextResponse.json({ error: 'Verboten' }, { status: 403 })

    const json = await request.json().catch(() => null)
    const parsed = patchSchema.safeParse(json)
    if (!parsed.success) return NextResponse.json({ error: 'Ungültige Daten', details: parsed.error.issues }, { status: 400 })

    const data: any = {}
    if (typeof parsed.data.isActive === 'boolean') data.isActive = parsed.data.isActive
    if (typeof parsed.data.title === 'string') data.title = parsed.data.title
    if (typeof parsed.data.shortDesc === 'string') data.shortDesc = parsed.data.shortDesc
    if (typeof parsed.data.description === 'string') data.description = parsed.data.description
    if (typeof parsed.data.category === 'string') data.category = parsed.data.category
    if (typeof parsed.data.location === 'string') data.location = parsed.data.location
    if (typeof parsed.data.city === 'string') data.city = parsed.data.city
    if (typeof parsed.data.country === 'string') data.country = parsed.data.country
    if (typeof parsed.data.priceInfo === 'string') data.priceInfo = parsed.data.priceInfo
    if (typeof parsed.data.contactInfo === 'string') data.contactInfo = parsed.data.contactInfo
    if (Array.isArray(parsed.data.media)) data.media = JSON.stringify(parsed.data.media)
    if (Object.keys(data).length === 0) return NextResponse.json({ ok: true })

    await (prisma as any).rental.update({ where: { id }, data })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('PATCH /api/rentals/[id] error:', e)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const { id } = await ctx.params
    const rental = await (prisma as any).rental.findUnique({ where: { id }, select: { postedById: true } })
    if (!rental) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
    if (rental.postedById !== session.user.id) return NextResponse.json({ error: 'Verboten' }, { status: 403 })

    await (prisma as any).rental.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/rentals/[id] error:', e)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

export const runtime = 'nodejs'

export async function GET(_request: Request, context: any) {
  try {
    const params = context?.params
    const resolved = (params && typeof params.then === 'function') ? await params : params
    const id = (resolved?.id as string)
    const job = await (prisma as any).job.findUnique({
      where: { id },
      include: { postedBy: { include: { profile: true } } },
    })
    if (!job) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

    const data = {
      id: job.id,
      title: job.title,
      shortDesc: job.shortDesc,
      description: job.description,
      category: job.category,
      location: job.location,
      city: job.city,
      country: job.country,
      salaryInfo: job.salaryInfo,
      contactInfo: job.contactInfo,
      media: (() => { try { return job.media ? JSON.parse(job.media) : [] } catch { return [] } })(),
      isActive: job.isActive,
      createdAt: job.createdAt,
      postedBy: {
        id: job.postedById,
        userType: (job as any).postedBy.userType,
        displayName: (job as any).postedBy.profile?.displayName ?? null,
        avatar: (job as any).postedBy.profile?.avatar ?? null,
        companyName: (job as any).postedBy.profile?.companyName ?? null,
      },
    }

    return NextResponse.json(data)
  } catch (e) {
    console.error('GET /api/jobs/[id] error:', e)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  title: z.string().min(3).max(120).optional(),
  shortDesc: z.string().min(10).max(260).optional(),
  description: z.string().min(20).max(8000).optional(),
  category: z.enum(['ESCORT','CLEANING','SECURITY','HOUSEKEEPING']).optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  salaryInfo: z.string().optional(),
  contactInfo: z.string().optional(),
})

export async function PATCH(request: Request, context: any) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const params = context?.params
    const resolved = (params && typeof params.then === 'function') ? await params : params
    const id = (resolved?.id as string)
    const job = await (prisma as any).job.findUnique({ where: { id }, select: { postedById: true } })
    if (!job) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
    if (job.postedById !== session.user.id) return NextResponse.json({ error: 'Verboten' }, { status: 403 })

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
    if (typeof parsed.data.salaryInfo === 'string') data.salaryInfo = parsed.data.salaryInfo
    if (typeof parsed.data.contactInfo === 'string') data.contactInfo = parsed.data.contactInfo
    if (Object.keys(data).length === 0) return NextResponse.json({ ok: true })

    await (prisma as any).job.update({ where: { id }, data })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('PATCH /api/jobs/[id] error:', e)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: any) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const params = context?.params
    const resolved = (params && typeof params.then === 'function') ? await params : params
    const id = (resolved?.id as string)
    const job = await (prisma as any).job.findUnique({ where: { id }, select: { postedById: true } })
    if (!job) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
    if (job.postedById !== session.user.id) return NextResponse.json({ error: 'Verboten' }, { status: 403 })

    await (prisma as any).job.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/jobs/[id] error:', e)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

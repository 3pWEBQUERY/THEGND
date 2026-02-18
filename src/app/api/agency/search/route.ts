import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getPrimaryImage(profile: any): string | null {
  if (profile?.avatar) return profile.avatar
  try {
    if (profile?.media) {
      const media = JSON.parse(profile.media)
      const firstImage = Array.isArray(media)
        ? media.find((m: any) => (m?.type?.toLowerCase?.() ?? '').includes('image'))
        : null
      if (firstImage?.url) return firstImage.url
    }
  } catch {}
  try {
    if (profile?.gallery) {
      const gallery = JSON.parse(profile.gallery)
      if (Array.isArray(gallery) && gallery[0]) return gallery[0]
    }
  } catch {}
  return null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() || ''
  const location = searchParams.get('location')?.trim() || ''
  const take = Math.min(Number(searchParams.get('take') || '60'), 100)
  const skip = Math.max(Number(searchParams.get('skip') || '0'), 0)
  const sort = (searchParams.get('sort') || 'newest').toLowerCase()
  const businessType = searchParams.get('businessType')?.trim() || ''
  const services = (searchParams.get('services')?.trim() || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const and: any[] = []
  if (q) {
    and.push({
      OR: [
        { profile: { is: { companyName: { contains: q, mode: 'insensitive' } } } },
        { profile: { is: { description: { contains: q, mode: 'insensitive' } } } },
      ],
    })
  }
  if (location) {
    and.push({
      OR: [
        { profile: { is: { city: { contains: location, mode: 'insensitive' } } } },
        { profile: { is: { country: { contains: location, mode: 'insensitive' } } } },
        { profile: { is: { locationFormatted: { contains: location, mode: 'insensitive' } } } },
      ],
    })
  }
  if (businessType) {
    and.push({ profile: { is: { businessType: { contains: businessType, mode: 'insensitive' } } } })
  }
  if (services.length) {
    and.push({
      OR: services.map((val) => ({ profile: { is: { services: { contains: val, mode: 'insensitive' } } } })),
    })
  }

  const where: any = {
    userType: 'AGENCY',
    isActive: true,
    profile: { isNot: null },
    ...(and.length ? { AND: and } : {}),
  }

  const orderBy: any =
    sort === 'name'
      ? { profile: { companyName: 'asc' } }
      : { createdAt: 'desc' }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: { profile: true },
      orderBy,
      skip,
      take,
    }),
  ])

  const items = users.map((u) => ({
    id: u.id,
    name: u.profile?.companyName ?? u.profile?.displayName ?? null,
    city: u.profile?.city ?? null,
    country: u.profile?.country ?? null,
    image: getPrimaryImage(u.profile) ?? null,
    description: u.profile?.description ?? null,
    businessType: u.profile?.businessType ?? null,
    visibility: u.profile?.visibility ?? null,
    isVerified: u.profile?.visibility === 'VERIFIED',
  }))

  return NextResponse.json({ total, items })
}

import type { AgencyItem } from '@/types/agency'
import { prisma } from '@/lib/prisma'
import ClubStudioPageClient from '@/app/club-studio/ClubStudioPageClient'

export const revalidate = 60

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

export default async function ClubStudioPage({ searchParams }: { searchParams: Promise<{ q?: string; location?: string; sort?: string }> }) {
  const sp = await searchParams
  const q = sp?.q?.trim() || ''
  const location = sp?.location?.trim() || ''
  const sort = ((sp?.sort?.trim()?.toLowerCase() as 'newest' | 'name') || 'newest') as 'newest' | 'name'

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

  const where: any = {
    userType: { in: ['CLUB', 'STUDIO'] },
    isActive: true,
    profile: { isNot: null },
    ...(and.length ? { AND: and } : {}),
  }

  const orderBy: any = sort === 'name' ? { profile: { companyName: 'asc' } } : { createdAt: 'desc' }

  const take = 60
  const skip = 0

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, include: { profile: true }, orderBy, take, skip }),
  ])

  const initialItems: AgencyItem[] = users.map((u) => ({
    id: u.id,
    name: u.profile?.companyName ?? u.profile?.displayName ?? null,
    city: u.profile?.city ?? null,
    country: u.profile?.country ?? null,
    image: getPrimaryImage(u.profile) ?? null,
    description: u.profile?.description ?? null,
    businessType: u.profile?.businessType ?? null,
  }))

  return (
    <ClubStudioPageClient
      initialItems={initialItems}
      initialTotal={total}
      initialQ={q}
      initialLocation={location}
      initialSort={sort}
    />
  )
}

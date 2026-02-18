import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LANGUAGES_DE } from '@/data/languages.de'
import { SERVICES_DE } from '@/data/services.de'

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

function getGalleryImages(profile: any): string[] {
  const urls: string[] = []
  try {
    if (profile?.media) {
      const media = JSON.parse(profile.media)
      if (Array.isArray(media)) {
        media.forEach((m: any) => {
          const t = (m?.type?.toLowerCase?.() ?? '')
          if (t.includes('image') && m?.url) urls.push(String(m.url))
        })
      }
    }
  } catch {}
  try {
    if (profile?.gallery) {
      const gallery = JSON.parse(profile.gallery)
      if (Array.isArray(gallery)) {
        gallery.forEach((u: any) => {
          if (u) urls.push(String(u))
        })
      }
    }
  } catch {}
  // Dedupe
  return Array.from(new Set(urls)).filter(Boolean)
}

// Helper to detect if a profile has at least one video in media JSON
function profileHasVideo(profile: any): boolean {
  try {
    if (profile?.media) {
      const media = JSON.parse(profile.media)
      if (Array.isArray(media)) {
        return media.some((m: any) => (m?.type?.toLowerCase?.() ?? '').includes('video'))
      }
    }
  } catch {}
  return false
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() || ''
  const location = searchParams.get('location')?.trim() || ''
  const take = Math.min(Number(searchParams.get('take') || '60'), 100)
  const skip = Math.max(Number(searchParams.get('skip') || '0'), 0)
  const verifiedOnly = searchParams.get('verifiedOnly') === '1'
  const ageVerifiedOnly = searchParams.get('ageVerifiedOnly') === '1'
  const hasVideoOnly = searchParams.get('hasVideo') === '1'
  const sort = (searchParams.get('sort') || 'newest').toLowerCase()

  // Advanced filters
  const height = searchParams.get('height')?.trim() || ''
  const weight = searchParams.get('weight')?.trim() || ''
  const breastType = searchParams.get('breastType')?.trim() || ''
  const breastSize = searchParams.get('breastSize')?.trim() || ''
  const eyeColor = searchParams.get('eyeColor')?.trim() || ''
  const hairColor = searchParams.get('hairColor')?.trim() || ''
  const hairLength = searchParams.get('hairLength')?.trim() || ''
  const clothingStyle = searchParams.get('clothingStyle')?.trim() || ''
  const clothingSize = searchParams.get('clothingSize')?.trim() || ''
  const ageMinRaw = searchParams.get('ageMin')?.trim() || ''
  const ageMaxRaw = searchParams.get('ageMax')?.trim() || ''
  const gender = searchParams.get('gender')?.trim() || ''
  const nationality = (searchParams.get('nationality')?.trim() || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const languages = (searchParams.get('languages')?.trim() || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const services = (searchParams.get('services')?.trim() || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const and: any[] = []
  if (q) {
    and.push({
      OR: [
        { profile: { is: { displayName: { contains: q, mode: 'insensitive' } } } },
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

  // Apply advanced filters against profile fields
  if (height) and.push({ profile: { is: { height: { contains: height, mode: 'insensitive' } } } })
  if (weight) and.push({ profile: { is: { weight: { contains: weight, mode: 'insensitive' } } } })
  if (breastType) and.push({ profile: { is: { breastType: { contains: breastType, mode: 'insensitive' } } } })
  if (breastSize) and.push({ profile: { is: { breastSize: { contains: breastSize, mode: 'insensitive' } } } })
  if (eyeColor) and.push({ profile: { is: { eyeColor: { contains: eyeColor, mode: 'insensitive' } } } })
  if (hairColor) and.push({ profile: { is: { hairColor: { contains: hairColor, mode: 'insensitive' } } } })
  if (hairLength) and.push({ profile: { is: { hairLength: { contains: hairLength, mode: 'insensitive' } } } })
  if (clothingStyle) and.push({ profile: { is: { clothingStyle: { contains: clothingStyle, mode: 'insensitive' } } } })
  if (clothingSize) and.push({ profile: { is: { clothingSize: { contains: clothingSize, mode: 'insensitive' } } } })
  const ageMin = Number(ageMinRaw)
  if (!Number.isNaN(ageMin) && ageMinRaw !== '') {
    and.push({ profile: { is: { age: { gte: ageMin } } } })
  }
  const ageMax = Number(ageMaxRaw)
  if (!Number.isNaN(ageMax) && ageMaxRaw !== '') {
    and.push({ profile: { is: { age: { lte: ageMax } } } })
  }
  if (gender) and.push({ profile: { is: { gender: { equals: gender } } } })
  if (nationality.length) {
    and.push({ OR: nationality.map((val) => ({ profile: { is: { nationality: { contains: val, mode: 'insensitive' } } } })) })
  }
  if (languages.length) {
    and.push({ OR: languages.map((val) => ({ profile: { is: { languages: { contains: val, mode: 'insensitive' } } } })) })
  }
  if (services.length) {
    and.push({ OR: services.map((val) => ({ profile: { is: { services: { contains: val, mode: 'insensitive' } } } })) })
  }

  const where: any = {
    userType: { in: ['HOBBYHURE'] },
    isActive: true,
    profile: { isNot: null },
    ...(and.length ? { AND: and } : {}),
  }

  const [totalBase, usersBase] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, include: { profile: true }, orderBy: { createdAt: 'desc' } }),
  ])

  // Determine which users have an approved verification
  const ids = usersBase.map((u: any) => u.id)
  let approvedSet = new Set<string>()
  if (ids.length > 0) {
    try {
      const inList = ids.map((id: string) => `'${id.replace(/'/g, "''")}'`).join(',')
      const rows: Array<{ userId: string }> = await (prisma as any).$queryRawUnsafe(
        `SELECT DISTINCT "userId" FROM "verification_requests" WHERE "status"::text = 'APPROVED' AND "userId" IN (${inList})`
      )
      approvedSet = new Set(rows.map((r) => r.userId))
    } catch {}
  }

  // Determine active highlights (Escort of the Week/Month)
  let weekSet = new Set<string>()
  let monthSet = new Set<string>()
  if (ids.length > 0) {
    try {
      const inList = ids.map((id: string) => `'${id.replace(/'/g, "''")}'`).join(',')
      const weekRows: Array<{ userId: string }> = await (prisma as any).$queryRawUnsafe(
        `SELECT DISTINCT b."userId" FROM "user_addon_bookings" b
         JOIN "addon_options" o ON o.id = b."addonOptionId"
         JOIN "addons" a ON a.id = o."addonId"
         WHERE a.key::text = 'ESCORT_OF_WEEK'
           AND b.status::text = 'ACTIVE'
           AND now() BETWEEN b."startsAt" AND b."endsAt"
           AND b."userId" IN (${inList})`
      )
      const monthRows: Array<{ userId: string }> = await (prisma as any).$queryRawUnsafe(
        `SELECT DISTINCT b."userId" FROM "user_addon_bookings" b
         JOIN "addon_options" o ON o.id = b."addonOptionId"
         JOIN "addons" a ON a.id = o."addonId"
         WHERE a.key::text = 'ESCORT_OF_MONTH'
           AND b.status::text = 'ACTIVE'
           AND now() BETWEEN b."startsAt" AND b."endsAt"
           AND b."userId" IN (${inList})`
      )
      weekSet = new Set(weekRows.map((r) => r.userId))
      monthSet = new Set(monthRows.map((r) => r.userId))
    } catch {}
  }

  const enriched = usersBase.map((u: any) => {
    const isVerified = u.profile?.visibility === 'VERIFIED'
    const isEscort = u.userType === 'ESCORT' || u.userType === 'HOBBYHURE'
    const isAgeVerified = isEscort && (approvedSet.has(u.id) || isVerified)
    return { u, isVerified, isAgeVerified, isEscort }
  })

  // Apply post-filters
  let filtered = enriched
  if (verifiedOnly) filtered = filtered.filter((x: any) => x.isVerified)
  if (ageVerifiedOnly) filtered = filtered.filter((x: any) => x.isEscort && x.isAgeVerified)
  if (hasVideoOnly) filtered = filtered.filter((x: any) => profileHasVideo(x.u.profile))

  // Sorting
  if (sort === 'name') {
    filtered.sort((a: any, b: any) => {
      const an = (a.u.profile?.displayName || '').toString().toLowerCase()
      const bn = (b.u.profile?.displayName || '').toString().toLowerCase()
      return an.localeCompare(bn)
    })
  } else {
    const rankHighlight = (id: string) => (monthSet.has(id) ? 2 : (weekSet.has(id) ? 1 : 0))
    filtered.sort((a: any, b: any) => {
      const wDiff = rankHighlight(b.u.id) - rankHighlight(a.u.id)
      if (wDiff !== 0) return wDiff
      const aTime = (a.u as any).createdAt ? new Date((a.u as any).createdAt).getTime() : 0
      const bTime = (b.u as any).createdAt ? new Date((b.u as any).createdAt).getTime() : 0
      return bTime - aTime
    })
  }

  const total = filtered.length
  const pageSlice = filtered.slice(skip, skip + take)
  const users = pageSlice.map((x: any) => x.u)

  // Helpers to normalize arrays from DB
  const LANGUAGE_VALUE_BY_LABEL = new Map(LANGUAGES_DE.map((o) => [o.label.toLowerCase(), o.value]))
  const LANGUAGE_VALUE_BY_VALUE = new Map(LANGUAGES_DE.map((o) => [o.value.toLowerCase(), o.value]))
  const SERVICE_VALUE_BY_LABEL = new Map(SERVICES_DE.map((o) => [o.label.toLowerCase(), o.value]))
  const SERVICE_VALUE_BY_VALUE = new Map(SERVICES_DE.map((o) => [o.value.toLowerCase(), o.value]))

  function parseList(raw: unknown): string[] | undefined {
    try {
      if (typeof raw === 'string') {
        const trimmed = raw.trim()
        if (!trimmed) return undefined
        // Try JSON first
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || trimmed.includes('"')) {
          const parsed = JSON.parse(trimmed)
          if (Array.isArray(parsed)) return parsed.map((x) => String(x))
        }
        // Fallback: comma/semicolon separated
        return trimmed
          .split(/[,;]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      }
      if (Array.isArray(raw)) return raw.map((x) => String(x))
    } catch {}
    return undefined
  }

  function normalizeLanguage(v: string): string {
    const key = v.trim().toLowerCase()
    return LANGUAGE_VALUE_BY_VALUE.get(key) || LANGUAGE_VALUE_BY_LABEL.get(key) || key
  }

  function slugifyService(v: string): string {
    return v
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, '-')
      .replace(/[^a-z0-9-]+/g, '')
      .replace(/--+/g, '-')
  }

  function normalizeService(v: string): string {
    const key = v.trim().toLowerCase()
    return (
      SERVICE_VALUE_BY_VALUE.get(key) ||
      SERVICE_VALUE_BY_LABEL.get(key) ||
      SERVICE_VALUE_BY_VALUE.get(slugifyService(key)) ||
      slugifyService(key)
    )
  }

  const items = users.map((u: any) => {
    const isWeek = weekSet.has(u.id)
    const isMonth = monthSet.has(u.id)
    const badges: string[] = []
    if (isWeek) badges.push('ESCORT_OF_WEEK')
    if (isMonth) badges.push('ESCORT_OF_MONTH')
    // Extract arrays (supports JSON arrays or comma-separated strings)
    let languagesArr: string[] | undefined = parseList(u.profile?.languages)?.map(normalizeLanguage)
    let servicesArr: string[] | undefined = parseList(u.profile?.services)?.map(normalizeService)
    return {
      id: u.id,
      name: u.profile?.displayName ?? null,
      city: u.profile?.city ?? null,
      country: u.profile?.country ?? null,
      image: getPrimaryImage(u.profile) ?? null,
      visibility: u.profile?.visibility ?? null,
      isVerified: u.profile?.visibility === 'VERIFIED',
      isAgeVerified: (u.userType === 'ESCORT' || u.userType === 'HOBBYHURE') && (approvedSet.has(u.id) || u.profile?.visibility === 'VERIFIED'),
      isEscortOfWeek: isWeek,
      isEscortOfMonth: isMonth,
      badges,
      createdAt: (u as any)?.createdAt ? new Date((u as any).createdAt as any).toISOString() : null,
      latitude: u.profile?.latitude ?? null,
      longitude: u.profile?.longitude ?? null,
      locationFormatted: u.profile?.locationFormatted ?? null,
      age: typeof u.profile?.age === 'number' ? u.profile.age : (u.profile?.age ? Number(u.profile.age) || null : null),
      slogan: u.profile?.slogan ?? null,
      languages: languagesArr,
      services: servicesArr,
      gallery: (() => {
        const all = getGalleryImages(u.profile)
        const primary = getPrimaryImage(u.profile)
        return all.filter((url) => url && url !== primary)
      })(),
    }
  })

  return NextResponse.json({ total, items })
}

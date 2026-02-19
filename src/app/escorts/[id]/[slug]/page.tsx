import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSeoOverride, mergeMetadata, getUserSeoSettings, mergeUserSeoMetadata } from '@/lib/seo'
import MessageButton from '@/components/MessageButton'
import GalleryGrid from '@/components/GalleryGrid'
import Tabs from '@/components/Tabs'
import ProfileFeed from '@/components/ProfileFeed'
import TranslatableDescription from '@/components/TranslatableDescription'
import ServiceTag from '@/components/ServiceTag'
import ServiceLegend from '@/components/ServiceLegend'
import { SERVICES_DE } from '@/data/services.de'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Globe } from 'lucide-react'
import Link from 'next/link'
import { BadgeCheck, ShieldCheck } from 'lucide-react'
import VerifiedBadges from '@/components/VerifiedBadges'
import MobileBottomBar from '@/components/MobileBottomBar'
import { FaInstagram, FaFacebook, FaXTwitter, FaYoutube, FaLinkedin, FaWhatsapp, FaTelegram, FaTiktok, FaSnapchat } from 'react-icons/fa6'
import { SiOnlyfans } from 'react-icons/si'
import RatingDonut from '@/components/RatingDonut'
import type React from 'react'
import ProfileComments from '@/components/ProfileComments'
import AltEscortViewOne from '@/components/escort-views/AltEscortViewOne'
import AltEscortViewTwo from '@/components/escort-views/AltEscortViewTwo'
import AltEscortViewFullSide from '@/components/escort-views/AltEscortViewFullSide'
import OnlineBadge from '@/components/OnlineBadge'
import ProfileAnalyticsTracker from '@/components/analytics/ProfileAnalyticsTracker'
import { headers } from 'next/headers'
import DateRequestDialog from '@/components/dates/DateRequestDialog'

export const dynamic = 'force-dynamic'

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000

// Helpers for formatting (aligned with ProfileComponent)
const toStr = (v: any) => (v === null || v === undefined) ? '' : String(v).trim()
const withUnit = (v: any, unit: string) => {
  const s = toStr(v)
  if (!s) return ''
  const low = s.toLowerCase()
  if (low.includes(unit.toLowerCase())) return s
  if (/^\d+(?:[\.,]\d+)?$/.test(s)) return `${s.replace(',', '.')} ${unit}`
  return s
}
// Brand colors per social platform
const brandColor = (key: string): string => {
  const k = key.toLowerCase()
  if (k === 'whatsapp') return '#25D366'
  if (k === 'instagram') return '#E4405F'
  if (k === 'facebook') return '#1877F2'
  if (k === 'twitter' || k === 'x') return '#1DA1F2'
  if (k === 'youtube') return '#FF0000'
  if (k === 'linkedin') return '#0A66C2'
  if (k === 'telegram') return '#26A5E4'
  if (k === 'tiktok') return '#000000'
  if (k === 'snapchat') return '#FFFC00'
  if (k === 'onlyfans') return '#00AEF0'
  return '#6B7280' // gray-500 fallback
}
const platformLabel = (key: string): string => {
  const k = key.toLowerCase()
  const map: Record<string, string> = {
    whatsapp: 'WhatsApp', instagram: 'Instagram', facebook: 'Facebook', twitter: 'Twitter', x: 'X',
    youtube: 'YouTube', linkedin: 'LinkedIn', telegram: 'Telegram', tiktok: 'TikTok', snapchat: 'Snapchat', onlyfans: 'OnlyFans'
  }
  return map[k] || (key.charAt(0).toUpperCase() + key.slice(1))
}
const formatHeight = (v: any) => withUnit(v, 'cm')
const formatWeight = (v: any) => withUnit(v, 'kg')
const formatShoeSize = (v: any) => withUnit(v, 'EU')
const capitalizeWords = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase())
const parseJsonish = (s: string): any => {
  try {
    const trimmed = s.trim()
    if (
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'))
    ) {
      return JSON.parse(trimmed)
    }
  } catch {}
  return s
}
const toArray = (v: any): any[] => {
  if (v === null || v === undefined) return []
  if (Array.isArray(v)) return v
  if (typeof v === 'string') {
    const parsed = parseJsonish(v)
    if (Array.isArray(parsed)) return parsed
    const s = toStr(parsed)
    if (!s) return []
    if (s.includes(',')) return s.split(',').map((x) => x.trim()).filter(Boolean)
    return [s]
  }
  return [v]
}
const translateTokenDE = (token: string): string => {
  const t = token.toLowerCase().replace(/[_\-\s]+/g, '')
  const map: Record<string, string> = {
    slim: 'Schlank', petite: 'Zierlich', athletic: 'Athletisch', fit: 'Fit', average: 'Durchschnittlich', curvy: 'Kurvig', bbw: 'Mollig',
    blonde: 'Blond', blond: 'Blond', brunette: 'Brünett', brown: 'Braun', black: 'Schwarz', red: 'Rot', auburn: 'Kupfer', chestnut: 'Kastanienbraun',
    darkbrown: 'Dunkelbraun', lightbrown: 'Hellbraun', grey: 'Grau', gray: 'Grau', silver: 'Silber', dyed: 'Gefärbt', highlights: 'Strähnen',
    short: 'Kurz', medium: 'Mittel', shoulderlength: 'Schulterlang', long: 'Lang', verylong: 'Sehr lang', bob: 'Bob',
    blue: 'Blau', green: 'Grün', hazel: 'Hasel', amber: 'Bernstein',
    natural: 'Natürlich', implants: 'Implantat', implant: 'Implantat', enhanced: 'Vergrößert',
    shaved: 'Rasiert', fullyshaved: 'Komplett rasiert', partiallyshaved: 'Teilrasiert', trimmed: 'Getrimmt', naturalhair: 'Natürlich', landingstrip: 'Landing Strip', brazilian: 'Brasilianisch', waxed: 'Gewaxt',
    ears: 'Ohren', navel: 'Bauchnabel', nipples: 'Brustwarzen', tongue: 'Zunge', nose: 'Nase', lip: 'Lippe', eyebrow: 'Augenbraue', intimate: 'Intim',
    arms: 'Arme', legs: 'Beine', back: 'Rücken', chest: 'Brust', neck: 'Nacken', shoulder: 'Schulter', small: 'Klein', large: 'Groß',
    elegant: 'Elegant', casual: 'Lässig', sexy: 'Sexy', business: 'Business', sporty: 'Sportlich', chic: 'Chic', street: 'Streetwear', classic: 'Klassisch'
  }
  return map[t] || capitalizeWords(token.replace(/[_-]+/g, ' ').toLowerCase())
}
const formatEnumListDE = (v: any): string => toArray(v).map((x) => translateTokenDE(String(x))).filter(Boolean).join(', ')
const badgeElementsDE = (v: any) => {
  const arr = toArray(v)
  return arr.map((x: any, i: number) => (
    <span key={`${String(x)}-${i}`} className="inline-flex items-center px-2.5 py-1 border border-gray-200 bg-gray-50 text-gray-700 text-xs rounded-none">
      {translateTokenDE(String(x))}
    </span>
  ))
}

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

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

async function getEscort(id: string) {
  let user: any = null
  try {
    user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    })

  } catch (e) {
    return null
  }
  if (!user || !user.isActive || (user.userType !== 'ESCORT' && user.userType !== 'HOBBYHURE')) return null
  const profile = user.profile
  let gallery: string[] = []
  let mediaImages: string[] = []
  let services: string[] = []
  try {
    if (profile?.gallery) {
      const g = JSON.parse(profile.gallery)
      if (Array.isArray(g)) gallery = g.filter((x: any) => typeof x === 'string')
    }
  } catch {}
  try {
    if (profile?.media) {
      const m = JSON.parse(profile.media)
      if (Array.isArray(m)) {
        mediaImages = m
          .filter((x: any) => (x?.type?.toLowerCase?.() ?? '').includes('image') && typeof x?.url === 'string')
          .map((x: any) => x.url as string)
      }
    }
  } catch {}
  try {
    if (profile?.services) {
      const s = JSON.parse(profile.services)
      if (Array.isArray(s)) services = s.filter((x: any) => typeof x === 'string')
    }
  } catch {}
  // Preferences: read hero settings
  let heroMobileLayout: 'cover' | 'half' | 'compact' = 'cover'
  let heroImageUrl: string | null = null
  try {
    if ((profile as any)?.preferences) {
      const prefs = JSON.parse((profile as any).preferences)
      const mobile = prefs?.hero?.mobileLayout
      if (mobile === 'cover' || mobile === 'half' || mobile === 'compact') {
        heroMobileLayout = mobile
      }
      if (typeof prefs?.hero?.imageUrl === 'string' && prefs.hero.imageUrl.trim()) {
        heroImageUrl = prefs.hero.imageUrl.trim()
      }
    }
  } catch {}
  // Parse social media
  let socials: Record<string, string> = {}
  try {
    if (profile?.socialMedia) {
      const o = JSON.parse(profile.socialMedia)
      if (o && typeof o === 'object') socials = o
    }
  } catch {}

  // Linked organizations (AGENCY/CLUB/STUDIO) via AppSetting girls:escort:<id>:orgs
  let linkedOrgs: Array<{ id: string; userType: string; name: string | null; logo: string | null }> = []
  try {
    const s = await (prisma as any).appSetting.findUnique({ where: { key: `girls:escort:${id}:orgs` } })
    const orgIds: string[] = (() => { try { return s?.value ? JSON.parse(s.value) : [] } catch { return [] } })()
    if (Array.isArray(orgIds) && orgIds.length > 0) {
      const orgUsers = await (prisma as any).user.findMany({
        where: { id: { in: orgIds } },
        select: { id: true, userType: true, profile: { select: { companyName: true, displayName: true, avatar: true } } },
      })
      linkedOrgs = orgUsers
        .filter((u: any) => ['AGENCY','CLUB','STUDIO'].includes(u.userType))
        .map((u: any) => ({ id: u.id, userType: u.userType, name: u.profile?.companyName || u.profile?.displayName || null, logo: u.profile?.avatar || null }))
    }
  } catch {}

  const primaryImage = getPrimaryImage(profile)
  // Presence (use raw SQL to avoid Prisma Client validation if types not regenerated)
  let isOnline = false
  try {
    const rows = await prisma.$queryRaw<Array<{ lastSeenAt: Date | null }>>`
      SELECT "lastSeenAt" FROM "users" WHERE id = ${id} LIMIT 1
    `
    const ts = rows?.[0]?.lastSeenAt ? new Date(rows[0].lastSeenAt as any).getTime() : 0
    isOnline = !!(ts && Date.now() - ts <= ONLINE_THRESHOLD_MS)
  } catch {}

  // VIP badge check
  let isVIP = false
  try {
    const vip = await (prisma as any).badge.findUnique({ where: { key: 'VIP_BADGE' }, select: { id: true } })
    if (vip?.id) {
      const has = await (prisma as any).userBadge.findFirst({ where: { userId: id, badgeId: vip.id }, select: { id: true } })
      isVIP = !!has
    }
  } catch {}

  let isAvailable = false
  try {
    const avail = await (prisma as any).appSetting.findUnique({ where: { key: `escort:availability:${id}` } })
    const av = (() => { try { return avail?.value ? JSON.parse(avail.value) : {} } catch { return {} } })()
    isAvailable = !!av.available
  } catch {}

  let openingHoursObj: any = null
  try {
    const oh = user?.profile?.openingHours
    if (oh && typeof oh === 'string') {
      const parsed = JSON.parse(oh)
      if (parsed && typeof parsed === 'object') openingHoursObj = parsed
    }
  } catch {}

  return {
    id: user.id,
    isOnline,
    vip: isVIP,
    available: isAvailable,
    profileView: profile?.profileView ?? 'STANDARD',
    name: profile?.displayName ?? null,
    slogan: profile?.slogan ?? null,
    age: (profile as any)?.age ?? null,
    city: profile?.city ?? null,
    state: profile?.state ?? null,
    country: profile?.country ?? null,
    description: profile?.description ?? null,
    image: primaryImage,
    visibility: profile?.visibility ?? null,
    gallery,
    mediaImages,
    services,
    socials,
    openingHours: openingHoursObj,
    location: {
      address: profile?.address ?? null,
      city: profile?.city ?? null,
      country: profile?.country ?? null,
      latitude: profile?.latitude ?? null,
      longitude: profile?.longitude ?? null,
      formatted: profile?.locationFormatted ?? null,
      zipCode: profile?.zipCode ?? null,
      placeId: profile?.locationPlaceId ?? null,
    },
    heroPrefs: { mobileLayout: heroMobileLayout, imageUrl: heroImageUrl },
    contact: {
      phone: profile?.phone ?? null,
      website: profile?.website ?? null,
    },
    details: {
      height: profile?.height ?? null,
      weight: profile?.weight ?? null,
      bodyType: (profile as any)?.bodyType ?? null,
      hairColor: profile?.hairColor ?? null,
      hairLength: profile?.hairLength ?? null,
      eyeColor: profile?.eyeColor ?? null,
      breastType: profile?.breastType ?? null,
      breastSize: profile?.breastSize ?? null,
      cupSize: (profile as any)?.cupSize ?? null,
      intimateArea: (profile as any)?.intimateArea ?? null,
      pubicHair: (profile as any)?.pubicHair ?? null,
      intimateStyle: (profile as any)?.intimateStyle ?? null,
      piercings: (profile as any)?.piercings ?? null,
      tattoos: (profile as any)?.tattoos ?? null,
      clothingStyle: profile?.clothingStyle ?? null,
      clothingSize: profile?.clothingSize ?? null,
      dressSize: (profile as any)?.dressSize ?? null,
      shoeSize: (profile as any)?.shoeSize ?? null,
    },
    orgs: linkedOrgs,
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; slug: string }> }): Promise<Metadata> {
  const { id, slug } = await params
  const data = await getEscort(id)
  const title = data?.name ? `${data.name} | Escort Profil` : 'Escort Profil'
  const description = data?.slogan || data?.description || undefined
  let meta: Metadata = {
    title,
    description,
    openGraph: {
      title,
      description,
      images: data?.image ? [data.image] : [],
    },
  }
  // Apply admin SEO page override
  const override = await getSeoOverride(`/escorts/${id}/${slug}`)
  meta = mergeMetadata(meta, override)
  // Apply user SEO addon settings (if profile owner has SEO addon)
  if (data) {
    const userSeo = await getUserSeoSettings(id)
    meta = mergeUserSeoMetadata(meta, userSeo)
  }
  return meta
}

export default async function EscortProfilePage({ params, searchParams }: { params: Promise<{ id: string; slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id, slug } = await params
  const sp = await searchParams
  const data = await getEscort(id)
  // Redirect to canonical slug if mismatch
  if (data?.name) {
    const expectedSlug = slugify(data.name)
    if (expectedSlug && slug !== expectedSlug) {
      redirect(`/escorts/${id}/${expectedSlug}`)
    }
  }
  if (!data) {
    return (
      <div className="min-h-screen bg-white">
        <MinimalistNavigation />
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h1 className="text-xl tracking-widest text-gray-800">PROFIL NICHT GEFUNDEN</h1>
        </div>
        <Footer />
      </div>
    )
  }

  const { id: escortId, name, slogan, age, city, country, image, description, details, gallery, mediaImages, services, contact, location, socials, isOnline } = data
  const heroMobileLayout = (data as any)?.heroPrefs?.mobileLayout || 'cover'
  const heroMobileClass = heroMobileLayout === 'half'
    ? 'h-[70vh] min-h-[420px]'
    : (heroMobileLayout === 'compact' ? 'h-[55vh] min-h-[320px]' : 'h-screen h-[100svh]')
  const heroImage = ((data as any)?.heroPrefs?.imageUrl as string | null) || image
  const images = [image, ...mediaImages, ...gallery].filter(Boolean) as string[]
  const galleryCount = (gallery || []).length
  const heightNum = toStr(details.height).replace(/[^0-9]/g, '') || null
  const bustLabel = (() => {
    const num = toStr((details as any)?.breastSize)
    const cup = toStr((details as any)?.cupSize).toUpperCase()
    const both = `${num}${cup}`.trim()
    return both || null
  })()
  const dressLabel = toStr((details as any)?.clothingSize || (details as any)?.dressSize) || null
  // Fetch recent posts for FEED tab with author and counts
  const session = await getServerSession(authOptions)

  // Country blocking: if owner enabled COUNTRY_BLOCK and viewer country is in blocked list, show restricted message
  let isBlockedForViewer = false
  try {
    const st = await (prisma as any).userAddonState.findUnique({
      where: { userId_key: { userId: id, key: 'COUNTRY_BLOCK' } },
      select: { enabled: true, settings: true },
    })
    if (st?.enabled) {
      let viewerCtry: string | null = null
      try {
        const h = await headers()
        viewerCtry = (h.get('x-vercel-ip-country') || h.get('cf-ipcountry') || h.get('x-geo-country') || null)
        // Fallback via Geo-IP if header not present
        if (!viewerCtry) {
          const fwd = h.get('x-forwarded-for') || ''
          const ip = fwd.split(',')[0]?.trim()
          if (ip && ip !== '::1' && ip !== '127.0.0.1' && ip !== 'localhost') {
            // Try ipwho.is first
            try {
              const resp = await fetch(`https://ipwho.is/${ip}`, { next: { revalidate: 0 } })
              if (resp.ok) {
                const json: any = await resp.json()
                const code = (json?.country_code || json?.countryCode || '').toString().toUpperCase()
                if (code && code.length === 2) viewerCtry = code
              }
            } catch {}
            // Fallback to ipapi.co
            if (!viewerCtry) {
              try {
                const resp2 = await fetch(`https://ipapi.co/${ip}/country/`, { next: { revalidate: 0 } })
                if (resp2.ok) {
                  const txt = (await resp2.text()).trim().toUpperCase()
                  if (txt && txt.length === 2) viewerCtry = txt
                }
              } catch {}
            }
          }
        }
      } catch {}
      // allow override via query param for testing: ?ctry=DE
      const qctry = typeof sp?.ctry === 'string' ? sp.ctry : Array.isArray(sp?.ctry) ? sp.ctry?.[0] : undefined
      if (!viewerCtry && qctry) viewerCtry = qctry
      const blocked = (() => {
        try {
          const parsed = st.settings ? JSON.parse(st.settings) : null
          const arr = parsed?.blocked
          return Array.isArray(arr) ? arr.map((x: any) => String(x).toUpperCase()) : []
        } catch { return [] }
      })()
      const v = (viewerCtry || '').toUpperCase()
      const isOwner = session?.user?.id === id
      if (!isOwner && v && blocked.includes(v)) isBlockedForViewer = true
    }
  } catch {}

  if (isBlockedForViewer) {
    return (
      <div className="min-h-screen bg-white">
        <MinimalistNavigation />
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h1 className="text-xl tracking-widest text-gray-800">PROFIL IN DEINEM LAND NICHT VERFÜGBAR</h1>
          <p className="mt-3 text-sm text-gray-600 max-w-2xl">Der Profilinhaber hat dieses Profil für deinen Standort eingeschränkt.</p>
          <div className="mt-6">
            <Link href="/escorts" className="text-xs uppercase tracking-widest text-pink-600 hover:underline">Zurück zur Übersicht</Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Is profile analytics enabled for this profile owner?
  let analyticsEnabled = false
  try {
    const st = await (prisma as any).userAddonState.findUnique({
      where: { userId_key: { userId: escortId, key: 'PROFILE_ANALYTICS' } },
      select: { enabled: true },
    })
    analyticsEnabled = !!(st?.enabled)
  } catch {}

  // Record profile visit (raw SQL for compatibility)
  try {
    if (escortId) {
      const visitor = session?.user?.id && session.user.id !== escortId ? session.user.id : null
      await prisma.$executeRaw`
        INSERT INTO "profile_visits" ("profileUserId", "visitorId", "visitedAt")
        VALUES (${escortId}, ${visitor}, NOW())
      `
    }
  } catch {}
  // Profile rating (average of visible root comments)
  const ratingAgg: any = await (prisma as any).comment.aggregate({
    where: { targetUserId: escortId, isVisible: true, parentId: null, NOT: { rating: null } },
    _avg: { rating: true },
    _count: true,
  })
  const ratingAvg = Number(ratingAgg?._avg?.rating ?? 0)
  const ratingRounded = Math.round(ratingAvg)
  const ratingCount = Number(ratingAgg?._count ?? 0)
  // Distribution per rating 1..5
  const ratingGroups: any[] = await (prisma as any).comment.groupBy({
    by: ['rating'],
    where: { targetUserId: escortId, isVisible: true, parentId: null, NOT: { rating: null } },
    _count: { _all: true },
  })
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const g of ratingGroups) {
    const r = Number(g.rating || 0)
    if (r >= 1 && r <= 5) dist[r] = Number(g._count?._all ?? g._count ?? 0)
  }
  const distTotal = Object.values(dist).reduce((a, b) => a + b, 0) || 1
  const include: any = {
    author: { select: { email: true, userType: true, profile: { select: { displayName: true, avatar: true } } } },
    _count: { select: { likes: true, comments: true } },
    comments: {
      select: {
        id: true,
        content: true,
        parentId: true,
        createdAt: true,
        author: {
          select: {
            email: true,
            profile: { select: { displayName: true, avatar: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    },
  }
  if (session?.user?.id) {
    include.likes = { where: { userId: session.user.id }, select: { id: true } }
  }
  const rawPosts = await prisma.post.findMany({
    where: { authorId: escortId, isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include,
  }) as any[]
  const postsForFeed = rawPosts.map((p: any) => {
    let imgs: string[] = []
    try {
      if (p.images) {
        const arr = JSON.parse(p.images)
        if (Array.isArray(arr)) imgs = arr.filter((x: any) => typeof x === 'string')
      }
    } catch {}
    return {
      id: p.id,
      content: p.content,
      images: imgs,
      createdAt: p.createdAt,
      isLikedByUser: !!(p.likes && p.likes.length > 0),
      _count: { likes: p._count?.likes ?? 0, comments: p._count?.comments ?? 0 },
      author: {
        email: p.author?.email,
        userType: p.author?.userType,
        profile: { displayName: p.author?.profile?.displayName, avatar: p.author?.profile?.avatar },
      },
      comments: (p.comments || []).map((c: any) => ({
        id: c.id,
        content: c.content,
        parentId: c.parentId ?? null,
        author: {
          email: c.author?.email,
          profile: { displayName: c.author?.profile?.displayName, avatar: c.author?.profile?.avatar },
        },
      })),
    }
  })

  // Approved verification (age/profile) -> show badges next to name
  let hasApprovedVerification = (data as any)?.visibility === 'VERIFIED'
  if (!hasApprovedVerification) {
    try {
      const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT 1 FROM "verification_requests"
          WHERE "userId" = ${escortId} AND "status"::text = 'APPROVED'
        ) AS "exists";
      `
      hasApprovedVerification = !!rows?.[0]?.exists
    } catch {}
  }

  // Determine selected view, allowing owner preview override via `?view=` or `?previewView=`
  let selectedView = (data as any)?.profileView || 'STANDARD'
  const candidate = (typeof sp?.view === 'string' ? sp.view : Array.isArray(sp?.view) ? sp?.view?.[0] : undefined)
    || (typeof sp?.previewView === 'string' ? sp.previewView : Array.isArray(sp?.previewView) ? sp?.previewView?.[0] : undefined)
  if (candidate && session?.user?.id === data.id && ['STANDARD', 'ALT1', 'ALT2', 'FULL_SIDE'].includes(candidate)) {
    selectedView = candidate
  }

  // Find similar escorts (same state/region first, then same city, then same country), exclude current profile
  let similarItems: Array<{ id: string; name: string | null; city: string | null; country: string | null; image: string | null; isVerified?: boolean; isAgeVerified?: boolean }> = []
  try {
    const city = data.city || null
    const state = data.state || null
    const country = data.country || null
    // Helper to map a user+profile to card item
    const mapToItem = (u: any) => ({
      id: u.id,
      name: u.profile?.displayName ?? null,
      city: u.profile?.city ?? null,
      country: u.profile?.country ?? null,
      image: getPrimaryImage(u.profile) || null,
      isVerified: (u.profile?.visibility ?? '') === 'VERIFIED',
      isAgeVerified: (u.profile?.visibility ?? '') === 'VERIFIED',
    })
    // First: same state/region (Kanton/Bundesland)
    if (state) {
      const byState = await prisma.user.findMany({
        where: {
          isActive: true,
          userType: { in: ['ESCORT','HOBBYHURE'] },
          id: { not: data.id },
          profile: {
            is: {
              state,
              visibility: { in: ['PUBLIC', 'VERIFIED'] as any },
            },
          },
        },
        take: 12,
        orderBy: { createdAt: 'desc' },
        include: { profile: true },
      })
      similarItems = byState.map(mapToItem)
    }
    // Second: same city (if not enough from state)
    if (similarItems.length < 12 && city) {
      const byCity = await prisma.user.findMany({
        where: {
          isActive: true,
          userType: { in: ['ESCORT','HOBBYHURE'] },
          id: { not: data.id },
          profile: {
            is: {
              city,
              visibility: { in: ['PUBLIC', 'VERIFIED'] as any },
            },
          },
        },
        take: 12,
        orderBy: { createdAt: 'desc' },
        include: { profile: true },
      })
      const seen = new Set(similarItems.map((x) => x.id))
      for (const u of byCity) {
        if (seen.has(u.id)) continue
        similarItems.push(mapToItem(u))
        if (similarItems.length >= 12) break
      }
    }
    // Third: same country
    if (similarItems.length < 12 && country) {
      const more = await prisma.user.findMany({
        where: {
          isActive: true,
          userType: { in: ['ESCORT','HOBBYHURE'] },
          id: { not: data.id },
          profile: {
            is: {
              country,
              visibility: { in: ['PUBLIC', 'VERIFIED'] as any },
            },
          },
        },
        take: 12,
        orderBy: { createdAt: 'desc' },
        include: { profile: true },
      })
      // append non-duplicates up to 12
      const seen = new Set(similarItems.map((x) => x.id))
      for (const u of more) {
        if (seen.has(u.id)) continue
        similarItems.push(mapToItem(u))
        if (similarItems.length >= 12) break
      }
    }
  } catch {}

  const sharedProps = { data, images, postsForFeed, ratingAvg, ratingCount, dist, distTotal, hasApprovedVerification, similarItems }

  if (selectedView === 'ALT1') {
    return <AltEscortViewOne {...sharedProps} />
  }
  if (selectedView === 'ALT2') {
    return <AltEscortViewTwo {...sharedProps} />
  }
  if (selectedView === 'FULL_SIDE') {
    return <AltEscortViewFullSide {...sharedProps} />
  }

  return (
    <div className="min-h-screen bg-white">
      {analyticsEnabled && <ProfileAnalyticsTracker profileUserId={escortId} />}
      <MinimalistNavigation />
      {/* Hero Section */}
      <section className={`relative ${heroMobileClass} md:h-[50vh] md:min-h-[400px]`}>
        {/* Background image with dark overlay */}
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage || '/escort.png'}
            alt={(name ?? 'Escort') + ' Hero'}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
          <div>
            <div className="flex items-center justify-center gap-3 mb-2">
              <h1 className="text-5xl md:text-6xl font-thin tracking-wider text-white">{name ? (name.toUpperCase?.() ?? name) : 'ESCORT'}</h1>
              {hasApprovedVerification && (
                <VerifiedBadges className="hidden md:flex" translucent />
              )}
              {(data as any)?.vip && (
                <span title="VIP" className="inline-flex items-center justify-center h-6 px-2 bg-white/90 border border-amber-300 text-amber-700 text-[10px] font-semibold tracking-widest">VIP</span>
              )}
            </div>
            {(city || country) && (
              <p className="text-sm text-gray-200">{city || country}</p>
            )}
            <div className="w-24 h-px bg-pink-500 mx-auto mt-3" />
          </div>
        </div>
      {/* Mobile-only Bottom Stats over Hero (inside hero) */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 z-10">
        <div className="relative px-4 pt-1 pb-[calc(env(safe-area-inset-bottom)+6px)]">
          <div className="flex items-end justify-between gap-4 text-white">
            {typeof age === 'number' && (
              <div className="flex flex-col items-center">
                <div className="text-2xl font-light leading-none">{age}</div>
                <div className="mt-1 text-[10px] uppercase tracking-widest opacity-80">Jahre</div>
              </div>
            )}
            <div className="h-8 w-px bg-white/30" />
            {heightNum && (
              <div className="flex flex-col items-center">
                <div className="text-2xl font-light leading-none">{heightNum}</div>
                <div className="mt-1 text-[10px] uppercase tracking-widest opacity-80">cm</div>
              </div>
            )}
            <div className="h-6 w-px bg-white/30" />
            {bustLabel && (
              <div className="flex flex-col items-center">
                <div className="text-2xl font-light leading-none">{bustLabel}</div>
                <div className="mt-1 text-[10px] uppercase tracking-widest opacity-80">BH</div>
              </div>
            )}
            <div className="h-6 w-px bg-white/30" />
            {dressLabel && (
              <div className="flex flex-col items-center">
                <div className="text-2xl font-light leading-none">{dressLabel}</div>
                <div className="mt-1 text-[10px] uppercase tracking-widest opacity-80">KF</div>
              </div>
            )}
            <div className="h-6 w-px bg-white/30" />
            <div className="flex flex-col items-center">
              <div className="text-2xl font-light leading-none">{galleryCount}</div>
              <div className="mt-1 text-[10px] uppercase tracking-widest opacity-80">Galerie</div>
            </div>
          </div>
        </div>
      </div>

      </section>
            <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          {image && (
            <div className="relative w-40 h-52 bg-gray-200 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={name ?? ''} className="w-full h-full object-cover" />
              {/* Online status on the small profile image (mobile & desktop) */}
              <OnlineBadge userId={escortId} initialOnline={isOnline} className="absolute top-2 right-2 z-10" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {name && <h1 className="text-2xl font-light tracking-widest text-gray-900">{name.toUpperCase?.() ?? name}</h1>}
                {hasApprovedVerification && (
                  <VerifiedBadges />
                )}
                {(data as any)?.vip && (
                  <span title="VIP" className="inline-flex items-center justify-center h-6 px-2 bg-white/90 border border-amber-300 text-amber-700 text-[10px] font-semibold tracking-widest">VIP</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 border text-[10px] uppercase tracking-widest ${((data as any)?.available ? 'border-emerald-300 text-emerald-700' : 'border-rose-300 text-rose-700')}`}>
                  {((data as any)?.available ? 'VERFÜGBAR' : 'NICHT VERFÜGBAR')}
                </span>
                {ratingCount > 0 && (
                  <>
                    <RatingDonut value={ratingAvg} size={32} strokeWidth={6} showValue={false} />
                    <div className="text-xs text-gray-700">{ratingAvg.toFixed(1)} / 5 <span className="text-gray-500">({ratingCount})</span></div>
                  </>
                )}
              </div>
            </div>
            {(city || country) && (
              <p className="text-sm text-gray-500 mt-1">{city || country}</p>
            )}
            {slogan && <p className="text-sm text-gray-600 mt-2 italic">“{slogan}”</p>}

            {/* CTA / Interaktion + Linked Org badges */}
            <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <MessageButton toUserId={escortId} toDisplayName={name ?? undefined} toAvatar={image ?? undefined} />
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="px-4 py-2 border border-gray-300 rounded-none text-sm tracking-widest hover:border-pink-500">
                    ANRUFEN
                  </a>
                )}
                {/* Date booking dialog trigger */}
                <DateRequestDialog escortId={escortId} escortName={name} defaultCity={city} escortAvatar={image} />
                {contact.website && (
                  <a href={contact.website} target="_blank" rel="noopener noreferrer" className="px-4 py-2 border border-gray-300 rounded-none text-sm tracking-widest hover:border-pink-500">
                    WEBSEITE
                  </a>
                )}
              </div>
              {Array.isArray((data as any)?.orgs) && (data as any).orgs.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-gray-500">AKTUELL IN</span>
                  <div className="flex flex-wrap gap-2">
                    {((data as any).orgs as any[]).map((o, idx) => {
                      const base = o.userType === 'AGENCY' ? '/agency' : '/club-studio'
                      const slug = slugify((o.name || o.userType || '').toString()) || (o.userType === 'AGENCY' ? 'agency' : 'club-studio')
                      const href = `${base}/${o.id}/${slug}`
                      return (
                        <Link
                          key={o.id || idx}
                          href={href}
                          className="inline-flex items-center gap-2 px-2 py-1 border border-gray-300 text-xs tracking-widest text-gray-700 hover:border-pink-500 hover:text-pink-600"
                        >
                          {o.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={o.logo} alt={o.name || o.userType} className="h-5 w-5 object-cover" />
                          ) : null}
                          {o.name || o.userType}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            {socials && Object.keys(socials).length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] tracking-widest text-gray-500 mb-1">SOCIALS</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(socials).map(([rawKey, rawVal]) => {
                    if (!rawVal) return null
                    const key = rawKey.toLowerCase()
                    let href = rawVal
                    if (key === 'whatsapp') {
                      const phone = rawVal.replace(/[^+\d]/g, '')
                      href = `https://wa.me/${phone}`
                    } else if (!/^https?:\/\//i.test(rawVal)) {
                      href = `https://${rawVal}`
                    }
                    const Icon =
                      key === 'instagram' ? FaInstagram :
                      key === 'facebook' ? FaFacebook :
                      key === 'twitter' || key === 'x' ? FaXTwitter :
                      key === 'youtube' ? FaYoutube :
                      key === 'linkedin' ? FaLinkedin :
                      key === 'whatsapp' ? FaWhatsapp :
                      key === 'telegram' ? FaTelegram :
                      key === 'tiktok' ? FaTiktok :
                      key === 'snapchat' ? FaSnapchat :
                      key === 'onlyfans' ? SiOnlyfans :
                      null
                    const color = brandColor(key)
                    return (
                      <a
                        key={rawKey}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1 border text-xs rounded-none transition-colors border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white hover:border-[var(--brand)]"
                        style={{ ['--brand' as any]: color }}
                        title={rawKey}
                      >
                        {Icon ? <Icon className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                        <span className="truncate">{platformLabel(key)}</span>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Tabs */}
        <div className="mt-10">
          <Tabs
            tabs={[
              {
                id: 'details',
                label: 'Details & Beschreibung',
                content: (
                  <div>
                    {Object.values(details).some(Boolean) && (
                      <div>
                        <h2 className="text-lg font-light tracking-widest text-gray-800">DETAILS</h2>
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                          {details.height && (<div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">GRÖSSE</div><div className="text-gray-800">{formatHeight(details.height)}</div></div>)}
                          {details.weight && (<div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">GEWICHT</div><div className="text-gray-800">{formatWeight(details.weight)}</div></div>)}
                          {details.bodyType && (
                            <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">KÖRPERTYP</div><div className="text-gray-800">{toArray(details.bodyType).length > 1 ? <div className="flex flex-wrap gap-2">{badgeElementsDE(details.bodyType)}</div> : formatEnumListDE(details.bodyType)}</div></div>
                          )}
                          {details.hairColor && (
                            <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">HAARFARBE</div><div className="text-gray-800">{toArray(details.hairColor).length > 1 ? <div className="flex flex-wrap gap-2">{badgeElementsDE(details.hairColor)}</div> : formatEnumListDE(details.hairColor)}</div></div>
                          )}
                          {details.hairLength && (
                            <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">HAARLÄNGE</div><div className="text-gray-800">{toArray(details.hairLength).length > 1 ? <div className="flex flex-wrap gap-2">{badgeElementsDE(details.hairLength)}</div> : formatEnumListDE(details.hairLength)}</div></div>
                          )}
                          {details.eyeColor && (
                            <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">AUGENFARBE</div><div className="text-gray-800">{toArray(details.eyeColor).length > 1 ? <div className="flex flex-wrap gap-2">{badgeElementsDE(details.eyeColor)}</div> : formatEnumListDE(details.eyeColor)}</div></div>
                          )}
                          {(details.breastType || details.breastSize || details.cupSize) && (
                            <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">BRUST</div><div className="text-gray-800"><div className="flex flex-wrap gap-2">{badgeElementsDE([toStr(details.breastSize || details.cupSize) ? (/^[a-z]$/i.test(String(details.breastSize || details.cupSize)) ? String(details.breastSize || details.cupSize).toUpperCase() : String(details.breastSize || details.cupSize)) : null, details.breastType].filter(Boolean))}</div></div></div>
                          )}
                          {(details.intimateArea || details.pubicHair || details.intimateStyle) && (
                            <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">INTIMBEREICH</div><div className="text-gray-800"><div className="flex flex-wrap gap-2">{badgeElementsDE([ ...toArray(details.intimateArea), ...toArray(details.pubicHair), ...toArray(details.intimateStyle) ])}</div></div></div>
                          )}
                          {(details.piercings !== null && details.piercings !== undefined) && (
                            <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">PIERCINGS</div><div className="text-gray-800">{typeof details.piercings === 'boolean' ? (details.piercings ? 'Ja' : 'Nein') : toArray(details.piercings).length > 1 ? <div className="flex flex-wrap gap-2">{badgeElementsDE(details.piercings)}</div> : formatEnumListDE(details.piercings)}</div></div>
                          )}
                          {(details.tattoos !== null && details.tattoos !== undefined) && (
                            <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">TÄTOWIERUNGEN</div><div className="text-gray-800">{typeof details.tattoos === 'boolean' ? (details.tattoos ? 'Ja' : 'Nein') : toArray(details.tattoos).length > 1 ? <div className="flex flex-wrap gap-2">{badgeElementsDE(details.tattoos)}</div> : formatEnumListDE(details.tattoos)}</div></div>
                          )}
                          {details.clothingStyle && (
                            <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">KLEIDUNGSSTIL</div><div className="text-gray-800">{toArray(details.clothingStyle).length > 1 ? <div className="flex flex-wrap gap-2">{badgeElementsDE(details.clothingStyle)}</div> : formatEnumListDE(details.clothingStyle)}</div></div>
                          )}
                          {(details.clothingSize || details.dressSize) && (
                            <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">KLEIDERGRÖSSE</div><div className="text-gray-800">{formatEnumListDE(details.clothingSize || details.dressSize)}</div></div>
                          )}
                          {details.shoeSize && (
                            <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">SCHUHGRÖSSE</div><div className="text-gray-800">{formatShoeSize(details.shoeSize)}</div></div>
                          )}
                        </div>
                      </div>
                    )}
                    {description && (
                      <div className="mt-8">
                        <h2 className="text-lg font-light tracking-widest text-gray-800">BESCHREIBUNG</h2>
                        <TranslatableDescription
                          text={description}
                          limit={600}
                          className="text-sm text-gray-700 mt-3 leading-relaxed"
                          buttonClassName="mt-3 text-xs font-light tracking-widest uppercase text-pink-500 hover:text-pink-600"
                        />
                      </div>
                    )}
                    {(data as any)?.openingHours && Object.keys((data as any).openingHours || {}).length > 0 && (
                      <div className="mt-8">
                        <h2 className="text-lg font-light tracking-widest text-gray-800">ANWESENHEITSZEITEN</h2>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Object.entries((data as any).openingHours).map(([day, hours]: any) => (
                            <div key={day} className="text-sm text-gray-800 flex items-center justify-between border border-gray-200 px-3 py-2">
                              <span className="text-[10px] tracking-widest text-gray-500 mr-3">{String(day).toUpperCase()}</span>
                              <span className="text-gray-900">{typeof hours === 'string' ? hours : (Array.isArray(hours) ? hours.join(', ') : '')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ),
              },
              {
                id: 'galerie',
                label: 'Galerie',
                content: images.length > 0 ? (
                  <GalleryGrid images={images} altBase={name ?? ''} className="mt-2" />
                ) : (
                  <div className="text-sm text-gray-500">Keine Bilder vorhanden.</div>
                ),
              },
              {
                id: 'services',
                label: 'Services',
                content: (
                  <div>
                    <div className="mb-3">
                      <ServiceLegend />
                    </div>
                    {services.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {services.map((s) => {
                          const found = SERVICES_DE.find((o) => o.value === s)
                          const label = found?.label || s
                            .replace(/[-_]/g, ' ')
                            .replace(/\s+/g, ' ')
                            .replace(/\b\w/g, (c) => c.toUpperCase())
                          return <ServiceTag key={s} value={s} label={label} />
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Keine Services angegeben.</div>
                    )}
                  </div>
                ),
              },
              {
                id: 'feed',
                label: 'Feed',
                content: <ProfileFeed posts={postsForFeed} />,
              },
              {
                id: 'kommentare',
                label: 'Kommentare',
                content: (
                  <div>
                    {ratingCount > 0 && (
                      <div className="mb-4 space-y-1">
                        {[5,4,3,2,1].map((r) => {
                          const c = dist[r] || 0
                          const pct = Math.round((c / distTotal) * 100)
                          const barColor = r <= 2 ? 'var(--rating-low)' : (r < 4 ? 'var(--rating-mid)' : 'var(--rating-high)')
                          return (
                            <div key={r} className="flex items-center gap-3 text-xs">
                              <div className="w-24 whitespace-nowrap text-gray-600">{r} Sterne</div>
                              <div className="flex-1 h-2" style={{ backgroundColor: 'var(--rating-track)' }}>
                                <div className="h-2" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                              </div>
                              <div className="w-12 text-right text-gray-600">{pct}%</div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <div id="kommentare" />
                    <ProfileComments targetUserId={escortId} />
                  </div>
                ),
              },
              {
                id: 'standort',
                label: 'Standort',
                content: (
                  <div>
                    <div className="text-sm text-gray-700 mb-3">
                      <div>
                        <span className="text-[10px] tracking-widest text-gray-500 mr-2">STRASSE:</span>
                        <span className="text-gray-800">{((location?.address || location?.formatted || '').split(',')[0]) || (city || country) || 'Nicht verfügbar'}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-[10px] tracking-widest text-gray-500 mr-2">STADT:</span>
                        <span className="text-gray-800">{(location?.zipCode || city) ? `${location?.zipCode ? location.zipCode + ' ' : ''}${city || ''}` : (country || 'Nicht verfügbar')}</span>
                      </div>
                    </div>
                    {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                      <div className="border border-gray-200 -mx-6 sm:mx-0">
                        <iframe
                          title="Standort"
                          className="w-full h-96"
                          src={
                            location?.placeId
                              ? `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=place_id:${location.placeId}`
                              : (location?.latitude && location?.longitude)
                                ? `https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&center=${location.latitude},${location.longitude}&zoom=14&maptype=roadmap`
                                : `https://www.google.com/maps/embed/v1/search?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(location?.formatted || location?.address || `${city || ''} ${country || ''}`)}`
                          }
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-amber-600">Google Maps API Key fehlt. Bitte setze NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.</div>
                    )}
                    {(city || country) && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location?.formatted || location?.address || `${city || ''} ${country || ''}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-sm underline"
                      >
                        Auf Karte öffnen
                      </a>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>
        {/* ANDERE ANZEIGEN (Similar Escorts) */}
        {similarItems.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-light tracking-widest text-gray-800">ANDERE ANZEIGEN</h2>
            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {similarItems.map((e) => {
                const slugged = e.name ? slugify(e.name) : 'escort'
                const href = `/escorts/${e.id}/${slugged}`
                return (
                  <div key={e.id} className="group cursor-pointer rounded-none">
                    <Link href={href} className="block">
                      <div className="aspect-[3/4] bg-gray-200 relative overflow-hidden border border-gray-200 group-hover:border-pink-500 transition-colors">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {e.image ? (
                          <img src={e.image} alt={e.name ?? ''} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-gray-300" />
                        )}
                        {(e.isVerified || e.isAgeVerified) && (
                          <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
                            {e.isVerified && (
                              <span title="Verifiziert" className="inline-flex items-center justify-center h-6 w-6 bg-white/90 border border-emerald-200 text-emerald-700">
                                <BadgeCheck className="h-4 w-4" />
                              </span>
                            )}
                            {e.isAgeVerified && (
                              <span title="Altersverifiziert" className="inline-flex items-center justify-center h-6 w-6 bg-white/90 border border-rose-200 text-rose-700">
                                <ShieldCheck className="h-4 w-4" />
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="px-3 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Link href={href} className="block truncate">
                          <h3 className="text-base font-medium tracking-widest text-gray-900 truncate">{(e.name?.toUpperCase?.() ?? e.name) || '—'}</h3>
                        </Link>
                        {e.isVerified && <BadgeCheck className="h-4 w-4 text-pink-500 flex-shrink-0" />}
                      </div>
                      {(e.city || e.country) && (
                        <div className="mt-1 text-sm text-gray-700">{e.city || e.country}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
      <MobileBottomBar
        name={name}
        locationText={city || country}
        ratingAvg={ratingAvg}
        ratingCount={ratingCount}
        phone={contact?.phone || null}
        escortId={escortId}
        avatar={image || null}
        commentsAnchor="kommentare"
      />
      <Footer />
    </div>
  )
}

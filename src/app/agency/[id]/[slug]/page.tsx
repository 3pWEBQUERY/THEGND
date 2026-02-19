import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { getSeoOverride, mergeMetadata, getUserSeoSettings, mergeUserSeoMetadata } from '@/lib/seo'
import { Globe, Phone, BadgeCheck } from 'lucide-react'
import { FaInstagram, FaFacebook, FaXTwitter, FaYoutube, FaLinkedin, FaWhatsapp, FaTelegram, FaTiktok, FaSnapchat } from 'react-icons/fa6'
import RatingDonut from '@/components/RatingDonut'
import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import MessageButton from '@/components/MessageButton'
import GalleryGrid from '@/components/GalleryGrid'
import Tabs from '@/components/Tabs'
import ProfileFeed from '@/components/ProfileFeed'
import ServiceTag from '@/components/ServiceTag'
import ServiceLegend from '@/components/ServiceLegend'
import { SERVICES_DE } from '@/data/services.de'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ExpandableText from '@/components/ExpandableText'
import type React from 'react'
import ProfileComments from '@/components/ProfileComments'
import ProfileAnalyticsTracker from '@/components/analytics/ProfileAnalyticsTracker'
import OnlineBadge from '@/components/OnlineBadge'
import Link from 'next/link'

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

// Helpers to format businessType and dates similar to Escort page formatting style
const prettifyToken = (v: any): string => {
  const s = (v ?? '').toString().trim()
  if (!s) return ''
  return s.replace(/[_-]+/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())
}
const formatBusinessType = (v: any): string => prettifyToken(v)
const formatEstablished = (iso: any): string => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (!isNaN(d.getTime())) return d.getFullYear().toString()
  } catch {}
  return prettifyToken(iso)
}

// Brand colors per social platform (used under CTA buttons)
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
  return '#6B7280'
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000

type GirlItem = {
  id: string
  name: string | null
  city: string | null
  country: string | null
  image: string | null
  isOnline: boolean
}

export default async function AgencyDetailPage({ params, searchParams }: { params: Promise<{ id: string; slug: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { id, slug } = await params
  const sp = (await (searchParams || Promise.resolve({}))) as Record<string, string | string[] | undefined>
  const sortKey = (typeof sp?.sort === 'string' ? sp.sort : Array.isArray(sp?.sort) ? sp.sort?.[0] : undefined) || 'name'
  const user = await prisma.user.findFirst({
    where: { id, userType: 'AGENCY', isActive: true },
    include: { profile: true },
  })
  if (!user || !user.profile) return notFound()

  const name = user.profile.companyName || user.profile.displayName || 'Agentur'
  // Redirect to canonical slug if mismatch
  if (name) {
    const expected = slugify(name)
    if (expected && slug !== expected) {
      redirect(`/agency/${id}/${expected}`)
    }
  }
  const city = user.profile.city || null
  const country = user.profile.country || null
  const image = getPrimaryImage(user.profile)
  const isVerified = (user.profile as any)?.visibility === 'VERIFIED'
  const description = user.profile.description || null
  // Collect gallery/media images similar to escorts page
  let gallery: string[] = []
  let mediaImages: string[] = []
  try {
    if (user.profile.gallery) {
      const g = JSON.parse(user.profile.gallery)
      if (Array.isArray(g)) gallery = g.filter((x: any) => typeof x === 'string')
    }
  } catch {}
  try {
    if (user.profile.media) {
      const m = JSON.parse(user.profile.media)
      if (Array.isArray(m)) {
        mediaImages = m
          .filter((x: any) => (x?.type?.toLowerCase?.() ?? '').includes('image') && typeof x?.url === 'string')
          .map((x: any) => x.url as string)
      }
    }
  } catch {}
  const images = [image, ...mediaImages, ...gallery].filter(Boolean) as string[]
  // Build location object
  const location = {
    address: user.profile.address || null,
    city,
    country,
    latitude: user.profile.latitude || null,
    longitude: user.profile.longitude || null,
    formatted: user.profile.locationFormatted || null,
    zipCode: user.profile.zipCode || null,
    placeId: user.profile.locationPlaceId || null,
  }
  // Parse services (JSON array of strings)
  let services: string[] = []
  try {
    if (user.profile.services) {
      const arr = JSON.parse(user.profile.services)
      if (Array.isArray(arr)) services = arr.filter((s: any) => typeof s === 'string')
    }
  } catch {}
  // Parse social media (JSON object)
  let socials: Record<string, string> = {}
  try {
    if (user.profile.socialMedia) {
      const o = JSON.parse(user.profile.socialMedia)
      if (o && typeof o === 'object') socials = o
    }
  } catch {}
  // Parse opening hours (JSON object)
  let openingHours: Record<string, { from: string; to: string }[]> = {}
  try {
    if ((user.profile as any).openingHours) {
      const oh = JSON.parse((user.profile as any).openingHours as any)
      if (oh && typeof oh === 'object') openingHours = oh
    }
  } catch {}
  const phone = user.profile.phone || null
  const website = user.profile.website || null
  // Fetch recent posts for FEED tab with author and counts
  const session = await getServerSession(authOptions)

  // Is profile analytics enabled for this profile owner?
  let analyticsEnabled = false
  try {
    const st = await (prisma as any).userAddonState.findUnique({
      where: { userId_key: { userId: user.id, key: 'PROFILE_ANALYTICS' } },
      select: { enabled: true },
    })
    analyticsEnabled = !!(st?.enabled)
  } catch {}
  // Profile rating (average of visible root comments)
  const ratingAgg: any = await (prisma as any).comment.aggregate({
    where: { targetUserId: user.id, isVisible: true, parentId: null, NOT: { rating: null } },
    _avg: { rating: true },
    _count: true,
  })
  const ratingAvg = Number(ratingAgg?._avg?.rating ?? 0)
  const ratingRounded = Math.round(ratingAvg)
  const ratingCount = Number(ratingAgg?._count ?? 0)
  // Distribution per rating 1..5
  const ratingGroups: any[] = await (prisma as any).comment.groupBy({
    by: ['rating'],
    where: { targetUserId: user.id, isVisible: true, parentId: null, NOT: { rating: null } },
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
    where: { authorId: user.id, isActive: true },
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

  // Linked escorts (Girls) for this agency via AppSetting (after user null-check)
  let girls: GirlItem[] = []
  try {
    const s = await (prisma as any).appSetting.findUnique({ where: { key: `girls:org:${user.id}:members` } })
    const ids: string[] = (() => { try { return s?.value ? JSON.parse(s.value) : [] } catch { return [] } })()
    if (Array.isArray(ids) && ids.length > 0) {
      const esc = await (prisma as any).user.findMany({
        where: { id: { in: ids }, isActive: true, userType: 'ESCORT' },
        select: { id: true, lastSeenAt: true, email: true, profile: true },
      })
      girls = esc.map((u: any) => ({
        id: u.id,
        name: u.profile?.displayName ?? u.email ?? null,
        city: u.profile?.city ?? null,
        country: u.profile?.country ?? null,
        image: getPrimaryImage(u.profile),
        isOnline: !!(u.lastSeenAt && (Date.now() - new Date(u.lastSeenAt as any).getTime()) <= ONLINE_THRESHOLD_MS),
      }))
      // Apply sorting based on sortKey
      girls.sort((a, b) => {
        if (sortKey === 'online') return (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0) || (a.name || '').localeCompare(b.name || '')
        if (sortKey === 'city') return (a.city || '').localeCompare(b.city || '') || (a.name || '').localeCompare(b.name || '')
        if (sortKey === 'country') return (a.country || '').localeCompare(b.country || '') || (a.name || '').localeCompare(b.name || '')
        return (a.name || '').localeCompare(b.name || '')
      })
    }
  } catch {}

  return (
    <div className="min-h-screen bg-white">
      {analyticsEnabled && <ProfileAnalyticsTracker profileUserId={user.id} />}
      <MinimalistNavigation />
      {/* Breadcrumb JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://thegnd.com/' },
              { '@type': 'ListItem', position: 2, name: 'Agenturen', item: 'https://thegnd.com/agency' },
              { '@type': 'ListItem', position: 3, name: name, item: `https://thegnd.com/agency/${user.id}/${(name || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}` },
            ],
          }),
        }}
      />

      {/* Hero Section aligned with escorts page */}
      <section className="relative h-screen h-[100svh] md:h-[50vh] md:min-h-[400px]">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image || '/escort.png'}
            alt={(name ?? 'Agentur') + ' Hero'}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* Centered content */}
        <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
          <div>
            <div className="flex items-center justify-center gap-3 mb-2">
              <h1 className="text-5xl md:text-6xl font-thin tracking-wider text-white">{name ? (name.toUpperCase?.() ?? name) : 'AGENTUR'}</h1>
              {isVerified && (
                <span title="Profil verifiziert" className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-widest border bg-emerald-50/90 text-emerald-800 border-emerald-200">
                  <BadgeCheck className="h-3.5 w-3.5" /> VERIFIZIERT
                </span>
              )}
            </div>
            {(city || country) && (
              <p className="text-sm text-gray-200">{city || country}</p>
            )}
            <div className="w-24 h-px bg-pink-500 mx-auto mt-3" />
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header block */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          {image && (
            <div className="w-40 h-52 bg-gray-200 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={name ?? ''} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              {name && (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-light tracking-widest text-gray-900">{name.toUpperCase?.() ?? name}</h1>
                  {isVerified && (
                    <span title="Profil verifiziert" className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-widest border bg-emerald-50 text-emerald-800 border-emerald-200">
                      <BadgeCheck className="h-3.5 w-3.5" /> VERIFIZIERT
                    </span>
                  )}
                </div>
              )}
              {ratingCount > 0 && (
                <div className="flex items-center gap-2">
                  <RatingDonut value={ratingAvg} size={32} strokeWidth={6} showValue={false} />
                  <div className="text-xs text-gray-700">{ratingAvg.toFixed(1)} / 5 <span className="text-gray-500">({ratingCount})</span></div>
                </div>
              )}
            </div>
            {(city || country) && (
              <p className="text-sm text-gray-500 mt-1">{city || country}</p>
            )}

            {/* CTA buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              <MessageButton toUserId={user.id} toDisplayName={name ?? undefined} toAvatar={image ?? undefined} />
              {phone && (
                <a href={`tel:${phone}`} className="px-4 py-2 border border-gray-300 rounded-none text-sm tracking-widest hover:border-pink-500">
                  ANRUFEN
                </a>
              )}
              {website && (
                <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 border border-gray-300 rounded-none text-sm tracking-widest hover:border-pink-500">
                  WEBSEITE
                </a>
              )}
            </div>
            {Object.keys(socials).length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] tracking-widest text-gray-500 mb-1">SOCIALS</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(socials).map(([rawKey, rawVal]) => {
                    if (!rawVal) return null
                    const key = rawKey.toLowerCase()
                    let href = rawVal as string
                    if (key === 'whatsapp') {
                      const phone = (rawVal as string).replace(/[^+\d]/g, '')
                      href = `https://wa.me/${phone}`
                    } else if (!/^https?:\/\//i.test(rawVal as string)) {
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
                      null
                    const color = brandColor(key)
                    const display = key === 'whatsapp' ? 'WHATSAPP' : (rawVal as string)
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
                        <span className="truncate max-w-[180px]">{display}</span>
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
                    <h2 className="text-lg font-light tracking-widest text-gray-800">DETAILS</h2>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      {user.profile.businessType && (
                        <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">UNTERNEHMEN</div><div className="text-gray-800">{formatBusinessType(user.profile.businessType)}</div></div>
                      )}
                      {user.profile.established && (
                        <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">GEGRÜNDET</div><div className="text-gray-800">{formatEstablished(user.profile.established)}</div></div>
                      )}
                      {user.profile.address && (
                        <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">ADRESSE</div><div className="text-gray-800">{user.profile.address}</div></div>
                      )}
                      {(city || country) && (
                        <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">ORT</div><div className="text-gray-800">{user.profile.zipCode ? `${user.profile.zipCode} ` : ''}{city || country}</div></div>
                      )}
                      {website && (
                        <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">WEBSEITE</div><div className="text-gray-800 break-all">{website}</div></div>
                      )}
                      {phone && (
                        <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">TELEFON</div><div className="text-gray-800">{phone}</div></div>
                      )}
                    </div>
                    {description && (
                      <div className="mt-8">
                        <h2 className="text-lg font-light tracking-widest text-gray-800">BESCHREIBUNG</h2>
                        <ExpandableText
                          text={description}
                          limit={600}
                          className="text-sm text-gray-700 mt-3 leading-relaxed"
                          buttonClassName="mt-3 text-xs font-light tracking-widest uppercase text-pink-500 hover:text-pink-600"
                        />
                      </div>
                    )}
                    {/* Opening Hours */}
                    {Object.keys(openingHours).length > 0 && (
                      <div className="mt-8">
                        <h2 className="text-lg font-light tracking-widest text-gray-800">ÖFFNUNGSZEITEN</h2>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            { key: 'mon', label: 'Montag' },
                            { key: 'tue', label: 'Dienstag' },
                            { key: 'wed', label: 'Mittwoch' },
                            { key: 'thu', label: 'Donnerstag' },
                            { key: 'fri', label: 'Freitag' },
                            { key: 'sat', label: 'Samstag' },
                            { key: 'sun', label: 'Sonntag' },
                          ].map(({ key, label }) => {
                            const slots = openingHours[key] || []
                            const text = slots.length ? slots.map(s => `${s.from}–${s.to}`).join(', ') : 'Geschlossen'
                            return (
                              <div key={key} className="text-sm">
                                <div className="text-[10px] tracking-widest text-gray-500">{label.toUpperCase()}</div>
                                <div className="text-gray-800">{text}</div>
                              </div>
                            )
                          })}
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
                content: services.length > 0 ? (
                  <div>
                    <div className="mb-3">
                      <ServiceLegend />
                    </div>
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
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Keine Services angegeben.</div>
                ),
              },
              {
                id: 'girls',
                label: 'GIRLS',
                content: girls.length > 0 ? (
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] tracking-widest text-gray-500">SORTIEREN:</span>
                      <Link href="?sort=name" className={`px-2 py-1 border text-xs tracking-widest ${sortKey==='name' ? 'border-pink-500 text-pink-600' : 'border-gray-300 text-gray-700 hover:border-pink-500 hover:text-pink-600'}`}>NAME</Link>
                      <Link href="?sort=city" className={`px-2 py-1 border text-xs tracking-widest ${sortKey==='city' ? 'border-pink-500 text-pink-600' : 'border-gray-300 text-gray-700 hover:border-pink-500 hover:text-pink-600'}`}>STADT</Link>
                      <Link href="?sort=country" className={`px-2 py-1 border text-xs tracking-widest ${sortKey==='country' ? 'border-pink-500 text-pink-600' : 'border-gray-300 text-gray-700 hover:border-pink-500 hover:text-pink-600'}`}>LAND</Link>
                      <Link href="?sort=online" className={`px-2 py-1 border text-xs tracking-widest ${sortKey==='online' ? 'border-pink-500 text-pink-600' : 'border-gray-300 text-gray-700 hover:border-pink-500 hover:text-pink-600'}`}>ONLINE</Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {girls.map((g: GirlItem) => {
                      const slug = slugify((g.name || 'escort').toString())
                      const href = `/escorts/${g.id}/${slug}`
                      return (
                        <Link key={g.id} href={href} className="group block">
                          <div className="relative aspect-[3/4] bg-gray-100 border border-gray-200 overflow-hidden">
                            {g.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={g.image} alt={g.name || 'Escort'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-400">Kein Bild</div>
                            )}
                            <OnlineBadge userId={g.id} initialOnline={g.isOnline} className="absolute top-2 right-2 z-10" />
                          </div>
                          <div className="px-2 py-2">
                            <div className="text-sm font-medium tracking-widest text-gray-900 truncate">{(g.name || '').toUpperCase()}</div>
                            <div className="text-xs text-gray-500 truncate">{[g.city, g.country].filter(Boolean).join(', ')}</div>
                          </div>
                        </Link>
                      )
                    })}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Keine Girls verbunden.</div>
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
                          const barColor = r <= 2 ? '#EF4444' : (r < 4 ? '#F59E0B' : '#10B981')
                          return (
                            <div key={r} className="flex items-center gap-3 text-xs">
                              <div className="w-24 whitespace-nowrap text-gray-600">{r} Sterne</div>
                              <div className="flex-1 h-2 bg-gray-200">
                                <div className="h-2" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                              </div>
                              <div className="w-12 text-right text-gray-600">{pct}%</div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <ProfileComments targetUserId={user.id} />
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
                        <span className="text-gray-800">{((location.address || location.formatted || '').split(',')[0]) || (city || country) || 'Nicht verfügbar'}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-[10px] tracking-widest text-gray-500 mr-2">STADT:</span>
                        <span className="text-gray-800">{(location.zipCode || city) ? `${location.zipCode ? location.zipCode + ' ' : ''}${city || ''}` : (country || 'Nicht verfügbar')}</span>
                      </div>
                    </div>
                    {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                      <div className="border border-gray-200">
                        <iframe
                          title="Standort"
                          className="w-full h-96"
                          src={
                            location.placeId
                              ? `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=place_id:${location.placeId}`
                              : (location.latitude && location.longitude)
                                ? `https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&center=${location.latitude},${location.longitude}&zoom=14&maptype=roadmap`
                                : `https://www.google.com/maps/embed/v1/search?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(location.formatted || location.address || `${city || ''} ${country || ''}`)}`
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
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.formatted || location.address || `${city || ''} ${country || ''}`)}`}
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
      </div>
      <Footer />
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; slug: string }> }): Promise<Metadata> {
  const { id } = await params
  const user = await prisma.user.findFirst({
    where: { id, userType: 'AGENCY', isActive: true },
    include: { profile: true },
  })
  if (!user || !user.profile) {
    return {
      title: 'Agentur | The GND',
      description: 'Agenturprofil auf The GND.',
      alternates: { canonical: `https://thegnd.com/agency/${id}` },
    }
  }
  const name = user.profile.companyName || user.profile.displayName || 'Agentur'
  const place = user.profile.city || user.profile.country || ''
  const title = `${name}${place ? ` – ${place}` : ''} | The GND`
  const description = user.profile.description || 'Agenturprofil auf The GND.'
  const slug = (name || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  const ogImage = getPrimaryImage(user.profile) || undefined
  let meta: Metadata = {
    title,
    description,
    alternates: { canonical: `https://thegnd.com/agency/${id}/${slug}` },
    openGraph: {
      title,
      description,
      type: 'profile',
      images: ogImage ? [ogImage] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
  // Apply admin SEO page override
  const override = await getSeoOverride(`/agency/${id}/${slug}`)
  meta = mergeMetadata(meta, override)
  // Apply user SEO addon settings
  const userSeo = await getUserSeoSettings(user.id)
  meta = mergeUserSeoMetadata(meta, userSeo)
  return meta
}

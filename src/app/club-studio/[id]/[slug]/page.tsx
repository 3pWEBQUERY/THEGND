import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import { Globe, Phone, BadgeCheck } from 'lucide-react'
import RatingDonut from '@/components/RatingDonut'
import MessageButton from '@/components/MessageButton'
import GalleryGrid from '@/components/GalleryGrid'
import Tabs from '@/components/Tabs'
import ProfileFeed from '@/components/ProfileFeed'
import ServiceTag from '@/components/ServiceTag'
import ServiceLegend from '@/components/ServiceLegend'
import { SERVICES_DE } from '@/data/services.de'
import ExpandableText from '@/components/ExpandableText'
import ProfileComments from '@/components/ProfileComments'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ProfileAnalyticsTracker from '@/components/analytics/ProfileAnalyticsTracker'

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

// Helpers to format and brand colors similar to Agency page
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

export default async function ClubStudioDetailPage({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id, slug } = await params
  const user = await prisma.user.findFirst({
    where: { id, userType: { in: ['CLUB', 'STUDIO'] }, isActive: true },
    include: { profile: true },
  })
  if (!user || !user.profile) return notFound()

  const name = user.profile.companyName || user.profile.displayName || 'Club / Studio'
  const expected = slugify(name)
  if (expected && slug !== expected) redirect(`/club-studio/${id}/${expected}`)

  const city = user.profile.city || null
  const country = user.profile.country || null
  const image = getPrimaryImage(user.profile)
  const isVerified = (user.profile as any)?.visibility === 'VERIFIED'
  const description = user.profile.description || null
  const phone = user.profile.phone || null
  const website = user.profile.website || null

  // Collect gallery/media images
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
  const locationObj = {
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

  // Ratings & Feed
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
  const ratingAgg: any = await (prisma as any).comment.aggregate({
    where: { targetUserId: user.id, isVisible: true, parentId: null, NOT: { rating: null } },
    _avg: { rating: true },
    _count: true,
  })
  const ratingAvg = Number(ratingAgg?._avg?.rating ?? 0)
  const ratingCount = Number(ratingAgg?._count ?? 0)
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
          select: { email: true, profile: { select: { displayName: true, avatar: true } } },
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
        author: { email: c.author?.email, profile: { displayName: c.author?.profile?.displayName, avatar: c.author?.profile?.avatar } },
      })),
    }
  })

  return (
    <div className="min-h-screen bg-white">
      {analyticsEnabled && <ProfileAnalyticsTracker profileUserId={user.id} />}
      <MinimalistNavigation />

      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px]">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image || '/2.jpg'} alt={(name ?? 'Club/Studio') + ' Hero'} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-thin tracking-wider text-white">{name ? (name.toUpperCase?.() ?? name) : 'CLUB & STUDIO'}</h1>
            {(city || country) && (
              <p className="text-sm text-gray-200 mt-2">{city || country}</p>
            )}
            <div className="w-24 h-px bg-pink-500 mx-auto mt-3" />
          </div>
        </div>
      </section>

      {/* Content */}
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
                    <span title="Profil verifiziert" className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-widest border bg-emerald-50 text-emerald-800 border-emerald-200"><BadgeCheck className="h-3.5 w-3.5" /> VERIFIZIERT</span>
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
            <div className="mt-4 flex flex-wrap gap-2">
              <MessageButton toUserId={user.id} toDisplayName={name ?? undefined} toAvatar={image ?? undefined} />
              {phone && (
                <a href={`tel:${phone}`} className="px-4 py-2 border border-gray-300 rounded-none text-sm tracking-widest hover:border-pink-500">ANRUFEN</a>
              )}
              {website && (
                <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 border border-gray-300 rounded-none text-sm tracking-widest hover:border-pink-500">WEBSEITE</a>
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
                    const color = brandColor(key)
                    return (
                      <a key={rawKey} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1 border text-xs rounded-none transition-colors border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white hover:border-[var(--brand)]" style={{ ['--brand' as any]: color }} title={rawKey}>
                        <Globe className="h-4 w-4" />
                        <span className="truncate max-w-[180px]">{rawVal}</span>
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
                        <ExpandableText text={description} limit={600} className="text-sm text-gray-700 mt-3 leading-relaxed" buttonClassName="mt-3 text-xs font-light tracking-widest uppercase text-pink-500 hover:text-pink-600" />
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
                    <div className="mb-3"><ServiceLegend /></div>
                    <div className="flex flex-wrap gap-2">
                      {services.map((s) => {
                        const found = SERVICES_DE.find((o) => o.value === s)
                        const label = found?.label || s.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                        return <ServiceTag key={s} value={s} label={label} />
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Keine Services angegeben.</div>
                ),
              },
              { id: 'feed', label: 'Feed', content: <ProfileFeed posts={postsForFeed} /> },
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
                              <div className="flex-1 h-2 bg-gray-200"><div className="h-2" style={{ width: `${pct}%`, backgroundColor: barColor }} /></div>
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
                      <div><span className="text-[10px] tracking-widest text-gray-500 mr-2">STRASSE:</span><span className="text-gray-800">{((locationObj.address || locationObj.formatted || '').split(',')[0]) || (city || country) || 'Nicht verfügbar'}</span></div>
                      <div className="mt-1"><span className="text-[10px] tracking-widest text-gray-500 mr-2">STADT:</span><span className="text-gray-800">{(locationObj.zipCode || city) ? `${locationObj.zipCode ? locationObj.zipCode + ' ' : ''}${city || ''}` : (country || 'Nicht verfügbar')}</span></div>
                    </div>
                    {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                      <div className="border border-gray-200">
                        <iframe
                          title="Standort"
                          className="w-full h-96"
                          src={
                            locationObj.placeId
                              ? `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=place_id:${locationObj.placeId}`
                              : (locationObj.latitude && locationObj.longitude)
                                ? `https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&center=${locationObj.latitude},${locationObj.longitude}&zoom=14&maptype=roadmap`
                                : `https://www.google.com/maps/embed/v1/search?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(locationObj.formatted || locationObj.address || `${city || ''} ${country || ''}`)}`
                          }
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-amber-600">Google Maps API Key fehlt. Bitte setze NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.</div>
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
    where: { id, userType: { in: ['CLUB', 'STUDIO'] }, isActive: true },
    include: { profile: true },
  })
  if (!user || !user.profile) {
    return {
      title: 'Club & Studio | The GND',
      description: 'Club- oder Studio-Profil auf The GND.',
      alternates: { canonical: `https://thegnd.com/club-studio/${id}` },
    }
  }
  const name = user.profile.companyName || user.profile.displayName || 'Club / Studio'
  const place = user.profile.city || user.profile.country || ''
  const title = `${name}${place ? ` – ${place}` : ''} | The GND`
  const description = user.profile.description || 'Club- oder Studio-Profil auf The GND.'
  const slug = (name || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  const ogImage = getPrimaryImage(user.profile) || undefined
  return {
    title,
    description,
    alternates: { canonical: `https://thegnd.com/club-studio/${id}/${slug}` },
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
}

import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'
import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import { redirect } from 'next/navigation'
import Tabs from '@/components/Tabs'
import ExpandableText from '@/components/ExpandableText'
import GalleryGrid from '@/components/GalleryGrid'
import MessageButton from '@/components/MessageButton'
import ProfileFeed from '@/components/ProfileFeed'
import ProfileComments from '@/components/ProfileComments'
import RatingDonut from '@/components/RatingDonut'
import OnlineBadge from '@/components/OnlineBadge'
import ProfileAnalyticsTracker from '@/components/analytics/ProfileAnalyticsTracker'
import { Globe } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { FaInstagram, FaFacebook, FaXTwitter, FaYoutube, FaLinkedin, FaWhatsapp, FaTelegram, FaTiktok, FaSnapchat } from 'react-icons/fa6'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const genderLabel: Record<string, string> = {
  MALE: 'Männlich',
  FEMALE: 'Weiblich',
  NON_BINARY: 'Non-Binary',
  OTHER: 'Andere',
}

// Social helpers (aligned with escorts page)
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
const platformLabel = (key: string): string => {
  const k = key.toLowerCase()
  const map: Record<string, string> = {
    whatsapp: 'WhatsApp', instagram: 'Instagram', facebook: 'Facebook', twitter: 'Twitter', x: 'X',
    youtube: 'YouTube', linkedin: 'LinkedIn', telegram: 'Telegram', tiktok: 'TikTok', snapchat: 'Snapchat'
  }
  return map[k] || (key.charAt(0).toUpperCase() + key.slice(1))
}

// Detail helpers (subset from escort page)
const toStr = (v: any) => (v === null || v === undefined) ? '' : String(v).trim()
const toArray = (v: any): any[] => {
  if (v === null || v === undefined) return []
  if (Array.isArray(v)) return v
  if (typeof v === 'string') {
    const s = v.trim()
    if (!s) return []
    try {
      const parsed = JSON.parse(s)
      if (Array.isArray(parsed)) return parsed
    } catch {}
    if (s.includes(',')) return s.split(',').map((x) => x.trim()).filter(Boolean)
    return [s]
  }
  return [v]
}
const translateTokenDE = (token: string): string => {
  const t = token.toLowerCase().replace(/[_\-\s]+/g, '')
  const map: Record<string, string> = {
    slim: 'Schlank', athletic: 'Athletisch', curvy: 'Kurvig', fit: 'Fit', average: 'Durchschnittlich',
    blonde: 'Blond', blond: 'Blond', brunette: 'Brünett', brown: 'Braun', black: 'Schwarz', red: 'Rot', grey: 'Grau', dyed: 'Gefärbt',
    short: 'Kurz', medium: 'Mittel', long: 'Lang',
    blue: 'Blau', green: 'Grün', hazel: 'Hasel', amber: 'Bernstein',
    elegant: 'Elegant', casual: 'Lässig', sexy: 'Sexy', sporty: 'Sportlich', classic: 'Klassisch', business: 'Business', chic: 'Chic', street: 'Streetwear',
  }
  return map[t] || token.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
const formatEnumListDE = (v: any): string => toArray(v).map((x) => translateTokenDE(String(x))).filter(Boolean).join(', ')
const badgeElementsDE = (v: any) => toArray(v).map((x: any, i: number) => (
  <span key={`${String(x)}-${i}`} className="inline-flex items-center px-2.5 py-1 border border-gray-200 bg-gray-50 text-gray-700 text-xs rounded-none">
    {translateTokenDE(String(x))}
  </span>
))

export default async function MemberPublicPage({ params }: any) {
  const { id, slug } = params
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
    }
  })

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <MinimalistNavigation />
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h1 className="text-2xl font-thin tracking-wider text-gray-800">Mitglied nicht gefunden</h1>
          <div className="mt-6">
            <Link href="/dashboard?tab=matching" className="text-sm text-pink-600 hover:underline">Zurück zum Matching</Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const p: any = user.profile || {}
  let gallery: string[] = []
  try { gallery = p.gallery ? JSON.parse(p.gallery) : [] } catch {}
  const hero = p.avatar || (Array.isArray(gallery) && gallery.length > 0 ? gallery[0] : null)
  const displayName = p.displayName || user.email.split('@')[0]
  const expectedSlug = (displayName || 'member').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  if (slug !== expectedSlug) {
    redirect(`/members/${id}/${expectedSlug}`)
  }

  // Onboarding-aligned fields
  const age: number | null = typeof p.age === 'number' ? p.age : (p.age ? Number(p.age) : null)
  const gender: string | null = p.gender || null
  const location: string = p.location || [p.city, p.country].filter(Boolean).join(', ')
  const bio: string = p.bio || p.about || ''
  let preferencesBlock: any = p.preferences || ''
  try {
    if (typeof preferencesBlock === 'string' && preferencesBlock.trim().startsWith('{') || preferencesBlock.trim().startsWith('[')) {
      preferencesBlock = JSON.parse(preferencesBlock)
    }
  } catch {}

  // Socials
  let socials: Record<string, string> = {}
  try {
    if (p.socialMedia) {
      const o = typeof p.socialMedia === 'string' ? JSON.parse(p.socialMedia) : p.socialMedia
      if (o && typeof o === 'object') socials = o
    }
  } catch {}

  // Presence (initial online status)
  let isOnline = false
  try {
    const rows = await prisma.$queryRaw<Array<{ lastSeenAt: Date | null }>>`
      SELECT "lastSeenAt" FROM "users" WHERE id = ${id} LIMIT 1
    `
    const ts = rows?.[0]?.lastSeenAt ? new Date(rows[0].lastSeenAt as any).getTime() : 0
    isOnline = !!(ts && Date.now() - ts <= 5 * 60 * 1000)
  } catch {}

  // FEED (Beiträge)
  const session = await getServerSession(authOptions)

  // Is profile analytics enabled for this profile owner?
  let analyticsEnabled = false
  try {
    const st = await (prisma as any).userAddonState.findUnique({
      where: { userId_key: { userId: id, key: 'PROFILE_ANALYTICS' } },
      select: { enabled: true },
    })
    analyticsEnabled = !!(st?.enabled)
  } catch {}
  const feedInclude: any = {
    author: { select: { email: true, userType: true, profile: { select: { displayName: true, avatar: true } } } },
    _count: { select: { likes: true, comments: true } },
    comments: {
      select: {
        id: true, content: true, parentId: true, createdAt: true,
        author: { select: { email: true, profile: { select: { displayName: true, avatar: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    },
  }
  if (session?.user?.id) {
    feedInclude.likes = { where: { userId: session.user.id }, select: { id: true } }
  }
  const rawPosts = await prisma.post.findMany({
    where: { authorId: id, isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: feedInclude,
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

  // Ratings/Kommentare (received)
  const ratingAgg: any = await (prisma as any).comment.aggregate({
    where: { targetUserId: id, isVisible: true, parentId: null, NOT: { rating: null } },
    _avg: { rating: true },
    _count: true,
  })
  const ratingAvg = Number(ratingAgg?._avg?.rating ?? 0)
  const ratingCount = Number(ratingAgg?._count ?? 0)
  const ratingGroups: any[] = await (prisma as any).comment.groupBy({
    by: ['rating'],
    where: { targetUserId: id, isVisible: true, parentId: null, NOT: { rating: null } },
    _count: { _all: true },
  })
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const g of ratingGroups) {
    const r = Number(g.rating || 0)
    if (r >= 1 && r <= 5) dist[r] = Number(g._count?._all ?? g._count ?? 0)
  }
  const distTotal = Object.values(dist).reduce((a, b) => a + b, 0) || 1

  // Gegebene Kommentare (by this member)
  const givenComments = await prisma.comment.findMany({
    where: { authorId: id, isVisible: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      content: true,
      rating: true,
      createdAt: true,
      targetUser: { select: { id: true, email: true, profile: { select: { displayName: true, avatar: true } } } },
    }
  })

  return (
    <div className="min-h-screen bg-white">
      {analyticsEnabled && <ProfileAnalyticsTracker profileUserId={id} />}
      <MinimalistNavigation />

      {/* Hero Section (like escorts) */}
      <section className="relative h-[100svh] md:h-[50vh] md:min-h-[400px]">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero || '/user.png'} alt={`${displayName} Hero`} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-thin tracking-wider text-white">{(displayName || 'MITGLIED').toUpperCase()}</h1>
            {location && (
              <p className="text-sm text-gray-200 mt-1">{location}</p>
            )}
            <div className="w-24 h-px bg-pink-500 mx-auto mt-3" />
          </div>
          {/* Online status bottom-right */}
          <OnlineBadge userId={id} initialOnline={isOnline} className="absolute bottom-4 right-4" />
        </div>
      </section>

      {/* Profile header with CTA */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm text-gray-500">
          <Link href="/dashboard?tab=matching" className="hover:text-pink-600">Zurück zum Matching</Link>
        </div>
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          {hero && (
            <div className="w-40 h-40 bg-gray-200 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={hero} alt={displayName} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-light tracking-widest text-gray-900">{(displayName || '').toUpperCase()}</h2>
              {ratingCount > 0 && (
                <div className="flex items-center gap-2">
                  <RatingDonut value={ratingAvg} size={32} strokeWidth={6} showValue={false} />
                  <div className="text-xs text-gray-700">{ratingAvg.toFixed(1)} / 5 <span className="text-gray-500">({ratingCount})</span></div>
                </div>
              )}
            </div>
            {location && <p className="text-sm text-gray-500 mt-1">{location}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <MessageButton toUserId={user.id} toDisplayName={displayName} toAvatar={hero ?? undefined} />
              <Link href="/dashboard?tab=messages" className="px-4 py-2 border border-gray-300 rounded-none text-sm tracking-widest hover:border-pink-500">
                NACHRICHTEN
              </Link>
            </div>
            {socials && Object.keys(socials).length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] tracking-widest text-gray-500 mb-1">SOCIALS</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(socials).map(([rawKey, rawVal]) => {
                    if (!rawVal) return null
                    const key = rawKey.toLowerCase()
                    let href = rawVal as string
                    if (key === 'whatsapp') {
                      const phone = href.replace(/[^+\d]/g, '')
                      href = `https://wa.me/${phone}`
                    } else if (!/^https?:\/\//i.test(href)) {
                      href = `https://${href}`
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
                    {/* Core info */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {age ? (<div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">ALTER</div><div className="text-gray-800">{age}</div></div>) : null}
                      {gender ? (<div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">GESCHLECHT</div><div className="text-gray-800">{genderLabel[gender] || gender}</div></div>) : null}
                      {location ? (<div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">ORT</div><div className="text-gray-800">{location}</div></div>) : null}
                    </div>

                    {/* Rich details (optional) */}
                    {(
                      p.height || p.weight || p.bodyType || p.hairColor || p.hairLength || p.eyeColor || p.clothingStyle || p.clothingSize || p.shoeSize !== undefined || p.tattoos !== undefined || p.piercings !== undefined
                    ) && (
                      <div className="mt-8">
                        <h3 className="text-lg font-light tracking-widest text-gray-800">DETAILS</h3>
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                          {p.height && (<div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">GRÖSSE</div><div className="text-gray-800">{toStr(p.height)}</div></div>)}
                          {p.weight && (<div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">GEWICHT</div><div className="text-gray-800">{toStr(p.weight)}</div></div>)}
                          {p.bodyType && (
                            <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">KÖRPERTYP</div><div className="text-gray-800">{toArray(p.bodyType).length > 1 ? <div className="flex flex-wrap gap-2">{badgeElementsDE(p.bodyType)}</div> : formatEnumListDE(p.bodyType)}</div></div>
                          )}
                          {p.hairColor && (
                            <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">HAARFARBE</div><div className="text-gray-800">{toArray(p.hairColor).length > 1 ? <div className="flex flex-wrap gap-2">{badgeElementsDE(p.hairColor)}</div> : formatEnumListDE(p.hairColor)}</div></div>
                          )}
                          {p.hairLength && (
                            <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">HAARLÄNGE</div><div className="text-gray-800">{toArray(p.hairLength).length > 1 ? <div className="flex flex-wrap gap-2">{badgeElementsDE(p.hairLength)}</div> : formatEnumListDE(p.hairLength)}</div></div>
                          )}
                          {p.eyeColor && (
                            <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">AUGENFARBE</div><div className="text-gray-800">{toArray(p.eyeColor).length > 1 ? <div className="flex flex-wrap gap-2">{badgeElementsDE(p.eyeColor)}</div> : formatEnumListDE(p.eyeColor)}</div></div>
                          )}
                          {p.clothingStyle && (
                            <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">KLEIDUNGSSTIL</div><div className="text-gray-800">{toArray(p.clothingStyle).length > 1 ? <div className="flex flex-wrap gap-2">{badgeElementsDE(p.clothingStyle)}</div> : formatEnumListDE(p.clothingStyle)}</div></div>
                          )}
                          {(p.clothingSize) && (
                            <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">KLEIDERGRÖSSE</div><div className="text-gray-800">{formatEnumListDE(p.clothingSize)}</div></div>
                          )}
                          {p.shoeSize !== undefined && p.shoeSize !== null && (
                            <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">SCHUHGRÖSSE</div><div className="text-gray-800">{toStr(p.shoeSize)}</div></div>
                          )}
                          {(p.tattoos !== undefined && p.tattoos !== null) && (
                            <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">TÄTOWIERUNGEN</div><div className="text-gray-800">{typeof p.tattoos === 'boolean' ? (p.tattoos ? 'Ja' : 'Nein') : (toArray(p.tattoos).length > 1 ? <div className="flex flex-wrap gap-2">{badgeElementsDE(p.tattoos)}</div> : formatEnumListDE(p.tattoos))}</div></div>
                          )}
                          {(p.piercings !== undefined && p.piercings !== null) && (
                            <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">PIERCINGS</div><div className="text-gray-800">{typeof p.piercings === 'boolean' ? (p.piercings ? 'Ja' : 'Nein') : (toArray(p.piercings).length > 1 ? <div className="flex flex-wrap gap-2">{badgeElementsDE(p.piercings)}</div> : formatEnumListDE(p.piercings))}</div></div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-8">
                      <h3 className="text-lg font-light tracking-widest text-gray-800">BESCHREIBUNG</h3>
                      {bio ? (
                        <ExpandableText text={bio} limit={600} className="text-sm text-gray-700 mt-3 leading-relaxed" buttonClassName="mt-3 text-xs font-light tracking-widest uppercase text-pink-500 hover:text-pink-600" />
                      ) : (
                        <div className="text-sm text-gray-500 mt-2">Keine Beschreibung vorhanden.</div>
                      )}
                    </div>
                    <div className="mt-8">
                      <h3 className="text-lg font-light tracking-widest text-gray-800">VORLIEBEN & INTERESSEN</h3>
                      {Array.isArray(preferencesBlock) ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {preferencesBlock.map((it: any, idx: number) => (
                            <span key={idx} className="inline-flex items-center px-2.5 py-1 border border-gray-200 bg-gray-50 text-gray-700 text-xs rounded-none">{String(it)}</span>
                          ))}
                        </div>
                      ) : preferencesBlock && typeof preferencesBlock === 'object' ? (
                        <div className="mt-3 space-y-1 text-sm text-gray-700">
                          {Object.entries(preferencesBlock).map(([k, v]) => (
                            <div key={k}><span className="text-gray-500">{k}:</span> {String(v)}</div>
                          ))}
                        </div>
                      ) : preferencesBlock ? (
                        <p className="text-sm text-gray-700 whitespace-pre-line mt-2">{String(preferencesBlock)}</p>
                      ) : (
                        <div className="text-sm text-gray-500 mt-2">Keine Angaben.</div>
                      )}
                    </div>
                  </div>
                )
              },
              {
                id: 'galerie',
                label: 'Galerie',
                content: (
                  (hero || (Array.isArray(gallery) && gallery.length > 0)) ? (
                    <GalleryGrid images={[hero, ...gallery].filter(Boolean) as string[]} altBase={displayName} className="mt-2" />
                  ) : (
                    <div className="text-sm text-gray-500">Keine Bilder vorhanden.</div>
                  )
                )
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
                    <ProfileComments targetUserId={id} />
                    {givenComments.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-lg font-light tracking-widest text-gray-800">GEGEBENE KOMMENTARE</h3>
                        <div className="mt-3 space-y-3">
                          {givenComments.map((c) => {
                            const t = c.targetUser
                            const name = t?.profile?.displayName || (t?.email ? t.email.split('@')[0] : 'Nutzer')
                            return (
                              <div key={c.id} className="p-3 border border-gray-200">
                                <div className="text-xs text-gray-500">an {name} • {new Date(c.createdAt).toLocaleDateString()}</div>
                                {typeof c.rating === 'number' && (
                                  <div className="text-xs text-gray-700 mt-1">Bewertung: {c.rating}/5</div>
                                )}
                                <div className="text-sm text-gray-800 mt-1 whitespace-pre-line">{c.content}</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              },
              {
                id: 'socials',
                label: 'Socials',
                content: (
                  socials && Object.keys(socials).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(socials).map(([rawKey, rawVal]) => {
                        if (!rawVal) return null
                        const key = rawKey.toLowerCase()
                        let href = rawVal as string
                        if (key === 'whatsapp') {
                          const phone = href.replace(/[^+\d]/g, '')
                          href = `https://wa.me/${phone}`
                        } else if (!/^https?:\/\//i.test(href)) {
                          href = `https://${href}`
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
                  ) : (
                    <div className="text-sm text-gray-500">Keine Social-Links vorhanden.</div>
                  )
                )
              },
            ]}
          />
        </div>
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 p-3">
        <div className="max-w-7xl mx-auto px-3">
          <Link href="/dashboard?tab=messages" className="w-full inline-flex items-center justify-center px-4 py-3 bg-pink-500 text-white text-xs tracking-widest uppercase">
            Nachricht schreiben
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}

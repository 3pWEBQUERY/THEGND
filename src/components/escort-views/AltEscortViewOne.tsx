import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import SimpleSlider from '@/components/SimpleSlider'
import Tabs from '@/components/Tabs'
import ProfileFeed from '@/components/ProfileFeed'
import TranslatableDescription from '@/components/TranslatableDescription'
import ServiceTag from '@/components/ServiceTag'
import ServiceLegend from '@/components/ServiceLegend'
import RatingDonut from '@/components/RatingDonut'
import MessageButton from '@/components/MessageButton'
import ProfileComments from '@/components/ProfileComments'
import OnlineBadge from '@/components/OnlineBadge'
import { SERVICES_DE } from '@/data/services.de'
import { Globe } from 'lucide-react'
import Link from 'next/link'
import { BadgeCheck, ShieldCheck } from 'lucide-react'
import VerifiedBadges from '@/components/VerifiedBadges'
import { FaInstagram, FaFacebook, FaXTwitter, FaYoutube, FaLinkedin, FaWhatsapp, FaTelegram, FaTiktok, FaSnapchat } from 'react-icons/fa6'
import { SiOnlyfans } from 'react-icons/si'
import React from 'react'
import MobileBottomBar from '@/components/MobileBottomBar'
import DateRequestDialog from '@/components/dates/DateRequestDialog'

function toStr(v: any) { return (v === null || v === undefined) ? '' : String(v).trim() }
function withUnit(v: any, unit: string) { const s = toStr(v); if (!s) return ''; const low = s.toLowerCase(); if (low.includes(unit.toLowerCase())) return s; if (/^\d+(?:[\.,]\d+)?$/.test(s)) return `${s.replace(',', '.')} ${unit}`; return s }
const formatHeight = (v: any) => withUnit(v, 'cm')
const formatWeight = (v: any) => withUnit(v, 'kg')
const formatShoeSize = (v: any) => withUnit(v, 'EU')
const parseJsonish = (s: string): any => { try { const t = s.trim(); if ((t.startsWith('[') && t.endsWith(']')) || (t.startsWith('{') && t.endsWith('}')) || (t.startsWith('"') && t.endsWith('"'))) { return JSON.parse(t) } } catch {} return s }
const toArray = (v: any): any[] => { if (v === null || v === undefined) return []; if (Array.isArray(v)) return v; if (typeof v === 'string') { const parsed = parseJsonish(v); if (Array.isArray(parsed)) return parsed; const s = toStr(parsed); if (!s) return []; if (s.includes(',')) return s.split(',').map((x) => x.trim()).filter(Boolean); return [s] } return [v] }
const capitalizeWords = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase())
const translateTokenDE = (token: string): string => { const t = token.toLowerCase().replace(/[_\-\s]+/g, ''); const map: Record<string, string> = { slim: 'Schlank', petite: 'Zierlich', athletic: 'Athletisch', fit: 'Fit', average: 'Durchschnittlich', curvy: 'Kurvig', bbw: 'Mollig', blonde: 'Blond', blond: 'Blond', brunette: 'Brünett', brown: 'Braun', black: 'Schwarz', red: 'Rot', auburn: 'Kupfer', chestnut: 'Kastanienbraun', darkbrown: 'Dunkelbraun', lightbrown: 'Hellbraun', grey: 'Grau', gray: 'Grau', silver: 'Silber', dyed: 'Gefärbt', highlights: 'Strähnen', short: 'Kurz', medium: 'Mittel', shoulderlength: 'Schulterlang', long: 'Lang', verylong: 'Sehr lang', bob: 'Bob', blue: 'Blau', green: 'Grün', hazel: 'Hasel', amber: 'Bernstein', natural: 'Natürlich', implants: 'Implantat', implant: 'Implantat', enhanced: 'Vergrößert', shaved: 'Rasiert', fullyshaved: 'Komplett rasiert', partiallyshaved: 'Teilrasiert', trimmed: 'Getrimmt', naturalhair: 'Natürlich', landingstrip: 'Landing Strip', brazilian: 'Brasilianisch', waxed: 'Gewaxt', ears: 'Ohren', navel: 'Bauchnabel', nipples: 'Brustwarzen', tongue: 'Zunge', nose: 'Nase', lip: 'Lippe', eyebrow: 'Augenbraue', intimate: 'Intim', arms: 'Arme', legs: 'Beine', back: 'Rücken', chest: 'Brust', neck: 'Nacken', shoulder: 'Schulter', small: 'Klein', large: 'Groß', elegant: 'Elegant', casual: 'Lässig', sexy: 'Sexy', business: 'Business', sporty: 'Sportlich', chic: 'Chic', street: 'Streetwear', classic: 'Klassisch' }; return map[t] || capitalizeWords(token.replace(/[_-]+/g, ' ').toLowerCase()) }
const formatEnumListDE = (v: any): string => toArray(v).map((x) => translateTokenDE(String(x))).filter(Boolean).join(', ')
const badgeElementsDE = (v: any) => { const arr = toArray(v); return arr.map((x: any, i: number) => (<span key={`${String(x)}-${i}`} className="inline-flex items-center px-2.5 py-1 border border-gray-200 bg-gray-50 text-gray-700 text-xs rounded-none">{translateTokenDE(String(x))}</span>)) }
const brandColor = (key: string): string => { const k = key.toLowerCase(); if (k === 'whatsapp') return '#25D366'; if (k === 'instagram') return '#E4405F'; if (k === 'facebook') return '#1877F2'; if (k === 'twitter' || k === 'x') return '#1DA1F2'; if (k === 'youtube') return '#FF0000'; if (k === 'linkedin') return '#0A66C2'; if (k === 'telegram') return '#26A5E4'; if (k === 'tiktok') return '#000000'; if (k === 'snapchat') return '#FFFC00'; if (k === 'onlyfans') return '#00AEF0'; return '#6B7280' }
function slugify(input: string): string { return input.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') }

export default function AltEscortViewOne(props: {
  data: any,
  images: string[],
  postsForFeed: any[],
  ratingAvg: number,
  ratingCount: number,
  dist: Record<number, number>,
  distTotal: number,
  hasApprovedVerification: boolean,
  similarItems?: Array<{ id: string; name: string | null; city: string | null; country: string | null; image: string | null; isVerified?: boolean; isAgeVerified?: boolean }>,
}) {
  const { data, images, postsForFeed, ratingAvg, ratingCount, dist, distTotal, hasApprovedVerification, similarItems = [] } = props
  const { id: escortId, name, slogan, city, country, image, description, details, services, contact, location, socials } = data
  const isOnline = !!data?.isOnline
  const heroMobileLayout = (data as any)?.heroPrefs?.mobileLayout || 'cover'
  const heroMobileClass = heroMobileLayout === 'half'
    ? 'h-[70vh] min-h-[420px]'
    : (heroMobileLayout === 'compact' ? 'h-[55vh] min-h-[320px]' : 'h-screen h-[100svh]')
  const heroImage = ((data as any)?.heroPrefs?.imageUrl as string | null) || image

  return (
    <div className="min-h-screen bg-white">
      <MinimalistNavigation />
      {/* Hero */}
      <section className="relative">
        <div className={`relative ${heroMobileClass} md:h-[50vh] md:min-h-[400px]`}>
          <img src={heroImage || '/escort.png'} alt={(name ?? 'Escort') + ' Hero'} className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {/* Online status bottom-right (live via presence API) */}
          <OnlineBadge userId={escortId} initialOnline={isOnline} className="absolute bottom-4 right-4" />
          <div className="absolute bottom-0 left-0 right-0">
            <div className="max-w-6xl mx-auto px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-light tracking-widest text-white drop-shadow">{name ? (name.toUpperCase?.() ?? name) : 'ESCORT'}</h1>
                    {hasApprovedVerification && (<VerifiedBadges />)}
                  </div>
                  {(city || country) && (<p className="text-sm text-white/90 mt-1">{city || country}</p>)}
                  {slogan && <p className="text-sm text-white/90 mt-1 italic">“{slogan}”</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Profile and Content */}
      <section className="relative">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Profile Card (sticky on desktop) */}
          <aside className="lg:col-span-1 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] overflow-auto bg-white border border-gray-200 p-6 space-y-4">
            <div className="w-full aspect-[3/4] bg-gray-100 overflow-hidden">
              <img src={image || '/escort.png'} alt={name ?? ''} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-light tracking-widest text-gray-900">{name ? (name.toUpperCase?.() ?? name) : 'ESCORT'}</h1>
                {hasApprovedVerification && (<VerifiedBadges />)}
              </div>
              {(city || country) && (<p className="text-sm text-gray-500 mt-1">{city || country}</p>)}
              {slogan && <p className="text-sm text-gray-600 mt-2 italic">“{slogan}”</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <MessageButton toUserId={escortId} toDisplayName={name ?? undefined} toAvatar={image ?? undefined} />
              <DateRequestDialog escortId={escortId} escortName={name} defaultCity={city} escortAvatar={image} />
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="px-2.5 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-none text-[11px] sm:text-sm tracking-widest hover:border-pink-500">ANRUFEN</a>
              )}
              {contact.website && (
                <a href={contact.website} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-none text-[11px] sm:text-sm tracking-widest hover:border-pink-500">WEBSEITE</a>
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
            {socials && Object.keys(socials).length > 0 && (
              <div>
                <div className="text-[10px] tracking-widest text-gray-500 mb-1">SOCIALS</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(socials).map(([rawKey, rawVal]) => {
                    if (!rawVal) return null
                    const key = rawKey.toLowerCase()
                    const raw = String(rawVal || '')
                    let href = raw
                    if (key === 'whatsapp') { const phone = raw.replace(/[^+\d]/g, ''); href = `https://wa.me/${phone}` } else if (!/^https?:\/\//i.test(raw)) { href = `https://${raw}` }
                    const Icon = key === 'instagram' ? FaInstagram : key === 'facebook' ? FaFacebook : key === 'twitter' || key === 'x' ? FaXTwitter : key === 'youtube' ? FaYoutube : key === 'linkedin' ? FaLinkedin : key === 'whatsapp' ? FaWhatsapp : key === 'telegram' ? FaTelegram : key === 'tiktok' ? FaTiktok : key === 'snapchat' ? FaSnapchat : key === 'onlyfans' ? SiOnlyfans : null
                    const color = brandColor(key)
                    return (
                      <a key={rawKey} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1 border text-xs rounded-none transition-colors border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white hover:border-[var(--brand)]" style={{ ['--brand' as any]: color }} title={rawKey}>
                        {Icon ? <Icon className="h-4 w-4" /> : <Globe className="h-4 w-4" />}<span className="truncate">{rawKey}</span>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
          </aside>

          {/* Right: Main Content */}
          <main className="lg:col-span-2 space-y-8">
            {/* Tabs for Details/Services/Feed/Kommentare/Standort */}
            <div className="bg-white border border-gray-200 p-6">
              <Tabs
                tabs={[
                  {
                    id: 'details',
                    label: 'Details & Beschreibung',
                    content: (
                      <div>
                        {Object.values(details).some(Boolean) && (
                          <div>
                            <h3 className="text-base font-light tracking-widest text-gray-800">DETAILS</h3>
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                              {details.height && (<div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">GRÖSSE</div><div className="text-gray-800">{formatHeight(details.height)}</div></div>)}
                              {details.weight && (<div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">GEWICHT</div><div className="text-gray-800">{formatWeight(details.weight)}</div></div>)}
                              {details.bodyType && (<div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">KÖRPERTYP</div><div className="text-gray-800">{toArray(details.bodyType).length > 1 ? <div className="flex flex-wrap gap-2">{badgeElementsDE(details.bodyType)}</div> : formatEnumListDE(details.bodyType)}</div></div>)}
                              {details.hairColor && (<div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">HAARFARBE</div><div className="text-gray-800">{toArray(details.hairColor).length > 1 ? <div className="flex flex-wrap gap-2">{badgeElementsDE(details.hairColor)}</div> : formatEnumListDE(details.hairColor)}</div></div>)}
                              {details.hairLength && (<div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">HAARLÄNGE</div><div className="text-gray-800">{toArray(details.hairLength).length > 1 ? <div className="flex flex-wrap gap-2">{badgeElementsDE(details.hairLength)}</div> : formatEnumListDE(details.hairLength)}</div></div>)}
                              {details.eyeColor && (<div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">AUGENFARBE</div><div className="text-gray-800">{toArray(details.eyeColor).length > 1 ? <div className="flex flex-wrap gap-2">{badgeElementsDE(details.eyeColor)}</div> : formatEnumListDE(details.eyeColor)}</div></div>)}
                              {(details.breastType || details.breastSize || (details as any).cupSize) && (
                                <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">BRUST</div><div className="text-gray-800"><div className="flex flex-wrap gap-2">{badgeElementsDE([ toStr((details as any).breastSize || (details as any).cupSize) ? (/^[a-z]$/i.test(String((details as any).breastSize || (details as any).cupSize)) ? String((details as any).breastSize || (details as any).cupSize).toUpperCase() : String((details as any).breastSize || (details as any).cupSize)) : null, (details as any).breastType ].filter(Boolean))}</div></div></div>
                              )}
                              {((details as any).intimateArea || (details as any).pubicHair || (details as any).intimateStyle) && (
                                <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">INTIMBEREICH</div><div className="text-gray-800"><div className="flex flex-wrap gap-2">{badgeElementsDE([ ...toArray((details as any).intimateArea), ...toArray((details as any).pubicHair), ...toArray((details as any).intimateStyle) ])}</div></div></div>
                              )}
                              {((details as any).piercings !== null && (details as any).piercings !== undefined) && (
                                <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">PIERCINGS</div><div className="text-gray-800">{typeof (details as any).piercings === 'boolean' ? ((details as any).piercings ? 'Ja' : 'Nein') : toArray((details as any).piercings).length > 1 ? <div className="flex flex-wrap gap-2">{badgeElementsDE((details as any).piercings)}</div> : formatEnumListDE((details as any).piercings)}</div></div>
                              )}
                              {((details as any).tattoos !== null && (details as any).tattoos !== undefined) && (
                                <div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">TÄTOWIERUNGEN</div><div className="text-gray-800">{typeof (details as any).tattoos === 'boolean' ? ((details as any).tattoos ? 'Ja' : 'Nein') : toArray((details as any).tattoos).length > 1 ? <div className="flex flex-wrap gap-2">{badgeElementsDE((details as any).tattoos)}</div> : formatEnumListDE((details as any).tattoos)}</div></div>
                              )}
                              {details.clothingStyle && (<div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">KLEIDUNGSSTIL</div><div className="text-gray-800">{toArray(details.clothingStyle).length > 1 ? <div className="flex flex-wrap gap-2">{badgeElementsDE(details.clothingStyle)}</div> : formatEnumListDE(details.clothingStyle)}</div></div>)}
                              {((details as any).clothingSize || (details as any).dressSize) && (<div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">KLEIDERGRÖSSE</div><div className="text-gray-800">{formatEnumListDE((details as any).clothingSize || (details as any).dressSize)}</div></div>)}
                              {(details as any).shoeSize && (<div className="text-sm"><div className="text-[10px] tracking-widest text-gray-500">SCHUHGRÖSSE</div><div className="text-gray-800">{formatShoeSize((details as any).shoeSize)}</div></div>)}
                            </div>
                          </div>
                        )}
                        {description && (
                          <div className="mt-8">
                            <h3 className="text-base font-light tracking-widest text-gray-800">BESCHREIBUNG</h3>
                            <TranslatableDescription text={description} limit={600} className="text-sm text-gray-700 mt-3 leading-relaxed" buttonClassName="mt-3 text-xs font-light tracking-widest uppercase text-pink-500 hover:text-pink-600" />
                          </div>
                        )}
                      </div>
                    )
                  },
                  {
                    id: 'services',
                    label: 'Services',
                    content: (
                      <div>
                        <div className="mb-3"><ServiceLegend /></div>
                        {services.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {services.map((s: string) => {
                              const found = SERVICES_DE.find((o) => o.value === s)
                              const label = found?.label || s.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
                              return <ServiceTag key={s} value={s} label={label} />
                            })}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Keine Services angegeben.</div>
                        )}
                      </div>
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
                        <ProfileComments targetUserId={escortId} />
                      </div>
                    )
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
                          <div className="border border-gray-200">
                            <iframe title="Standort" className="w-full h-96" src={
                              location?.placeId
                                ? `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=place_id:${location.placeId}`
                                : (location?.latitude && location?.longitude)
                                  ? `https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&center=${location.latitude},${location.longitude}&zoom=14&maptype=roadmap`
                                  : `https://www.google.com/maps/embed/v1/search?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(location?.formatted || location?.address || `${city || ''} ${country || ''}`)}`
                            } allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                          </div>
                        ) : (
                          <div className="text-sm text-amber-600">Google Maps API Key fehlt. Bitte setze NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.</div>
                        )}
                        {(city || country) && (
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location?.formatted || location?.address || `${city || ''} ${country || ''}`)}`} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-sm underline">Auf Karte öffnen</a>
                        )}
                      </div>
                    )
                  }
                ]}
              />
            </div>

            {/* Media Gallery (Slider, no auto-slide) */}
            <div className="bg-white border border-gray-200 p-6">
              <h2 className="text-lg font-light tracking-widest text-gray-800">GALERIE</h2>
              <div className="mt-4">
                <SimpleSlider images={images} altBase={name ?? ''} />
              </div>
            </div>

            {/* ANDERE ANZEIGEN (Similar Escorts) */}
            {similarItems.length > 0 && (
              <div className="bg-white border border-gray-200 p-6">
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
              </div>
            )}
          </main>
        </div>
      </section>
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

 'use client'
import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Tabs from '@/components/Tabs'
import ProfileFeed from '@/components/ProfileFeed'
import TranslatableDescription from '@/components/TranslatableDescription'
import ServiceTag from '@/components/ServiceTag'
import ServiceLegend from '@/components/ServiceLegend'
import RatingDonut from '@/components/RatingDonut'
import MessageButton from '@/components/MessageButton'
import ProfileComments from '@/components/ProfileComments'
import OnlineBadge from '@/components/OnlineBadge'
import VerifiedBadges from '@/components/VerifiedBadges'
import MobileBottomBar from '@/components/MobileBottomBar'
import { SERVICES_DE } from '@/data/services.de'
import React from 'react'
import DateRequestDialog from '@/components/dates/DateRequestDialog'

function toStr(v: any) { return (v === null || v === undefined) ? '' : String(v).trim() }
function withUnit(v: any, unit: string) { const s = toStr(v); if (!s) return ''; const low = s.toLowerCase(); if (low.includes(unit.toLowerCase())) return s; if (/^\d+(?:[\.,]\d+)?$/.test(s)) return `${s.replace(',', '.') } ${unit}`; return s }
const formatHeight = (v: any) => withUnit(v, 'cm')
const formatWeight = (v: any) => withUnit(v, 'kg')
const formatShoeSize = (v: any) => withUnit(v, 'EU')
const parseJsonish = (s: string): any => { try { const t = s.trim(); if ((t.startsWith('[') && t.endsWith(']')) || (t.startsWith('{') && t.endsWith('}')) || (t.startsWith('"') && t.endsWith('"'))) { return JSON.parse(t) } } catch {} return s }
const toArray = (v: any): any[] => { if (v === null || v === undefined) return []; if (Array.isArray(v)) return v; if (typeof v === 'string') { const parsed = parseJsonish(v); if (Array.isArray(parsed)) return parsed; const s = toStr(parsed); if (!s) return []; if (s.includes(',')) return s.split(',').map((x) => x.trim()).filter(Boolean); return [s] } return [v] }
const capitalizeWords = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase())
const translateTokenDE = (token: string): string => { const t = token.toLowerCase().replace(/[_\-\s]+/g, ''); const map: Record<string, string> = { slim: 'Schlank', petite: 'Zierlich', athletic: 'Athletisch', fit: 'Fit', average: 'Durchschnittlich', curvy: 'Kurvig', bbw: 'Mollig', blonde: 'Blond', blond: 'Blond', brunette: 'Brünett', brown: 'Braun', black: 'Schwarz', red: 'Rot', auburn: 'Kupfer', chestnut: 'Kastanienbraun', darkbrown: 'Dunkelbraun', lightbrown: 'Hellbraun', grey: 'Grau', gray: 'Grau', silver: 'Silber', dyed: 'Gefärbt', highlights: 'Strähnen', short: 'Kurz', medium: 'Mittel', shoulderlength: 'Schulterlang', long: 'Lang', verylong: 'Sehr lang', bob: 'Bob', blue: 'Blau', green: 'Grün', hazel: 'Hasel', amber: 'Bernstein', natural: 'Natürlich', implants: 'Implantat', implant: 'Implantat', enhanced: 'Vergrößert', shaved: 'Rasiert', fullyshaved: 'Komplett rasiert', partiallyshaved: 'Teilrasiert', trimmed: 'Getrimmt', naturalhair: 'Natürlich', landingstrip: 'Landing Strip', brazilian: 'Brasilianisch', waxed: 'Gewaxt', ears: 'Ohren', navel: 'Bauchnabel', nipples: 'Brustwarzen', tongue: 'Zunge', nose: 'Nase', lip: 'Lippe', eyebrow: 'Augenbraue', intimate: 'Intim', arms: 'Arme', legs: 'Beine', back: 'Rücken', chest: 'Brust', neck: 'Nacken', shoulder: 'Schulter', small: 'Klein', large: 'Groß', elegant: 'Elegant', casual: 'Lässig', sexy: 'Sexy', business: 'Business', sporty: 'Sportlich', chic: 'Chic', street: 'Streetwear', classic: 'Klassisch' }; return map[t] || capitalizeWords(token.replace(/[_-]+/g, ' ').toLowerCase()) }
const formatEnumListDE = (v: any): string => toArray(v).map((x) => translateTokenDE(String(x))).filter(Boolean).join(', ')
const badgeElementsDE = (v: any) => { const arr = toArray(v); return arr.map((x: any, i: number) => (<span key={`${String(x)}-${i}`} className="inline-flex items-center px-2.5 py-1 border border-gray-200 bg-gray-50 text-gray-700 text-xs rounded-none">{translateTokenDE(String(x))}</span>)) }

export default function AltEscortViewFullSide(props: {
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
  const { data, images, postsForFeed, ratingAvg, ratingCount, dist, distTotal, hasApprovedVerification } = props
  const { id: escortId, name, slogan, city, country, image, description, details, services, contact, location } = data
  const isOnline = !!data?.isOnline
  const heroImage = ((data as any)?.heroPrefs?.imageUrl as string | null) || image

  // Build slideshow: avatar/hero first, then gallery images (unique, truthy)
  const slides = React.useMemo(() => {
    const arr = [image, heroImage, ...(Array.isArray(images) ? images : [])].filter(Boolean) as string[]
    return Array.from(new Set(arr))
  }, [image, heroImage, images])
  const [slideIndex, setSlideIndex] = React.useState(0)
  const slideRef = React.useRef<HTMLDivElement | null>(null)
  const nextSlide = React.useCallback(() => setSlideIndex(i => (i + 1) % slides.length), [slides.length])
  const prevSlide = React.useCallback(() => setSlideIndex(i => (i - 1 + slides.length) % slides.length), [slides.length])
  // Basic swipe handling (no visible UI)
  const touchStartX = React.useRef<number | null>(null)
  const touchEndX = React.useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => { touchEndX.current = null; touchStartX.current = e.changedTouches[0]?.clientX ?? null }
  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => { touchEndX.current = e.changedTouches[0]?.clientX ?? null }
  const onTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return
    const delta = touchStartX.current - touchEndX.current
    const threshold = 30
    if (delta > threshold) nextSlide()
    else if (delta < -threshold) prevSlide()
    touchStartX.current = null; touchEndX.current = null
  }
  const onClickSlide = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = slideRef.current
    if (!el || slides.length <= 1) return
    const rect = el.getBoundingClientRect()
    const mid = rect.left + rect.width / 2
    if (e.clientX < mid) prevSlide()
    else nextSlide()
  }

  return (
    <div className="min-h-screen bg-white">
      <MinimalistNavigation darkBg />

      {/* Full-side layout */}
      <section className="relative">
        {/* push content below absolute nav */}
        <div className="w-full px-0 pt-[5.2rem] pb-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 items-stretch">
            {/* Left: Tall image (fills viewport height on desktop) */}
            <div className="relative bg-black">
              <div
                ref={slideRef}
                className="h-[calc(100vh-5.2rem)] min-h-[calc(100vh-5.2rem)] w-full relative overflow-hidden select-none cursor-pointer"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onClick={onClickSlide}
              >
                {/* Slides (no visible controls, no thumbs) */}
                <div className="absolute inset-0">
                  {slides.length ? (
                    slides.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={`${src}-${i}`}
                        src={src}
                        alt={`${name ? (name.toUpperCase?.() ?? name) : 'ESCORT'} Slide ${i + 1}/${slides.length}`}
                        className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-out ${i === slideIndex ? 'opacity-100' : 'opacity-0'}`}
                        loading={i === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                    ))
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={heroImage || '/escort.png'} alt={(name ?? 'Escort') + ' Hero'} className="absolute inset-0 w-full h-full object-cover object-center" />
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <OnlineBadge userId={escortId} initialOnline={isOnline} className="absolute top-3 right-3" />
                {/* Bottom overlay: basic stats */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-light tracking-widest">{name ? (name.toUpperCase?.() ?? name) : 'ESCORT'}</h1>
                    {hasApprovedVerification && (<VerifiedBadges />)}
                  </div>
                  {(city || country) && (<div className="text-sm/relaxed text-white/90">{city || country}</div>)}
                  {slogan && <div className="text-sm/relaxed text-white/90 italic mt-1">“{slogan}”</div>}
                </div>
              </div>
            </div>

            {/* Center: Details panel */}
            <div className="bg-white border border-gray-200 lg:border-l-0 border-b-0 p-6 lg:p-8 h-full min-h-[calc(100vh-5.2rem)] flex flex-col">
              {/* Header badges */}
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-2 py-0.5 border text-[10px] uppercase tracking-widest ${((data as any)?.available ? 'border-emerald-300 text-emerald-700' : 'border-rose-300 text-rose-700')}`}>
                  {((data as any)?.available ? 'VERFÜGBAR' : 'NICHT VERFÜGBAR')}
                </span>
                {ratingCount > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <RatingDonut value={ratingAvg} size={28} strokeWidth={5} showValue={false} />
                    <div>{ratingAvg.toFixed(1)} / 5 <span className="text-gray-500">({ratingCount})</span></div>
                  </div>
                )}
              </div>

              {/* Contact actions */}
              <div className="mt-3 flex flex-wrap gap-2">
                <MessageButton toUserId={escortId} toDisplayName={name ?? undefined} toAvatar={image ?? undefined} />
                <DateRequestDialog escortId={escortId} escortName={name} defaultCity={city} escortAvatar={image} />
                {contact?.phone && (<a href={`tel:${contact.phone}`} className="px-2.5 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-none text-[11px] sm:text-sm tracking-widest hover:border-pink-500">ANRUFEN</a>)}
                {contact?.website && (<a href={contact.website} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-none text-[11px] sm:text-sm tracking-widest hover:border-pink-500">WEBSEITE</a>)}
              </div>

              {/* Tabs */}
              <div className="mt-6">
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
                    { id: 'feed', label: 'Feed', content: <ProfileFeed posts={postsForFeed} /> },
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
                        </div>
                      )
                    },
                  ]}
                />
              </div>
            </div>

            {/* Right: Right Review panel */}
            <div id="kommentare" className="bg-white border border-gray-200 lg:border-l-0 border-b-0 p-6 lg:p-8 h-full min-h-[calc(100vh-5.2rem)] flex flex-col">
              <div className="text-base font-light tracking-widest text-gray-800">KOMMENTARE</div>
              <div className="mt-4 flex-1 min-h-0 overflow-y-auto">
                <ProfileComments targetUserId={escortId} />
              </div>
            </div>
          </div>
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
    </div>
  )
}

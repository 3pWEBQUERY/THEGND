"use client"

import Image from 'next/image'
import Link from 'next/link'

export type RentalItem = {
  id: string
  title: string
  shortDesc: string
  description?: string
  category: 'APARTMENT' | 'ROOM' | 'STUDIO' | 'EVENT_SPACE'
  city?: string | null
  country?: string | null
  media?: string[]
  priceInfo?: string | null
  createdAt?: string
  postedBy?: { id: string; userType: string; displayName: string | null; avatar: string | null; companyName: string | null }
}

export default function RentalsListItem({ rental }: { rental: RentalItem }) {
  const cover = (rental.media && rental.media[0]) || rental.postedBy?.avatar || null
  const location = [rental.city || '', rental.country || ''].filter(Boolean).join(', ')
  const company = rental.postedBy?.companyName || rental.postedBy?.displayName || ''
  const catLabel = (
    rental.category === 'APARTMENT' ? 'Apartment' :
    rental.category === 'ROOM' ? 'Zimmer' :
    rental.category === 'STUDIO' ? 'Studio' : 'Eventfläche'
  )

  // Build profile URL for postedBy
  const slugify = (input: string) => input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

  const profileHref = (() => {
    const pb = rental.postedBy
    if (!pb?.id) return null
    const type = (pb.userType || '').toUpperCase()
    const slug = slugify(company || pb.displayName || pb.companyName || 'profil')
    const base = type === 'ESCORT' ? '/escorts' : type === 'AGENCY' ? '/agency' : (type === 'CLUB' || type === 'STUDIO') ? '/club-studio' : '/members'
    return `${base}/${pb.id}/${slug}`
  })()

  return (
    <div className="w-full border border-gray-200 bg-white hover:shadow-sm transition-shadow">
      <div className="md:grid md:grid-cols-[260px_1fr_160px] md:gap-x-6">
        <div className="relative w-full h-44 md:h-full md:min-h-[180px] md:self-stretch bg-gray-100 overflow-hidden">
          {cover ? (
            <Image src={cover} alt={rental.title} fill className="object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">KEIN BILD</div>
          )}
        </div>
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-thin tracking-wider text-gray-900 truncate">{rental.title}</h3>
            {rental.postedBy && company ? (
              profileHref ? (
                <Link href={profileHref} className="hidden md:inline-flex items-center gap-2 pl-2 pr-3 py-2 overflow-hidden border border-gray-300 border-l-4 border-l-pink-600 bg-neutral-50 hover:border-pink-500 hover:text-pink-600 transition-colors max-w-[50%]">
                  {rental.postedBy.avatar && (
                    <Image src={rental.postedBy.avatar} alt={company} width={24} height={24} className="object-cover shrink-0" />
                  )}
                  <span className="truncate text-xs uppercase tracking-widest">{company}</span>
                </Link>
              ) : (
                <div className="hidden md:inline-flex items-center gap-2 pl-2 pr-3 py-2 overflow-hidden border border-gray-300 border-l-4 border-l-pink-600 bg-neutral-50 max-w-[50%]">
                  {rental.postedBy.avatar && (
                    <Image src={rental.postedBy.avatar} alt={company} width={24} height={24} className="object-cover shrink-0" />
                  )}
                  <span className="truncate text-xs uppercase tracking-widest">{company}</span>
                </div>
              )
            ) : (
              rental.createdAt ? <div className="text-xs text-gray-500 whitespace-nowrap">{new Date(rental.createdAt).toLocaleDateString('de-DE')}</div> : null
            )}
          </div>
          <p className="mt-2 text-sm text-gray-700 line-clamp-2">{rental.shortDesc}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-widest text-gray-600">
            <span className="px-2 py-1 border border-gray-300 bg-white">{catLabel}</span>
            {location && <span className="px-2 py-1 border border-gray-300 bg-white">{location}</span>}
            {rental.priceInfo && <span className="px-2 py-1 border border-gray-300 bg-white">{rental.priceInfo}</span>}
          </div>

          {/* Mobile actions row */}
          <div className="mt-4 flex items-stretch gap-2 md:hidden">
            <Link href={`/mieten/${rental.id}`} className="flex-1 px-3 py-2 text-xs uppercase tracking-widest text-center bg-pink-500 hover:bg-pink-600 text-white">Details</Link>
            {rental.postedBy?.id ? (
              <Link
                href={`/dashboard?tab=messages&to=${encodeURIComponent(rental.postedBy.id)}${rental.postedBy.displayName ? `&toName=${encodeURIComponent(rental.postedBy.displayName)}` : ''}${rental.postedBy.avatar ? `&toAvatar=${encodeURIComponent(rental.postedBy.avatar)}` : ''}`}
                className="flex-1 px-3 py-2 text-xs uppercase tracking-widest text-center border border-gray-300 hover:border-pink-500 hover:text-pink-600"
              >
                Kontakt
              </Link>
            ) : (
              <button disabled className="flex-1 px-3 py-2 text-xs uppercase tracking-widest border border-gray-200 text-gray-400">Kontakt</button>
            )}
          </div>
        </div>
        <div className="hidden md:flex p-4 md:p-6 flex-col items-stretch justify-center gap-2 border-l border-gray-100">
          <Link href={`/mieten/${rental.id}`} className="px-3 py-2 text-xs uppercase tracking-widest text-center bg-pink-500 hover:bg-pink-600 text-white">Details</Link>
          {rental.postedBy?.id ? (
            <Link href={`/dashboard?tab=messages&to=${encodeURIComponent(rental.postedBy.id)}${rental.postedBy.displayName ? `&toName=${encodeURIComponent(rental.postedBy.displayName)}` : ''}${rental.postedBy.avatar ? `&toAvatar=${encodeURIComponent(rental.postedBy.avatar)}` : ''}`} className="px-3 py-2 text-xs uppercase tracking-widest text-center border border-gray-300 hover:border-pink-500 hover:text-pink-600">Kontakt</Link>
          ) : (
            <button disabled className="px-3 py-2 text-xs uppercase tracking-widest border border-gray-200 text-gray-400">Kontakt</button>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useToast } from '@/components/ui/toast'

export type JobItem = {
  id: string
  title: string
  shortDesc: string
  description?: string
  category: 'ESCORT' | 'CLEANING' | 'SECURITY' | 'HOUSEKEEPING'
  city?: string | null
  country?: string | null
  media?: string[]
  createdAt?: string
  postedBy?: { id: string; userType: string; displayName: string | null; avatar: string | null; companyName: string | null }
}

export default function JobsListItem({ job }: { job: JobItem }) {
  const [shareBusy, setShareBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const toast = useToast()
  const cover = (job.media && job.media[0]) || job.postedBy?.avatar || null
  const location = [job.city || '', job.country || ''].filter(Boolean).join(', ')
  const company = job.postedBy?.companyName || job.postedBy?.displayName || ''
  const catLabel = (
    job.category === 'ESCORT' ? 'Escort' :
    job.category === 'CLEANING' ? 'Reinigungskraft' :
    job.category === 'SECURITY' ? 'Security' : 'Hausdame'
  )

  // Build profile URL for postedBy
  const slugify = (input: string) => input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

  const profileHref = (() => {
    const pb = job.postedBy
    if (!pb?.id) return null
    const type = (pb.userType || '').toUpperCase()
    const slug = slugify(company || pb.displayName || pb.companyName || 'profil')
    const base = type === 'ESCORT' ? '/escorts' : type === 'AGENCY' ? '/agency' : (type === 'CLUB' || type === 'STUDIO') ? '/club-studio' : '/members'
    return `${base}/${pb.id}/${slug}`
  })()

  const jobUrl = `/jobs/${job.id}`

  const onShare = async () => {
    try {
      setShareBusy(true)
      const title = job.title
      const text = job.shortDesc || job.title
      const url = typeof window !== 'undefined' ? `${window.location.origin}${jobUrl}` : jobUrl
      if (navigator.share) {
        await navigator.share({ title, text, url })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        toast.show('Link kopiert', { variant: 'success' })
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }
    } catch {
      toast.show('Teilen fehlgeschlagen', { variant: 'error' })
    }
    finally {
      setShareBusy(false)
    }
  }

  return (
    <div className="w-full border border-gray-200 bg-white hover:shadow-sm transition-shadow">
      <div className="md:grid md:grid-cols-[260px_1fr_160px] md:gap-x-6">
        {/* Left: Portrait image */}
        <div className="relative w-full h-44 md:h-full md:min-h-[180px] md:self-stretch bg-gray-100 overflow-hidden">
          {cover ? (
            <Image src={cover} alt={job.title} fill className="object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">KEIN BILD</div>
          )}
        </div>

        {/* Middle: details */}
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg md:text-xl font-thin tracking-wider text-gray-900">{job.title}</h3>
            {job.postedBy && company && (
              profileHref ? (
                <Link href={profileHref} className="hidden md:inline-flex items-center gap-2 pl-2 pr-3 py-2 overflow-hidden border border-gray-300 border-l-4 border-l-pink-600 bg-neutral-50 hover:border-pink-500 hover:text-pink-600 transition-colors max-w-[50%]">
                  {job.postedBy.avatar && (
                    <Image src={job.postedBy.avatar} alt={company} width={24} height={24} className="object-cover shrink-0" />
                  )}
                  <span className="truncate text-xs uppercase tracking-widest">{company}</span>
                </Link>
              ) : (
                <div className="hidden md:inline-flex items-center gap-2 pl-2 pr-3 py-2 overflow-hidden border border-gray-300 border-l-4 border-l-pink-600 bg-neutral-50 max-w-[50%]">
                  {job.postedBy.avatar && (
                    <Image src={job.postedBy.avatar} alt={company} width={24} height={24} className="object-cover shrink-0" />
                  )}
                  <span className="truncate text-xs uppercase tracking-widest">{company}</span>
                </div>
              )
            )}
          </div>
          <div className="mt-2 text-sm text-gray-700 line-clamp-2 md:line-clamp-3">{job.shortDesc}</div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-widest text-gray-600">
            <span className="px-2 py-1 border border-gray-300 bg-white">{catLabel}</span>
            {location && <span className="px-2 py-1 border border-gray-300 bg-white">{location}</span>}
          </div>

          {/* Mobile actions row */}
          <div className="mt-4 flex items-stretch gap-2 md:hidden">
            <Link href={jobUrl} className="flex-1 px-3 py-2 text-xs uppercase tracking-widest text-center bg-pink-500 hover:bg-pink-600 text-white">Details</Link>
            {job.postedBy?.id ? (
              <Link
                href={`/dashboard?tab=messages&to=${encodeURIComponent(job.postedBy.id)}${job.postedBy.displayName ? `&toName=${encodeURIComponent(job.postedBy.displayName)}` : ''}${job.postedBy.avatar ? `&toAvatar=${encodeURIComponent(job.postedBy.avatar)}` : ''}`}
                className="flex-1 px-3 py-2 text-xs uppercase tracking-widest text-center border border-gray-300 hover:border-pink-500 hover:text-pink-600"
              >
                Kontakt
              </Link>
            ) : (
              <button disabled className="flex-1 px-3 py-2 text-xs uppercase tracking-widest border border-gray-200 text-gray-400">Kontakt</button>
            )}
            <button onClick={onShare} disabled={shareBusy} className="flex-1 px-3 py-2 text-xs uppercase tracking-widest border border-gray-300 hover:border-pink-500 hover:text-pink-600 disabled:opacity-60">{shareBusy ? '…' : copied ? 'Kopiert' : 'Teilen'}</button>
          </div>
        </div>

        {/* Right: vertical buttons */}
        <div className="hidden md:flex p-4 md:p-6 flex-col items-stretch justify-center gap-2 border-l border-gray-100">
          <Link href={jobUrl} className="px-3 py-2 text-xs uppercase tracking-widest text-center bg-pink-500 hover:bg-pink-600 text-white">Details</Link>
          {job.postedBy?.id ? (
            <Link
              href={`/dashboard?tab=messages&to=${encodeURIComponent(job.postedBy.id)}${job.postedBy.displayName ? `&toName=${encodeURIComponent(job.postedBy.displayName)}` : ''}${job.postedBy.avatar ? `&toAvatar=${encodeURIComponent(job.postedBy.avatar)}` : ''}`}
              className="px-3 py-2 text-xs uppercase tracking-widest text-center border border-gray-300 hover:border-pink-500 hover:text-pink-600"
              data-analytics="job_contact"
            >
              Kontakt
            </Link>
          ) : (
            <button disabled className="px-3 py-2 text-xs uppercase tracking-widest border border-gray-200 text-gray-400">Kontakt</button>
          )}
          <button onClick={onShare} disabled={shareBusy} className="px-3 py-2 text-xs uppercase tracking-widest border border-gray-300 hover:border-pink-500 hover:text-pink-600 disabled:opacity-60" data-analytics="job_share">{shareBusy ? '…' : copied ? 'Kopiert' : 'Teilen'}</button>
        </div>
      </div>
    </div>
  )
}

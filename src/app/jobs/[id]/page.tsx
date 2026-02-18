import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import Tabs from '@/components/Tabs'

async function getJob(id: string) {
  try {
    const job: any = await (prisma as any).job.findUnique({
      where: { id },
      include: { postedBy: { include: { profile: true } } },
    })
    if (!job) return null
    return {
      id: job.id,
      title: job.title,
      shortDesc: job.shortDesc,
      description: job.description,
      category: job.category,
      location: job.location,
      city: job.city,
      country: job.country,
      salaryInfo: job.salaryInfo,
      contactInfo: job.contactInfo,
      media: (() => { try { return job.media ? JSON.parse(job.media) : [] } catch { return [] } })(),
      isActive: job.isActive,
      createdAt: job.createdAt,
      postedBy: {
        id: job.postedById,
        userType: job.postedBy?.userType,
        displayName: job.postedBy?.profile?.displayName ?? null,
        avatar: job.postedBy?.profile?.avatar ?? null,
        companyName: job.postedBy?.profile?.companyName ?? null,
      },
    }
  } catch {
    return null
  }
}

export default async function JobDetailPage({ params, searchParams: _searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params
  await _searchParams
  const job = await getJob(id)

  return (
    <div className="min-h-screen bg-white">
      <MinimalistNavigation />

      {/* Hero (condensed) */}
      <section className="relative h-[34vh] min-h-[280px]">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/jobs.jpg" alt="Job Hero" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-thin tracking-wider text-white mb-2">{job?.title || 'JOB'}</h1>
            <div className="w-20 h-px bg-pink-500 mx-auto" />
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {!job ? (
          <div className="text-sm text-gray-600">Job nicht gefunden.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Media column */}
            <div className="md:col-span-1">
              <div className="space-y-3">
                {(Array.isArray(job.media) && job.media.length > 0 ? job.media : [job.postedBy?.avatar].filter(Boolean)).map((u: string, idx: number) => (
                  <div key={idx} className="relative aspect-[3/4] bg-gray-100 border border-gray-200 overflow-hidden">
                    <Image src={u} alt={job.title} fill className="object-cover" />
                  </div>
                ))}
                {(!job.media || job.media.length === 0) && !job.postedBy?.avatar && (
                  <div className="h-40 border border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-500">KEIN BILD</div>
                )}
                {job?.postedBy?.id && (
                  <div className="border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-gray-100 flex items-center justify-center overflow-hidden">
                        {job.postedBy.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={job.postedBy.avatar} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-sm font-light tracking-widest text-gray-600">
                            {(job.postedBy.displayName || job.postedBy.companyName || 'N').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-light tracking-wide text-gray-800">
                          {job.postedBy.companyName || job.postedBy.displayName || 'Nutzer'}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Link
                        href={`/dashboard?tab=messages&to=${encodeURIComponent(job.postedBy.id)}${job.postedBy.displayName ? `&toName=${encodeURIComponent(job.postedBy.displayName)}` : ''}${job.postedBy.avatar ? `&toAvatar=${encodeURIComponent(job.postedBy.avatar)}` : ''}`}
                        className="w-full inline-block text-center px-3 py-2 text-xs uppercase tracking-widest border border-gray-300 hover:border-pink-500 hover:text-pink-600"
                      >
                        Kontakt
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Details column */}
            <div className="md:col-span-2">
              <div className="border border-gray-200 p-6 bg-white">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-thin tracking-wider text-gray-900">{job.title}</h2>
                    <div className="w-16 h-px bg-pink-500 mt-2" />
                  </div>
                  {job?.postedBy?.id && (
                    <Link
                      href={`/dashboard?tab=messages&to=${encodeURIComponent(job.postedBy.id)}${job.postedBy.displayName ? `&toName=${encodeURIComponent(job.postedBy.displayName)}` : ''}${job.postedBy.avatar ? `&toAvatar=${encodeURIComponent(job.postedBy.avatar)}` : ''}`}
                      className="px-4 py-2 text-xs uppercase tracking-widest bg-pink-500 hover:bg-pink-600 text-white self-start"
                    >
                      Kontakt aufnehmen
                    </Link>
                  )}
                </div>
                <Tabs
                  className="mt-4"
                  tabs={[
                    {
                      id: 'aktuell',
                      label: 'Aktuell',
                      content: (
                        <>
                          <div className="text-sm text-gray-700 mb-4">{job.shortDesc}</div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-widest text-gray-600 mb-6">
                            <span className="px-2 py-1 border border-gray-300">{job.category}</span>
                            {job.city && <span className="px-2 py-1 border border-gray-300">{job.city}{job.country ? `, ${job.country}` : ''}</span>}
                            {job.postedBy?.companyName && <span className="px-2 py-1 border border-gray-300">{job.postedBy.companyName}</span>}
                          </div>
                          <div className="prose prose-p:my-3 prose-ul:my-2 prose-li:my-0 text-gray-800 max-w-none">
                            <p style={{ whiteSpace: 'pre-wrap' }}>{job.description}</p>
                          </div>
                          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {job.salaryInfo && (
                              <div className="border border-gray-200 p-4">
                                <div className="text-[11px] uppercase tracking-widest text-gray-500 mb-1">Vergütung</div>
                                <div className="text-sm text-gray-800">{job.salaryInfo}</div>
                              </div>
                            )}
                            {job.contactInfo && (
                              <div className="border border-gray-200 p-4">
                                <div className="text-[11px] uppercase tracking-widest text-gray-500 mb-1">Kontakt</div>
                                <div className="text-sm text-gray-800 break-all">{job.contactInfo}</div>
                              </div>
                            )}
                          </div>
                        </>
                      ),
                    },
                    {
                      id: 'galerie',
                      label: 'Galerie',
                      content: (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {(Array.isArray(job.media) && job.media.length > 0 ? job.media : [job.postedBy?.avatar].filter(Boolean)).map((u: string, idx: number) => (
                            <div key={idx} className="relative aspect-[3/4] bg-gray-100 border border-gray-200 overflow-hidden">
                              <Image src={u} alt={job.title} fill className="object-cover" />
                            </div>
                          ))}
                          {(!job.media || job.media.length === 0) && !job.postedBy?.avatar && (
                            <div className="h-40 border border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-500 w-full col-span-2 md:col-span-3">KEIN BILD</div>
                          )}
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

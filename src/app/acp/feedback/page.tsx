import { requireAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import React from 'react'
import StatusSelect from './StatusSelect'
import FeedbackFilters from './FeedbackFilters'

function formatDate(d: Date) {
  try {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(d)
  } catch {
    return ''
  }
}

export const dynamic = 'force-dynamic'

export default async function AcpFeedbackPage({ searchParams }: any) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return notFound()

  const rawStatus = (searchParams?.status || '').toString().toUpperCase()
  const rawReason = (searchParams?.reason || '').toString().toUpperCase()
  const allowedStatus = ['OPEN','IN_REVIEW','RESOLVED']
  const allowedReason = ['REPORT_AD','BUG','PRAISE','ADVERTISING','CUSTOMER_SERVICE','OTHER']
  const status = allowedStatus.includes(rawStatus) ? rawStatus : undefined
  const reason = allowedReason.includes(rawReason) ? rawReason : undefined

  const where: any = {}
  if (status) where.status = status
  if (reason) where.reason = reason

  const items = await prisma.feedback.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: ({
      id: true,
      email: true,
      message: true,
      reason: true,
      customTitle: true,
      contact: true,
      status: true,
      createdAt: true,
      user: { select: { email: true } }
    } as any)
  })

  return (
    <div className="p-6">
      <h1 className="text-xl font-light tracking-widest">Feedback</h1>
      <div className="mt-2 h-[2px] w-24 bg-gradient-to-r from-pink-600/0 via-pink-500/80 to-pink-600/0" />

      <FeedbackFilters />

      <div className="overflow-x-auto border border-gray-200">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase tracking-widest text-[11px]">
            <tr>
              <th className="text-left p-3 border-b">Datum</th>
              <th className="text-left p-3 border-b">User/E-Mail</th>
              <th className="text-left p-3 border-b">Grund</th>
              <th className="text-left p-3 border-b">Titel</th>
              <th className="text-left p-3 border-b">Nachricht</th>
              <th className="text-left p-3 border-b">Kontakt</th>
              <th className="text-left p-3 border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((f: any) => (
              <tr key={f.id} className="align-top">
                <td className="p-3 border-b text-gray-700 whitespace-nowrap">{formatDate(new Date(f.createdAt))}</td>
                <td className="p-3 border-b text-gray-700 whitespace-nowrap">
                  {f.user?.email || f.email || '—'}
                </td>
                <td className="p-3 border-b text-gray-700 whitespace-nowrap">
                  {(() => {
                    switch (f.reason) {
                      case 'REPORT_AD': return 'Anzeige melden'
                      case 'BUG': return 'Funktioniert nicht'
                      case 'PRAISE': return 'Lob & Kritik'
                      case 'ADVERTISING': return 'Werbung'
                      case 'CUSTOMER_SERVICE': return 'Kundenbetreuer'
                      case 'OTHER': return 'Etwas anderes'
                      default: return '—'
                    }
                  })()}
                </td>
                <td className="p-3 border-b text-gray-700 whitespace-nowrap">{f.customTitle || '—'}</td>
                <td className="p-3 border-b text-gray-800 max-w-[640px]">
                  <div className="whitespace-pre-wrap break-words">{f.message}</div>
                </td>
                <td className="p-3 border-b text-gray-700 whitespace-nowrap">{f.contact || '—'}</td>
                <td className="p-3 border-b">
                  <StatusSelect id={f.id} value={f.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

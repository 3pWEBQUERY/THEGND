'use client'

import Link from 'next/link'
import React from 'react'

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function orgTypeLabel(t: string): string {
  if (t === 'AGENCY') return 'AGENTUR'
  if (t === 'CLUB') return 'CLUB'
  if (t === 'STUDIO') return 'STUDIO'
  return t
}

export default function ProfileOrgConnections(props: {
  joinCode: string
  onChangeJoinCode: (v: string) => void
  joining: boolean
  onSubmitJoin: () => void
  loadingMyOrgs: boolean
  myOrgs: Array<{ id: string; userType: string; name: string; avatar: string | null; city: string | null; country: string | null }> | null
  unlinking: string | null
  onUnlink: (orgId: string) => void
}) {
  const { joinCode, onChangeJoinCode, joining, onSubmitJoin, loadingMyOrgs, myOrgs, unlinking, onUnlink } = props

  return (
    <div className="bg-white border border-gray-100 rounded-none">
      <div className="p-4 sm:p-8">
        <div className="text-xs font-light tracking-widest text-gray-600 mb-2">ZU AGENTUR, CLUB ODER STUDIO HINZUFÜGEN</div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <input
            value={joinCode}
            onChange={(e) => onChangeJoinCode(e.target.value.toUpperCase())}
            placeholder="Code eingeben"
            className="flex-1 border border-gray-300 px-3 py-2 text-sm tracking-widest uppercase"
          />
          <button
            type="button"
            onClick={onSubmitJoin}
            disabled={joining}
            className="px-3 py-2 text-xs uppercase tracking-widest rounded-none bg-pink-600 hover:bg-pink-500 text-white border border-pink-600 hover:border-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {joining ? 'Verbinde…' : 'VERBINDEN'}
          </button>
        </div>

        {/* Current orgs */}
        <div className="mt-4">
          <div className="text-[10px] tracking-widest text-gray-500 mb-2">AKTUELL VERBUNDEN</div>
          {loadingMyOrgs ? (
            <div className="text-sm text-gray-500">Lade…</div>
          ) : !myOrgs || myOrgs.length === 0 ? (
            <div className="text-sm text-gray-500">Noch keine Verbindung vorhanden.</div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {myOrgs.map((o) => {
                const base = o.userType === 'AGENCY' ? '/agency' : '/club-studio'
                const href = `${base}/${o.id}/${slugify(o.name || o.userType)}`
                return (
                  <li key={o.id} className="border border-gray-200 p-3 flex items-center gap-3">
                    <Link href={href} className="h-10 w-10 bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                      {o.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.avatar} alt={o.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[10px] text-gray-500">Kein Logo</div>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link href={href} className="text-sm font-medium tracking-widest text-gray-900 truncate hover:text-pink-600">
                          {o.name.toUpperCase?.() ?? o.name}
                        </Link>
                        <span className="text-[10px] uppercase tracking-widest border border-gray-300 text-gray-700 px-1 py-0.5">{orgTypeLabel(o.userType)}</span>
                      </div>
                      <div className="text-xs text-gray-500 truncate">{[o.city, o.country].filter(Boolean).join(', ')}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUnlink(o.id)}
                      disabled={unlinking === o.id}
                      className="px-2 py-1 text-[10px] uppercase tracking-widest border border-gray-300 hover:border-pink-500 hover:text-pink-600 disabled:opacity-50"
                    >
                      {unlinking === o.id ? 'Entferne…' : 'Entfernen'}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

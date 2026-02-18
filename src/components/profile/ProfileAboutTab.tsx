'use client'

import { Fragment, useState } from 'react'

type Props = {
  profile: any
  userType: string
}

export default function ProfileAboutTab({ profile, userType }: Props) {
  const [showFullDesc, setShowFullDesc] = useState(false)

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-sm font-light tracking-wide text-gray-500">Noch keine Profilinformationen vorhanden.</p>
      </div>
    )
  }

  // Helpers (duplicated locally to keep this component self-contained)
  const toStr = (v: any) => (v === null || v === undefined) ? '' : String(v).trim()
  const withUnit = (v: any, unit: string) => {
    const s = toStr(v)
    if (!s) return ''
    const low = s.toLowerCase()
    if (low.includes(unit.toLowerCase())) return s
    if (/^\d+(?:[\.,]\d+)?$/.test(s)) return `${s.replace(',', '.') } ${unit}`
    return s
  }
  const formatHeight = (v: any) => withUnit(v, 'cm')
  const formatWeight = (v: any) => withUnit(v, 'kg')
  const formatShoeSize = (v: any) => withUnit(v, 'EU')
  const capitalizeWords = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase())
  const prettifyToken = (v: any): string => {
    const s = toStr(v)
    if (!s) return ''
    if (/^[a-z]$/i.test(s)) return s.toUpperCase()
    return capitalizeWords(s.replace(/[\[\]"]+/g, '').replace(/[_-]+/g, ' ').toLowerCase())
  }
  const parseJsonish = (s: string): any => {
    try {
      const trimmed = s.trim()
      if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
        return JSON.parse(trimmed)
      }
    } catch {}
    return s
  }
  const toArray = (v: any): any[] => {
    if (v === null || v === undefined) return []
    if (Array.isArray(v)) return v
    if (typeof v === 'string') {
      const parsed = parseJsonish(v)
      if (Array.isArray(parsed)) return parsed
      const s = toStr(parsed)
      if (!s) return []
      if (s.includes(',')) return s.split(',').map((x) => x.trim()).filter(Boolean)
      return [s]
    }
    return [v]
  }
  const translateTokenDE = (token: string): string => {
    const t = token.toLowerCase().replace(/[_\-\s]+/g, '')
    const map: Record<string, string> = {
      slim: 'Schlank', petite: 'Zierlich', athletic: 'Athletisch', fit: 'Fit', average: 'Durchschnittlich', curvy: 'Kurvig', bbw: 'Mollig',
      blonde: 'Blond', blond: 'Blond', brunette: 'Brünett', brown: 'Braun', black: 'Schwarz', red: 'Rot', auburn: 'Kupfer', chestnut: 'Kastanienbraun',
      darkbrown: 'Dunkelbraun', lightbrown: 'Hellbraun', grey: 'Grau', gray: 'Grau', silver: 'Silber', dyed: 'Gefärbt', highlights: 'Strähnen',
      short: 'Kurz', medium: 'Mittel', shoulderlength: 'Schulterlang', long: 'Lang', verylong: 'Sehr lang', bob: 'Bob',
      blue: 'Blau', green: 'Grün', hazel: 'Hasel', amber: 'Bernstein',
      natural: 'Natürlich', implants: 'Implantat', implant: 'Implantat', enhanced: 'Vergrößert',
      shaved: 'Rasiert', fullyshaved: 'Komplett rasiert', partiallyshaved: 'Teilrasiert', trimmed: 'Getrimmt', naturalhair: 'Natürlich', landingstrip: 'Landing Strip', brazilian: 'Brasilianisch', waxed: 'Gewaxt',
      ears: 'Ohren', navel: 'Bauchnabel', nipples: 'Brustwarzen', tongue: 'Zunge', nose: 'Nase', lip: 'Lippe', eyebrow: 'Augenbraue', intimate: 'Intim',
      arms: 'Arme', legs: 'Beine', back: 'Rücken', chest: 'Brust', neck: 'Nacken', shoulder: 'Schulter', small: 'Klein', large: 'Groß',
      elegant: 'Elegant', casual: 'Lässig', sexy: 'Sexy', business: 'Business', sporty: 'Sportlich', chic: 'Chic', street: 'Streetwear', classic: 'Klassisch'
    }
    return map[t] || capitalizeWords(token.replace(/[_-]+/g, ' ').toLowerCase())
  }
  const formatEnumListDE = (v: any): string => toArray(v).map((x) => translateTokenDE(String(x))).filter(Boolean).join(', ')
  const badgeElementsDE = (v: any) => {
    const arr = toArray(v)
    return arr.map((x: any, i: number) => (
      <span key={`${String(x)}-${i}`} className="inline-flex items-center px-2.5 py-1 border border-gray-200 bg-gray-50 text-gray-700 text-xs rounded-none">
        {translateTokenDE(String(x))}
      </span>
    ))
  }

  const normalizeDescription = (html: string): string => {
    if (!html) return ''
    let s = String(html)
    s = s
      .replace(/<br\s*\/?>(?=\s|$)/gi, '\n')
      .replace(/<\/?div[^>]*>/gi, '\n')
      .replace(/<\/?p[^>]*>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<\/(li|ul|ol)>/gi, '\n')
      .replace(/<h[1-6][^>]*>/gi, '')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<[^>]+>/g, '')
    s = s
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
    s = s.replace(/\n{3,}/g, '\n\n').trim()
    return s
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {(userType === 'ESCORT') && (
        <div className="bg-gray-50 p-6">
          <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-4">AUSSEHEN</h3>
          <div className="w-12 h-px bg-pink-500 mb-6"></div>
          <div className="space-y-3">
            {profile.height && (
              <div className="text-sm font-light tracking-wide text-gray-700"><strong>Größe:</strong> {formatHeight(profile.height)}</div>
            )}
            {profile.weight && (
              <div className="text-sm font-light tracking-wide text-gray-700"><strong>Gewicht:</strong> {formatWeight(profile.weight)}</div>
            )}
            {profile.bodyType && (
              <div className="text-sm font-light tracking-wide text-gray-700">
                <strong>Körpertyp:</strong>{' '}
                {toArray(profile.bodyType).length > 1 ? (
                  <span className="ml-1 inline-flex flex-wrap gap-2 align-middle">{badgeElementsDE(profile.bodyType)}</span>
                ) : (
                  <span className="ml-1">{formatEnumListDE(profile.bodyType)}</span>
                )}
              </div>
            )}
            {profile.hairColor && (
              <div className="text-sm font-light tracking-wide text-gray-700">
                <strong>Haarfarbe:</strong>{' '}
                {toArray(profile.hairColor).length > 1 ? (
                  <span className="ml-1 inline-flex flex-wrap gap-2 align-middle">{badgeElementsDE(profile.hairColor)}</span>
                ) : (
                  <span className="ml-1">{formatEnumListDE(profile.hairColor)}</span>
                )}
              </div>
            )}
            {profile?.hairLength && (
              <div className="text-sm font-light tracking-wide text-gray-700">
                <strong>Haarlänge:</strong>{' '}
                {toArray(profile.hairLength).length > 1 ? (
                  <span className="ml-1 inline-flex flex-wrap gap-2 align-middle">{badgeElementsDE(profile.hairLength)}</span>
                ) : (
                  <span className="ml-1">{formatEnumListDE(profile.hairLength)}</span>
                )}
              </div>
            )}
            {profile.eyeColor && (
              <div className="text-sm font-light tracking-wide text-gray-700">
                <strong>Augenfarbe:</strong>{' '}
                {toArray(profile.eyeColor).length > 1 ? (
                  <span className="ml-1 inline-flex flex-wrap gap-2 align-middle">{badgeElementsDE(profile.eyeColor)}</span>
                ) : (
                  <span className="ml-1">{formatEnumListDE(profile.eyeColor)}</span>
                )}
              </div>
            )}
            {(profile?.breastType || profile?.breastSize || profile?.cupSize) && (() => {
              const sizeRaw = toStr(profile?.breastSize || profile?.cupSize)
              const cupOrSize = sizeRaw ? (/^[a-z]$/i.test(sizeRaw) ? sizeRaw.toUpperCase() : prettifyToken(sizeRaw)) : ''
              const typeRaw = profile?.breastType
              const tokens = [cupOrSize, typeRaw].filter(Boolean)
              return (
                <div className="text-sm font-light tracking-wide text-gray-700">
                  <strong>Brust:</strong>{' '}
                  <span className="ml-1 inline-flex flex-wrap gap-2 align-middle">{badgeElementsDE(tokens)}</span>
                </div>
              )
            })()}
            {(profile?.intimateArea || profile?.pubicHair || profile?.intimateStyle) && (() => {
              const arr = [
                ...toArray(profile?.intimateArea),
                ...toArray(profile?.pubicHair),
                ...toArray(profile?.intimateStyle),
              ].filter(Boolean)
              return (
                <div className="text-sm font-light tracking-wide text-gray-700">
                  <strong>Intimbereich:</strong>{' '}
                  {arr.length > 1 ? (
                    <span className="ml-1 inline-flex flex-wrap gap-2 align-middle">{badgeElementsDE(arr)}</span>
                  ) : (
                    <span className="ml-1">{formatEnumListDE(arr)}</span>
                  )}
                </div>
              )
            })()}
            {(profile?.piercings !== undefined && profile?.piercings !== null) && (
              <div className="text-sm font-light tracking-wide text-gray-700">
                <strong>Piercings:</strong>{' '}
                {typeof profile.piercings === 'boolean' ? (
                  <span className="ml-1">{profile.piercings ? 'Ja' : 'Nein'}</span>
                ) : toArray(profile.piercings).length > 1 ? (
                  <span className="ml-1 inline-flex flex-wrap gap-2 align-middle">{badgeElementsDE(profile.piercings)}</span>
                ) : (
                  <span className="ml-1">{formatEnumListDE(profile.piercings)}</span>
                )}
              </div>
            )}
            {(profile?.tattoos !== undefined && profile?.tattoos !== null) && (
              <div className="text-sm font-light tracking-wide text-gray-700">
                <strong>Tätowierungen:</strong>{' '}
                {typeof profile.tattoos === 'boolean' ? (
                  <span className="ml-1">{profile.tattoos ? 'Ja' : 'Nein'}</span>
                ) : toArray(profile.tattoos).length > 1 ? (
                  <span className="ml-1 inline-flex flex-wrap gap-2 align-middle">{badgeElementsDE(profile.tattoos)}</span>
                ) : (
                  <span className="ml-1">{formatEnumListDE(profile.tattoos)}</span>
                )}
              </div>
            )}
            {profile?.clothingStyle && (
              <div className="text-sm font-light tracking-wide text-gray-700">
                <strong>Kleidungsstil:</strong>{' '}
                {toArray(profile.clothingStyle).length > 1 ? (
                  <span className="ml-1 inline-flex flex-wrap gap-2 align-middle">{badgeElementsDE(profile.clothingStyle)}</span>
                ) : (
                  <span className="ml-1">{formatEnumListDE(profile.clothingStyle)}</span>
                )}
              </div>
            )}
            {profile?.dressSize && (
              <div className="text-sm font-light tracking-wide text-gray-700">
                <strong>Kleidergröße:</strong>{' '}
                {toArray(profile.dressSize).length > 1 ? (
                  <span className="ml-1 inline-flex flex-wrap gap-2 align-middle">{badgeElementsDE(profile.dressSize)}</span>
                ) : (
                  <span className="ml-1">{formatEnumListDE(profile.dressSize)}</span>
                )}
              </div>
            )}
            {profile?.shoeSize && (
              <div className="text-sm font-light tracking-wide text-gray-700"><strong>Schuhgröße:</strong> {formatShoeSize(profile.shoeSize)}</div>
            )}
          </div>
        </div>
      )}

      {profile?.description && (
        <div className="bg-gray-50 p-6">
          <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-4">BESCHREIBUNG</h3>
          <div className="w-12 h-px bg-pink-500 mb-6"></div>
          {(() => {
            const full = normalizeDescription(profile.description as string)
            const LIMIT = 600
            const isLong = full.length > LIMIT
            const shown = showFullDesc || !isLong ? full : full.slice(0, LIMIT).trimEnd() + '…'
            return (
              <Fragment>
                <pre className="text-sm font-light tracking-wide text-gray-700 leading-relaxed whitespace-pre-wrap">{shown}</pre>
                {isLong && (
                  <button
                    type="button"
                    onClick={() => setShowFullDesc((v) => !v)}
                    className="mt-3 text-xs font-light tracking-widest uppercase text-pink-500 hover:text-pink-600"
                  >
                    {showFullDesc ? 'WENIGER ANZEIGEN' : 'WEITER LESEN'}
                  </button>
                )}
              </Fragment>
            )
          })()}
        </div>
      )}
    </div>
  )
}

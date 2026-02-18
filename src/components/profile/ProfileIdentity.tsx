'use client'

import { MapPin, Calendar, Globe, Phone } from 'lucide-react'
import { getGenderDisplayName } from '@/lib/validations'
import { useMemo } from 'react'
import LANGUAGES_DE from '@/data/languages.de'
import COUNTRIES_DE from '@/data/countries.de'
import * as Tooltip from '@radix-ui/react-tooltip'

type Profile = any

type Props = {
  displayName: string
  userTypeLabel: string
  profile: Profile | null | undefined
  formattedLocation: string
  isOwnProfile: boolean
}

export default function ProfileIdentity({ displayName, userTypeLabel, profile, formattedLocation, isOwnProfile }: Props) {
  const langMap = useMemo(() => {
    const map: Record<string, string> = {}
    LANGUAGES_DE.forEach(({ value, label }) => {
      map[String(value).toLowerCase()] = label
    })
    return map
  }, [])

  const countryMap = useMemo(() => {
    const map: Record<string, string> = {}
    COUNTRIES_DE.forEach(({ value, label }) => {
      map[String(value).toUpperCase()] = label
    })
    return map
  }, [])

  // Normalizes possible JSON string inputs like '["EE"]' or '"EE"' or comma-separated strings into a string array
  const normalizeToArray = (val: unknown): string[] => {
    if (Array.isArray(val)) return val.map((v) => String(v))
    if (typeof val === 'string') {
      const s = val.trim()
      // Try JSON parse first if looks like JSON
      if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('"') && s.endsWith('"'))) {
        try {
          const parsed = JSON.parse(s)
          if (Array.isArray(parsed)) return parsed.map((v: any) => String(v))
          if (typeof parsed === 'string') return [parsed]
        } catch {
          // If JSON.parse fails but looks like a bracketed list, try manual parsing
          if (s.startsWith('[') && s.endsWith(']')) {
            const inner = s.slice(1, -1)
            const parts = inner
              .split(',')
              .map((p) => p.trim().replace(/^['"]|['"]$/g, ''))
              .filter(Boolean)
            if (parts.length) return parts
          }
        }
      }
      // Fallbacks: comma separated or single value
      if (s.includes(',')) return s.split(',').map((v) => v.trim()).filter(Boolean)
      return s ? [s] : []
    }
    return []
  }
  return (
    <div className="flex-1 space-y-6">
      <div>
        <h1 className="text-3xl font-thin tracking-wider text-gray-800">{displayName}</h1>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs font-light tracking-widest text-pink-500 uppercase px-3 py-1 border border-pink-200">
            {userTypeLabel}
          </span>
          {profile?.slogan && (
            <span className="text-sm font-light tracking-wide text-gray-600 italic">{profile.slogan}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {profile?.age && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="font-light tracking-wide text-gray-700">{profile.age} Jahre alt</span>
          </div>
        )}

        {profile?.gender && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">♀♂</span>
            <span className="font-light tracking-wide text-gray-700">{getGenderDisplayName(profile.gender)}</span>
          </div>
        )}

        {formattedLocation && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="font-light tracking-wide text-gray-700">{formattedLocation}</span>
          </div>
        )}

        {(() => {
          const natList = normalizeToArray(profile?.nationality)
          const natLabel = natList
            .map((code: string) => countryMap[String(code).toUpperCase()] || String(code).toUpperCase())
            .join(', ')
          if (!natLabel) return null
          return (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-500" />
              <span className="font-light tracking-wide text-gray-700">{natLabel}</span>
            </div>
          )
        })()}

        {profile?.website && (
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-500" />
            <a href={profile.website} target="_blank" rel="noopener noreferrer" 
               className="font-light tracking-wide text-pink-500 hover:text-pink-600 transition-colors">
              Webseite
            </a>
          </div>
        )}

        {profile?.phone && isOwnProfile && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-500" />
            <span className="font-light tracking-wide text-gray-700">{profile.phone}</span>
          </div>
        )}
      </div>

      {normalizeToArray(profile?.languages).length > 0 && (
        <div>
          <h4 className="text-sm font-light tracking-widest text-gray-800 uppercase mb-3">SPRACHEN</h4>
          <Tooltip.Provider delayDuration={100}>
            <div className="flex flex-wrap gap-2">
              {normalizeToArray(profile?.languages).map((lang: string) => {
                const code = String(lang).toLowerCase()
                const label = langMap[code] || String(lang)
                return (
                  <Tooltip.Root key={lang}>
                    <Tooltip.Trigger asChild>
                      <span
                        className="text-xs font-light tracking-widest text-gray-600 border border-gray-200 px-3 py-1 uppercase cursor-help"
                        aria-label={label}
                      >
                        {code.toUpperCase()}
                      </span>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content sideOffset={6} className="rounded bg-gray-900 text-white px-2 py-1 text-xs shadow-md">
                        {label}
                        <Tooltip.Arrow className="fill-gray-900" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                )
              })}
            </div>
          </Tooltip.Provider>
        </div>
      )}

      {profile?.bio && (
        <div>
          <h4 className="text-sm font-light tracking-widest text-gray-800 uppercase mb-3">ÜBER MICH</h4>
          <p className="text-sm font-light tracking-wide text-gray-700 leading-relaxed">{profile.bio}</p>
        </div>
      )}
    </div>
  )
}

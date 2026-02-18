import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type LocationLike = {
  city?: string | null
  country?: string | null
  zipCode?: string | null
  address?: string | null
  location?: string | null
} | null | undefined

export function formatLocation(src: LocationLike): string {
  if (!src) return ''
  const city = (src.city || '').trim()
  const country = (src.country || '').trim()
  const zip = (src.zipCode || '').trim()
  // Prefer structured City, Country. Include ZIP if present and not redundant
  if (city || country) {
    const cityPart = zip ? `${zip} ${city}`.trim() : city
    return [cityPart, country].filter(Boolean).join(', ')
  }
  // Fallback to legacy free-text location
  const legacy = (src.location || '').trim()
  return legacy
}

export type EscortItem = {
  id: string
  name: string | null
  city: string | null
  country: string | null
  image: string | null
  createdAt?: string | null
  visibility?: 'PUBLIC' | 'VERIFIED' | 'PRIVATE'
  isVerified?: boolean
  isAgeVerified?: boolean
  // Optional highlight flags for homepage badges
  isEscortOfWeek?: boolean
  isEscortOfMonth?: boolean
  badges?: string[]
  // Optional geolocation for map view
  latitude?: number | null
  longitude?: number | null
  locationFormatted?: string | null
  // Extra info for richer list cards
  age?: number | null
  slogan?: string | null
  languages?: string[]
  services?: string[]
  // Additional image URLs (excluding the primary image)
  gallery?: string[]
}

export type EscortFilters = {
  height?: string
  weight?: string
  breastType?: string
  breastSize?: string
  eyeColor?: string
  hairColor?: string
  hairLength?: string
  clothingStyle?: string
  clothingSize?: string
  // Additional onboarding-related filters
  ageMin?: string
  ageMax?: string
  gender?: string
  nationality?: string[]
  languages?: string[]
  services?: string[]
}

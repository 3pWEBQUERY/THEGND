export type AgencyItem = {
  id: string
  name: string | null
  city: string | null
  country: string | null
  image: string | null
  description?: string | null
  businessType?: string | null
  visibility?: 'PUBLIC' | 'VERIFIED' | 'PRIVATE'
  isVerified?: boolean
}

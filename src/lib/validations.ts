import { z } from 'zod'
import { UserType, Gender } from '@prisma/client'

// Auth Schemas
export const signUpSchema = z.object({
  email: z.string().email('Ungültige Email-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben'),
  userType: z.enum(['MEMBER', 'ESCORT', 'HOBBYHURE', 'AGENCY', 'CLUB', 'STUDIO'])
})

export const signInSchema = z.object({
  email: z.string().email('Ungültige Email-Adresse'),
  password: z.string().min(1, 'Passwort ist erforderlich')
})

// Onboarding Schemas
export const memberOnboardingSchema = z.object({
  displayName: z.string().min(2, 'Name muss mindestens 2 Zeichen haben').optional(),
  age: z.number().min(18, 'Mindestalter ist 18').max(100).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'OTHER']).optional(),
  location: z.string().optional(),
  bio: z.string().max(500, 'Bio darf maximal 500 Zeichen haben').optional(),
  preferences: z.string().optional()
})

export const escortOnboardingStep1Schema = z.object({
  displayName: z.string().min(2, 'Anzeigename muss mindestens 2 Zeichen haben'),
  slogan: z.string().max(100, 'Slogan darf maximal 100 Zeichen haben').optional(),
  age: z.number().min(18, 'Mindestalter ist 18').max(100),
  gender: z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'OTHER']),
  nationality: z.array(z.string()).min(1, 'Mindestens eine Nationalität ist erforderlich'),
  languages: z.array(z.string()).min(1, 'Mindestens eine Sprache ist erforderlich')
})

export const escortOnboardingStep2Schema = z.object({
  height: z.string().optional(),
  weight: z.string().optional(),
  bodyType: z.string().optional(),
  hairColor: z.string().optional(),
  hairLength: z.string().optional(),
  breastType: z.string().optional(),
  breastSize: z.string().optional(),
  intimateArea: z.string().optional(),
  piercings: z.array(z.string()).optional(),
  tattoos: z.array(z.string()).optional(),
  clothingStyle: z.string().optional(),
  clothingSize: z.string().optional(),
  shoeSize: z.string().optional(),
  eyeColor: z.string().optional()
})

export const escortOnboardingStep3Schema = z.object({
  description: z.string().min(50, 'Beschreibung muss mindestens 50 Zeichen haben'),
  services: z.array(z.string()).optional()
})

// accept absolute http(s) URLs or site-relative paths like /uploads/...
const urlOrPath = z
  .string()
  .refine((v) => /^https?:\/\//i.test(v) || v.startsWith('/'), {
    message: 'Ungültige URL oder Pfad'
  })

export const escortOnboardingStep4Schema = z.object({
  gallery: z.array(urlOrPath).max(30, 'Maximal 30 Medien erlaubt').optional(),
  media: z.array(z.object({
    url: urlOrPath,
    filename: z.string(),
    type: z.string(),
    mediaType: z.enum(['image','video']),
    size: z.number().nonnegative(),
  })).max(30, 'Maximal 30 Medien erlaubt').optional()
}).refine((data) => !!(data.gallery && data.gallery.length) || !!(data.media && data.media.length), {
  message: 'Bitte füge mindestens ein Medium hinzu.'
})

export const escortOnboardingStep5Schema = z.object({
  services: z.array(z.string()).min(1, 'Wähle mindestens einen Service')
})

// E.164-ähnliches Format: optionales +, 8-15 Ziffern, keine führende 0
const phoneRegex = /^\+?[1-9]\d{7,14}$/
const normalizePhone = (v: string) => v.replace(/[\s().-]/g, '')

export const escortOnboardingStep6Schema = z.object({
  phone: z
    .string()
    .refine((v) => phoneRegex.test(normalizePhone(v)), {
      message: 'Bitte gib eine gültige internationale Telefonnummer an (z. B. +491701234567).'
    }),
  website: z.string().url('Ungültige Website URL').optional(),
  socialMedia: z
    .record(z.string(), z.string())
    .superRefine((val, ctx) => {
      const entries = Object.entries(val)
      if (entries.length > 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Maximal 10 Social-Links erlaubt.'
        })
      }
      for (const [key, raw] of entries) {
        if (key.toLowerCase() === 'whatsapp') {
          const cleaned = normalizePhone(raw)
          if (!phoneRegex.test(cleaned)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [key],
              message: 'WhatsApp erfordert eine gültige Telefonnummer (z. B. +491701234567), keine URL.'
            })
          }
        } else {
          try {
            // eslint-disable-next-line no-new
            new URL(raw)
          } catch {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [key],
              message: 'Bitte gib eine gültige URL an.'
            })
          }
        }
      }
    })
    .optional()
})

export const escortOnboardingStep7Schema = z.object({
  address: z.string().min(5, 'Adresse ist erforderlich'),
  city: z.string().min(2, 'Stadt ist erforderlich'),
  state: z.string().optional(),
  country: z.string().min(2, 'Land ist erforderlich'),
  zipCode: z.string().min(2, 'PLZ ist erforderlich').max(20).optional(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      placeId: z.string().optional(),
      formattedAddress: z.string().optional(),
    })
    .optional(),
})

// Agency/Club/Studio Schemas
export const businessOnboardingSchema = z.object({
  companyName: z.string().min(2, 'Firmenname ist erforderlich'),
  businessType: z.string().min(2, 'Geschäftstyp ist erforderlich'),
  description: z.string().min(50, 'Beschreibung muss mindestens 50 Zeichen haben'),
  address: z.string().min(5, 'Adresse ist erforderlich'),
  city: z.string().min(2, 'Stadt ist erforderlich'),
  country: z.string().min(2, 'Land ist erforderlich'),
  zipCode: z.string().min(3, 'PLZ ist erforderlich'),
  phone: z.string().min(10, 'Telefonnummer ist erforderlich'),
  website: z.string().url('Ungültige Website URL').optional(),
  established: z.date().optional()
})

// Business step-by-step variants used by AGENCY/CLUB/STUDIO
export const businessOnboardingStep1Schema = z.object({
  companyName: z.string().min(2, 'Firmenname ist erforderlich'),
  businessType: z.string().min(2, 'Geschäftstyp ist erforderlich'),
  openingHours: z
    .record(
      z.enum(['mon','tue','wed','thu','fri','sat','sun']),
      z.array(z.object({ from: z.string(), to: z.string() }))
    )
    .optional(),
})

export const businessOnboardingStep2Schema = z.object({
  address: z.string().min(5, 'Adresse ist erforderlich'),
  city: z.string().min(2, 'Stadt ist erforderlich'),
  country: z.string().min(2, 'Land ist erforderlich'),
  phone: z
    .string()
    .refine((v) => phoneRegex.test(normalizePhone(v)), {
      message: 'Bitte gib eine gültige internationale Telefonnummer an (z. B. +491701234567).'
    }),
})

export const businessOnboardingStep3Schema = z.object({
  description: z.string().min(50, 'Beschreibung muss mindestens 50 Zeichen haben'),
})

// Business/Agency/Club/Studio Step 4–7 Schemas (mirror escort where applicable)
// Accept absolute http(s) URLs or site-relative paths for logo and gallery/media
export const businessOnboardingStep4Schema = z.object({
  logo: urlOrPath.optional(),
  gallery: z.array(urlOrPath).max(30, 'Maximal 30 Medien erlaubt').optional(),
  media: z.array(z.object({
    url: urlOrPath,
    filename: z.string(),
    type: z.string(),
    mediaType: z.enum(['image','video']),
    size: z.number().nonnegative(),
  })).max(30, 'Maximal 30 Medien erlaubt').optional(),
}).refine((data) => !!data.logo || !!(data.gallery && data.gallery.length) || !!(data.media && data.media.length), {
  message: 'Bitte füge mindestens ein Logo oder ein Medium hinzu.'
})

export const businessOnboardingStep5Schema = z.object({
  services: z.array(z.string()).min(1, 'Wähle mindestens einen Service')
})

export const businessOnboardingStep6Schema = z.object({
  phone: z
    .string()
    .refine((v) => phoneRegex.test(normalizePhone(v)), {
      message: 'Bitte gib eine gültige internationale Telefonnummer an (z. B. +491701234567).'
    }),
  website: z.string().url('Ungültige Website URL').optional(),
  socialMedia: z
    .record(z.string(), z.string())
    .superRefine((val, ctx) => {
      const entries = Object.entries(val)
      if (entries.length > 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Maximal 10 Social-Links erlaubt.'
        })
      }
      for (const [key, raw] of entries) {
        if (key.toLowerCase() === 'whatsapp') {
          const cleaned = normalizePhone(raw)
          if (!phoneRegex.test(cleaned)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [key],
              message: 'WhatsApp erfordert eine gültige Telefonnummer (z. B. +491701234567), keine URL.'
            })
          }
        } else {
          try {
            // eslint-disable-next-line no-new
            new URL(raw)
          } catch {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [key],
              message: 'Bitte gib eine gültige URL an.'
            })
          }
        }
      }
    })
    .optional()
})

export const businessOnboardingStep7Schema = z.object({
  address: z.string().min(5, 'Adresse ist erforderlich'),
  city: z.string().min(2, 'Stadt ist erforderlich'),
  state: z.string().optional(),
  country: z.string().min(2, 'Land ist erforderlich'),
  zipCode: z.string().min(2, 'PLZ ist erforderlich').max(20).optional(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      placeId: z.string().optional(),
      formattedAddress: z.string().optional(),
    })
    .optional(),
})

// Post Schema
export const createPostSchema = z
  .object({
    content: z.string().max(2000, 'Maximal 2000 Zeichen').optional(),
    images: z.array(urlOrPath).max(5, 'Maximal 5 Bilder pro Post').optional()
  })
  .refine((data) => {
    const hasText = !!data.content && data.content.trim().length > 0
    const hasImages = !!data.images && data.images.length > 0
    return hasText || hasImages
  }, {
    message: 'Bitte gib Text ein oder füge mindestens ein Bild hinzu.',
    path: ['content']
  })

// Story Schema
export const createStorySchema = z.object({
  content: z.string().min(1, 'Inhalt ist erforderlich').max(500, 'Maximal 500 Zeichen'),
  image: z.string().url('Ungültige Bild URL').optional(),
  video: z.string().url('Ungültige Video URL').optional()
})

// Message Schema
export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Nachricht darf nicht leer sein').max(1000, 'Maximal 1000 Zeichen'),
  receiverId: z.string().cuid('Ungültige Empfänger ID')
})

// Utility functions
export const getUserTypeDisplayName = (userType: UserType): string => {
  const typeMap = {
    MEMBER: 'Mitglied',
    ESCORT: 'Escort',
    HOBBYHURE: 'Hobbyhure',
    AGENCY: 'Agentur',
    CLUB: 'Club',
    STUDIO: 'Studio'
  }
  return typeMap[userType]
}

export const getProfileUrl = (opts: { id: string; userType: string; displayName?: string | null }): string => {
  const slug = (opts.displayName || 'profil')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  switch (opts.userType) {
    case 'ESCORT':
    case 'HOBBYHURE':
      return `/escorts/${opts.id}/${slug}`
    case 'AGENCY':
      return `/agency/${opts.id}/${slug}`
    case 'CLUB':
    case 'STUDIO':
      return `/club-studio/${opts.id}/${slug}`
    case 'MEMBER':
    default:
      return `/members/${opts.id}/${slug}`
  }
}

export const getGenderDisplayName = (gender: Gender): string => {
  const genderMap = {
    MALE: 'Männlich',
    FEMALE: 'Weiblich',
    NON_BINARY: 'Non-Binary',
    OTHER: 'Andere'
  }
  return genderMap[gender]
}

export const canCreateStories = (userType: UserType): boolean => {
  return userType !== 'MEMBER'
}

export const formatTimeAgo = (date: Date): string => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Gerade eben'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`
  
  return date.toLocaleDateString('de-DE')
}
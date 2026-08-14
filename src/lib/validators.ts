import { z } from "zod";
import { istSprachcode } from "@/lib/languages";

/**
 * Medien-Adressen können zweierlei Form haben:
 *   • app-relativ  `/media/<key>`  — Standard, da Railway Buckets privat sind
 *   • absolut      `https://…`     — wenn ein CDN mit öffentlichem Lesezugriff davorhängt
 * `z.string().url()` würde die relative Variante ablehnen.
 */
export const mediaUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => /^\/media\/[^\s]+$/.test(value) || /^https?:\/\/[^\s]+$/.test(value), {
    message: "Ungültige Medien-Adresse.",
  });

export const emailSchema = z.string().trim().toLowerCase().email("Bitte gib eine gültige E-Mail-Adresse ein.");

export const passwordSchema = z
  .string()
  .min(8, "Mindestens 8 Zeichen.")
  .max(100, "Höchstens 100 Zeichen.")
  .regex(/[a-zA-Z]/, "Mindestens ein Buchstabe.")
  .regex(/[0-9]/, "Mindestens eine Ziffer.");

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    passwordConfirm: z.string(),
    displayName: z.string().trim().min(2, "Mindestens 2 Zeichen.").max(40),
    role: z.enum(["MEMBER", "ESCORT", "AGENCY"]).default("MEMBER"),
    ageConfirmed: z.literal(true, { errorMap: () => ({ message: "Bitte bestätige, dass du 18+ bist." }) }),
    termsAccepted: z.literal(true, { errorMap: () => ({ message: "Bitte akzeptiere die AGB." }) }),
    newsletter: z.boolean().optional().default(false),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Passwörter stimmen nicht überein.",
    path: ["passwordConfirm"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Bitte gib dein Passwort ein."),
  remember: z.boolean().optional(),
});

export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = z
  .object({
    token: z.string().min(10),
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Passwörter stimmen nicht überein.",
    path: ["passwordConfirm"],
  });

// ── Profil ───────────────────────────────────────────────────────────────────

const optionalString = (max = 255) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

const optionalInt = (min: number, max: number) =>
  z.coerce
    .number()
    .int()
    .min(min)
    .max(max)
    .optional()
    .or(z.literal("").transform(() => undefined));

export const profileBasicsSchema = z.object({
  displayName: z.string().trim().min(2, "Mindestens 2 Zeichen.").max(40),
  headline: optionalString(90),
  about: z.string().trim().max(5000).optional(),
  gender: z.enum(["FEMALE", "MALE", "TRANS_FEMALE", "TRANS_MALE", "NON_BINARY", "COUPLE"]),
  kind: z.enum(["INDEPENDENT", "AGENCY_MODEL", "AGENCY", "CLUB", "STUDIO", "MASSAGE", "TRANS", "COUPLE"]),
  orientation: z.enum(["HETERO", "HOMO", "BI", "PAN", "ASK"]).optional(),
  birthDate: z.string().optional(),
  nationality: optionalString(60),
});

export const profileAppearanceSchema = z.object({
  heightCm: optionalInt(120, 230),
  weightKg: optionalInt(35, 250),
  bodyType: z.enum(["SLIM", "ATHLETIC", "AVERAGE", "CURVY", "BBW", "MUSCULAR"]).optional(),
  cupSize: optionalString(4),
  breastType: z.enum(["NATURAL", "SILICONE"]).optional(),
  dressSize: optionalString(4),
  shoeSize: optionalString(4),
  hairColor: z.enum(["BLONDE", "BROWN", "BLACK", "RED", "GREY", "COLORED", "BALD"]).optional(),
  hairLength: z.enum(["SHORT", "MEDIUM", "LONG"]).optional(),
  eyeColor: z.enum(["BLUE", "GREEN", "BROWN", "GREY", "HAZEL", "BLACK"]).optional(),
  ethnicity: z.enum(["EUROPEAN", "LATIN", "ASIAN", "AFRICAN", "ARABIC", "MIXED", "OTHER"]).optional(),
  pubicHair: z.enum(["SHAVED", "TRIMMED", "NATURAL", "PARTIAL"]).optional(),
  smoker: z.enum(["NO", "OCCASIONALLY", "YES"]).optional(),
  tattoos: z.boolean().optional(),
  piercings: z.boolean().optional(),
});

export const profileContactSchema = z.object({
  phone: optionalString(30),
  showPhone: z.boolean().optional(),
  whatsapp: optionalString(30),
  telegram: optionalString(40),
  website: optionalString(120),
  instagram: optionalString(40),
  onlyfans: optionalString(80),
  contactNote: optionalString(300),
});

export const profileLocationSchema = z.object({
  cityId: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional().nullable(),
  lng: z.coerce.number().min(-180).max(180).optional().nullable(),
  district: optionalString(60),
  zip: optionalString(10),
  street: optionalString(120),
  showAddress: z.boolean().optional(),
  radiusKm: optionalInt(0, 500),
  meetingPlace: z.enum(["INCALL", "OUTCALL", "BOTH"]),
  travelsWorldwide: z.boolean().optional(),
});

export const profilePricingSchema = z.object({
  // Start ausschliesslich in der Schweiz — weitere Währungen später.
  currency: z.literal("CHF").default("CHF"),
  priceHalfHour: optionalInt(0, 100000),
  priceHour: optionalInt(0, 100000),
  priceTwoHours: optionalInt(0, 100000),
  priceNight: optionalInt(0, 1000000),
  priceNote: z.string().trim().max(1000).optional(),
});

// ── Interaktion ──────────────────────────────────────────────────────────────

export const messageSchema = z
  .object({
    conversationId: z.string().optional(),
    recipientId: z.string().optional(),
    body: z.string().trim().max(4000).default(""),
    attachmentUrl: mediaUrlSchema.optional(),
    attachmentType: z.enum(["IMAGE", "VIDEO"]).optional(),
  })
  // Ein reiner Medien-Versand ohne Text ist erlaubt.
  .refine((d) => d.body.length > 0 || Boolean(d.attachmentUrl), {
    message: "Nachricht darf nicht leer sein.",
    path: ["body"],
  });

export const reviewSchema = z.object({
  profileId: z.string(),
  rating: z.coerce.number().int().min(1).max(5),
  ratingLooks: z.coerce.number().int().min(1).max(5).optional(),
  ratingService: z.coerce.number().int().min(1).max(5).optional(),
  ratingCharm: z.coerce.number().int().min(1).max(5).optional(),
  ratingHygiene: z.coerce.number().int().min(1).max(5).optional(),
  ratingValue: z.coerce.number().int().min(1).max(5).optional(),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(40, "Bitte schreibe mindestens 40 Zeichen.").max(4000),
  metAt: z.string().optional(),
});

export const bookingSchema = z.object({
  profileId: z.string(),
  date: z.string().min(1, "Bitte Datum wählen."),
  time: z.string().min(1, "Bitte Uhrzeit wählen."),
  minutes: z.coerce.number().int().min(30).max(1440),
  place: z.enum(["INCALL", "OUTCALL", "BOTH"]),
  address: z.string().trim().max(200).optional(),
  note: z.string().trim().max(1000).optional(),
});

export const reportSchema = z.object({
  targetType: z.enum(["PROFILE", "REVIEW", "MESSAGE", "POST", "USER"]),
  targetId: z.string(),
  reason: z.enum(["FAKE", "SPAM", "ILLEGAL", "UNDERAGE", "HARASSMENT", "COPYRIGHT", "TRAFFICKING", "OTHER"]),
  details: z.string().trim().max(2000).optional(),
});

export const postSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  mediaUrl: mediaUrlSchema.optional(),
  visibility: z.enum(["PUBLIC", "FOLLOWERS", "PAID"]).default("PUBLIC"),
  unlockCost: z.coerce.number().int().min(0).max(500).default(0),
});

export const searchParamsSchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  gender: z.string().optional(),
  kind: z.string().optional(),
  service: z.union([z.string(), z.array(z.string())]).optional(),
  lang: z.union([z.string(), z.array(z.string())]).optional(),
  ageMin: z.coerce.number().int().min(18).max(99).optional(),
  ageMax: z.coerce.number().int().min(18).max(99).optional(),
  priceMin: z.coerce.number().int().min(0).optional(),
  priceMax: z.coerce.number().int().min(0).optional(),
  heightMin: z.coerce.number().int().optional(),
  heightMax: z.coerce.number().int().optional(),
  body: z.string().optional(),
  hair: z.string().optional(),
  ethnicity: z.string().optional(),
  cup: z.string().optional(),
  place: z.string().optional(),
  verified: z.string().optional(),
  online: z.string().optional(),
  withVideo: z.string().optional(),
  withReviews: z.string().optional(),
  smoker: z.string().optional(),
  tattoos: z.string().optional(),
  sort: z.string().optional(),
  page: z.coerce.number().int().min(1).max(500).optional(),
  // Umkreissuche: Mittelpunkt, Radius und der angezeigte Ortsname.
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().int().min(1).max(300).optional(),
  ort: z.string().max(120).optional(),
  // Auch Profile einbeziehen, deren eigener Anfahrtsradius bis hierher reicht.
  anfahrt: z.string().optional(),
  ansicht: z.enum(["liste", "karte"]).optional(),
});

export type SearchQuery = z.infer<typeof searchParamsSchema>;

/** Suchparameter der Agentur-/Clubsuche. */
export const agencySearchSchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  kind: z.string().optional(),
  service: z.union([z.string(), z.array(z.string())]).optional(),
  lang: z.union([z.string(), z.array(z.string())]).optional(),
  verified: z.string().optional(),
  open: z.string().optional(),
  withModels: z.string().optional(),
  priceMax: z.coerce.number().int().min(0).optional(),
  // Ausstattung — Kommaliste aus AGENCY_AMENITIES.
  amenity: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().int().min(1).max(300).optional(),
  ort: z.string().max(120).optional(),
  sort: z.string().optional(),
  page: z.coerce.number().int().min(1).max(500).optional(),
  ansicht: z.enum(["liste", "karte"]).optional(),
});

export type AgencySearchQuery = z.infer<typeof agencySearchSchema>;

/**
 * Leerbare Felder.
 *
 * `optionalString` macht aus "" ein `undefined` — und `undefined` heisst bei
 * Prisma „nicht ändern“. Ein geleertes Feld bliebe damit stehen. Für alles,
 * was sich wieder entfernen lassen muss, wird "" deshalb zu `null`.
 */
const clearableString = (max = 255) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v == null || v === "" ? null : v));

const clearableMediaUrl = z
  .union([z.literal(""), z.null(), mediaUrlSchema])
  .optional()
  .transform((v) => (v == null || v === "" ? null : v));

const clearableInt = (min: number, max: number) =>
  z
    .union([z.literal(""), z.null(), z.coerce.number().int().min(min).max(max)])
    .optional()
    .transform((v) => (v == null || v === "" ? null : v));

/** Persönliches Profil eines Kontos — Name, Bild, Sprache. */
export const memberProfileSchema = z.object({
  displayName: z.string().trim().min(2, "Mindestens 2 Zeichen.").max(40),
  avatarUrl: clearableMediaUrl,
  locale: z
    .string()
    .trim()
    .toLowerCase()
    .refine(istSprachcode, "Unbekannte Sprache.")
    .default("de"),
});

/** Willkommensschritt eines Mitgliedskontos. */
export const memberOnboardingSchema = z.object({
  displayName: z.string().trim().min(2, "Mindestens 2 Zeichen.").max(40),
  avatarUrl: clearableMediaUrl,
  locale: z
    .string()
    .trim()
    .toLowerCase()
    .refine(istSprachcode, "Unbekannte Sprache.")
    .default("de"),
  newsletterOptIn: z.boolean().optional(),
  marketingOptIn: z.boolean().optional(),
});

/** Prüfantrag eines Hauses. */
export const agencyVerificationSchema = z.object({
  legalName: z.string().trim().min(2, "Bitte die Firmierung angeben.").max(160),
  uid: optionalString(30),
  contactName: z.string().trim().min(2, "Bitte die verantwortliche Person angeben.").max(120),
  contactRole: optionalString(80),
  // Objektschlüssel aus dem Upload, keine öffentlichen URLs.
  registryKey: z.string().trim().min(3, "Bitte einen Nachweis hochladen.").max(300),
  permitKey: optionalString(300),
  idKey: z.string().trim().min(3, "Bitte den Ausweis hochladen.").max(300),
});

/** Pflege einer Agentur / eines Hauses im Admin. */
export const agencySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, "Bitte eine Adresse (Slug) angeben.")
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Nur Kleinbuchstaben, Ziffern und Bindestriche."),
  name: z.string().trim().min(2, "Bitte einen Namen angeben.").max(120),
  kind: z.enum(["AGENCY", "CLUB", "STUDIO", "MASSAGE", "SAUNA", "BAR"]),
  headline: clearableString(160),
  about: clearableString(5000),
  logoUrl: clearableMediaUrl,
  coverUrl: clearableMediaUrl,
  website: clearableString(200),
  phone: clearableString(40),
  whatsapp: clearableString(40),
  email: clearableString(160),
  street: clearableString(120),
  zip: clearableString(10),
  district: clearableString(60),
  cityId: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional().nullable(),
  lng: z.coerce.number().min(-180).max(180).optional().nullable(),
  priceFrom: clearableInt(0, 100000),
  isOpen24h: z.boolean().optional(),
  hasParking: z.boolean().optional(),
  hasBar: z.boolean().optional(),
  acceptsCards: z.boolean().optional(),
  barrierFree: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

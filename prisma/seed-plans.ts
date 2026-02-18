/**
 * Seed membership plans per UserType into the database.
 *
 * Run with:  npx tsx prisma/seed-plans.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type PlanSeed = {
  key: 'BASIS' | 'PLUS' | 'PREMIUM'
  userType: 'MEMBER' | 'ESCORT' | 'HOBBYHURE' | 'AGENCY' | 'CLUB' | 'STUDIO'
  name: string
  description: string
  priceCents: number
  features: string // JSON array
  sortOrder: number
  recommended?: boolean
}

const plans: PlanSeed[] = [
  // ─── MEMBER ──────────────────────────────────────────────
  {
    key: 'BASIS',
    userType: 'MEMBER',
    name: 'Member Basis',
    description: 'Dein Einstieg in die THEGND Community. Grundlegende Social-Features und Profil.',
    priceCents: 999,
    features: JSON.stringify([
      'Social-Feed & Kommentare',
      'Basis-Profil',
      'Bis zu 3 Fotos',
      'Forum-Zugang',
      'Nachrichten senden',
    ]),
    sortOrder: 1,
  },
  {
    key: 'PLUS',
    userType: 'MEMBER',
    name: 'Member Plus',
    description: 'Erweiterte Community-Features für aktive Mitglieder.',
    priceCents: 1999,
    features: JSON.stringify([
      'Alles aus BASIS',
      'Erweitertes Profil',
      'Bis zu 10 Fotos',
      'Blog-Zugang',
      'Feed-Priorität',
      'Matching-Feature',
    ]),
    sortOrder: 2,
    recommended: true,
  },
  {
    key: 'PREMIUM',
    userType: 'MEMBER',
    name: 'Member Premium',
    description: 'Alle Features für das ultimative Community-Erlebnis.',
    priceCents: 3499,
    features: JSON.stringify([
      'Alles aus PLUS',
      'Unbegrenzte Fotos',
      'Stories erstellen',
      'Premium-Badge',
      'Prioritäts-Support',
      'Erweiterte Matching-Filter',
    ]),
    sortOrder: 3,
  },

  // ─── ESCORT ──────────────────────────────────────────────
  {
    key: 'BASIS',
    userType: 'ESCORT',
    name: 'Escort Basis',
    description: 'Dein Einstieg als Escort auf THEGND. Präsenz mit Standard-Funktionen.',
    priceCents: 1999,
    features: JSON.stringify([
      'Standard-Listing in der Suche',
      'Basis-Profil mit Galerie',
      'Bis zu 5 Fotos',
      'Nachrichten empfangen',
      'Grundlegendes Profil-SEO',
    ]),
    sortOrder: 1,
  },
  {
    key: 'PLUS',
    userType: 'ESCORT',
    name: 'Escort Plus',
    description: 'Mehr Reichweite, erweiterte Darstellung und priorisierte Listings.',
    priceCents: 3999,
    features: JSON.stringify([
      'Alles aus BASIS',
      'Priorisierung gegenüber BASIS',
      'Erweiterte Profil-Module',
      'Bis zu 15 Fotos + 2 Videos',
      'Date-Anfragen',
      'Städte-Boost verfügbar',
    ]),
    sortOrder: 2,
    recommended: true,
  },
  {
    key: 'PREMIUM',
    userType: 'ESCORT',
    name: 'Escort Premium',
    description: 'Maximale Sichtbarkeit, Top-Placement und alle Premium-Vorteile.',
    priceCents: 6999,
    features: JSON.stringify([
      'Alles aus PLUS',
      'Top-Placement in den Listen',
      'Alle Profil-Features',
      'Bis zu 30 Fotos + 5 Videos + Stories',
      'Profil-Analytics',
      'Premium-Badge & Verifizierung',
    ]),
    sortOrder: 3,
  },

  // ─── HOBBYHURE ───────────────────────────────────────────
  {
    key: 'BASIS',
    userType: 'HOBBYHURE',
    name: 'Hobby Basis',
    description: 'Starte als Hobbyhure auf THEGND mit grundlegenden Profil-Funktionen.',
    priceCents: 1499,
    features: JSON.stringify([
      'Standard-Listing in der Suche',
      'Basis-Profil mit Galerie',
      'Bis zu 5 Fotos',
      'Nachrichten empfangen',
    ]),
    sortOrder: 1,
  },
  {
    key: 'PLUS',
    userType: 'HOBBYHURE',
    name: 'Hobby Plus',
    description: 'Mehr Sichtbarkeit und erweiterte Funktionen für dein Profil.',
    priceCents: 2999,
    features: JSON.stringify([
      'Alles aus BASIS',
      'Priorisierung gegenüber BASIS',
      'Erweiterte Profil-Module',
      'Bis zu 10 Fotos + 1 Video',
      'Date-Anfragen',
    ]),
    sortOrder: 2,
    recommended: true,
  },
  {
    key: 'PREMIUM',
    userType: 'HOBBYHURE',
    name: 'Hobby Premium',
    description: 'Top-Placement und alle Features für maximale Reichweite.',
    priceCents: 4999,
    features: JSON.stringify([
      'Alles aus PLUS',
      'Top-Placement in den Listen',
      'Alle Profil-Features',
      'Bis zu 20 Fotos + 3 Videos + Stories',
      'Profil-Analytics',
    ]),
    sortOrder: 3,
  },

  // ─── AGENCY ──────────────────────────────────────────────
  {
    key: 'BASIS',
    userType: 'AGENCY',
    name: 'Agentur Basis',
    description: 'Grundlegender Agentur-Auftritt auf THEGND.',
    priceCents: 4999,
    features: JSON.stringify([
      'Agentur-Profil',
      'Bis zu 5 Escorts verwalten',
      'Job-Listings erstellen',
      'Basis-Galerie',
      'Nachrichten',
    ]),
    sortOrder: 1,
  },
  {
    key: 'PLUS',
    userType: 'AGENCY',
    name: 'Agentur Plus',
    description: 'Erweiterte Agentur-Funktionen für mehr Reichweite.',
    priceCents: 8999,
    features: JSON.stringify([
      'Alles aus BASIS',
      'Bis zu 15 Escorts verwalten',
      'Priorisierung in der Suche',
      'Erweiterte Analytics',
      'Event-Listings',
    ]),
    sortOrder: 2,
    recommended: true,
  },
  {
    key: 'PREMIUM',
    userType: 'AGENCY',
    name: 'Agentur Premium',
    description: 'Maximale Präsenz und unbegrenzte Escorts.',
    priceCents: 14999,
    features: JSON.stringify([
      'Alles aus PLUS',
      'Unbegrenzte Escorts',
      'Top-Placement',
      'Marketing-Tools',
      'Premium-Badge',
      'Prioritäts-Support',
    ]),
    sortOrder: 3,
  },

  // ─── CLUB ────────────────────────────────────────────────
  {
    key: 'BASIS',
    userType: 'CLUB',
    name: 'Club Basis',
    description: 'Grundlegender Club-Auftritt auf THEGND.',
    priceCents: 3999,
    features: JSON.stringify([
      'Club-Profil',
      'Basis-Galerie',
      'Job-Listings erstellen',
      'Öffnungszeiten anzeigen',
      'Nachrichten',
    ]),
    sortOrder: 1,
  },
  {
    key: 'PLUS',
    userType: 'CLUB',
    name: 'Club Plus',
    description: 'Mehr Sichtbarkeit und erweiterte Club-Funktionen.',
    priceCents: 6999,
    features: JSON.stringify([
      'Alles aus BASIS',
      'Erweiterte Galerie & Videos',
      'Event-Listings',
      'Priorisierung in der Suche',
      'Erweiterte Analytics',
    ]),
    sortOrder: 2,
    recommended: true,
  },
  {
    key: 'PREMIUM',
    userType: 'CLUB',
    name: 'Club Premium',
    description: 'Top-Placement und alle Premium-Features für Clubs.',
    priceCents: 11999,
    features: JSON.stringify([
      'Alles aus PLUS',
      'Top-Placement',
      'Alle Profil-Features',
      'Marketing-Tools',
      'Premium-Badge',
      'Prioritäts-Support',
    ]),
    sortOrder: 3,
  },

  // ─── STUDIO ──────────────────────────────────────────────
  {
    key: 'BASIS',
    userType: 'STUDIO',
    name: 'Studio Basis',
    description: 'Grundlegender Studio-Auftritt auf THEGND.',
    priceCents: 3999,
    features: JSON.stringify([
      'Studio-Profil',
      'Basis-Galerie',
      'Job-Listings erstellen',
      'Öffnungszeiten anzeigen',
      'Nachrichten',
    ]),
    sortOrder: 1,
  },
  {
    key: 'PLUS',
    userType: 'STUDIO',
    name: 'Studio Plus',
    description: 'Mehr Sichtbarkeit und erweiterte Studio-Funktionen.',
    priceCents: 6999,
    features: JSON.stringify([
      'Alles aus BASIS',
      'Erweiterte Galerie & Videos',
      'Event-Listings',
      'Priorisierung in der Suche',
      'Erweiterte Analytics',
    ]),
    sortOrder: 2,
    recommended: true,
  },
  {
    key: 'PREMIUM',
    userType: 'STUDIO',
    name: 'Studio Premium',
    description: 'Top-Placement und alle Premium-Features für Studios.',
    priceCents: 11999,
    features: JSON.stringify([
      'Alles aus PLUS',
      'Top-Placement',
      'Alle Profil-Features',
      'Marketing-Tools',
      'Premium-Badge',
      'Prioritäts-Support',
    ]),
    sortOrder: 3,
  },
]

async function main() {
  console.log('Seeding membership plans per UserType...')

  for (const plan of plans) {
    const existing = await prisma.membershipPlan.findFirst({
      where: { key: plan.key, userType: plan.userType },
    })

    if (existing) {
      console.log(`  ✓ ${plan.userType} / ${plan.key} already exists — updating`)
      await prisma.membershipPlan.update({
        where: { id: existing.id },
        data: {
          name: plan.name,
          description: plan.description,
          priceCents: plan.priceCents,
          features: plan.features,
          sortOrder: plan.sortOrder,
          active: true,
        },
      })
    } else {
      console.log(`  + Creating ${plan.userType} / ${plan.key}`)
      await prisma.membershipPlan.create({
        data: {
          key: plan.key,
          name: plan.name,
          description: plan.description,
          priceCents: plan.priceCents,
          features: plan.features,
          sortOrder: plan.sortOrder,
          userType: plan.userType,
          active: true,
        },
      })
    }
  }

  console.log(`\nDone! ${plans.length} plans seeded.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

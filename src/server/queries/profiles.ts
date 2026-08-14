import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { boundingBox, ungefaehr, type Punkt } from "@/lib/geo";
import type { SearchQuery } from "@/lib/validators";

export const profileCardSelect = {
  id: true,
  slug: true,
  displayName: true,
  headline: true,
  displayAge: true,
  birthDate: true,
  gender: true,
  kind: true,
  isVerified: true,
  verificationLevel: true,
  isFeatured: true,
  isNew: true,
  priceHour: true,
  currency: true,
  ratingAvg: true,
  reviewCount: true,
  viewCount: true,
  favoriteCount: true,
  lastActiveAt: true,
  bumpedAt: true,
  publishedAt: true,
  meetingPlace: true,
  heightCm: true,
  bodyType: true,
  cupSize: true,
  city: { select: { name: true, slug: true } },
  media: {
    where: { moderation: "APPROVED" as const, visibility: "PUBLIC" as const },
    orderBy: [{ isCover: "desc" as const }, { position: "asc" as const }],
    take: 4,
    select: { id: true, url: true, thumbUrl: true, blurData: true, type: true },
  },
  user: { select: { lastSeenAt: true } },
  boosts: {
    where: { active: true, endsAt: { gt: new Date() } },
    select: { type: true },
  },
} satisfies Prisma.ProfileSelect;

export type ProfileCardData = Prisma.ProfileGetPayload<{ select: typeof profileCardSelect }>;

const PAGE_SIZE = 24;

function ageToBirthRange(min?: number, max?: number) {
  const now = Date.now();
  const range: { gte?: Date; lte?: Date } = {};
  if (max !== undefined) range.gte = new Date(now - (max + 1) * 31557600000);
  if (min !== undefined) range.lte = new Date(now - min * 31557600000);
  return Object.keys(range).length ? range : undefined;
}

/** Mittelpunkt der Umkreissuche, sofern die Anfrage einen enthält. */
export function umkreisAusQuery(
  q: SearchQuery,
): { mitte: Punkt; radiusKm: number; mitAnfahrt: boolean } | null {
  if (q.lat === undefined || q.lng === undefined) return null;
  return { mitte: { lat: q.lat, lng: q.lng }, radiusKm: q.radius ?? 25, mitAnfahrt: q.anfahrt === "1" };
}

type Umkreistreffer = { id: string; lat: number; lng: number; distanz_km: number; eigene_koordinate: boolean };

/**
 * Profil-IDs im Umkreis, sortiert nach Entfernung.
 *
 * Ohne PostGIS: eine Bounding-Box grenzt grob ein (nutzt den Index auf
 * lat/lng), danach rechnet die Haversine-Formel exakt. Profile ohne eigene
 * Koordinate fallen auf den Mittelpunkt ihrer Stadt zurück — sonst wären
 * Bestandsprofile aus der Umkreissuche komplett verschwunden.
 *
 * Mit `mitAnfahrt` zählt zusätzlich der eingetragene Anfahrtsradius: Wer
 * 50 km fährt, erscheint dann auch bei einer Suche aus 40 km Entfernung.
 * Standardmässig aus — sonst überrascht ein 10-km-Umkreis mit 30-km-Treffern.
 */
async function profileImUmkreis(
  mitte: Punkt,
  radiusKm: number,
  mitAnfahrt: boolean,
): Promise<Umkreistreffer[]> {
  // Mit einbezogener Anfahrt kann ein Profil bis zu seinem eigenen Radius
  // ausserhalb liegen — dann muss die Box entsprechend grösser sein.
  const box = boundingBox(mitte, mitAnfahrt ? radiusKm + 200 : radiusKm);

  return db.$queryRaw<Umkreistreffer[]>`
    SELECT
      p.id,
      COALESCE(p.lat, c.lat)::float8 AS lat,
      COALESCE(p.lng, c.lng)::float8 AS lng,
      (6371 * acos(LEAST(1, GREATEST(-1,
        cos(radians(${mitte.lat}::float8)) * cos(radians(COALESCE(p.lat, c.lat)))
          * cos(radians(COALESCE(p.lng, c.lng)) - radians(${mitte.lng}::float8))
        + sin(radians(${mitte.lat}::float8)) * sin(radians(COALESCE(p.lat, c.lat)))
      ))))::float8 AS distanz_km,
      (p.lat IS NOT NULL AND p.lng IS NOT NULL) AS eigene_koordinate
    FROM "Profile" p
    LEFT JOIN "City" c ON c.id = p."cityId"
    WHERE p.status = 'ACTIVE'
      AND COALESCE(p.lat, c.lat) BETWEEN ${box.minLat}::float8 AND ${box.maxLat}::float8
      AND COALESCE(p.lng, c.lng) BETWEEN ${box.minLng}::float8 AND ${box.maxLng}::float8
      AND (6371 * acos(LEAST(1, GREATEST(-1,
        cos(radians(${mitte.lat}::float8)) * cos(radians(COALESCE(p.lat, c.lat)))
          * cos(radians(COALESCE(p.lng, c.lng)) - radians(${mitte.lng}::float8))
        + sin(radians(${mitte.lat}::float8)) * sin(radians(COALESCE(p.lat, c.lat)))
      )))) <= ${radiusKm}::float8 + (CASE WHEN ${mitAnfahrt} THEN COALESCE(p."radiusKm", 0) ELSE 0 END)::float8
    ORDER BY distanz_km ASC
    LIMIT 2000
  `;
}

export function buildProfileWhere(q: SearchQuery): Prisma.ProfileWhereInput {
  const AND: Prisma.ProfileWhereInput[] = [{ status: "ACTIVE" }];

  if (q.q) {
    AND.push({
      OR: [
        { displayName: { contains: q.q, mode: "insensitive" } },
        { headline: { contains: q.q, mode: "insensitive" } },
        { about: { contains: q.q, mode: "insensitive" } },
        { city: { name: { contains: q.q, mode: "insensitive" } } },
      ],
    });
  }

  if (q.city) AND.push({ city: { slug: q.city } });
  if (q.country) AND.push({ city: { country: { code: q.country.toUpperCase() } } });
  if (q.gender) AND.push({ gender: { in: q.gender.split(",") as never } });
  if (q.kind) AND.push({ kind: { in: q.kind.split(",") as never } });
  if (q.body) AND.push({ bodyType: { in: q.body.split(",") as never } });
  if (q.hair) AND.push({ hairColor: { in: q.hair.split(",") as never } });
  if (q.ethnicity) AND.push({ ethnicity: { in: q.ethnicity.split(",") as never } });
  if (q.cup) AND.push({ cupSize: { in: q.cup.split(",") } });
  if (q.smoker) AND.push({ smoker: { in: q.smoker.split(",") as never } });
  if (q.tattoos === "1") AND.push({ tattoos: true });
  if (q.place && q.place !== "BOTH") AND.push({ meetingPlace: { in: [q.place as never, "BOTH"] } });

  const birth = ageToBirthRange(q.ageMin, q.ageMax);
  if (birth) AND.push({ birthDate: birth });

  if (q.priceMin !== undefined || q.priceMax !== undefined) {
    AND.push({
      priceHour: {
        ...(q.priceMin !== undefined ? { gte: q.priceMin } : {}),
        ...(q.priceMax !== undefined ? { lte: q.priceMax } : {}),
      },
    });
  }
  if (q.heightMin !== undefined || q.heightMax !== undefined) {
    AND.push({
      heightCm: {
        ...(q.heightMin !== undefined ? { gte: q.heightMin } : {}),
        ...(q.heightMax !== undefined ? { lte: q.heightMax } : {}),
      },
    });
  }

  const services = Array.isArray(q.service) ? q.service : q.service ? [q.service] : [];
  for (const slug of services) AND.push({ services: { some: { service: { slug } } } });

  const langs = Array.isArray(q.lang) ? q.lang : q.lang ? [q.lang] : [];
  if (langs.length) AND.push({ languages: { some: { language: { code: { in: langs } } } } });

  if (q.verified === "1") AND.push({ isVerified: true });
  if (q.withReviews === "1") AND.push({ reviewCount: { gt: 0 } });
  if (q.withVideo === "1") AND.push({ media: { some: { type: "VIDEO", moderation: "APPROVED" } } });
  if (q.online === "1") AND.push({ user: { lastSeenAt: { gte: new Date(Date.now() - 15 * 60_000) } } });

  return { AND };
}

export function buildProfileOrder(sort?: string): Prisma.ProfileOrderByWithRelationInput[] {
  switch (sort) {
    case "new":
      return [{ publishedAt: "desc" }, { createdAt: "desc" }];
    case "online":
      return [{ user: { lastSeenAt: "desc" } }];
    case "rating":
      return [{ ratingAvg: "desc" }, { reviewCount: "desc" }];
    case "price_asc":
      return [{ priceHour: "asc" }];
    case "price_desc":
      return [{ priceHour: "desc" }];
    case "views":
      return [{ viewCount: "desc" }];
    default:
      return [{ isFeatured: "desc" }, { rankScore: "desc" }, { bumpedAt: "desc" }];
  }
}

export async function searchProfiles(q: SearchQuery) {
  const page = q.page ?? 1;
  const umkreis = umkreisAusQuery(q);

  // Der Umkreis wird vorab in der Datenbank ausgewertet und dann als
  // ID-Liste in die reguläre Abfrage gehängt. So bleiben alle übrigen
  // Filter unverändert wirksam.
  const imUmkreis = umkreis
    ? await profileImUmkreis(umkreis.mitte, umkreis.radiusKm, umkreis.mitAnfahrt)
    : null;
  const geo = new Map(imUmkreis?.map((t) => [t.id, t]));

  const where = buildProfileWhere(q);
  if (imUmkreis) {
    (where.AND as Prisma.ProfileWhereInput[]).push({ id: { in: imUmkreis.map((t) => t.id) } });
  }

  // Bei aktivem Umkreis ist „nächstgelegen“ die sinnvolle Vorgabe. Wählt
  // jemand ausdrücklich eine andere Sortierung, gilt diese.
  const nachEntfernung = Boolean(imUmkreis) && (!q.sort || q.sort === "distanz");

  const [items, total] = await Promise.all([
    db.profile.findMany({
      where,
      orderBy: buildProfileOrder(q.sort),
      select: profileCardSelect,
      // Nach Entfernung sortieren wir selbst — dafür braucht es alle Treffer.
      ...(nachEntfernung ? {} : { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    }),
    db.profile.count({ where }),
  ]);

  let seite = items;
  if (nachEntfernung) {
    seite = [...items]
      .sort((a, b) => (geo.get(a.id)?.distanz_km ?? 1e9) - (geo.get(b.id)?.distanz_km ?? 1e9))
      .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }

  return {
    items: seite.map((p) => ({ ...p, distanzKm: geo.get(p.id)?.distanz_km ?? null })),
    total,
    page,
    pageSize: PAGE_SIZE,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    umkreis,
  };
}

/**
 * Treffer für die Kartenansicht — mehr Einträge als eine Listenseite, dafür
 * nur die Felder, die die Karte wirklich braucht.
 *
 * Wer keine Adresse freigegeben hat, wird auf ein 500-m-Raster gerundet. Die
 * genaue Position einer Anbieterin gehört nicht auf eine öffentliche Karte.
 */
export async function searchProfilesForMap(q: SearchQuery, take = 300) {
  const umkreis = umkreisAusQuery(q);
  const imUmkreis = umkreis
    ? await profileImUmkreis(umkreis.mitte, umkreis.radiusKm, umkreis.mitAnfahrt)
    : null;
  const geo = new Map(imUmkreis?.map((t) => [t.id, t]));

  const where = buildProfileWhere(q);
  if (imUmkreis) {
    (where.AND as Prisma.ProfileWhereInput[]).push({ id: { in: imUmkreis.map((t) => t.id) } });
  }

  const profile = await db.profile.findMany({
    where,
    orderBy: buildProfileOrder(q.sort),
    take,
    select: {
      id: true,
      slug: true,
      displayName: true,
      lat: true,
      lng: true,
      priceHour: true,
      currency: true,
      showAddress: true,
      city: { select: { name: true, lat: true, lng: true } },
    },
  });

  return profile.flatMap((p) => {
    const roh = geo.get(p.id);
    const lat = p.lat ?? roh?.lat ?? p.city?.lat ?? null;
    const lng = p.lng ?? roh?.lng ?? p.city?.lng ?? null;
    if (lat == null || lng == null) return [];

    const eigen = p.lat != null && p.lng != null;
    const verstecken = eigen && !p.showAddress;
    const punkt = verstecken ? ungefaehr({ lat, lng }) : { lat, lng };

    return [
      {
        id: p.id,
        slug: p.slug,
        displayName: p.displayName,
        lat: punkt.lat,
        lng: punkt.lng,
        cityName: p.city?.name ?? null,
        priceHour: p.priceHour,
        currency: p.currency,
        distanzKm: roh?.distanz_km ?? null,
        ungefaehr: verstecken || !eigen,
      },
    ];
  });
}

export async function getFeaturedProfiles(take = 8) {
  return db.profile.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ isFeatured: true }, { boosts: { some: { active: true, type: "SPOTLIGHT", endsAt: { gt: new Date() } } } }],
    },
    orderBy: [{ rankScore: "desc" }, { bumpedAt: "desc" }],
    select: profileCardSelect,
    take,
  });
}

export async function getNewestProfiles(take = 12) {
  return db.profile.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: profileCardSelect,
    take,
  });
}

export async function getOnlineProfiles(take = 12) {
  return db.profile.findMany({
    where: { status: "ACTIVE", user: { lastSeenAt: { gte: new Date(Date.now() - 15 * 60_000) } } },
    orderBy: { user: { lastSeenAt: "desc" } },
    select: profileCardSelect,
    take,
  });
}

export async function getTopRatedProfiles(take = 12) {
  return db.profile.findMany({
    where: { status: "ACTIVE", reviewCount: { gte: 1 } },
    orderBy: [{ ratingAvg: "desc" }, { reviewCount: "desc" }],
    select: profileCardSelect,
    take,
  });
}

export async function getProfileBySlug(slug: string) {
  return db.profile.findFirst({
    where: { slug, status: { in: ["ACTIVE", "PAUSED"] } },
    include: {
      city: { include: { country: true } },
      agency: true,
      user: { select: { id: true, lastSeenAt: true, createdAt: true, displayName: true, avatarUrl: true } },
      media: {
        where: { moderation: "APPROVED" },
        orderBy: [{ isCover: "desc" }, { position: "asc" }],
      },
      services: { include: { service: { include: { category: true } } } },
      languages: { include: { language: true } },
      rates: { orderBy: { minutes: "asc" } },
      workingHours: { orderBy: { weekday: "asc" } },
      tours: {
        where: { to: { gte: new Date() } },
        orderBy: { from: "asc" },
        include: { city: true },
      },
      boosts: { where: { active: true, endsAt: { gt: new Date() } } },
      _count: { select: { favorites: true, reviews: { where: { status: "PUBLISHED" } } } },
    },
  });
}

export type ProfileDetail = NonNullable<Awaited<ReturnType<typeof getProfileBySlug>>>;

export async function getSimilarProfiles(profile: { id: string; cityId: string | null; gender: string }, take = 6) {
  return db.profile.findMany({
    where: {
      status: "ACTIVE",
      id: { not: profile.id },
      ...(profile.cityId ? { cityId: profile.cityId } : {}),
      gender: profile.gender as never,
    },
    orderBy: [{ rankScore: "desc" }],
    select: profileCardSelect,
    take,
  });
}

export async function getPopularCities(take = 12) {
  const cities = await db.city.findMany({
    where: { OR: [{ isPopular: true }, { profiles: { some: { status: "ACTIVE" } } }] },
    include: {
      country: { select: { code: true, nameDe: true } },
      _count: { select: { profiles: { where: { status: "ACTIVE" } } } },
    },
    take: 60,
  });

  return cities
    .sort((a, b) => b._count.profiles - a._count.profiles || Number(b.isPopular) - Number(a.isPopular))
    .slice(0, take);
}

export async function getPlatformStats() {
  const [profiles, verified, cities, reviews] = await Promise.all([
    db.profile.count({ where: { status: "ACTIVE" } }),
    db.profile.count({ where: { status: "ACTIVE", isVerified: true } }),
    db.city.count({ where: { profiles: { some: { status: "ACTIVE" } } } }),
    db.review.count({ where: { status: "PUBLISHED" } }),
  ]);
  return { profiles, verified, cities, reviews };
}

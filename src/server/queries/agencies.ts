import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { boundingBox, type Punkt } from "@/lib/geo";
import { AGENCY_AMENITIES } from "@/lib/constants";
import { istGeoeffnet } from "@/lib/opening-hours";
import type { AgencySearchQuery } from "@/lib/validators";

const PAGE_SIZE = 18;

export const agencyCardSelect = {
  id: true,
  slug: true,
  name: true,
  kind: true,
  headline: true,
  about: true,
  logoUrl: true,
  coverUrl: true,
  cityName: true,
  district: true,
  priceFrom: true,
  currency: true,
  isVerified: true,
  isOpen24h: true,
  hasParking: true,
  hasBar: true,
  acceptsCards: true,
  barrierFree: true,
  lat: true,
  lng: true,
  city: { select: { name: true, slug: true, lat: true, lng: true } },
  hours: { select: { weekday: true, opensAt: true, closesAt: true, closed: true } },
  languages: { select: { language: { select: { code: true, name: true, flag: true } } } },
  _count: { select: { profiles: { where: { status: "ACTIVE" as const } } } },
} satisfies Prisma.AgencySelect;

export type AgencyCardData = Prisma.AgencyGetPayload<{ select: typeof agencyCardSelect }>;

/** Mittelpunkt der Umkreissuche, sofern die Anfrage einen enthält. */
export function agenturUmkreis(q: AgencySearchQuery): { mitte: Punkt; radiusKm: number } | null {
  if (q.lat === undefined || q.lng === undefined) return null;
  return { mitte: { lat: q.lat, lng: q.lng }, radiusKm: q.radius ?? 25 };
}

type Umkreistreffer = { id: string; distanz_km: number };

/**
 * Agentur-IDs im Umkreis, nach Entfernung sortiert.
 *
 * Gleiche Mechanik wie bei den Profilen: Bounding-Box über den Index, dann
 * Haversine. Häuser ohne eigene Koordinate fallen auf den Mittelpunkt ihrer
 * Stadt zurück. Einen Anfahrtsradius gibt es hier nicht — ein Club kommt
 * nicht zu dir.
 */
async function agenturenImUmkreis(mitte: Punkt, radiusKm: number): Promise<Umkreistreffer[]> {
  const box = boundingBox(mitte, radiusKm);

  return db.$queryRaw<Umkreistreffer[]>`
    SELECT
      a.id,
      (6371 * acos(LEAST(1, GREATEST(-1,
        cos(radians(${mitte.lat}::float8)) * cos(radians(COALESCE(a.lat, c.lat)))
          * cos(radians(COALESCE(a.lng, c.lng)) - radians(${mitte.lng}::float8))
        + sin(radians(${mitte.lat}::float8)) * sin(radians(COALESCE(a.lat, c.lat)))
      ))))::float8 AS distanz_km
    FROM "Agency" a
    LEFT JOIN "City" c ON c.id = a."cityId"
    WHERE a."isPublished" = true
      AND COALESCE(a.lat, c.lat) BETWEEN ${box.minLat}::float8 AND ${box.maxLat}::float8
      AND COALESCE(a.lng, c.lng) BETWEEN ${box.minLng}::float8 AND ${box.maxLng}::float8
      AND (6371 * acos(LEAST(1, GREATEST(-1,
        cos(radians(${mitte.lat}::float8)) * cos(radians(COALESCE(a.lat, c.lat)))
          * cos(radians(COALESCE(a.lng, c.lng)) - radians(${mitte.lng}::float8))
        + sin(radians(${mitte.lat}::float8)) * sin(radians(COALESCE(a.lat, c.lat)))
      )))) <= ${radiusKm}::float8
    ORDER BY distanz_km ASC
    LIMIT 2000
  `;
}

export function buildAgencyWhere(q: AgencySearchQuery): Prisma.AgencyWhereInput {
  const AND: Prisma.AgencyWhereInput[] = [{ isPublished: true }];

  if (q.q) {
    AND.push({
      OR: [
        { name: { contains: q.q, mode: "insensitive" } },
        { headline: { contains: q.q, mode: "insensitive" } },
        { about: { contains: q.q, mode: "insensitive" } },
        { cityName: { contains: q.q, mode: "insensitive" } },
        { city: { name: { contains: q.q, mode: "insensitive" } } },
      ],
    });
  }

  if (q.city) AND.push({ city: { slug: q.city } });
  if (q.kind) AND.push({ kind: { in: q.kind.split(",") as never } });
  if (q.verified === "1") AND.push({ isVerified: true });
  if (q.withModels === "1") AND.push({ profiles: { some: { status: "ACTIVE" } } });
  if (q.priceMax !== undefined) AND.push({ priceFrom: { lte: q.priceMax } });

  const services = Array.isArray(q.service) ? q.service : q.service ? [q.service] : [];
  for (const slug of services) AND.push({ services: { some: { service: { slug } } } });

  const langs = Array.isArray(q.lang) ? q.lang : q.lang ? [q.lang] : [];
  if (langs.length) AND.push({ languages: { some: { language: { code: { in: langs } } } } });

  // Ausstattung: nur die bekannten Spalten zulassen, nichts aus der URL
  // ungeprüft in die Abfrage übernehmen.
  const erlaubt = new Set(AGENCY_AMENITIES.map((a) => a.key as string));
  for (const key of (q.amenity ?? "").split(",").filter(Boolean)) {
    if (erlaubt.has(key)) AND.push({ [key]: true } as Prisma.AgencyWhereInput);
  }

  return { AND };
}

function buildAgencyOrder(sort?: string): Prisma.AgencyOrderByWithRelationInput[] {
  switch (sort) {
    case "models":
      return [{ profiles: { _count: "desc" } }, { name: "asc" }];
    case "new":
      return [{ createdAt: "desc" }];
    case "name":
      return [{ name: "asc" }];
    case "price_asc":
      return [{ priceFrom: { sort: "asc", nulls: "last" } }, { name: "asc" }];
    default:
      return [{ isVerified: "desc" }, { profiles: { _count: "desc" } }, { name: "asc" }];
  }
}

export async function searchAgencies(q: AgencySearchQuery) {
  const page = q.page ?? 1;
  const umkreis = agenturUmkreis(q);

  const imUmkreis = umkreis ? await agenturenImUmkreis(umkreis.mitte, umkreis.radiusKm) : null;
  const geo = new Map(imUmkreis?.map((t) => [t.id, t.distanz_km]));

  const where = buildAgencyWhere(q);
  if (imUmkreis) {
    (where.AND as Prisma.AgencyWhereInput[]).push({ id: { in: imUmkreis.map((t) => t.id) } });
  }

  // „Jetzt geöffnet“ und die Entfernungssortierung lassen sich nicht in SQL
  // ausdrücken; in beiden Fällen holen wir alle Treffer und schneiden die
  // Seite selbst heraus. Der Bestand ist dafür klein genug.
  const nurGeoeffnet = q.open === "1";
  const nachEntfernung = Boolean(imUmkreis) && !q.sort;
  const selbstPaginieren = nurGeoeffnet || nachEntfernung;

  const [roh, gesamtOhneOeffnung] = await Promise.all([
    db.agency.findMany({
      where,
      orderBy: buildAgencyOrder(q.sort),
      select: agencyCardSelect,
      skip: selbstPaginieren ? 0 : (page - 1) * PAGE_SIZE,
      take: selbstPaginieren ? 500 : PAGE_SIZE,
    }),
    db.agency.count({ where }),
  ]);

  let treffer = roh.map((a) => ({
    ...a,
    distanzKm: geo.get(a.id) ?? null,
    geoeffnet: istGeoeffnet(a),
  }));

  if (nurGeoeffnet) treffer = treffer.filter((a) => a.geoeffnet === true);
  if (nachEntfernung) treffer.sort((a, b) => (a.distanzKm ?? 1e9) - (b.distanzKm ?? 1e9));

  const total = selbstPaginieren && nurGeoeffnet ? treffer.length : gesamtOhneOeffnung;
  const items = selbstPaginieren ? treffer.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : treffer;

  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    umkreis,
  };
}

/** Treffer für die Kartenansicht. Häuser haben eine öffentliche Adresse. */
export async function searchAgenciesForMap(q: AgencySearchQuery, take = 300) {
  const umkreis = agenturUmkreis(q);
  const imUmkreis = umkreis ? await agenturenImUmkreis(umkreis.mitte, umkreis.radiusKm) : null;
  const geo = new Map(imUmkreis?.map((t) => [t.id, t.distanz_km]));

  const where = buildAgencyWhere(q);
  if (imUmkreis) {
    (where.AND as Prisma.AgencyWhereInput[]).push({ id: { in: imUmkreis.map((t) => t.id) } });
  }

  const agenturen = await db.agency.findMany({
    where,
    orderBy: buildAgencyOrder(q.sort),
    take,
    select: {
      id: true,
      slug: true,
      name: true,
      lat: true,
      lng: true,
      priceFrom: true,
      currency: true,
      cityName: true,
      city: { select: { name: true, lat: true, lng: true } },
    },
  });

  return agenturen.flatMap((a) => {
    const lat = a.lat ?? a.city?.lat ?? null;
    const lng = a.lng ?? a.city?.lng ?? null;
    if (lat == null || lng == null) return [];
    return [
      {
        id: a.id,
        slug: a.slug,
        displayName: a.name,
        lat,
        lng,
        cityName: a.city?.name ?? a.cityName,
        priceHour: a.priceFrom,
        currency: a.currency,
        distanzKm: geo.get(a.id) ?? null,
        // Häuser sind ortsgebunden und öffentlich — keine Unschärfe nötig.
        ungefaehr: a.lat == null,
      },
    ];
  });
}

/** Auswahlmöglichkeiten der Filterleiste, jeweils mit Trefferzahl. */
export async function loadAgencyFilterOptions() {
  const [cities, kinds, services, languages, preis] = await Promise.all([
    db.city.findMany({
      where: { agencies: { some: { isPublished: true } } },
      select: { slug: true, name: true, _count: { select: { agencies: true } } },
      orderBy: { name: "asc" },
      take: 300,
    }),
    db.agency.groupBy({ by: ["kind"], where: { isPublished: true }, _count: true }),
    db.agencyService.findMany({
      distinct: ["serviceId"],
      select: { service: { select: { slug: true, name: true, category: { select: { name: true } } } } },
    }),
    db.agencyLanguage.findMany({
      distinct: ["languageId"],
      select: { language: { select: { code: true, name: true } } },
    }),
    db.agency.aggregate({ where: { isPublished: true }, _max: { priceFrom: true } }),
  ]);

  return {
    cities: cities.map((c) => ({ slug: c.slug, name: c.name, count: c._count.agencies })),
    kinds: Object.fromEntries(kinds.map((k) => [k.kind, k._count])) as Record<string, number>,
    services: services
      .map((s) => ({ slug: s.service.slug, name: s.service.name, category: s.service.category.name }))
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)),
    languages: languages
      .map((l) => l.language)
      .sort((a, b) => a.name.localeCompare(b.name)),
    priceMax: preis._max.priceFrom ?? 500,
  };
}

export type AgencyFilterOptions = Awaited<ReturnType<typeof loadAgencyFilterOptions>>;

import "server-only";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * Zugriff auf das eigene Haus.
 *
 * Wer zu einem Haus gehört, steht in `AgencyMember`. Es gibt drei Stufen:
 *   OWNER   — alles, inklusive Team und Löschen
 *   MANAGER — Stammdaten, Standort, Zeiten, Angebot, Models
 *   STAFF   — nur lesen
 *
 * Absichtlich nicht über `User.role` gesteuert: jemand kann Mitarbeiterin
 * eines Hauses sein und daneben ein eigenes Escort-Profil führen.
 */

export type AgencyRolle = "OWNER" | "MANAGER" | "STAFF";

export const darfBearbeiten = (rolle: AgencyRolle) => rolle === "OWNER" || rolle === "MANAGER";

/** Mitgliedschaft der angemeldeten Person, oder `null`. */
export async function eigeneMitgliedschaft() {
  const user = await getCurrentUser();
  if (!user) return null;

  const mitglied = await db.agencyMember.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { agencyId: true, role: true },
  });
  if (!mitglied) return null;

  const rolle = (["OWNER", "MANAGER", "STAFF"] as const).includes(mitglied.role as AgencyRolle)
    ? (mitglied.role as AgencyRolle)
    : "STAFF";

  return { userId: user.id, agencyId: mitglied.agencyId, rolle };
}

/** Vollständiger Datensatz des eigenen Hauses samt Verknüpfungen. */
export async function eigenesHaus() {
  const mitglied = await eigeneMitgliedschaft();
  if (!mitglied) return null;

  const agency = await db.agency.findUnique({
    where: { id: mitglied.agencyId },
    include: {
      services: { select: { serviceId: true } },
      languages: { select: { languageId: true } },
      hours: { orderBy: { weekday: "asc" } },
    },
  });
  if (!agency) return null;

  return { agency, rolle: mitglied.rolle, userId: mitglied.userId };
}

/** Offene Einladungen für das Profil der angemeldeten Person. */
export async function offeneEinladungen(profileId?: string | null) {
  if (!profileId) return [];
  return db.agencyInvite.findMany({
    where: { profileId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      message: true,
      createdAt: true,
      agency: { select: { name: true, slug: true, kind: true, logoUrl: true, isVerified: true, cityName: true } },
    },
  });
}

/**
 * Kennzahlen des eigenen Hauses fürs Dashboard.
 *
 * Aufrufe werden über alle zugeordneten Profile summiert — für ein Haus ist
 * die Gesamtreichweite die interessante Zahl, nicht die einzelner Models.
 */
export async function hausKennzahlen(agencyId: string) {
  const seit7 = new Date(Date.now() - 7 * 864e5);
  const seit30 = new Date(Date.now() - 30 * 864e5);

  const [haus, models, aktiveModels, anfragen, einladungen, aufrufe7, aufrufe30, bewertungen, buchungen] =
    await Promise.all([
      db.agency.findUnique({
        where: { id: agencyId },
        select: {
          name: true,
          slug: true,
          kind: true,
          isPublished: true,
          isVerified: true,
          about: true,
          headline: true,
          phone: true,
          coverUrl: true,
          lat: true,
          cityId: true,
          priceFrom: true,
          isOpen24h: true,
          verification: { select: { status: true } },
          _count: { select: { services: true, languages: true, hours: true, members: true } },
        },
      }),
      db.profile.count({ where: { agencyId } }),
      db.profile.count({ where: { agencyId, status: "ACTIVE" } }),
      db.agencyInvite.count({ where: { agencyId, status: "PENDING", origin: "PROFILE" } }),
      db.agencyInvite.count({ where: { agencyId, status: "PENDING", origin: "AGENCY" } }),
      db.profileView.count({ where: { profile: { agencyId }, createdAt: { gte: seit7 } } }),
      db.profileView.count({ where: { profile: { agencyId }, createdAt: { gte: seit30 } } }),
      db.review.count({ where: { profile: { agencyId }, status: "PUBLISHED" } }),
      db.booking.count({ where: { profile: { agencyId } } }),
    ]);

  if (!haus) return null;

  // Was zum vollständigen Inserat noch fehlt — dieselbe Idee wie die
  // Profil-Vollständigkeit, nur für Häuser.
  const schritte = [
    { key: "about", label: "Beschreibung ergänzen", erledigt: Boolean(haus.about && haus.about.length > 80) },
    { key: "cover", label: "Titelbild hinterlegen", erledigt: Boolean(haus.coverUrl) },
    { key: "standort", label: "Standort auf der Karte setzen", erledigt: haus.lat != null && haus.cityId != null },
    { key: "zeiten", label: "Öffnungszeiten eintragen", erledigt: haus.isOpen24h || haus._count.hours > 0 },
    { key: "angebot", label: "Angebot auswählen", erledigt: haus._count.services > 0 },
    { key: "sprachen", label: "Sprachen angeben", erledigt: haus._count.languages > 0 },
    { key: "kontakt", label: "Telefonnummer hinterlegen", erledigt: Boolean(haus.phone) },
    { key: "models", label: "Erstes Model einladen", erledigt: models > 0 },
    { key: "pruefung", label: "Prüfung beantragen", erledigt: haus.isVerified || haus.verification?.status === "SUBMITTED" },
  ];

  return {
    haus,
    models,
    aktiveModels,
    anfragen,
    einladungen,
    aufrufe7,
    aufrufe30,
    bewertungen,
    buchungen,
    schritte,
    fortschritt: Math.round((schritte.filter((s) => s.erledigt).length / schritte.length) * 100),
  };
}

export type HausKennzahlen = NonNullable<Awaited<ReturnType<typeof hausKennzahlen>>>;

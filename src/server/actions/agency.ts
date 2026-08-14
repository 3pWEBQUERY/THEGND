"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { agencySchema, agencyVerificationSchema } from "@/lib/validators";
import { darfBearbeiten, eigeneMitgliedschaft } from "@/server/queries/agency-access";
import { type ActionState, bool, fail, fromZod, str, success } from "@/server/action-utils";

/**
 * Selbstverwaltung eines Hauses.
 *
 * Klar abgegrenzt vom Admin: hier lässt sich weder das Geprüft-Siegel setzen
 * noch ein fremdes Haus bearbeiten. Alles läuft über die Mitgliedschaft der
 * angemeldeten Person.
 */

type Kontext = {
  agencyId: string;
  userId: string;
  rolle: "OWNER" | "MANAGER" | "STAFF";
};

async function mitSchreibrecht(): Promise<{ ok: true; ctx: Kontext } | { ok: false; error: ActionState }> {
  const mitglied = await eigeneMitgliedschaft();
  if (!mitglied) return { ok: false, error: fail("Du gehörst zu keinem Haus.") };
  if (!darfBearbeiten(mitglied.rolle)) {
    return {
      ok: false,
      error: fail("Dafür fehlt dir die Berechtigung. Wende dich an die Inhaberin."),
    };
  }
  return { ok: true, ctx: mitglied };
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// ── Anlegen ──────────────────────────────────────────────────────────────────

/** Legt ein Haus an und macht die anlegende Person zur Inhaberin. */
export async function createOwnAgencyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Bitte melde dich an.");

  const vorhanden = await db.agencyMember.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });
  if (vorhanden) return fail("Du gehörst bereits zu einem Haus.");

  const name = str(formData, "name") ?? "";
  if (name.trim().length < 2) return fail("Bitte einen Namen angeben.", { name: ["Zu kurz."] });

  const kind = str(formData, "kind") ?? "AGENCY";
  const cityId = str(formData, "cityId") || undefined;

  // Freien Slug finden, statt die Person raten zu lassen.
  const basis = slugify(name) || "haus";
  let slug = basis;
  for (let i = 2; await db.agency.findUnique({ where: { slug }, select: { id: true } }); i++) {
    slug = `${basis}-${i}`;
  }

  const stadt = cityId
    ? await db.city.findUnique({
        where: { id: cityId },
        select: { name: true },
      })
    : null;

  const agency = await db.agency.create({
    data: {
      slug,
      name: name.trim(),
      kind: kind as never,
      headline: str(formData, "headline") ?? null,
      cityId: cityId ?? null,
      cityName: stadt?.name ?? null,
      countryCode: "CH",
      // Neu angelegte Häuser sind zunächst versteckt — erst nach dem
      // Ausfüllen selbst veröffentlichen.
      isPublished: false,
      isVerified: false,
      members: { create: { userId: user.id, role: "OWNER" } },
    },
  });

  // Rolle nachziehen, damit das Dashboard den Anbieterbereich zeigt.
  if (user.role === "MEMBER") {
    await db.user.update({ where: { id: user.id }, data: { role: "AGENCY" } });
  }

  revalidatePath("/dashboard/agentur");
  return success("Haus angelegt.", { id: agency.id, slug: agency.slug });
}

// ── Stammdaten ───────────────────────────────────────────────────────────────

export async function updateOwnAgencyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const zugriff = await mitSchreibrecht();
  if (!zugriff.ok) return zugriff.error;
  const { ctx } = zugriff;

  const parsed = agencySchema.safeParse({
    slug: str(formData, "slug") ?? "",
    name: str(formData, "name") ?? "",
    kind: str(formData, "kind") ?? "AGENCY",
    headline: str(formData, "headline"),
    about: str(formData, "about"),
    logoUrl: str(formData, "logoUrl"),
    coverUrl: str(formData, "coverUrl"),
    website: str(formData, "website"),
    phone: str(formData, "phone"),
    whatsapp: str(formData, "whatsapp"),
    email: str(formData, "email"),
    street: str(formData, "street"),
    zip: str(formData, "zip"),
    district: str(formData, "district"),
    cityId: str(formData, "cityId") || undefined,
    lat: str(formData, "lat") || null,
    lng: str(formData, "lng") || null,
    priceFrom: str(formData, "priceFrom"),
    isOpen24h: bool(formData, "isOpen24h"),
    hasParking: bool(formData, "hasParking"),
    hasBar: bool(formData, "hasBar"),
    acceptsCards: bool(formData, "acceptsCards"),
    barrierFree: bool(formData, "barrierFree"),
    isPublished: bool(formData, "isPublished"),
  });
  if (!parsed.success) return fromZod(parsed.error);

  // Das Geprüft-Siegel ist ein Vertrauenssignal und wird ausschliesslich von
  // der Moderation vergeben. Hier explizit herausgeschnitten, damit ein
  // untergeschobenes Formularfeld auch dann wirkungslos bleibt, wenn das
  // Schema später einmal anders aussieht.
  const { cityId, isVerified: _siegel, ...rest } = parsed.data;
  void _siegel;
  const stadt = cityId
    ? await db.city.findUnique({
        where: { id: cityId },
        select: { name: true },
      })
    : null;

  const kollision = await db.agency.findFirst({
    where: { slug: rest.slug, NOT: { id: ctx.agencyId } },
    select: { id: true },
  });
  if (kollision)
    return fail("Diese Adresse ist bereits vergeben.", {
      slug: ["Bereits vergeben."],
    });

  const vorher = await db.agency.findUnique({
    where: { id: ctx.agencyId },
    select: { slug: true },
  });

  await db.agency.update({
    where: { id: ctx.agencyId },
    data: {
      ...rest,
      cityId: cityId ?? null,
      cityName: stadt?.name ?? null,
      countryCode: "CH",
    },
  });

  const serviceIds = formData.getAll("serviceIds").map(String).filter(Boolean);
  await db.agencyService.deleteMany({ where: { agencyId: ctx.agencyId } });
  if (serviceIds.length) {
    await db.agencyService.createMany({
      data: serviceIds.map((serviceId) => ({
        agencyId: ctx.agencyId,
        serviceId,
      })),
      skipDuplicates: true,
    });
  }

  const languageIds = formData.getAll("languageIds").map(String).filter(Boolean);
  await db.agencyLanguage.deleteMany({ where: { agencyId: ctx.agencyId } });
  if (languageIds.length) {
    await db.agencyLanguage.createMany({
      data: languageIds.map((languageId) => ({
        agencyId: ctx.agencyId,
        languageId,
      })),
      skipDuplicates: true,
    });
  }

  await db.agencyHour.deleteMany({ where: { agencyId: ctx.agencyId } });
  if (!rest.isOpen24h) {
    await db.agencyHour.createMany({
      data: [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
        const opensAt = str(formData, `opensAt_${weekday}`);
        const closesAt = str(formData, `closesAt_${weekday}`);
        return {
          agencyId: ctx.agencyId,
          weekday,
          closed: bool(formData, `closed_${weekday}`) || !opensAt || !closesAt,
          opensAt: opensAt ?? null,
          closesAt: closesAt ?? null,
        };
      }),
    });
  }

  revalidatePath("/dashboard/agentur");
  revalidatePath("/agenturen");
  revalidatePath(`/agenturen/${rest.slug}`);
  if (vorher && vorher.slug !== rest.slug) revalidatePath(`/agenturen/${vorher.slug}`);

  return success("Gespeichert.");
}

// ── Models ───────────────────────────────────────────────────────────────────

/**
 * Lädt ein Profil ein. Die Zuordnung entsteht erst mit der Zusage —
 * ein Haus kann sich kein fremdes Inserat einfach zuschreiben.
 */
export async function inviteModelAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const zugriff = await mitSchreibrecht();
  if (!zugriff.ok) return zugriff.error;
  const { ctx } = zugriff;

  const eingabe = (str(formData, "slug") ?? "")
    .trim()
    .replace(/^.*\/escort\//, "")
    .replace(/\/+$/, "");
  if (!eingabe) return fail("Bitte die Profiladresse angeben.", { slug: ["Pflichtfeld."] });

  const profil = await db.profile.findUnique({
    where: { slug: eingabe },
    select: { id: true, displayName: true, agencyId: true, userId: true },
  });
  if (!profil)
    return fail("Kein Profil mit dieser Adresse gefunden.", {
      slug: ["Unbekannt."],
    });
  if (profil.agencyId === ctx.agencyId) return fail("Dieses Profil gehört bereits zu deinem Haus.");
  if (profil.agencyId) return fail("Dieses Profil ist bereits einem anderen Haus zugeordnet.");

  const haus = await db.agency.findUnique({
    where: { id: ctx.agencyId },
    select: { name: true },
  });

  await db.agencyInvite.upsert({
    where: {
      agencyId_profileId: { agencyId: ctx.agencyId, profileId: profil.id },
    },
    update: {
      status: "PENDING",
      message: str(formData, "message"),
      invitedById: ctx.userId,
      respondedAt: null,
    },
    create: {
      agencyId: ctx.agencyId,
      profileId: profil.id,
      message: str(formData, "message"),
      invitedById: ctx.userId,
    },
  });

  await db.notification
    .create({
      data: {
        userId: profil.userId,
        type: "SYSTEM",
        title: "Einladung von einem Haus",
        body: `${haus?.name ?? "Ein Haus"} möchte dich ins Team aufnehmen. Du entscheidest, ob du zusagst.`,
        href: "/dashboard/profil",
      },
    })
    .catch(() => null);

  revalidatePath("/dashboard/agentur/models");
  return success(`Einladung an ${profil.displayName} verschickt.`);
}

export async function revokeInviteAction(inviteId: string): Promise<ActionState> {
  const zugriff = await mitSchreibrecht();
  if (!zugriff.ok) return zugriff.error;

  const einladung = await db.agencyInvite.findUnique({
    where: { id: inviteId },
    select: { agencyId: true },
  });
  if (!einladung || einladung.agencyId !== zugriff.ctx.agencyId) return fail("Nicht gefunden.");

  await db.agencyInvite.update({
    where: { id: inviteId },
    data: { status: "REVOKED", respondedAt: new Date() },
  });
  revalidatePath("/dashboard/agentur/models");
  return success("Einladung zurückgezogen.");
}

/** Löst die Zuordnung. Das Profil selbst bleibt unangetastet. */
export async function removeModelAction(profileId: string): Promise<ActionState> {
  const zugriff = await mitSchreibrecht();
  if (!zugriff.ok) return zugriff.error;

  const profil = await db.profile.findUnique({
    where: { id: profileId },
    select: { agencyId: true, kind: true },
  });
  if (!profil || profil.agencyId !== zugriff.ctx.agencyId) return fail("Nicht gefunden.");

  await db.profile.update({
    where: { id: profileId },
    data: {
      agencyId: null,
      ...(profil.kind === "AGENCY_MODEL" ? { kind: "INDEPENDENT" as const } : {}),
    },
  });
  await db.agencyInvite.deleteMany({
    where: { agencyId: zugriff.ctx.agencyId, profileId },
  });

  revalidatePath("/dashboard/agentur/models");
  revalidatePath("/agenturen");
  return success("Zuordnung aufgehoben.");
}

// ── Antwort der eingeladenen Person ──────────────────────────────────────────

export async function respondToInviteAction(inviteId: string, zusagen: boolean): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user?.profileId) return fail("Bitte melde dich mit deinem Profil an.");

  const einladung = await db.agencyInvite.findUnique({
    where: { id: inviteId },
    select: {
      id: true,
      profileId: true,
      agencyId: true,
      status: true,
      agency: { select: { name: true } },
    },
  });
  if (!einladung || einladung.profileId !== user.profileId) return fail("Nicht gefunden.");
  if (einladung.status !== "PENDING") return fail("Diese Einladung ist nicht mehr offen.");

  await db.agencyInvite.update({
    where: { id: inviteId },
    data: {
      status: zusagen ? "ACCEPTED" : "DECLINED",
      respondedAt: new Date(),
    },
  });

  if (zusagen) {
    await db.profile.update({
      where: { id: user.profileId },
      data: { agencyId: einladung.agencyId, kind: "AGENCY_MODEL" },
    });
    // Andere offene Einladungen erübrigen sich.
    await db.agencyInvite.updateMany({
      where: {
        profileId: user.profileId,
        status: "PENDING",
        NOT: { id: inviteId },
      },
      data: { status: "DECLINED", respondedAt: new Date() },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profil");
  revalidatePath("/agenturen");
  return success(zusagen ? `Du gehörst jetzt zu ${einladung.agency.name}.` : "Einladung abgelehnt.");
}

/** Austritt aus eigenem Antrieb — jederzeit und ohne Zustimmung des Hauses. */
export async function leaveAgencyAction(): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user?.profileId) return fail("Bitte melde dich an.");

  const profil = await db.profile.findUnique({
    where: { id: user.profileId },
    select: { agencyId: true, kind: true },
  });
  if (!profil?.agencyId) return fail("Du gehörst zu keinem Haus.");

  await db.profile.update({
    where: { id: user.profileId },
    data: {
      agencyId: null,
      ...(profil.kind === "AGENCY_MODEL" ? { kind: "INDEPENDENT" as const } : {}),
    },
  });
  await db.agencyInvite.deleteMany({
    where: { profileId: user.profileId, agencyId: profil.agencyId },
  });

  revalidatePath("/dashboard/profil");
  revalidatePath("/agenturen");
  return success("Du bist aus dem Haus ausgetreten.");
}

// ── Team ─────────────────────────────────────────────────────────────────────

export async function addTeamMemberAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const mitglied = await eigeneMitgliedschaft();
  if (!mitglied) return fail("Du gehörst zu keinem Haus.");
  if (mitglied.rolle !== "OWNER") return fail("Nur die Inhaberin kann das Team verwalten.");

  const email = (str(formData, "email") ?? "").trim().toLowerCase();
  if (!email)
    return fail("Bitte eine E-Mail-Adresse angeben.", {
      email: ["Pflichtfeld."],
    });

  const rolle = str(formData, "role") === "MANAGER" ? "MANAGER" : "STAFF";

  const person = await db.user.findUnique({
    where: { email },
    select: { id: true, displayName: true },
  });
  if (!person) {
    return fail("Zu dieser Adresse gibt es kein Konto. Die Person muss sich zuerst registrieren.", {
      email: ["Unbekannt."],
    });
  }

  const schon = await db.agencyMember.findFirst({
    where: { userId: person.id },
    select: { agencyId: true },
  });
  if (schon?.agencyId === mitglied.agencyId) return fail("Diese Person ist bereits im Team.");
  if (schon) return fail("Diese Person gehört bereits zu einem anderen Haus.");

  await db.agencyMember.create({
    data: { agencyId: mitglied.agencyId, userId: person.id, role: rolle },
  });

  await db.notification
    .create({
      data: {
        userId: person.id,
        type: "SYSTEM",
        title: "Du wurdest ins Team aufgenommen",
        body: "Du kannst das Haus jetzt im Dashboard verwalten.",
        href: "/dashboard/agentur",
      },
    })
    .catch(() => null);

  revalidatePath("/dashboard/agentur/team");
  return success(`${person.displayName ?? email} hinzugefügt.`);
}

export async function removeTeamMemberAction(memberId: string): Promise<ActionState> {
  const mitglied = await eigeneMitgliedschaft();
  if (!mitglied) return fail("Du gehörst zu keinem Haus.");
  if (mitglied.rolle !== "OWNER") return fail("Nur die Inhaberin kann das Team verwalten.");

  const ziel = await db.agencyMember.findUnique({
    where: { id: memberId },
    select: { agencyId: true, userId: true, role: true },
  });
  if (!ziel || ziel.agencyId !== mitglied.agencyId) return fail("Nicht gefunden.");
  if (ziel.userId === mitglied.userId) return fail("Du kannst dich nicht selbst entfernen.");

  // Ein Haus ohne Inhaberin wäre nicht mehr verwaltbar.
  if (ziel.role === "OWNER") {
    const inhaber = await db.agencyMember.count({
      where: { agencyId: mitglied.agencyId, role: "OWNER" },
    });
    if (inhaber <= 1) return fail("Das Haus braucht mindestens eine Inhaberin.");
  }

  await db.agencyMember.delete({ where: { id: memberId } });
  revalidatePath("/dashboard/agentur/team");
  return success("Zugang entfernt.");
}

// ── Beitrittsanfrage einer Anbieterin ────────────────────────────────────────

/**
 * Gegenrichtung zur Einladung: Die Anbieterin fragt bei einem Haus an.
 *
 * Zustimmen muss immer die andere Seite — hier also das Haus. Dieselbe
 * Tabelle wie bei den Einladungen, unterschieden über `origin`.
 */
export async function requestJoinAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user?.profileId) return fail("Dafür brauchst du ein eigenes Profil.");

  const profil = await db.profile.findUnique({
    where: { id: user.profileId },
    select: { id: true, displayName: true, agencyId: true, status: true },
  });
  if (!profil) return fail("Profil nicht gefunden.");
  if (profil.agencyId) return fail("Du gehörst bereits zu einem Haus. Tritt zuerst aus.");

  const slug = (str(formData, "agencySlug") ?? "")
    .trim()
    .replace(/^.*\/agenturen\//, "")
    .replace(/\/+$/, "");
  if (!slug) return fail("Bitte ein Haus auswählen.", { agencySlug: ["Pflichtfeld."] });

  const haus = await db.agency.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      isPublished: true,
      members: { select: { userId: true } },
    },
  });
  if (!haus || !haus.isPublished)
    return fail("Kein Haus mit dieser Adresse gefunden.", {
      agencySlug: ["Unbekannt."],
    });

  const bestehend = await db.agencyInvite.findUnique({
    where: { agencyId_profileId: { agencyId: haus.id, profileId: profil.id } },
    select: { status: true, origin: true },
  });
  if (bestehend?.status === "PENDING") {
    return fail(
      bestehend.origin === "AGENCY"
        ? "Dieses Haus hat dich bereits eingeladen — du kannst direkt zusagen."
        : "Deine Anfrage läuft bereits.",
    );
  }

  await db.agencyInvite.upsert({
    where: { agencyId_profileId: { agencyId: haus.id, profileId: profil.id } },
    update: {
      status: "PENDING",
      origin: "PROFILE",
      message: str(formData, "message"),
      invitedById: user.id,
      respondedAt: null,
    },
    create: {
      agencyId: haus.id,
      profileId: profil.id,
      origin: "PROFILE",
      message: str(formData, "message"),
      invitedById: user.id,
    },
  });

  // Alle Verantwortlichen des Hauses benachrichtigen.
  if (haus.members.length) {
    await db.notification
      .createMany({
        data: haus.members.map((m) => ({
          userId: m.userId,
          type: "SYSTEM" as const,
          title: "Neue Beitrittsanfrage",
          body: `${profil.displayName} möchte zu deinem Haus gehören.`,
          href: "/dashboard/agentur/models",
        })),
      })
      .catch(() => null);
  }

  revalidatePath("/dashboard/zugehoerigkeit");
  return success(`Anfrage an ${haus.name} verschickt.`);
}

/** Eigene Anfrage wieder zurückziehen. */
export async function withdrawJoinRequestAction(inviteId: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user?.profileId) return fail("Bitte melde dich an.");

  const anfrage = await db.agencyInvite.findUnique({
    where: { id: inviteId },
    select: { profileId: true, origin: true, status: true },
  });
  if (!anfrage || anfrage.profileId !== user.profileId) return fail("Nicht gefunden.");
  if (anfrage.origin !== "PROFILE" || anfrage.status !== "PENDING")
    return fail("Das lässt sich nicht zurückziehen.");

  await db.agencyInvite.delete({ where: { id: inviteId } });
  revalidatePath("/dashboard/zugehoerigkeit");
  return success("Anfrage zurückgezogen.");
}

/** Das Haus entscheidet über eine eingegangene Beitrittsanfrage. */
export async function decideJoinRequestAction(inviteId: string, annehmen: boolean): Promise<ActionState> {
  const zugriff = await mitSchreibrecht();
  if (!zugriff.ok) return zugriff.error;

  const anfrage = await db.agencyInvite.findUnique({
    where: { id: inviteId },
    select: {
      agencyId: true,
      profileId: true,
      status: true,
      origin: true,
      profile: { select: { displayName: true, agencyId: true, userId: true } },
      agency: { select: { name: true } },
    },
  });
  if (!anfrage || anfrage.agencyId !== zugriff.ctx.agencyId) return fail("Nicht gefunden.");
  if (anfrage.origin !== "PROFILE" || anfrage.status !== "PENDING")
    return fail("Diese Anfrage ist nicht mehr offen.");
  if (annehmen && anfrage.profile.agencyId)
    return fail("Dieses Profil gehört inzwischen zu einem anderen Haus.");

  await db.agencyInvite.update({
    where: { id: inviteId },
    data: {
      status: annehmen ? "ACCEPTED" : "DECLINED",
      respondedAt: new Date(),
    },
  });

  if (annehmen) {
    await db.profile.update({
      where: { id: anfrage.profileId },
      data: { agencyId: anfrage.agencyId, kind: "AGENCY_MODEL" },
    });
    await db.agencyInvite.updateMany({
      where: { profileId: anfrage.profileId, status: "PENDING" },
      data: { status: "DECLINED", respondedAt: new Date() },
    });
  }

  await db.notification
    .create({
      data: {
        userId: anfrage.profile.userId,
        type: "SYSTEM",
        title: annehmen ? "Beitritt bestätigt" : "Beitritt abgelehnt",
        body: annehmen
          ? `Du gehörst jetzt zu ${anfrage.agency.name}.`
          : `${anfrage.agency.name} hat deine Anfrage abgelehnt.`,
        href: "/dashboard/zugehoerigkeit",
      },
    })
    .catch(() => null);

  revalidatePath("/dashboard/agentur/models");
  revalidatePath("/agenturen");
  return success(annehmen ? `${anfrage.profile.displayName} ist jetzt im Team.` : "Anfrage abgelehnt.");
}

// ── Prüfantrag des Hauses ────────────────────────────────────────────────────

/**
 * Reicht das Haus zur Prüfung ein.
 *
 * Vergeben wird das Siegel weiterhin ausschliesslich von der Moderation —
 * hier entsteht nur der Antrag.
 */
export async function submitAgencyVerificationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const mitglied = await eigeneMitgliedschaft();
  if (!mitglied) return fail("Du gehörst zu keinem Haus.");
  if (mitglied.rolle !== "OWNER") return fail("Nur die Inhaberin kann die Prüfung beantragen.");

  const haus = await db.agency.findUnique({
    where: { id: mitglied.agencyId },
    select: { isVerified: true, verification: { select: { status: true } } },
  });
  if (haus?.isVerified) return fail("Dein Haus ist bereits geprüft.");
  if (haus?.verification?.status === "SUBMITTED" || haus?.verification?.status === "IN_REVIEW") {
    return fail("Dein Antrag liegt bereits bei uns.");
  }

  const parsed = agencyVerificationSchema.safeParse({
    legalName: str(formData, "legalName") ?? "",
    uid: str(formData, "uid"),
    contactName: str(formData, "contactName") ?? "",
    contactRole: str(formData, "contactRole"),
    registryKey: str(formData, "registryKey") ?? "",
    permitKey: str(formData, "permitKey"),
    idKey: str(formData, "idKey") ?? "",
  });
  if (!parsed.success) return fromZod(parsed.error);

  await db.agencyVerification.upsert({
    where: { agencyId: mitglied.agencyId },
    update: {
      ...parsed.data,
      status: "SUBMITTED",
      submittedById: mitglied.userId,
      submittedAt: new Date(),
      note: null,
      reviewedAt: null,
      reviewerId: null,
    },
    create: {
      agencyId: mitglied.agencyId,
      ...parsed.data,
      status: "SUBMITTED",
      submittedById: mitglied.userId,
      submittedAt: new Date(),
    },
  });

  revalidatePath("/dashboard/agentur/pruefung");
  revalidatePath("/admin/agenturen");
  return success("Antrag eingereicht. Wir melden uns nach der Prüfung.");
}

// ── Umwandlung eines fälschlich angelegten Profils ───────────────────────────

/**
 * Wandelt ein persönliches Inserat in ein Haus um.
 *
 * Hintergrund: Die Kategorien „Agentur“, „Club“, „Studio“ und „Massage“ waren
 * früher auch beim persönlichen Profil wählbar. Wer ein Haus führen wollte,
 * landete dadurch mit einem Escort-Profil ohne Standort, Öffnungszeiten und
 * Team. Diese Aktion überführt die vorhandenen Angaben ins richtige Modell.
 *
 * Das Profil wird dabei nicht gelöscht, sondern archiviert — was jemand
 * eingetragen hat, verschwindet nicht ungefragt.
 */
export async function convertProfileToAgencyAction(): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user?.profileId) return fail("Kein Profil gefunden.");

  const vorhanden = await db.agencyMember.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });
  if (vorhanden) return fail("Du gehörst bereits zu einem Haus.");

  const profil = await db.profile.findUnique({
    where: { id: user.profileId },
    select: {
      id: true,
      displayName: true,
      kind: true,
      headline: true,
      about: true,
      phone: true,
      whatsapp: true,
      website: true,
      street: true,
      zip: true,
      district: true,
      cityId: true,
      lat: true,
      lng: true,
      priceHour: true,
      currency: true,
      services: { select: { serviceId: true } },
      languages: { select: { languageId: true } },
      city: { select: { name: true } },
    },
  });
  if (!profil) return fail("Kein Profil gefunden.");

  const hausArt: Record<string, string> = {
    AGENCY: "AGENCY",
    CLUB: "CLUB",
    STUDIO: "STUDIO",
    MASSAGE: "MASSAGE",
  };
  const kind = hausArt[profil.kind] ?? "AGENCY";

  const basis = slugify(profil.displayName) || "haus";
  let slug = basis;
  for (let i = 2; await db.agency.findUnique({ where: { slug }, select: { id: true } }); i++) {
    slug = `${basis}-${i}`;
  }

  const agency = await db.agency.create({
    data: {
      slug,
      name: profil.displayName,
      kind: kind as never,
      headline: profil.headline,
      about: profil.about,
      phone: profil.phone,
      whatsapp: profil.whatsapp,
      website: profil.website,
      street: profil.street,
      zip: profil.zip,
      district: profil.district,
      cityId: profil.cityId,
      cityName: profil.city?.name ?? null,
      lat: profil.lat,
      lng: profil.lng,
      priceFrom: profil.priceHour,
      currency: profil.currency,
      countryCode: "CH",
      // Erst nach Durchsicht veröffentlichen — die übernommenen Texte sind
      // für ein persönliches Inserat geschrieben.
      isPublished: false,
      isVerified: false,
      members: { create: { userId: user.id, role: "OWNER" } },
    },
  });

  if (profil.services.length) {
    await db.agencyService.createMany({
      data: profil.services.map((s) => ({
        agencyId: agency.id,
        serviceId: s.serviceId,
      })),
      skipDuplicates: true,
    });
  }
  if (profil.languages.length) {
    await db.agencyLanguage.createMany({
      data: profil.languages.map((l) => ({
        agencyId: agency.id,
        languageId: l.languageId,
      })),
      skipDuplicates: true,
    });
  }

  // Profil archivieren statt löschen und vom Konto lösen, damit das
  // Dashboard nicht weiter den Escort-Bereich zeigt.
  await db.profile.update({
    where: { id: profil.id },
    data: { status: "ARCHIVED" },
  });
  await db.user.update({ where: { id: user.id }, data: { role: "AGENCY" } });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/agentur");
  revalidatePath("/agenturen");

  return success(`„${profil.displayName}“ ist jetzt ein Haus.`, {
    slug: agency.slug,
  });
}

/**
 * Archiviert ein persönliches Inserat, das eigentlich ein Haus beschreibt.
 *
 * Für den Fall, dass bereits ein Haus existiert und das alte Escort-Profil
 * nur noch übrig ist. Bewusst archivieren statt löschen — Eingetragenes
 * verschwindet nicht ungefragt, es ist nur nicht mehr öffentlich und taucht
 * nicht mehr als „mein Inserat“ auf.
 */
export async function archiveOwnProfileAction(): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user?.profileId) return fail("Kein Profil gefunden.");

  const profil = await db.profile.findUnique({
    where: { id: user.profileId },
    select: { id: true, displayName: true, status: true },
  });
  if (!profil) return fail("Kein Profil gefunden.");
  if (profil.status === "ARCHIVED") return fail("Dieses Inserat ist bereits archiviert.");

  await db.profile.update({
    where: { id: profil.id },
    data: { status: "ARCHIVED" },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profil");
  revalidatePath("/escorts");

  return success(`„${profil.displayName}“ wurde archiviert.`);
}

// ── Eigene Models anlegen ────────────────────────────────────────────────────

/**
 * Legt ein Inserat an, das die Agentur selbst führt.
 *
 * Ein Inserat hängt im Datenmodell immer an einem Konto. Deshalb entsteht hier
 * ein verwaltetes Konto ohne Passwort — anmelden kann sich damit niemand.
 * Trägt die Agentur eine E-Mail-Adresse ein, kann die Person das Konto später
 * über „Passwort vergessen“ selbst übernehmen und das Inserat weiterführen.
 */
export async function createManagedModelAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const zugriff = await mitSchreibrecht();
  if (!zugriff.ok) return zugriff.error;
  const { ctx } = zugriff;

  const displayName = (str(formData, "displayName") ?? "").trim();
  if (displayName.length < 2) return fail("Bitte einen Namen angeben.", { displayName: ["Zu kurz."] });

  const gender = str(formData, "gender") ?? "FEMALE";
  const cityId = str(formData, "cityId") || undefined;
  const email = (str(formData, "email") ?? "").trim().toLowerCase();

  if (email) {
    const belegt = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (belegt) {
      return fail("Zu dieser E-Mail-Adresse gibt es bereits ein Konto.", {
        email: ["Bereits vergeben."],
      });
    }
  }

  // Freien Slug finden.
  const basis = slugify(displayName) || "model";
  let slug = basis;
  for (let i = 2; await db.profile.findUnique({ where: { slug }, select: { id: true } }); i++) {
    slug = `${basis}-${i}`;
  }

  // Models eines Hauses arbeiten am Standort des Hauses — Adresse also
  // vollständig übernehmen, nicht nur die Stadt.
  const haus = await db.agency.findUnique({
    where: { id: ctx.agencyId },
    select: { name: true, cityId: true, cityName: true, district: true, street: true, zip: true, lat: true, lng: true },
  });

  // Ohne echte Adresse eine eindeutige Platzhalter-Adresse: `email` ist
  // Pflicht und eindeutig, das Konto soll aber nicht erreichbar wirken.
  // Zufallssuffix statt Zeitstempel: Bei mehreren Anlagen in derselben
  // Millisekunde wäre der Zeitstempel identisch, und `email` ist eindeutig.
  const kontoEmail = email || `model-${slug}-${randomBytes(4).toString("hex")}@verwaltet.invalid`;

  const konto = await db.user.create({
    data: {
      email: kontoEmail,
      role: "ESCORT",
      status: "ACTIVE",
      displayName,
      managedByAgencyId: ctx.agencyId,
      // Kein Passwort — Anmeldung erst nach Übernahme durch die Person.
      passwordHash: null,
      ageConfirmedAt: new Date(),
      termsAcceptedAt: new Date(),
    },
    select: { id: true },
  });

  const profil = await db.profile.create({
    data: {
      userId: konto.id,
      slug,
      displayName,
      gender: gender as never,
      kind: "AGENCY_MODEL",
      status: "DRAFT",
      agencyId: ctx.agencyId,
      // Eine ausdrücklich gewählte Stadt gewinnt; sonst der Standort des Hauses.
      cityId: cityId ?? haus?.cityId ?? null,
      ...(cityId
        ? {}
        : {
            district: haus?.district ?? null,
            street: haus?.street ?? null,
            zip: haus?.zip ?? null,
            lat: haus?.lat ?? null,
            lng: haus?.lng ?? null,
          }),
      currency: "CHF",
    },
    select: { id: true, displayName: true },
  });

  revalidatePath("/dashboard/agentur/models");
  revalidatePath("/agenturen");

  return success(`${profil.displayName} angelegt — jetzt Inserat ausfüllen.`, {
    profileId: profil.id,
  });
}

/**
 * Entfernt ein von der Agentur angelegtes Model vollständig.
 *
 * Nur für verwaltete Konten: Wer ein eigenes Login hat, wird über
 * `removeModelAction` lediglich aus dem Haus gelöst, nie gelöscht.
 */
export async function deleteManagedModelAction(profileId: string): Promise<ActionState> {
  const zugriff = await mitSchreibrecht();
  if (!zugriff.ok) return zugriff.error;

  const profil = await db.profile.findUnique({
    where: { id: profileId },
    select: {
      agencyId: true,
      displayName: true,
      userId: true,
      user: { select: { managedByAgencyId: true } },
    },
  });
  if (!profil || profil.agencyId !== zugriff.ctx.agencyId) return fail("Nicht gefunden.");
  if (profil.user.managedByAgencyId !== zugriff.ctx.agencyId) {
    return fail("Dieses Model führt ein eigenes Konto — du kannst es nur aus dem Haus lösen.");
  }

  // Das Konto trägt das Inserat; der Rest hängt per Cascade daran.
  await db.user.delete({ where: { id: profil.userId } });

  revalidatePath("/dashboard/agentur/models");
  revalidatePath("/agenturen");
  return success(`${profil.displayName} gelöscht.`);
}

/**
 * Trägt die E-Mail-Adresse eines verwalteten Models nach.
 *
 * Damit kann die Person das Inserat später über „Passwort vergessen“ selbst
 * übernehmen — ohne Adresse bliebe das Konto dauerhaft an die Agentur
 * gebunden.
 */
export async function setManagedModelEmailAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const zugriff = await mitSchreibrecht();
  if (!zugriff.ok) return zugriff.error;

  const profileId = str(formData, "profileId") ?? "";
  const email = (str(formData, "email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) return fail("Bitte eine gültige Adresse angeben.", { email: ["Ungültig."] });

  const profil = await db.profile.findUnique({
    where: { id: profileId },
    select: { agencyId: true, userId: true, displayName: true, user: { select: { managedByAgencyId: true } } },
  });
  if (!profil || profil.agencyId !== zugriff.ctx.agencyId) return fail("Nicht gefunden.");
  if (profil.user.managedByAgencyId !== zugriff.ctx.agencyId) {
    return fail("Dieses Model führt ein eigenes Konto — die Adresse ändert nur die Person selbst.");
  }

  const belegt = await db.user.findFirst({
    where: { email, NOT: { id: profil.userId } },
    select: { id: true },
  });
  if (belegt) return fail("Diese Adresse ist bereits vergeben.", { email: ["Bereits vergeben."] });

  await db.user.update({ where: { id: profil.userId }, data: { email } });

  revalidatePath(`/dashboard/agentur/models/${profileId}`);
  return success(`Adresse für ${profil.displayName} gespeichert.`);
}

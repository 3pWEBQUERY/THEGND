"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { mailer } from "@/lib/mail";
import { agencySchema } from "@/lib/validators";
import { type ActionState, bool, fail, fromZod, str, success } from "@/server/action-utils";

async function requireStaff() {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) return null;
  return user;
}

async function log(userId: string, action: string, entity: string, entityId: string, meta?: object) {
  await db.auditLog.create({ data: { userId, action, entity, entityId, meta: meta as never } }).catch(() => null);
}

// ── Profile ──────────────────────────────────────────────────────────────────

export async function moderateProfileAction(profileId: string, decision: "APPROVE" | "REJECT" | "SUSPEND", note?: string): Promise<ActionState> {
  const staff = await requireStaff();
  if (!staff) return fail("Keine Berechtigung.");

  const profile = await db.profile.findUnique({
    where: { id: profileId },
    select: { slug: true, user: { select: { email: true } } },
  });
  if (!profile) return fail("Profil nicht gefunden.");

  const status = decision === "APPROVE" ? "ACTIVE" : decision === "REJECT" ? "REJECTED" : "PAUSED";
  await db.profile.update({
    where: { id: profileId },
    data: { status, publishedAt: decision === "APPROVE" ? new Date() : undefined, isNew: decision === "APPROVE" },
  });

  if (decision === "APPROVE") await mailer.profileApproved(profile.user.email, profile.slug);

  await log(staff.id, `profile:${decision.toLowerCase()}`, "Profile", profileId, { note });
  revalidatePath("/admin/profile");
  return success(`Profil ${decision === "APPROVE" ? "freigegeben" : decision === "REJECT" ? "abgelehnt" : "pausiert"}.`);
}

// ── Medien ───────────────────────────────────────────────────────────────────

export async function moderateMediaAction(mediaId: string, approve: boolean, note?: string): Promise<ActionState> {
  const staff = await requireStaff();
  if (!staff) return fail("Keine Berechtigung.");

  await db.media.update({
    where: { id: mediaId },
    data: { moderation: approve ? "APPROVED" : "REJECTED", moderationNote: approve ? null : (note ?? "Verstoss gegen die Richtlinien.") },
  });

  await log(staff.id, `media:${approve ? "approve" : "reject"}`, "Media", mediaId);
  revalidatePath("/admin/medien");
  return success(approve ? "Medium freigegeben." : "Medium abgelehnt.");
}

export async function bulkApproveMediaAction(profileId: string): Promise<ActionState> {
  const staff = await requireStaff();
  if (!staff) return fail("Keine Berechtigung.");

  const { count } = await db.media.updateMany({
    where: { profileId, moderation: "PENDING" },
    data: { moderation: "APPROVED" },
  });

  await log(staff.id, "media:bulk-approve", "Profile", profileId, { count });
  revalidatePath("/admin/medien");
  return success(`${count} Medien freigegeben.`);
}

// ── Verifizierung ────────────────────────────────────────────────────────────

export async function reviewVerificationAction(
  verificationId: string,
  approve: boolean,
  level: "PHOTO" | "ID" | "PREMIUM" = "ID",
  note?: string,
): Promise<ActionState> {
  const staff = await requireStaff();
  if (!staff) return fail("Keine Berechtigung.");

  const verification = await db.verification.findUnique({
    where: { id: verificationId },
    select: { profileId: true, profile: { select: { user: { select: { email: true } } } } },
  });
  if (!verification) return fail("Antrag nicht gefunden.");

  await db.$transaction([
    db.verification.update({
      where: { id: verificationId },
      data: {
        status: approve ? "APPROVED" : "REJECTED",
        level: approve ? level : "NONE",
        note: note ?? null,
        reviewerId: staff.id,
        reviewedAt: new Date(),
        expiresAt: approve ? new Date(Date.now() + 365 * 864e5) : null,
      },
    }),
    db.profile.update({
      where: { id: verification.profileId },
      data: {
        isVerified: approve,
        verificationLevel: approve ? level : "NONE",
        rankScore: approve ? { increment: 15 } : undefined,
      },
    }),
    db.notification.create({
      data: {
        userId: staff.id,
        type: "VERIFICATION",
        title: approve ? "Verifizierung freigegeben" : "Verifizierung abgelehnt",
        body: `Antrag ${verificationId.slice(0, 8)} bearbeitet.`,
        href: "/admin/verifizierungen",
      },
    }),
  ]);

  await mailer.verificationResult(verification.profile.user.email, approve, note);
  await log(staff.id, `verification:${approve ? "approve" : "reject"}`, "Verification", verificationId);

  revalidatePath("/admin/verifizierungen");
  return success(approve ? "Verifiziert." : "Abgelehnt.");
}

// ── Bewertungen ──────────────────────────────────────────────────────────────

export async function moderateReviewAction(reviewId: string, publish: boolean): Promise<ActionState> {
  const staff = await requireStaff();
  if (!staff) return fail("Keine Berechtigung.");

  const review = await db.review.update({
    where: { id: reviewId },
    data: { status: publish ? "PUBLISHED" : "REJECTED" },
    select: { profileId: true },
  });

  if (publish) {
    const stats = await db.review.aggregate({
      where: { profileId: review.profileId, status: "PUBLISHED" },
      _avg: { rating: true },
      _count: true,
    });
    await db.profile.update({
      where: { id: review.profileId },
      data: { ratingAvg: stats._avg.rating ?? 0, reviewCount: stats._count },
    });
  }

  await log(staff.id, `review:${publish ? "publish" : "reject"}`, "Review", reviewId);
  revalidatePath("/admin/bewertungen");
  return success(publish ? "Bewertung veröffentlicht." : "Bewertung abgelehnt.");
}

// ── Meldungen ────────────────────────────────────────────────────────────────

export async function resolveReportAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  if (!staff) return fail("Keine Berechtigung.");

  const reportId = str(formData, "reportId");
  const status = str(formData, "status");
  if (!reportId || !status) return fail("Ungültige Anfrage.");

  await db.report.update({
    where: { id: reportId },
    data: {
      status: status as never,
      handledById: staff.id,
      resolution: str(formData, "resolution") ?? null,
    },
  });

  await log(staff.id, `report:${status}`, "Report", reportId);
  revalidatePath("/admin/meldungen");
  return success("Meldung bearbeitet.");
}

// ── Nutzer ───────────────────────────────────────────────────────────────────

export async function updateUserStatusAction(userId: string, status: "ACTIVE" | "SUSPENDED" | "BANNED"): Promise<ActionState> {
  const staff = await requireStaff();
  if (!staff) return fail("Keine Berechtigung.");
  if (staff.id === userId) return fail("Du kannst dein eigenes Konto nicht sperren.");

  await db.user.update({ where: { id: userId }, data: { status } });
  if (status !== "ACTIVE") {
    await db.session.deleteMany({ where: { userId } });
    await db.profile.updateMany({ where: { userId }, data: { status: "PAUSED" } });
  }

  await log(staff.id, `user:${status.toLowerCase()}`, "User", userId);
  revalidatePath("/admin/nutzer");
  return success(`Konto auf ${status} gesetzt.`);
}

export async function grantCreditsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  if (!staff || staff.role !== "ADMIN") return fail("Nur Administratoren.");

  const userId = str(formData, "userId");
  const amount = Number(str(formData, "amount") ?? 0);
  if (!userId || !Number.isFinite(amount) || amount === 0) return fail("Ungültige Eingabe.");

  const updated = await db.user.update({
    where: { id: userId },
    data: { credits: { increment: amount } },
    select: { credits: true },
  });
  await db.transaction.create({
    data: {
      userId,
      type: amount > 0 ? "BONUS" : "SPEND",
      amount,
      balance: updated.credits,
      note: str(formData, "note") ?? "Manuelle Anpassung durch Support",
    },
  });

  await log(staff.id, "credits:grant", "User", userId, { amount });
  revalidatePath("/admin/nutzer");
  return success(`${amount > 0 ? "+" : ""}${amount} Credits gebucht.`);
}

// ── Agenturen & Häuser ───────────────────────────────────────────────────────

/**
 * Anlegen und Bearbeiten in einem Schritt: ohne `id` wird neu erstellt,
 * mit `id` aktualisiert. Services, Sprachen und Öffnungszeiten kommen als
 * Listen aus dem Formular und werden jeweils komplett neu gesetzt.
 */
export async function saveAgencyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  if (!staff) return fail("Keine Berechtigung.");

  const id = str(formData, "id");
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
    isVerified: bool(formData, "isVerified"),
    isPublished: bool(formData, "isPublished"),
  });
  if (!parsed.success) return fromZod(parsed.error);

  const { cityId, ...rest } = parsed.data;
  const stadt = cityId ? await db.city.findUnique({ where: { id: cityId }, select: { name: true } }) : null;
  const daten = {
    ...rest,
    cityId: cityId ?? null,
    // `cityName` bleibt als Freitext gefüllt, damit ältere Ansichten und die
    // Suche ohne Stadtrelation weiterhin etwas anzuzeigen haben.
    cityName: stadt?.name ?? null,
    countryCode: "CH",
  };

  // Der Slug ist die öffentliche Adresse — Kollisionen früh abfangen.
  const kollision = await db.agency.findFirst({
    where: { slug: daten.slug, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  });
  if (kollision) return fail("Diese Adresse ist bereits vergeben.", { slug: ["Bereits vergeben."] });

  const agency = id
    ? await db.agency.update({ where: { id }, data: daten })
    : await db.agency.create({ data: daten });

  // Verknüpfungen komplett ersetzen.
  const serviceIds = formData.getAll("serviceIds").map(String).filter(Boolean);
  await db.agencyService.deleteMany({ where: { agencyId: agency.id } });
  if (serviceIds.length) {
    await db.agencyService.createMany({
      data: serviceIds.map((serviceId) => ({ agencyId: agency.id, serviceId })),
      skipDuplicates: true,
    });
  }

  const languageIds = formData.getAll("languageIds").map(String).filter(Boolean);
  await db.agencyLanguage.deleteMany({ where: { agencyId: agency.id } });
  if (languageIds.length) {
    await db.agencyLanguage.createMany({
      data: languageIds.map((languageId) => ({ agencyId: agency.id, languageId })),
      skipDuplicates: true,
    });
  }

  await db.agencyHour.deleteMany({ where: { agencyId: agency.id } });
  if (!daten.isOpen24h) {
    const zeiten = [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
      const geschlossen = bool(formData, `closed_${weekday}`);
      const opensAt = str(formData, `opensAt_${weekday}`);
      const closesAt = str(formData, `closesAt_${weekday}`);
      return {
        agencyId: agency.id,
        weekday,
        closed: geschlossen || !opensAt || !closesAt,
        opensAt: opensAt ?? null,
        closesAt: closesAt ?? null,
      };
    });
    await db.agencyHour.createMany({ data: zeiten });
  }

  await log(staff.id, id ? "agency.update" : "agency.create", "Agency", agency.id);
  revalidatePath("/admin/agenturen");
  revalidatePath("/agenturen");
  revalidatePath(`/agenturen/${agency.slug}`);

  return success(id ? "Haus gespeichert." : "Haus angelegt.", { id: agency.id, slug: agency.slug });
}

export async function deleteAgencyAction(agencyId: string): Promise<ActionState> {
  const staff = await requireStaff();
  if (!staff) return fail("Keine Berechtigung.");

  const agency = await db.agency.findUnique({ where: { id: agencyId }, select: { slug: true } });
  if (!agency) return fail("Nicht gefunden.");

  // Zugeordnete Profile bleiben bestehen und verlieren nur die Zuordnung —
  // ein gelöschtes Haus darf keine Profile mitnehmen.
  await db.profile.updateMany({ where: { agencyId }, data: { agencyId: null } });
  await db.agency.delete({ where: { id: agencyId } });

  await log(staff.id, "agency.delete", "Agency", agencyId);
  revalidatePath("/admin/agenturen");
  revalidatePath("/agenturen");
  return success("Haus gelöscht.");
}

/** Prüfantrag eines Hauses entscheiden — nur die Moderation vergibt das Siegel. */
export async function reviewAgencyVerificationAction(
  verificationId: string,
  approve: boolean,
  note?: string,
): Promise<ActionState> {
  const staff = await requireStaff();
  if (!staff) return fail("Keine Berechtigung.");

  const antrag = await db.agencyVerification.findUnique({
    where: { id: verificationId },
    select: { agencyId: true, agency: { select: { name: true, slug: true, members: { select: { userId: true } } } } },
  });
  if (!antrag) return fail("Antrag nicht gefunden.");

  await db.$transaction([
    db.agencyVerification.update({
      where: { id: verificationId },
      data: {
        status: approve ? "APPROVED" : "REJECTED",
        note: note ?? null,
        reviewerId: staff.id,
        reviewedAt: new Date(),
      },
    }),
    db.agency.update({ where: { id: antrag.agencyId }, data: { isVerified: approve } }),
  ]);

  if (antrag.agency.members.length) {
    await db.notification
      .createMany({
        data: antrag.agency.members.map((m) => ({
          userId: m.userId,
          type: "VERIFICATION" as const,
          title: approve ? "Haus geprüft" : "Prüfung abgelehnt",
          body: approve
            ? "Dein Haus trägt jetzt das Geprüft-Siegel."
            : note ?? "Wir konnten die Angaben nicht bestätigen.",
          href: "/dashboard/agentur/pruefung",
        })),
      })
      .catch(() => null);
  }

  await log(staff.id, `agencyVerification:${approve ? "approve" : "reject"}`, "AgencyVerification", verificationId);
  revalidatePath("/admin/agenturen");
  revalidatePath("/agenturen");
  revalidatePath(`/agenturen/${antrag.agency.slug}`);
  return success(approve ? "Haus geprüft." : "Abgelehnt.");
}

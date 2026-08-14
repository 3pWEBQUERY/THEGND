"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { mailer } from "@/lib/mail";
import { deleteObject } from "@/lib/s3";
import { slugify } from "@/lib/utils";
import { CREDIT_COSTS } from "@/lib/constants";
import {
  profileAppearanceSchema,
  profileBasicsSchema,
  profileContactSchema,
  profileLocationSchema,
  profilePricingSchema,
  memberOnboardingSchema,
  memberProfileSchema,
} from "@/lib/validators";
import { type ActionState, bool, fail, fromZod, num, str, strList, success } from "@/server/action-utils";
import { spendCredits } from "@/server/credits";

type OwnProfileResult =
  | { ok: false; error: ActionState }
  | {
      ok: true;
      user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
      profile: NonNullable<Awaited<ReturnType<typeof db.profile.findUnique>>>;
    };

/**
 * Auflösung des zu bearbeitenden Inserats.
 *
 * Ohne `profileId` das eigene — so verhalten sich alle Aktionen für
 * Anbieterinnen unverändert. Mit `profileId` das Inserat eines Models, sofern
 * die angemeldete Person das zugehörige Haus verwaltet (OWNER oder MANAGER).
 * Damit greifen beide Wege auf denselben Code zu, statt ihn zu verdoppeln.
 */
async function editableProfile(profileId?: string | null): Promise<OwnProfileResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: fail("Nicht angemeldet.") };

  const profile = profileId
    ? await db.profile.findUnique({ where: { id: profileId } })
    : await db.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return { ok: false, error: fail("Kein Profil gefunden.") };

  if (profile.userId === user.id) return { ok: true, user, profile };

  if (profile.agencyId) {
    const mitglied = await db.agencyMember.findFirst({
      where: { userId: user.id, agencyId: profile.agencyId },
      select: { role: true },
    });
    if (mitglied && (mitglied.role === "OWNER" || mitglied.role === "MANAGER")) {
      return { ok: true, user, profile };
    }
  }

  return { ok: false, error: fail("Keine Berechtigung für dieses Inserat.") };
}

/** Kurzform für Aktionen, die das Ziel aus dem Formular lesen. */
const ownProfile = (formData?: FormData) =>
  editableProfile(formData ? str(formData, "profileId") : undefined);

async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base) || "profil";
  let candidate = root;
  let n = 1;
  while (true) {
    const existing = await db.profile.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${root}-${++n}`;
  }
}

// ── Profil anlegen (Onboarding) ──────────────────────────────────────────────

export async function createProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Nicht angemeldet.");

  const existing = await db.profile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (existing) redirect("/dashboard/profil");

  const parsed = profileBasicsSchema.safeParse({
    displayName: str(formData, "displayName"),
    headline: str(formData, "headline"),
    about: str(formData, "about"),
    gender: str(formData, "gender"),
    kind: str(formData, "kind") ?? "INDEPENDENT",
    orientation: str(formData, "orientation") || undefined,
    birthDate: str(formData, "birthDate"),
    nationality: str(formData, "nationality"),
  });
  if (!parsed.success) return fromZod(parsed.error);

  const birthDate = parsed.data.birthDate ? new Date(parsed.data.birthDate) : null;
  if (birthDate) {
    const age = (Date.now() - birthDate.getTime()) / 31557600000;
    if (age < 18)
      return fail("Du musst mindestens 18 Jahre alt sein.", {
        birthDate: ["Mindestalter 18."],
      });
    if (age > 90)
      return fail("Bitte prüfe dein Geburtsdatum.", {
        birthDate: ["Ungültig."],
      });
  }

  const cityId = str(formData, "cityId") || null;

  const profile = await db.profile.create({
    data: {
      userId: user.id,
      slug: await uniqueSlug(parsed.data.displayName),
      displayName: parsed.data.displayName,
      headline: parsed.data.headline,
      about: parsed.data.about,
      gender: parsed.data.gender,
      kind: parsed.data.kind,
      orientation: parsed.data.orientation,
      birthDate,
      displayAge: birthDate ? Math.floor((Date.now() - birthDate.getTime()) / 31557600000) : null,
      nationality: parsed.data.nationality,
      cityId,
      status: "DRAFT",
      verification: { create: {} },
    },
  });

  if (user.role === "MEMBER") {
    await db.user.update({ where: { id: user.id }, data: { role: "ESCORT" } });
  }

  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/profil?created=1&id=${profile.id}`);
}

// ── Profil bearbeiten ────────────────────────────────────────────────────────

export async function updateBasicsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await ownProfile(formData);
  if (!ctx.ok) return ctx.error;

  const parsed = profileBasicsSchema.safeParse({
    displayName: str(formData, "displayName"),
    headline: str(formData, "headline"),
    about: str(formData, "about"),
    gender: str(formData, "gender"),
    kind: str(formData, "kind"),
    orientation: str(formData, "orientation") || undefined,
    birthDate: str(formData, "birthDate"),
    nationality: str(formData, "nationality"),
  });
  if (!parsed.success) return fromZod(parsed.error);

  const birthDate = parsed.data.birthDate ? new Date(parsed.data.birthDate) : null;
  if (birthDate && (Date.now() - birthDate.getTime()) / 31557600000 < 18) {
    return fail("Mindestalter 18 Jahre.", { birthDate: ["Mindestalter 18."] });
  }

  await db.profile.update({
    where: { id: ctx.profile.id },
    data: {
      displayName: parsed.data.displayName,
      headline: parsed.data.headline,
      about: parsed.data.about,
      aboutEn: str(formData, "aboutEn") || null,
      gender: parsed.data.gender,
      kind: parsed.data.kind,
      orientation: parsed.data.orientation,
      birthDate,
      displayAge:
        num(formData, "displayAge") ??
        (birthDate ? Math.floor((Date.now() - birthDate.getTime()) / 31557600000) : null),
      nationality: parsed.data.nationality,
      metaTitle: str(formData, "metaTitle") || null,
      metaDescription: str(formData, "metaDescription") || null,
    },
  });

  revalidatePath("/dashboard/profil");
  return success("Grunddaten gespeichert.");
}

export async function updateSeoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await ownProfile(formData);
  if (!ctx.ok) return ctx.error;

  await db.profile.update({
    where: { id: ctx.profile.id },
    data: {
      metaTitle: str(formData, "metaTitle")?.slice(0, 60) || null,
      metaDescription: str(formData, "metaDescription")?.slice(0, 160) || null,
    },
  });

  revalidatePath("/dashboard/profil");
  return success("SEO-Angaben gespeichert.");
}

export async function updateAppearanceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await ownProfile(formData);
  if (!ctx.ok) return ctx.error;

  const parsed = profileAppearanceSchema.safeParse({
    heightCm: str(formData, "heightCm"),
    weightKg: str(formData, "weightKg"),
    bodyType: str(formData, "bodyType") || undefined,
    cupSize: str(formData, "cupSize"),
    breastType: str(formData, "breastType") || undefined,
    dressSize: str(formData, "dressSize"),
    shoeSize: str(formData, "shoeSize"),
    hairColor: str(formData, "hairColor") || undefined,
    hairLength: str(formData, "hairLength") || undefined,
    eyeColor: str(formData, "eyeColor") || undefined,
    ethnicity: str(formData, "ethnicity") || undefined,
    pubicHair: str(formData, "pubicHair") || undefined,
    smoker: str(formData, "smoker") || undefined,
    tattoos: bool(formData, "tattoos"),
    piercings: bool(formData, "piercings"),
  });
  if (!parsed.success) return fromZod(parsed.error);

  await db.profile.update({ where: { id: ctx.profile.id }, data: parsed.data });
  revalidatePath("/dashboard/profil");
  return success("Aussehen gespeichert.");
}

export async function updateContactAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await ownProfile(formData);
  if (!ctx.ok) return ctx.error;

  const parsed = profileContactSchema.safeParse({
    phone: str(formData, "phone"),
    showPhone: bool(formData, "showPhone"),
    whatsapp: str(formData, "whatsapp"),
    telegram: str(formData, "telegram"),
    website: str(formData, "website"),
    instagram: str(formData, "instagram"),
    onlyfans: str(formData, "onlyfans"),
    contactNote: str(formData, "contactNote"),
  });
  if (!parsed.success) return fromZod(parsed.error);

  await db.profile.update({ where: { id: ctx.profile.id }, data: parsed.data });
  revalidatePath("/dashboard/profil");
  return success("Kontaktdaten gespeichert.");
}

export async function updateLocationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await ownProfile(formData);
  if (!ctx.ok) return ctx.error;

  const parsed = profileLocationSchema.safeParse({
    cityId: str(formData, "cityId") || undefined,
    // Aus dem Karten-Picker. Leer bedeutet „gelöscht“, nicht „unverändert“.
    lat: str(formData, "lat") || null,
    lng: str(formData, "lng") || null,
    district: str(formData, "district"),
    zip: str(formData, "zip"),
    street: str(formData, "street"),
    showAddress: bool(formData, "showAddress"),
    radiusKm: str(formData, "radiusKm"),
    meetingPlace: str(formData, "meetingPlace") ?? "BOTH",
    travelsWorldwide: bool(formData, "travelsWorldwide"),
  });
  if (!parsed.success) return fromZod(parsed.error);

  await db.profile.update({
    where: { id: ctx.profile.id },
    data: {
      ...parsed.data,
      hasCar: bool(formData, "hasCar"),
      acceptsCouples: bool(formData, "acceptsCouples"),
    },
  });
  revalidatePath("/dashboard/profil");
  return success("Standort gespeichert.");
}

export async function updatePricingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await ownProfile(formData);
  if (!ctx.ok) return ctx.error;

  const parsed = profilePricingSchema.safeParse({
    currency: str(formData, "currency") ?? "CHF",
    priceHalfHour: str(formData, "priceHalfHour"),
    priceHour: str(formData, "priceHour"),
    priceTwoHours: str(formData, "priceTwoHours"),
    priceNight: str(formData, "priceNight"),
    priceNote: str(formData, "priceNote"),
  });
  if (!parsed.success) return fromZod(parsed.error);

  // Zusätzliche Preisstaffeln (dynamische Zeilen)
  const minutes = strList(formData, "rateMinutes");
  const prices = strList(formData, "ratePrice");
  const places = strList(formData, "ratePlace");

  await db.$transaction([
    db.profile.update({ where: { id: ctx.profile.id }, data: parsed.data }),
    db.rate.deleteMany({ where: { profileId: ctx.profile.id } }),
    ...(minutes.length
      ? [
          db.rate.createMany({
            data: minutes
              .map((m, i) => ({
                profileId: ctx.profile.id,
                minutes: Number(m),
                price: Number(prices[i] ?? 0),
                place: (places[i] ?? "BOTH") as never,
                position: i,
              }))
              .filter((r) => r.minutes > 0 && r.price > 0),
          }),
        ]
      : []),
  ]);

  revalidatePath("/dashboard/profil");
  return success("Preise gespeichert.");
}

export async function updateServicesAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await ownProfile(formData);
  if (!ctx.ok) return ctx.error;

  const serviceIds = strList(formData, "serviceId");

  await db.$transaction([
    db.profileService.deleteMany({ where: { profileId: ctx.profile.id } }),
    ...(serviceIds.length
      ? [
          db.profileService.createMany({
            data: serviceIds.map((serviceId) => ({
              profileId: ctx.profile.id,
              serviceId,
              extraCost: num(formData, `extra_${serviceId}`) ?? null,
            })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);

  revalidatePath("/dashboard/profil");
  return success("Services gespeichert.");
}

export async function updateLanguagesAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await ownProfile(formData);
  if (!ctx.ok) return ctx.error;

  const languageIds = strList(formData, "languageId");

  await db.$transaction([
    db.profileLanguage.deleteMany({ where: { profileId: ctx.profile.id } }),
    ...(languageIds.length
      ? [
          db.profileLanguage.createMany({
            data: languageIds.map((languageId) => ({
              profileId: ctx.profile.id,
              languageId,
              level: num(formData, `level_${languageId}`) ?? 3,
            })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);

  revalidatePath("/dashboard/profil");
  return success("Sprachen gespeichert.");
}

export async function updateWorkingHoursAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await ownProfile(formData);
  if (!ctx.ok) return ctx.error;

  const rows = Array.from({ length: 7 }, (_, weekday) => ({
    profileId: ctx.profile.id,
    weekday,
    from: str(formData, `from_${weekday}`) || "10:00",
    to: str(formData, `to_${weekday}`) || "22:00",
    closed: bool(formData, `closed_${weekday}`),
  }));

  await db.$transaction([
    db.workingHour.deleteMany({ where: { profileId: ctx.profile.id } }),
    db.workingHour.createMany({ data: rows }),
  ]);

  revalidatePath("/dashboard/verfuegbarkeit");
  return success("Erreichbarkeit gespeichert.");
}

// ── Touren ───────────────────────────────────────────────────────────────────

export async function createTourAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await ownProfile(formData);
  if (!ctx.ok) return ctx.error;

  const cityId = str(formData, "cityId");
  const from = str(formData, "from");
  const to = str(formData, "to");
  if (!cityId || !from || !to) return fail("Bitte Stadt und Zeitraum angeben.");
  if (new Date(to) < new Date(from)) return fail("Das Enddatum liegt vor dem Startdatum.");

  await db.tour.create({
    data: {
      profileId: ctx.profile.id,
      cityId,
      from: new Date(from),
      to: new Date(to),
      note: str(formData, "note") || null,
    },
  });

  revalidatePath("/dashboard/touren");
  return success("Tour hinzugefügt.");
}

/** Wird als Formular-Aktion gebunden; das Ziel-Inserat kommt aus dem Formular. */
export async function deleteTourAction(tourId: string, formData?: FormData) {
  const ctx = await ownProfile(formData);
  if (!ctx.ok) return;
  await db.tour.deleteMany({
    where: { id: tourId, profileId: ctx.profile.id },
  });
  revalidatePath("/dashboard/touren");
}

// ── Medien ───────────────────────────────────────────────────────────────────

export async function addMediaAction(payload: {
  key: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  width?: number;
  height?: number;
  sizeBytes?: number;
  mimeType?: string;
  /** Ziel-Inserat — ohne Angabe das eigene. */
  profileId?: string;
}): Promise<ActionState> {
  const ctx = await editableProfile(payload.profileId);
  if (!ctx.ok) return ctx.error;

  const count = await db.media.count({ where: { profileId: ctx.profile.id } });
  if (count >= 60) return fail("Maximal 60 Medien pro Profil.");

  await db.media.create({
    data: {
      profileId: ctx.profile.id,
      key: payload.key,
      url: payload.url,
      thumbUrl: payload.url,
      type: payload.type,
      width: payload.width,
      height: payload.height,
      sizeBytes: payload.sizeBytes,
      mimeType: payload.mimeType,
      position: count,
      isCover: count === 0,
      moderation: "PENDING",
    },
  });

  revalidatePath("/dashboard/medien");
  return success("Datei hochgeladen — wird geprüft.");
}

export async function deleteMediaAction(mediaId: string, profileId?: string): Promise<ActionState> {
  const ctx = await editableProfile(profileId);
  if (!ctx.ok) return ctx.error;

  const media = await db.media.findFirst({
    where: { id: mediaId, profileId: ctx.profile.id },
  });
  if (!media) return fail("Datei nicht gefunden.");

  await db.media.delete({ where: { id: mediaId } });
  await deleteObject(media.key);

  revalidatePath("/dashboard/medien");
  return success("Datei gelöscht.");
}

export async function setCoverAction(mediaId: string, profileId?: string): Promise<ActionState> {
  const ctx = await editableProfile(profileId);
  if (!ctx.ok) return ctx.error;

  await db.$transaction([
    db.media.updateMany({
      where: { profileId: ctx.profile.id },
      data: { isCover: false },
    }),
    db.media.updateMany({
      where: { id: mediaId, profileId: ctx.profile.id },
      data: { isCover: true },
    }),
  ]);

  revalidatePath("/dashboard/medien");
  return success("Titelbild gesetzt.");
}

export async function updateMediaVisibilityAction(
  mediaId: string,
  visibility: "PUBLIC" | "MEMBERS" | "PRIVATE",
  unlockCost = 0,
  profileId?: string,
): Promise<ActionState> {
  const ctx = await editableProfile(profileId);
  if (!ctx.ok) return ctx.error;

  await db.media.updateMany({
    where: { id: mediaId, profileId: ctx.profile.id },
    data: {
      visibility,
      unlockCost: visibility === "PRIVATE" ? Math.max(0, unlockCost) : 0,
    },
  });

  revalidatePath("/dashboard/medien");
  return success("Sichtbarkeit aktualisiert.");
}

export async function reorderMediaAction(orderedIds: string[], profileId?: string): Promise<ActionState> {
  const ctx = await editableProfile(profileId);
  if (!ctx.ok) return ctx.error;

  await db.$transaction(
    orderedIds.map((id, position) =>
      db.media.updateMany({
        where: { id, profileId: ctx.profile.id },
        data: { position },
      }),
    ),
  );

  revalidatePath("/dashboard/medien");
  return success();
}

// ── Status ───────────────────────────────────────────────────────────────────

export async function publishProfileAction(profileId?: string): Promise<ActionState> {
  const ctx = await editableProfile(profileId);
  if (!ctx.ok) return ctx.error;

  const mediaCount = await db.media.count({
    where: { profileId: ctx.profile.id },
  });
  if (mediaCount === 0) return fail("Bitte lade mindestens ein Foto hoch, bevor du veröffentlichst.");
  if (!ctx.profile.cityId) return fail("Bitte hinterlege deine Stadt.");
  if (!ctx.profile.about || ctx.profile.about.length < 50)
    return fail("Bitte schreibe mindestens 50 Zeichen über dich.");

  await db.profile.update({
    where: { id: ctx.profile.id },
    data: {
      status: "PENDING_REVIEW",
      publishedAt: ctx.profile.publishedAt ?? new Date(),
    },
  });

  revalidatePath("/dashboard", "layout");
  return success("Profil eingereicht. Wir prüfen es meist innerhalb von 2 Stunden.");
}

export async function toggleProfileStatusAction(profileId?: string): Promise<ActionState> {
  const ctx = await editableProfile(profileId);
  if (!ctx.ok) return ctx.error;

  const next = ctx.profile.status === "ACTIVE" ? "PAUSED" : ctx.profile.status === "PAUSED" ? "ACTIVE" : null;
  if (!next) return fail("Profil kann in diesem Status nicht umgeschaltet werden.");

  await db.profile.update({
    where: { id: ctx.profile.id },
    data: { status: next },
  });
  revalidatePath("/dashboard", "layout");
  return success(next === "ACTIVE" ? "Profil ist wieder online." : "Profil pausiert.");
}

// ── Sichtbarkeit / Boosts ────────────────────────────────────────────────────

const BOOST_CONFIG = {
  BUMP: { credits: CREDIT_COSTS.BUMP, hours: 0 },
  TOP_LISTING: { credits: CREDIT_COSTS.TOP_LISTING_DAY, hours: 24 },
  SPOTLIGHT: { credits: CREDIT_COSTS.SPOTLIGHT_DAY, hours: 24 },
  HIGHLIGHT: { credits: CREDIT_COSTS.HIGHLIGHT_WEEK, hours: 168 },
  STORY_PIN: { credits: CREDIT_COSTS.STORY_PIN, hours: 24 },
  BANNER: { credits: CREDIT_COSTS.BANNER_DAY, hours: 24 },
} as const;

export async function purchaseBoostAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await ownProfile(formData);
  if (!ctx.ok) return ctx.error;
  if (ctx.profile.status !== "ACTIVE") return fail("Dein Profil muss online sein, um Werbung zu buchen.");

  const type = str(formData, "type") as keyof typeof BOOST_CONFIG | undefined;
  if (!type || !(type in BOOST_CONFIG)) return fail("Unbekanntes Werbeprodukt.");

  const days = Math.min(30, Math.max(1, num(formData, "days") ?? 1));
  const config = BOOST_CONFIG[type];
  const totalCredits = type === "BUMP" ? config.credits : config.credits * days;

  const spent = await spendCredits(ctx.user.id, totalCredits, `Werbung: ${type} (${days} Tag(e))`);
  if (!spent.ok) return fail(spent.message);

  if (type === "BUMP") {
    await db.profile.update({
      where: { id: ctx.profile.id },
      data: { bumpedAt: new Date(), rankScore: { increment: 5 } },
    });
  } else {
    const hours = config.hours * days;
    await db.boost.create({
      data: {
        profileId: ctx.profile.id,
        type,
        cityId: ctx.profile.cityId,
        endsAt: new Date(Date.now() + hours * 36e5),
        credits: totalCredits,
      },
    });
    if (type === "SPOTLIGHT" || type === "TOP_LISTING") {
      await db.profile.update({
        where: { id: ctx.profile.id },
        data: { isFeatured: true, rankScore: { increment: 25 } },
      });
    }
  }

  await db.notification.create({
    data: {
      userId: ctx.user.id,
      type: "BOOST",
      title: "Werbung aktiviert",
      body: `${type} für ${days} Tag(e) — ${totalCredits} Credits.`,
      href: "/dashboard/werbung",
    },
  });

  revalidatePath("/dashboard/werbung");
  return success(`Aktiviert! ${totalCredits} Credits abgebucht.`);
}

// ── Verifizierung ────────────────────────────────────────────────────────────

export async function submitVerificationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  // Bewusst ohne Ziel-Inserat: Ausweisdokumente reicht nur die Person selbst
  // ein, nicht ihr Haus.
  const ctx = await editableProfile();
  if (!ctx.ok) return ctx.error;

  const idFrontKey = str(formData, "idFrontKey");
  const selfieKey = str(formData, "selfieKey");
  if (!idFrontKey || !selfieKey) return fail("Bitte lade Ausweis und Selfie hoch.");

  await db.verification.upsert({
    where: { profileId: ctx.profile.id },
    update: {
      idFrontKey,
      idBackKey: str(formData, "idBackKey") || null,
      selfieKey,
      legalName: str(formData, "legalName") || null,
      birthDate: str(formData, "birthDate") ? new Date(str(formData, "birthDate")!) : null,
      documentNo: str(formData, "documentNo") || null,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
    create: {
      profileId: ctx.profile.id,
      idFrontKey,
      idBackKey: str(formData, "idBackKey") || null,
      selfieKey,
      legalName: str(formData, "legalName") || null,
      birthDate: str(formData, "birthDate") ? new Date(str(formData, "birthDate")!) : null,
      documentNo: str(formData, "documentNo") || null,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  revalidatePath("/dashboard/verifizierung");
  return success("Unterlagen eingereicht. Wir melden uns innerhalb von 24 Stunden.");
}

// ── Konto-Einstellungen ──────────────────────────────────────────────────────


export async function updateAccountAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Nicht angemeldet.");

  await db.user.update({
    where: { id: user.id },
    data: {
      phone: str(formData, "phone") || null,
      timezone: str(formData, "timezone") ?? "Europe/Zurich",
      newsletterOptIn: bool(formData, "newsletterOptIn"),
      marketingOptIn: bool(formData, "marketingOptIn"),
    },
  });

  revalidatePath("/dashboard/einstellungen");
  return success("Einstellungen gespeichert.");
}

export async function notifyProfileApproved(profileId: string) {
  const profile = await db.profile.findUnique({
    where: { id: profileId },
    select: { slug: true, user: { select: { email: true } } },
  });
  if (profile) await mailer.profileApproved(profile.user.email, profile.slug);
}

// ── Mitgliedskonto ───────────────────────────────────────────────────────────

/**
 * Willkommensschritt für Mitglieder.
 *
 * Ein Mitglied ist Gast, keine Anbieterin — es legt kein Inserat an, sondern
 * richtet sein Konto ein: Anzeigename, Bild, Sprache, Benachrichtigungen.
 * Genau die Felder, die ein Gastkonto überhaupt besitzt.
 */
export async function completeMemberOnboardingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Nicht angemeldet.");

  const parsed = memberOnboardingSchema.safeParse({
    displayName: str(formData, "displayName") ?? "",
    avatarUrl: str(formData, "avatarUrl"),
    locale: str(formData, "locale") ?? "de",
    newsletterOptIn: bool(formData, "newsletterOptIn"),
    marketingOptIn: bool(formData, "marketingOptIn"),
  });
  if (!parsed.success) return fromZod(parsed.error);

  await db.user.update({
    where: { id: user.id },
    data: {
      ...parsed.data,
      // Der Willkommensschritt gilt damit als erledigt.
      onboardedAt: new Date(),
    },
  });

  revalidatePath("/dashboard", "layout");
  return success("Konto eingerichtet.");
}

/**
 * Persönliches Profil des Kontos.
 *
 * Name, Bild und Sprache — wie man auf der Seite auftritt, unabhängig vom
 * Inserat. Für Mitglieder ist das ihr ganzes Profil; Anbieterinnen führen
 * daneben ihr Inserat, das eigene Felder hat.
 */
export async function updateMemberProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Nicht angemeldet.");

  const parsed = memberProfileSchema.safeParse({
    displayName: str(formData, "displayName") ?? "",
    avatarUrl: str(formData, "avatarUrl"),
    locale: str(formData, "locale") ?? "de",
  });
  if (!parsed.success) return fromZod(parsed.error);

  await db.user.update({ where: { id: user.id }, data: parsed.data });

  revalidatePath("/dashboard", "layout");
  return success("Profil gespeichert.");
}

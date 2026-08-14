"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, randomToken } from "@/lib/auth";
import { reportSchema } from "@/lib/validators";
import { type ActionState, fail, fromZod, rateLimit, str, success } from "@/server/action-utils";

export async function subscribeNewsletterAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = str(formData, "email")?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) return fail("Bitte gib eine gültige E-Mail-Adresse ein.");

  const limited = rateLimit(`nl:${email}`, 3, 60 * 60_000);
  if (!limited.ok) return fail("Zu viele Versuche.");

  await db.newsletterSubscriber.upsert({
    where: { email },
    update: {},
    create: { email, token: randomToken(16) },
  });

  return success("Danke! Bitte bestätige den Link in deiner E-Mail.");
}

export async function reportAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  const parsed = reportSchema.safeParse({
    targetType: str(formData, "targetType"),
    targetId: str(formData, "targetId"),
    reason: str(formData, "reason"),
    details: str(formData, "details"),
  });
  if (!parsed.success) return fromZod(parsed.error);

  const limited = rateLimit(`report:${user?.id ?? "anon"}`, 10, 60 * 60_000);
  if (!limited.ok) return fail("Zu viele Meldungen in kurzer Zeit.");

  await db.report.create({
    data: { ...parsed.data, reporterId: user?.id ?? null },
  });

  return success("Danke für deine Meldung. Unser Team prüft den Fall.");
}

/**
 * Eine einzelne Benachrichtigung als gelesen vermerken.
 *
 * Wird beim Anklicken ausgelöst — wer sie geöffnet hat, hat sie gesehen.
 * Die Besitzprüfung steckt in der Bedingung: fremde Einträge trifft das
 * `updateMany` schlicht nicht.
 */
export async function markNotificationReadAction(id: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Nicht angemeldet.");

  const treffer = await db.notification.updateMany({
    where: { id, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  // Nur neu rechnen, wenn sich wirklich etwas geändert hat — sonst flackert
  // die Liste bei jedem Klick auf bereits Gelesenes.
  if (treffer.count > 0) revalidatePath("/dashboard", "layout");
  return success();
}

export async function markNotificationsReadAction(): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Nicht angemeldet.");
  await db.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/dashboard", "layout");
  return success();
}

export async function saveSearchAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Bitte melde dich an, um Suchen zu speichern.");

  const name = str(formData, "name")?.trim();
  const query = str(formData, "query");
  if (!name || !query) return fail("Name und Suchparameter fehlen.");

  await db.savedSearch.create({
    data: {
      userId: user.id,
      name: name.slice(0, 60),
      query: Object.fromEntries(new URLSearchParams(query)),
      alertMail: str(formData, "alertMail") === "on",
    },
  });

  revalidatePath("/dashboard/suchen");
  return success("Suche gespeichert.");
}

export async function deleteSavedSearchAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await db.savedSearch.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard/suchen");
}

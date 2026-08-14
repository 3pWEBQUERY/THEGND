"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { aufraeumenAbgelaufene, eigeneStoryQuelle } from "@/server/queries/stories";
import { fail, fromZod, str, success, type ActionState } from "@/server/action-utils";
import { deleteObject, keyFromPublicUrl } from "@/lib/s3";

/**
 * Stories veröffentlichen, löschen, als gesehen melden.
 *
 * Wer posten darf, entscheidet `eigeneStoryQuelle` — Mitgliedskonten sind
 * dort nicht vorgesehen. Eine Obergrenze gibt es nicht; alles, was innerhalb
 * von 24 Stunden entsteht, läuft beim Anschauen als eine Abfolge.
 */

const DAUER_MS = 24 * 60 * 60 * 1000;

const storySchema = z.object({
  mediaUrl: z.string().min(1, "Bitte lade zuerst ein Bild oder Video hoch."),
  mediaType: z.enum(["IMAGE", "VIDEO"]).default("IMAGE"),
  caption: z
    .string()
    .trim()
    .max(200, "Höchstens 200 Zeichen.")
    .optional()
    .transform((wert) => wert || null),
});

export async function createStoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const quelle = await eigeneStoryQuelle();
  if (!quelle) return fail("Stories können nur Anbieterinnen und Häuser veröffentlichen.");

  const parsed = storySchema.safeParse({
    mediaUrl: str(formData, "mediaUrl") ?? "",
    mediaType: str(formData, "mediaType") ?? "IMAGE",
    caption: str(formData, "caption"),
  });
  if (!parsed.success) return fromZod(parsed.error);

  await db.story.create({
    data: {
      ...(quelle.art === "PROFILE" ? { profileId: quelle.id } : { agencyId: quelle.id }),
      mediaUrl: parsed.data.mediaUrl,
      mediaType: parsed.data.mediaType,
      caption: parsed.data.caption,
      expiresAt: new Date(Date.now() + DAUER_MS),
    },
  });

  // Gelegenheit nutzen: was abgelaufen ist, kann weg.
  await aufraeumenAbgelaufene(quelle);

  revalidatePath("/feed");
  revalidatePath("/dashboard/stories");
  return success("Story veröffentlicht — 24 Stunden sichtbar.");
}

export async function deleteStoryAction(storyId: string): Promise<ActionState> {
  const quelle = await eigeneStoryQuelle();
  if (!quelle) return fail("Keine Berechtigung.");

  const story = await db.story.findUnique({
    where: { id: storyId },
    select: { profileId: true, agencyId: true, mediaUrl: true },
  });
  if (!story) return fail("Story nicht gefunden.");

  const eigene = quelle.art === "PROFILE" ? story.profileId === quelle.id : story.agencyId === quelle.id;
  if (!eigene) return fail("Das ist nicht deine Story.");

  await db.story.delete({ where: { id: storyId } });

  // Die Datei mitnehmen — sonst bleibt sie unerreichbar im Bucket liegen.
  const key = keyFromPublicUrl(story.mediaUrl);
  if (key?.startsWith("story/")) await deleteObject(key);

  revalidatePath("/feed");
  revalidatePath("/dashboard/stories");
  return success("Story gelöscht.");
}

/**
 * Gesehen-Vermerk.
 *
 * Ohne Anmeldung wird nichts gespeichert — die Story bleibt trotzdem
 * sichtbar. Der eigene Blick zählt nicht mit.
 */
export async function markStorySeenAction(storyId: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return success();

  const story = await db.story.findUnique({
    where: { id: storyId },
    select: { profile: { select: { userId: true } }, agency: { select: { members: { select: { userId: true } } } } },
  });
  if (!story) return fail("Story nicht gefunden.");

  const eigene =
    story.profile?.userId === user.id ||
    Boolean(story.agency?.members.some((mitglied) => mitglied.userId === user.id));
  if (eigene) return success();

  await db.storyView.upsert({
    where: { storyId_userId: { storyId, userId: user.id } },
    update: {},
    create: { storyId, userId: user.id },
  });

  return success();
}

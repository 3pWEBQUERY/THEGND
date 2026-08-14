import "server-only";

import { cache } from "react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { eigeneMitgliedschaft, darfBearbeiten } from "@/server/queries/agency-access";
import { deleteObject, keyFromPublicUrl } from "@/lib/s3";

/**
 * Stories — flüchtige Beiträge, 24 Stunden sichtbar.
 *
 * Gebündelt wird beim Lesen: alles, was ein Urheber innerhalb seiner
 * 24 Stunden gepostet hat, erscheint als eine Kachel und läuft im Betrachter
 * als Abfolge durch. Postet er nach, wächst dieselbe Kachel — es entsteht
 * keine zweite daneben.
 */

export type StoryTeil = {
  id: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO" | "AUDIO";
  caption: string | null;
  createdAt: string;
  /** Wie oft angesehen — nur für den Urheber gefüllt. */
  views: number;
  gesehen: boolean;
};

export type StoryBuendel = {
  /** Stabiler Schlüssel des Urhebers, etwa `profile:cly…`. */
  key: string;
  art: "PROFILE" | "AGENCY";
  name: string;
  href: string;
  bildUrl: string | null;
  isVerified: boolean;
  /** Gehört dem angemeldeten Konto — dann Löschen und Reichweite sichtbar. */
  eigene: boolean;
  /** Alle Teile ungesehen? Bestimmt die Hervorhebung der Kachel. */
  ungesehen: boolean;
  teile: StoryTeil[];
};

/** Wer darf posten — und unter welchem Namen? */
export type StoryQuelle = {
  art: "PROFILE" | "AGENCY";
  id: string;
  name: string;
  bildUrl: string | null;
};

/**
 * Kann das angemeldete Konto Stories veröffentlichen?
 *
 * Mitgliedskonten nicht — sie schauen zu. Anbieterinnen posten unter ihrem
 * Inserat, Häuser unter dem Haus. Wer beides führt, postet unter dem Haus:
 * dort steht die Reichweite.
 */
export const eigeneStoryQuelle = cache(async (): Promise<StoryQuelle | null> => {
  const user = await getCurrentUser();
  if (!user || user.role === "MEMBER") return null;

  const mitgliedschaft = await eigeneMitgliedschaft();
  if (mitgliedschaft && darfBearbeiten(mitgliedschaft.rolle)) {
    const haus = await db.agency.findUnique({
      where: { id: mitgliedschaft.agencyId },
      select: { id: true, name: true, logoUrl: true },
    });
    if (haus) return { art: "AGENCY", id: haus.id, name: haus.name, bildUrl: haus.logoUrl };
  }

  if (user.profileId) {
    const profil = await db.profile.findUnique({
      where: { id: user.profileId },
      select: {
        id: true,
        displayName: true,
        status: true,
        media: {
          where: { moderation: "APPROVED" },
          orderBy: { position: "asc" },
          take: 1,
          select: { thumbUrl: true, url: true },
        },
      },
    });
    // Ein archiviertes Inserat ist nirgends sichtbar — dann auch keine Story.
    if (profil && profil.status !== "ARCHIVED") {
      return {
        art: "PROFILE",
        id: profil.id,
        name: profil.displayName,
        bildUrl: profil.media[0]?.thumbUrl ?? profil.media[0]?.url ?? null,
      };
    }
  }

  return null;
});

/**
 * Alle laufenden Stories, nach Urheber gebündelt.
 *
 * Reihenfolge wie gewohnt: eigene zuerst, dann ungesehene, dann der Rest —
 * jeweils die neueste zuoberst.
 */
export async function storyBuendel(nur?: { art: "PROFILE" | "AGENCY"; id: string }): Promise<StoryBuendel[]> {
  const user = await getCurrentUser();

  const stories = await db.story.findMany({
    where: {
      expiresAt: { gt: new Date() },
      ...(nur
        ? nur.art === "PROFILE"
          ? { profileId: nur.id, profile: { status: "ACTIVE" } }
          : { agencyId: nur.id, agency: { isPublished: true } }
        : { OR: [{ profile: { status: "ACTIVE" } }, { agency: { isPublished: true } }] }),
    },
    orderBy: { createdAt: "asc" },
    take: 400,
    select: {
      id: true,
      mediaUrl: true,
      mediaType: true,
      caption: true,
      createdAt: true,
      profile: {
        select: {
          id: true,
          slug: true,
          displayName: true,
          isVerified: true,
          userId: true,
          media: {
            where: { moderation: "APPROVED" },
            orderBy: { position: "asc" },
            take: 1,
            select: { thumbUrl: true, url: true },
          },
        },
      },
      agency: { select: { id: true, slug: true, name: true, isVerified: true, logoUrl: true } },
      _count: { select: { views: true } },
      views: user ? { where: { userId: user.id }, select: { storyId: true } } : false,
    },
  });

  const eigenesHaus = user ? await eigeneMitgliedschaft() : null;

  const buendel = new Map<string, StoryBuendel>();

  for (const story of stories) {
    const urheber = story.profile
      ? {
          key: `profile:${story.profile.id}`,
          art: "PROFILE" as const,
          name: story.profile.displayName,
          href: `/escort/${story.profile.slug}`,
          bildUrl: story.profile.media[0]?.thumbUrl ?? story.profile.media[0]?.url ?? null,
          isVerified: story.profile.isVerified,
          eigene: Boolean(user && story.profile.userId === user.id),
        }
      : story.agency
        ? {
            key: `agency:${story.agency.id}`,
            art: "AGENCY" as const,
            name: story.agency.name,
            href: `/agenturen/${story.agency.slug}`,
            bildUrl: story.agency.logoUrl,
            isVerified: story.agency.isVerified,
            eigene: Boolean(eigenesHaus && eigenesHaus.agencyId === story.agency.id),
          }
        : null;
    if (!urheber) continue;

    const gesehen = Array.isArray(story.views) ? story.views.length > 0 : false;

    const vorhanden = buendel.get(urheber.key) ?? { ...urheber, ungesehen: false, teile: [] };
    vorhanden.teile.push({
      id: story.id,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      caption: story.caption,
      createdAt: story.createdAt.toISOString(),
      views: urheber.eigene ? story._count.views : 0,
      gesehen,
    });
    buendel.set(urheber.key, vorhanden);
  }

  const liste = [...buendel.values()].map((eintrag) => ({
    ...eintrag,
    // Die eigene Kachel bleibt ruhig: den eigenen Beitrag kennt man.
    ungesehen: !eintrag.eigene && eintrag.teile.some((teil) => !teil.gesehen),
  }));

  return liste.sort((a, b) => {
    if (a.eigene !== b.eigene) return a.eigene ? -1 : 1;
    if (a.ungesehen !== b.ungesehen) return a.ungesehen ? -1 : 1;
    const letzte = (eintrag: StoryBuendel) => eintrag.teile[eintrag.teile.length - 1]!.createdAt;
    return letzte(b).localeCompare(letzte(a));
  });
}

/** Die laufenden Stories eines Urhebers — für die Verwaltung im Dashboard. */
export async function eigeneStories(quelle: StoryQuelle) {
  return db.story.findMany({
    where: {
      expiresAt: { gt: new Date() },
      ...(quelle.art === "PROFILE" ? { profileId: quelle.id } : { agencyId: quelle.id }),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      mediaUrl: true,
      mediaType: true,
      caption: true,
      createdAt: true,
      expiresAt: true,
      _count: { select: { views: true } },
    },
  });
}

/**
 * Abgelaufene Stories eines Urhebers wegräumen — Datensatz und Datei.
 *
 * Läuft beiläufig mit, wenn jemand eine neue Story aufgibt oder seine
 * Übersicht öffnet. Das erspart einen Aufräumdienst und hält den Bucket
 * frei von Medien, die niemand mehr sehen kann.
 */
export async function aufraeumenAbgelaufene(quelle: StoryQuelle) {
  const alt = await db.story.findMany({
    where: {
      expiresAt: { lte: new Date() },
      ...(quelle.art === "PROFILE" ? { profileId: quelle.id } : { agencyId: quelle.id }),
    },
    select: { id: true, mediaUrl: true },
  });
  if (alt.length === 0) return;

  await db.story.deleteMany({ where: { id: { in: alt.map((story) => story.id) } } });
  await Promise.all(
    alt.map(async (story) => {
      const key = keyFromPublicUrl(story.mediaUrl);
      // Nur Story-Medien anfassen: eine Story kann auf ein Galeriebild zeigen.
      if (key?.startsWith("story/")) await deleteObject(key);
    }),
  );
}

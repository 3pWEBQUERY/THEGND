import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { StoryManager } from "@/components/dashboard/story-manager";
import { aufraeumenAbgelaufene, eigeneStories, eigeneStoryQuelle } from "@/server/queries/stories";

export const metadata: Metadata = { title: "Stories" };

export default async function DashboardStoriesPage() {
  await requireUser();

  // Mitgliedskonten schauen Stories nur an — für sie gibt es hier nichts.
  const quelle = await eigeneStoryQuelle();
  if (!quelle) redirect("/dashboard");

  // Beim Öffnen der Übersicht abgelaufene Teile samt Datei wegräumen.
  await aufraeumenAbgelaufene(quelle);
  const stories = await eigeneStories(quelle);

  return (
    <>
      <PageHeader
        title="Stories"
        description="Kurze Einblicke, 24 Stunden sichtbar. Alles, was du in dieser Zeit postest, erscheint als eine Story."
      />

      <StoryManager
        quelle={quelle}
        stories={stories.map((story) => ({
          id: story.id,
          mediaUrl: story.mediaUrl,
          mediaType: story.mediaType,
          caption: story.caption,
          createdAt: story.createdAt.toISOString(),
          expiresAt: story.expiresAt.toISOString(),
          views: story._count.views,
        }))}
      />
    </>
  );
}

export const dynamic = "force-dynamic";

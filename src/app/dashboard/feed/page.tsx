import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Rss } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { PostComposer } from "@/components/feed/post-composer";
import { PostCard } from "@/components/feed/post-card";

export const metadata: Metadata = { title: "Pinnwand" };

export default async function DashboardFeedPage() {
  const user = await requireUser();
  if (!user.profileId) redirect("/onboarding");

  const posts = await db.post.findMany({
    where: { profileId: user.profileId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      profile: {
        select: {
          slug: true,
          displayName: true,
          isVerified: true,
          city: { select: { name: true } },
          media: { where: { moderation: "APPROVED" }, take: 1, orderBy: { position: "asc" }, select: { url: true, thumbUrl: true } },
        },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { author: { select: { displayName: true, avatarUrl: true } } },
      },
    },
  });

  return (
    <>
      <PageHeader
        title="Pinnwand"
        description="Halte deine Follower auf dem Laufenden — Beiträge erscheinen im öffentlichen Feed."
      />

      <div className="mx-auto max-w-2xl space-y-4">
        <PostComposer />

        {posts.length === 0 ? (
          <EmptyState icon={Rss} title="Noch keine Beiträge" description="Schreib dein erstes Update — Texte mit Bild erhalten die meiste Aufmerksamkeit." />
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={JSON.parse(JSON.stringify(post))} liked={false} isLoggedIn />
          ))
        )}
      </div>
    </>
  );
}

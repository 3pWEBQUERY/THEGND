import type { Metadata } from "next";
import Link from "next/link";
import { Rss } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PostCard } from "@/components/feed/post-card";
import { StoryRail } from "@/components/stories/story-rail";
import { eigeneStoryQuelle, storyBuendel } from "@/server/queries/stories";
import { PostComposer } from "@/components/feed/post-composer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Feed",
  description: "Neuigkeiten, Stories und Beiträge direkt von den Profilen.",
  alternates: { canonical: "/feed" },
};

export default async function FeedPage() {
  const user = await getCurrentUser();

  const [posts, buendel, quelle, likedIds] = await Promise.all([
    db.post.findMany({
      where: { moderation: "APPROVED", profile: { status: "ACTIVE" } },
      orderBy: { createdAt: "desc" },
      take: 40,
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
    }),
    storyBuendel(),
    eigeneStoryQuelle(),
    user
      ? db.postLike.findMany({ where: { userId: user.id }, select: { postId: true } }).then((r) => r.map((x) => x.postId))
      : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <Rss className="size-3.5" /> Community
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight">Feed</h1>
        <p className="mt-3 text-muted-foreground">
          Updates, Angebote und Einblicke — direkt von den Profilen, ohne Umweg.
        </p>
      </header>

      <StoryRail buendel={buendel} quelle={quelle} className="mb-8" />

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {user?.profileId && <PostComposer />}

          {posts.length === 0 ? (
            <Card className="py-16 text-center">
              <Rss className="mx-auto mb-3 size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Noch keine Beiträge. Sei die erste Person!</p>
            </Card>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={JSON.parse(JSON.stringify(post))}
                liked={likedIds.includes(post.id)}
                isLoggedIn={Boolean(user)}
              />
            ))
          )}
        </div>

        <aside className="hidden lg:block">
          <Card className="sticky top-24 p-5">
            <h2 className="mb-3 text-base font-semibold">Community-Regeln</h2>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {[
                "Respektvoll bleiben — keine Beleidigungen.",
                "Keine Kontaktdaten Dritter posten.",
                "Nur eigene Inhalte hochladen.",
                "Keine illegalen Angebote.",
              ].map((rule) => (
                <li key={rule} className="flex gap-2">
                  <span className="text-primary">•</span>
                  {rule}
                </li>
              ))}
            </ul>
            <Badge variant="neutral" size="sm" className="mt-4">
              Moderiert · 24/7
            </Badge>
          </Card>
        </aside>
      </div>
    </div>
  );
}

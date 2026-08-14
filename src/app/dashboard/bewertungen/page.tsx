import type { Metadata } from "next";
import { StarOff } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, EmptyState, StatCard } from "@/components/dashboard/page-header";
import { ReviewReplyCard } from "@/components/dashboard/review-reply-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Bewertungen" };

export default async function ReviewsPage() {
  const user = await requireUser();

  const [received, written, profile] = await Promise.all([
    user.profileId
      ? db.review.findMany({
          where: { profileId: user.profileId },
          orderBy: { createdAt: "desc" },
          include: { author: { select: { displayName: true, avatarUrl: true } } },
        })
      : [],
    db.review.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      include: { profile: { select: { displayName: true, slug: true } } },
    }),
    user.profileId
      ? db.profile.findUnique({ where: { id: user.profileId }, select: { ratingAvg: true, reviewCount: true } })
      : null,
  ]);

  const pending = received.filter((r) => r.status === "PENDING").length;

  return (
    <>
      <PageHeader title="Bewertungen" description="Antworte öffentlich — das schafft Vertrauen bei neuen Kontakten." />

      {profile && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Durchschnitt" value={profile.ratingAvg.toFixed(1)} hint="von 5" />
          <StatCard label="Veröffentlicht" value={profile.reviewCount} />
          <StatCard label="In Prüfung" value={pending} />
        </div>
      )}

      <Tabs defaultValue={user.profileId ? "received" : "written"}>
        <TabsList>
          {user.profileId && <TabsTrigger value="received">Erhalten ({received.length})</TabsTrigger>}
          <TabsTrigger value="written">Geschrieben ({written.length})</TabsTrigger>
        </TabsList>

        {user.profileId && (
          <TabsContent value="received">
            {received.length === 0 ? (
              <EmptyState icon={StarOff} title="Noch keine Bewertungen" description="Nach dem ersten Treffen können Mitglieder dich bewerten." />
            ) : (
              <div className="space-y-3">
                {received.map((review) => (
                  <ReviewReplyCard key={review.id} review={JSON.parse(JSON.stringify(review))} />
                ))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="written">
          {written.length === 0 ? (
            <EmptyState icon={StarOff} title="Noch nichts bewertet" description="Deine abgegebenen Bewertungen erscheinen hier." />
          ) : (
            <div className="space-y-3">
              {written.map((review) => (
                <div key={review.id} className="rounded-2xl border border-border bg-card p-5">
                  <p className="font-medium">{review.profile.displayName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {review.rating}/5 · Status: {review.status}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}

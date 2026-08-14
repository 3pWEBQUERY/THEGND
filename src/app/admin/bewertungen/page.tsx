import type { Metadata } from "next";
import { Check, Star, X } from "lucide-react";
import { db } from "@/lib/db";
import { moderateReviewAction } from "@/server/actions/admin";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { ActionButton } from "@/components/admin/action-buttons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Bewertungen · Admin" };

export default async function AdminReviewsPage() {
  const reviews = await db.review.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: 60,
    include: {
      author: { select: { displayName: true, email: true } },
      profile: { select: { displayName: true, slug: true } },
    },
  });

  return (
    <>
      <PageHeader title="Bewertungs-Moderation" description="Prüfe auf Beleidigungen, private Daten und Fakes." />

      {reviews.length === 0 ? (
        <EmptyState icon={Star} title="Keine offenen Bewertungen" description="Alles freigegeben." />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-64 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{review.author.displayName ?? review.author.email}</span>
                    <span className="text-xs text-muted-foreground">→</span>
                    <span className="text-sm font-semibold">{review.profile.displayName}</span>
                    <Badge size="sm" variant="neutral">
                      {review.rating}/5
                    </Badge>
                    {review.isVerifiedMeeting && (
                      <Badge size="sm" variant="success">
                        verifiziertes Treffen
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{timeAgo(review.createdAt)}</span>
                  </div>
                  {review.title && <p className="mt-2 text-sm font-semibold">{review.title}</p>}
                  <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{review.body}</p>
                </div>

                <div className="flex gap-2">
                  <ActionButton size="sm" variant="success" action={moderateReviewAction.bind(null, review.id, true)}>
                    <Check className="size-4" /> Veröffentlichen
                  </ActionButton>
                  <ActionButton
                    size="sm"
                    variant="outline"
                    confirm="Bewertung ablehnen?"
                    action={moderateReviewAction.bind(null, review.id, false)}
                  >
                    <X className="size-4" /> Ablehnen
                  </ActionButton>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

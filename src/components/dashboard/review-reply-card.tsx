"use client";

import * as React from "react";
import { useActionState } from "react";
import { BadgeCheck, CornerDownRight, Send } from "lucide-react";
import { toast } from "sonner";
import { replyToReviewAction } from "@/server/actions/interactions";
import { Stars } from "@/components/profile/reviews";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { AvatarFallback, AvatarImage, AvatarRoot } from "@/components/ui/primitives";
import { initials, timeAgo } from "@/lib/utils";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  status: string;
  reply: string | null;
  createdAt: string;
  isVerifiedMeeting: boolean;
  author: { displayName: string | null; avatarUrl: string | null };
};

export function ReviewReplyCard({ review }: { review: Review }) {
  const [state, action, pending] = useActionState(replyToReviewAction, {});
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Antwort gespeichert");
      setOpen(false);
    } else if (state.message) toast.error(state.message);
  }, [state]);

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <AvatarRoot className="size-10">
          {review.author.avatarUrl && <AvatarImage src={review.author.avatarUrl} alt="" />}
          <AvatarFallback>{initials(review.author.displayName)}</AvatarFallback>
        </AvatarRoot>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{review.author.displayName ?? "Mitglied"}</span>
            {review.isVerifiedMeeting && (
              <Badge variant="success" size="sm">
                <BadgeCheck className="size-3" /> Verifiziert
              </Badge>
            )}
            {review.status === "PENDING" && (
              <Badge variant="warning" size="sm">
                In Prüfung
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">{timeAgo(review.createdAt)}</span>
          </div>

          <Stars value={review.rating} className="mt-1" />
          {review.title && <p className="mt-2 text-sm font-semibold">{review.title}</p>}
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{review.body}</p>

          {review.reply ? (
            <div className="mt-4 rounded-xl border-l-2 border-primary bg-muted/50 p-3">
              <p className="text-xs font-semibold text-primary">Deine Antwort</p>
              <p className="mt-1 text-sm text-muted-foreground">{review.reply}</p>
            </div>
          ) : open ? (
            <form action={action} className="mt-4 space-y-2">
              <input type="hidden" name="reviewId" value={review.id} />
              <Textarea name="reply" rows={3} required maxLength={2000} placeholder="Sachlich und freundlich antworten…" />
              <div className="flex gap-2">
                <Button type="submit" size="sm" variant="brand" loading={pending}>
                  <Send className="size-4" /> Antwort veröffentlichen
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
                  Abbrechen
                </Button>
              </div>
            </form>
          ) : (
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setOpen(true)}>
              <CornerDownRight className="size-4" /> Antworten
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

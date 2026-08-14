"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { BadgeCheck, MessageSquareQuote, PenLine, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AvatarFallback, AvatarImage, AvatarRoot, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Progress } from "@/components/ui/primitives";
import { createReviewAction } from "@/server/actions/interactions";
import { cn, initials, timeAgo } from "@/lib/utils";

export type ReviewItem = {
  id: string;
  rating: number;
  ratingLooks: number | null;
  ratingService: number | null;
  ratingCharm: number | null;
  ratingHygiene: number | null;
  ratingValue: number | null;
  title: string | null;
  body: string;
  createdAt: Date;
  isVerifiedMeeting: boolean;
  reply: string | null;
  repliedAt: Date | null;
  author: { displayName: string | null; avatarUrl: string | null };
};

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} von 5 Sternen`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i <= Math.round(value) ? "fill-rating text-rating" : "text-muted-foreground/35"}
        />
      ))}
    </span>
  );
}

export function ReviewSection({
  profileId,
  displayName,
  reviews,
  average,
  canReview,
  isLoggedIn,
}: {
  profileId: string;
  displayName: string;
  reviews: ReviewItem[];
  average: number;
  canReview: boolean;
  isLoggedIn: boolean;
}) {
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  const subScores = [
    { key: "ratingLooks", label: "Aussehen" },
    { key: "ratingService", label: "Service" },
    { key: "ratingCharm", label: "Charme" },
    { key: "ratingHygiene", label: "Hygiene" },
    { key: "ratingValue", label: "Preis-Leistung" },
  ] as const;

  const avgOf = (key: (typeof subScores)[number]["key"]) => {
    const values = reviews.map((r) => r[key]).filter((v): v is number => typeof v === "number");
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  };

  return (
    <section id="bewertungen" className="scroll-mt-24">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          Bewertungen <span className="text-muted-foreground">({reviews.length})</span>
        </h2>
        <ReviewDialog profileId={profileId} displayName={displayName} canReview={canReview} isLoggedIn={isLoggedIn} />
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center">
          <MessageSquareQuote className="mx-auto mb-3 size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Noch keine Bewertungen. Sei die erste Person!</p>
        </div>
      ) : (
        <>
          <div className="mb-8 grid gap-6 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-[auto_1fr_1fr]">
            <div className="text-center sm:text-left">
              <p className="font-display text-5xl font-bold">{average.toFixed(1)}</p>
              <Stars value={average} size={16} className="mt-1.5" />
              <p className="mt-1 text-xs text-muted-foreground">{reviews.length} Bewertungen</p>
            </div>

            <div className="space-y-1.5">
              {distribution.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-muted-foreground">{star}</span>
                  <Star className="size-3 fill-rating text-rating" />
                  <Progress value={reviews.length ? (count / reviews.length) * 100 : 0} className="h-1.5 flex-1" />
                  <span className="w-6 text-right text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              {subScores.map(({ key, label }) => {
                const value = avgOf(key);
                if (!value) return null;
                return (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <span className="w-24 text-muted-foreground">{label}</span>
                    <Progress value={(value / 5) * 100} className="h-1.5 flex-1" />
                    <span className="w-6 text-right font-medium">{value.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-2xl border border-border bg-card p-5">
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
                          <BadgeCheck className="size-3" /> Verifiziertes Treffen
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{timeAgo(review.createdAt)}</span>
                    </div>
                    <Stars value={review.rating} className="mt-1" />
                    {review.title && <h3 className="mt-2 text-sm font-semibold">{review.title}</h3>}
                    <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {review.body}
                    </p>

                    {review.reply && (
                      <div className="mt-4 rounded-xl border-l-2 border-primary bg-muted/50 p-3">
                        <p className="text-xs font-semibold text-primary">Antwort von {displayName}</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{review.reply}</p>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function ReviewDialog({
  profileId,
  displayName,
  canReview,
  isLoggedIn,
}: {
  profileId: string;
  displayName: string;
  canReview: boolean;
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [state, action, pending] = useActionState(createReviewAction, {});

  React.useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Bewertung gesendet");
      setOpen(false);
    } else if (state.message) toast.error(state.message);
  }, [state]);

  if (!isLoggedIn) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/login">
          <PenLine className="size-4" /> Bewertung schreiben
        </Link>
      </Button>
    );
  }
  if (!canReview) return null;

  const sub = [
    { name: "ratingLooks", label: "Aussehen" },
    { name: "ratingService", label: "Service" },
    { name: "ratingCharm", label: "Charme" },
    { name: "ratingHygiene", label: "Hygiene" },
    { name: "ratingValue", label: "Preis-Leistung" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PenLine className="size-4" /> Bewertung schreiben
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{displayName} bewerten</DialogTitle>
          <DialogDescription>
            Bitte bleib fair und sachlich. Beleidigungen und private Details werden nicht veröffentlicht.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <input type="hidden" name="profileId" value={profileId} />
          <input type="hidden" name="rating" value={rating} />

          <Field label="Gesamtbewertung" required>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  aria-label={`${i} Sterne`}
                  className="transition-transform hover:scale-110"
                >
                  <Star className={cn("size-7", i <= rating ? "fill-rating text-rating" : "text-muted-foreground/35")} />
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            {sub.map((s) => (
              <Field key={s.name} label={s.label}>
                <Select name={s.name} defaultValue="5" className="h-10 px-3">
                  {[5, 4, 3, 2, 1].map((v) => (
                    <option key={v} value={v}>
                      {v} Sterne
                    </option>
                  ))}
                </Select>
              </Field>
            ))}
          </div>

          <Field label="Überschrift">
            <Input name="title" maxLength={120} placeholder="Kurz auf den Punkt" />
          </Field>

          <Field label="Deine Erfahrung" required hint="Mindestens 40 Zeichen.">
            <Textarea name="body" rows={5} required minLength={40} maxLength={4000} />
          </Field>

          <Field label="Datum des Treffens">
            <Input type="date" name="metAt" max={new Date().toISOString().slice(0, 10)} />
          </Field>

          <DialogFooter>
            <Button type="submit" variant="brand" loading={pending} className="w-full">
              Bewertung absenden
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

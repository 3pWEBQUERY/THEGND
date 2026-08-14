"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Crown, MapPin, Play, Sparkles, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/profile/favorite-button";
import { GENDER_LABEL, PLACE_LABEL } from "@/lib/constants";
import { ageFromBirthdate, cn, formatPrice, isOnline } from "@/lib/utils";
import type { ProfileCardData } from "@/server/queries/profiles";

export function ProfileCard({
  profile,
  favorited,
  priority,
  compact,
  className,
}: {
  profile: ProfileCardData;
  favorited?: boolean;
  priority?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const [index, setIndex] = React.useState(0);
  const images = profile.media.length ? profile.media : [];
  const online = isOnline(profile.user?.lastSeenAt, 15);
  const age = profile.displayAge ?? ageFromBirthdate(profile.birthDate);
  const hasVideo = images.some((m) => m.type === "VIDEO");
  const boosted = profile.boosts.some((b) => b.type === "TOP_LISTING" || b.type === "SPOTLIGHT");
  const highlighted = profile.boosts.some((b) => b.type === "HIGHLIGHT") || profile.isFeatured;

  const current = images[index] ?? images[0];

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card",
        highlighted ? "border-accent/45" : "border-border",
        className,
      )}
      onMouseLeave={() => setIndex(0)}
    >
      <Link href={`/escort/${profile.slug}`} className="block">
        <div className={cn("relative overflow-hidden bg-muted", compact ? "aspect-3/4" : "aspect-[3/4.2]")}>
          {current ? (
            <Image
              src={current.thumbUrl ?? current.url}
              alt={profile.displayName}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
              placeholder={current.blurData ? "blur" : undefined}
              blurDataURL={current.blurData ?? undefined}
              className="object-cover"
            />
          ) : (
            <div className="grid size-full place-items-center bg-muted text-muted-foreground">
              <Sparkles className="size-8 opacity-40" />
            </div>
          )}

          {/* Hover-Zonen zum Durchblättern */}
          {images.length > 1 && (
            <div className="absolute inset-0 hidden sm:flex">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  tabIndex={-1}
                  aria-hidden
                  className="h-full flex-1"
                  onMouseEnter={() => setIndex(i)}
                />
              ))}
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

          {/* Fortschrittsbalken */}
          {images.length > 1 && (
            <div className="pointer-events-none absolute inset-x-2.5 top-2.5 hidden gap-1 sm:flex">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-0.5 flex-1 rounded-xs transition-colors",
                    i === index ? "bg-white" : "bg-white/30",
                  )}
                />
              ))}
            </div>
          )}

          {/* Badges oben links */}
          <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5 sm:top-5">
            {boosted && (
              <Badge variant="glass" size="sm" className="border-accent/40 text-accent">
                <Crown className="size-3" /> TOP
              </Badge>
            )}
            {profile.isNew && (
              <Badge variant="glass" size="sm">
                NEU
              </Badge>
            )}
            {hasVideo && (
              <Badge variant="glass" size="sm">
                <Play className="size-3" /> Video
              </Badge>
            )}
          </div>

          {online && (
            <span className="absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-md sm:top-5">
              <span className="size-1.5 animate-pulse-ring rounded-xs bg-success" />
              Online
            </span>
          )}

          {/* Info-Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-3">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-base font-semibold text-white drop-shadow">{profile.displayName}</h3>
              {age && <span className="shrink-0 text-sm text-white/75">{age}</span>}
              {profile.isVerified && <BadgeCheck className="size-4 shrink-0 text-info" aria-label="Verifiziert" />}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-white/70">
              {profile.city && (
                <span className="flex min-w-0 items-center gap-1">
                  <MapPin className="size-3 shrink-0" />
                  <span className="truncate">{profile.city.name}</span>
                </span>
              )}
              {profile.reviewCount > 0 && (
                <span className="flex shrink-0 items-center gap-0.5">
                  <Star className="size-3 fill-rating text-rating" />
                  {profile.ratingAvg.toFixed(1)}
                  <span className="text-white/45">({profile.reviewCount})</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      <div className="absolute right-2 top-11 sm:top-14">
        <FavoriteButton profileId={profile.id} initial={favorited} />
      </div>

      {!compact && (
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <span className="truncate text-xs text-muted-foreground">
            {GENDER_LABEL[profile.gender] ?? ""}
            {profile.meetingPlace ? ` · ${PLACE_LABEL[profile.meetingPlace]}` : ""}
          </span>
          <span className="shrink-0 text-sm font-semibold">
            {profile.priceHour ? (
              <>
                {formatPrice(profile.priceHour, profile.currency)}
                <span className="text-xs font-normal text-muted-foreground">/h</span>
              </>
            ) : (
              <span className="text-xs font-normal text-muted-foreground">Preis auf Anfrage</span>
            )}
          </span>
        </div>
      )}
    </article>
  );
}

export function ProfileCardSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className={cn("skeleton", compact ? "aspect-3/4" : "aspect-[3/4.2]")} />
      {!compact && (
        <div className="flex items-center justify-between gap-2 px-3 py-3">
          <div className="skeleton h-3 w-20 rounded-xs" />
          <div className="skeleton h-3 w-12 rounded-xs" />
        </div>
      )}
    </div>
  );
}

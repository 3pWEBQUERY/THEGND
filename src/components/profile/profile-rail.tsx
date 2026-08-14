"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { ProfileCard } from "@/components/profile/profile-card";
import { Button } from "@/components/ui/button";
import type { ProfileCardData } from "@/server/queries/profiles";
import { cn } from "@/lib/utils";

export function ProfileRail({
  title,
  subtitle,
  href,
  profiles,
  favoriteIds,
  eyebrow,
  className,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  profiles: ProfileCardData[];
  favoriteIds?: string[];
  eyebrow?: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  const scroll = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 900), behavior: "smooth" });
  };

  if (!profiles.length) return null;

  return (
    <section className={cn("mx-auto max-w-[1400px] px-4 py-10 sm:px-6", className)}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </p>
          )}
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden gap-1 sm:flex">
            <Button variant="outline" size="icon-sm" onClick={() => scroll(-1)} aria-label="Zurück">
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => scroll(1)} aria-label="Weiter">
              <ChevronRight />
            </Button>
          </div>
          {href && (
            <Button asChild variant="ghost" size="sm">
              <Link href={href}>
                Alle <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div
        ref={ref}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
      >
        {profiles.map((profile, i) => (
          <div key={profile.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23%] xl:w-[18.5%]">
            <ProfileCard profile={profile} priority={i < 4} favorited={favoriteIds?.includes(profile.id)} />
          </div>
        ))}
      </div>
    </section>
  );
}

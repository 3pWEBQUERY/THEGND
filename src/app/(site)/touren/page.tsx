import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CalendarRange, MapPin, Plane } from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LOCALE, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tourplan",
  description: "Wer ist wann wo? Alle angekündigten Touren und Gastaufenthalte auf einen Blick.",
  alternates: { canonical: "/touren" },
};

export default async function ToursPage() {
  const tours = await db.tour.findMany({
    where: { to: { gte: new Date() }, profile: { status: "ACTIVE" } },
    orderBy: { from: "asc" },
    take: 120,
    include: {
      city: { select: { name: true, slug: true } },
      profile: {
        select: {
          slug: true,
          displayName: true,
          isVerified: true,
          city: { select: { name: true } },
          media: { where: { moderation: "APPROVED" }, take: 1, orderBy: { position: "asc" }, select: { url: true, thumbUrl: true } },
        },
      },
    },
  });

  const byMonth = tours.reduce<Record<string, typeof tours>>((acc, tour) => {
    const key = new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric" }).format(tour.from);
    (acc[key] ??= []).push(tour);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
      <header className="mb-10 max-w-2xl">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <Plane className="size-3.5" /> Unterwegs
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight">Tourplan</h1>
        <p className="mt-3 text-muted-foreground">
          Viele Profile reisen. Hier siehst du, wer demnächst in deiner Stadt ist — plane rechtzeitig.
        </p>
      </header>

      {tours.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Aktuell sind keine Touren angekündigt.
        </p>
      ) : (
        <div className="space-y-10">
          {Object.entries(byMonth).map(([month, items]) => (
            <section key={month}>
              <h2 className="mb-4 font-display text-2xl font-bold capitalize tracking-tight">{month}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((tour) => (
                  <Card key={tour.id} className="flex items-center gap-4 p-4">
                    <Link href={`/escort/${tour.profile.slug}`} className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {tour.profile.media[0] && (
                        <Image
                          src={tour.profile.media[0].thumbUrl ?? tour.profile.media[0].url}
                          alt={tour.profile.displayName}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/escort/${tour.profile.slug}`} className="block truncate font-semibold hover:text-primary">
                        {tour.profile.displayName}
                      </Link>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" /> {tour.city.name}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarRange className="size-3" />
                        {formatDate(tour.from)} – {formatDate(tour.to)}
                      </p>
                    </div>
                    {tour.profile.isVerified && (
                      <Badge variant="success" size="sm">
                        ✓
                      </Badge>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

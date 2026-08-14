import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { CityGrid } from "@/components/marketing/city-grid";
import { getPopularCities } from "@/server/queries/profiles";
import { Badge } from "@/components/ui/badge";
import { FlagAvatar } from "@/components/ui/flag-avatar";

export const metadata: Metadata = {
  title: "Städte A–Z",
  description: "Escorts nach Stadt — von Zürich über Bern bis Genf. Alle Schweizer Städte mit aktiven Profilen im Überblick.",
  alternates: { canonical: "/staedte" },
};

export default async function CitiesPage() {
  const [popular, countries] = await Promise.all([
    getPopularCities(12),
    db.country.findMany({
      orderBy: { nameDe: "asc" },
      include: {
        cities: {
          where: { profiles: { some: { status: "ACTIVE" } } },
          orderBy: { name: "asc" },
          select: { slug: true, name: true, _count: { select: { profiles: { where: { status: "ACTIVE" } } } } },
        },
      },
    }),
  ]);

  const withCities = countries.filter((c) => c.cities.length > 0);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
      <header className="mb-10 max-w-2xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Standorte</p>
        <h1 className="font-display text-4xl font-bold tracking-tight">Städte A–Z</h1>
        <p className="mt-3 text-muted-foreground">
          Finde Begleitung genau dort, wo du bist. Alle Städte mit aktiven, geprüften Profilen.
        </p>
      </header>

      <CityGrid cities={popular} />

      <div className="mt-14 space-y-10">
        {withCities.map((country) => (
          <section key={country.id}>
            <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
              <FlagAvatar flag={country.flag} code={country.code} label={country.nameDe} size="xl" />
              {country.nameDe}
              <Badge variant="neutral" size="sm">{country.cities.length}</Badge>
            </h2>
            <div className="flex flex-wrap gap-2">
              {country.cities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/escorts?city=${city.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
                >
                  <MapPin className="size-3.5 opacity-60" />
                  {city.name}
                  <span className="text-xs text-muted-foreground">{city._count.profiles}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {withCities.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            Noch keine aktiven Profile. Schau bald wieder vorbei.
          </p>
        )}
      </div>
    </div>
  );
}

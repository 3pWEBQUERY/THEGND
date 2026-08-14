import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";

type CityItem = {
  slug: string;
  name: string;
  heroImage: string | null;
  country: { code: string; nameDe: string };
  _count: { profiles: number };
};

export function CityGrid({ cities }: { cities: CityItem[] }) {
  if (!cities.length) return null;

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Nach Standort</p>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Beliebte Städte</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Von Zürich bis Genf — finde Begleitung in deiner Nähe.
          </p>
        </div>
        <Link
          href="/staedte"
          className="hidden items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
        >
          Alle Städte <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cities.map((city, i) => (
          <Link
            key={city.slug}
            href={`/escorts?city=${city.slug}`}
            className="group relative aspect-4/5 overflow-hidden rounded-2xl border border-border bg-muted"
          >
            {city.heroImage ? (
              <Image
                src={city.heroImage}
                alt={city.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover opacity-70 transition-opacity duration-500 group-hover:opacity-90"
              />
            ) : (
              <div className="size-full bg-brand/70 opacity-90" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="flex items-center gap-1 text-sm font-semibold text-white">
                <MapPin className="size-3.5 opacity-70" />
                {city.name}
              </p>
              <p className="mt-0.5 text-xs text-white/60">
                {city._count.profiles} {city._count.profiles === 1 ? "Profil" : "Profile"}
              </p>
            </div>
            <span className="absolute right-2.5 top-2.5 rounded-md bg-black/45 px-1.5 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-md">
              {city.country.code}
            </span>
            {i === 0 && (
              <span className="absolute left-2.5 top-2.5 rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                #1
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

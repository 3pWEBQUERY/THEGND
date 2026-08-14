"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, MapPin, Search, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PlaceSearch } from "@/components/map/place-search";
import { RADIUS_STANDARD, RADIUS_STUFEN, type Ort } from "@/lib/geo";
import { Badge } from "@/components/ui/badge";
import { cn, formatCompact } from "@/lib/utils";

type City = { slug: string; name: string };

export function Hero({
  cities,
  stats,
  gallery,
}: {
  cities: City[];
  stats: { profiles: number; verified: number; cities: number; reviews: number };
  gallery: { slug: string; name: string; image: string | null }[];
}) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [city, setCity] = React.useState("");
  const [umkreis, setUmkreis] = React.useState<Ort | null>(null);
  const [radius, setRadius] = React.useState(RADIUS_STANDARD);
  const [modus, setModus] = React.useState<"stadt" | "umkreis">("stadt");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (modus === "umkreis" && umkreis) {
      params.set("lat", umkreis.lat.toFixed(5));
      params.set("lng", umkreis.lng.toFixed(5));
      params.set("radius", String(radius));
      params.set("ort", umkreis.label);
    } else if (city) {
      params.set("city", city);
    }
    router.push(`/escorts${params.size ? `?${params}` : ""}`);
  };

  return (
    <section className="noise surface-glow relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,var(--primary)_0%,transparent_45%)] opacity-[0.12]" />

      <div className="relative mx-auto grid max-w-[1400px] gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
        <div className="animate-in-up">
          <Badge variant="neutral" size="lg" className="mb-6 border-border/80 backdrop-blur">
            <span className="mr-1 inline-block size-1.5 animate-pulse rounded-xs bg-success" />
            {formatCompact(stats.profiles)} aktive Profile · {formatCompact(stats.cities)} Städte
          </Badge>

          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Begegnungen, die
            <br />
            <span className="text-brand">wirklich passen.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Das kuratierte Verzeichnis für Escorts, Agenturen und Clubs. Verifizierte Profile, echte Bewertungen,
            direkter Kontakt — diskret, sicher und ohne Zwischenhändler.
          </p>

          <form
            onSubmit={submit}
            className="mt-8 flex flex-col gap-2 rounded-2xl border border-border bg-card/80 p-2 backdrop-blur-xl sm:flex-row"
          >
            <div className="flex flex-1 items-center gap-2 px-3">
              <Search className="size-4.5 shrink-0 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Name, Service oder Stichwort"
                aria-label="Suchbegriff"
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
            </div>

            <div className="flex items-center gap-2 border-border px-3 sm:border-l">
              {modus === "stadt" ? (
                <>
                  <MapPin className="size-4.5 shrink-0 text-muted-foreground" />
                  <Select
                    value={city}
                    onValueChange={setCity}
                    aria-label="Stadt"
                    className="h-12 w-full border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 sm:w-40"
                    contentClassName="min-w-56"
                  >
                    <option value="">Alle Städte</option>
                    {cities.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </>
              ) : (
                <div className="flex w-full items-center gap-2 sm:w-72">
                  <PlaceSearch
                    wert={umkreis?.label}
                    onWahl={setUmkreis}
                    onLeeren={() => setUmkreis(null)}
                    placeholder="Ort oder PLZ"
                    className="min-w-0 flex-1 [&>div]:h-12 [&>div]:border-0 [&>div]:bg-transparent [&>div]:px-0"
                  />
                  <Select
                    value={String(radius)}
                    onValueChange={(v) => setRadius(Number(v))}
                    aria-label="Umkreis"
                    className="h-12 w-24 shrink-0 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                    contentClassName="min-w-32"
                  >
                    {RADIUS_STUFEN.map((stufe) => (
                      <option key={stufe} value={String(stufe)}>
                        {stufe} km
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>

            <Button type="submit" variant="brand" size="lg" className="shrink-0">
              Entdecken
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <div className="mt-3 flex items-center gap-4 text-xs">
            {(
              [
                ["stadt", "Nach Stadt"],
                ["umkreis", "Im Umkreis"],
              ] as const
            ).map(([wert, label]) => (
              <button
                key={wert}
                type="button"
                onClick={() => setModus(wert)}
                aria-pressed={modus === wert}
                className={
                  modus === wert
                    ? "border-b border-primary pb-0.5 font-medium text-primary"
                    : "border-b border-transparent pb-0.5 text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Beliebt:</span>
            {[
              { label: "Jetzt online", href: "/escorts?online=1" },
              { label: "Verifiziert", href: "/escorts?verified=1" },
              { label: "Neu", href: "/escorts?sort=new" },
              { label: "Dinner-Date", href: "/escorts?service=dinner-date" },
              { label: "Massage", href: "/escorts?kind=MASSAGE" },
            ].map((chip) => (
              <Link key={chip.href} href={chip.href}>
                <Badge variant="outline" className="transition-colors hover:border-primary hover:text-primary">
                  {chip.label}
                </Badge>
              </Link>
            ))}
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-8">
            {[
              { icon: Users, value: formatCompact(stats.profiles), label: "Profile" },
              { icon: BadgeCheck, value: formatCompact(stats.verified), label: "Verifiziert" },
              { icon: Sparkles, value: formatCompact(stats.reviews), label: "Bewertungen" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label}>
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon className="size-3.5" />
                  {label}
                </dt>
                <dd className="mt-1 font-display text-2xl font-bold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <HeroCollage gallery={gallery} />
      </div>
    </section>
  );
}

/**
 * Bildwand neben dem Einstieg.
 *
 * Vier gleich geschnittene Hochformate in zwei Spalten, die rechte versetzt —
 * ruhiger als das frühere Mosaik aus Quadrat und Hochformaten, das an den
 * Kanten ausfranste und unten aus dem Abschnitt lief. Der Name steht immer
 * da, nicht erst beim Überfahren: die Kacheln führen auf ein Inserat.
 */
function HeroCollage({ gallery }: { gallery: { slug: string; name: string; image: string | null }[] }) {
  const items = gallery.filter((item) => item.image).slice(0, 4);
  if (items.length < 2) return null;

  const spalten = [items.slice(0, Math.ceil(items.length / 2)), items.slice(Math.ceil(items.length / 2))];

  return (
    <div className="relative hidden lg:block">
      <div className="mx-auto flex w-full max-w-lg gap-4">
        {spalten.map((spalte, spaltenNr) => (
          <div key={spaltenNr} className={cn("flex-1 space-y-4", spaltenNr === 1 && "pt-12")}>
            {spalte.map((item, i) => (
              <Kachel key={item.slug} item={item} nr={spaltenNr * 2 + i} />
            ))}
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute -bottom-4 left-0 rounded-2xl border border-border bg-card/90 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-success/15 text-success">
            <BadgeCheck className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Jedes Profil geprüft</p>
            <p className="text-xs text-muted-foreground">Ausweis- & Foto-Verifizierung</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kachel({ item, nr }: { item: { slug: string; name: string; image: string | null }; nr: number }) {
  return (
    <Link
      href={`/escort/${item.slug}`}
      className="group relative block aspect-4/5 overflow-hidden rounded-2xl border border-border bg-muted"
      style={{ animation: `fade-up 0.6s cubic-bezier(0.16,1,0.3,1) ${nr * 0.08}s both` }}
    >
      <Image
        src={item.image!}
        alt={item.name}
        fill
        sizes="(max-width: 1024px) 0px, 260px"
        className="object-cover"
        priority={nr === 0}
      />
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/45 px-3 py-2 backdrop-blur-sm">
        <span className="truncate text-sm font-semibold text-white">{item.name}</span>
        <ArrowRight className="size-3.5 shrink-0 text-white/70 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

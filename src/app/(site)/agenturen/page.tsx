import type { Metadata } from "next";
import Link from "next/link";
import { Building2, SearchX, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { agencySearchSchema } from "@/lib/validators";
import { loadAgencyFilterOptions, searchAgencies, searchAgenciesForMap } from "@/server/queries/agencies";
import { AgencyCard } from "@/components/agency/agency-card";
import { AgencyFilterSheet, AgencyFilterSidebar } from "@/components/search/agency-filter-panel";
import { ActiveFilterChips, type FilterChip } from "@/components/search/filter-primitives";
import { AgencySortSelect } from "@/components/search/sort-select";
import { ViewSwitch } from "@/components/search/view-switch";
import { ResultsMap } from "@/components/map/results-map";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { AGENCY_AMENITIES, AGENCY_KIND_LABEL } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Agenturen & Clubs",
  description:
    "Geprüfte Escort-Agenturen, Clubs, Studios und Massagesalons in der Schweiz — nach Stadt, Umkreis, Angebot und Öffnungszeit filtern.",
  alternates: { canonical: "/agenturen" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AgenciesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const parsed = agencySearchSchema.safeParse(sp);
  const query = parsed.success ? parsed.data : {};

  const ansicht = query.ansicht === "karte" ? "karte" : "liste";

  const [{ items, total, page, pages, umkreis }, options, cityName, kartenTreffer] = await Promise.all([
    searchAgencies(query),
    loadAgencyFilterOptions(),
    query.city ? db.city.findFirst({ where: { slug: query.city }, select: { name: true } }) : null,
    ansicht === "karte" ? searchAgenciesForMap(query) : Promise.resolve([]),
  ]);

  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (Array.isArray(value)) value.forEach((v) => urlParams.append(key, v));
    else if (value) urlParams.set(key, value);
  }

  const chips = buildAgencyChips(query, options);

  const titel =
    umkreis && query.ort
      ? `Häuser im Umkreis von ${query.ort}`
      : cityName
        ? `Agenturen & Clubs in ${cityName.name}`
        : query.q
          ? `Suche: „${query.q}“`
          : "Agenturen & Clubs";

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <header className="mb-6">
        <nav className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Start
          </Link>
          <span>/</span>
          <span className="text-foreground">Agenturen</span>
          {cityName && (
            <>
              <span>/</span>
              <span className="text-foreground">{cityName.name}</span>
            </>
          )}
        </nav>

        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <Building2 className="size-3.5" /> Häuser & Teams
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{titel}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {formatNumber(total)} {total === 1 ? "Haus" : "Häuser"} gefunden
          {umkreis && ` · ${umkreis.radiusKm} km Umkreis`}
          {query.open === "1" && " · jetzt geöffnet"}
          {query.verified === "1" && " · geprüft"}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <AgencyFilterSidebar options={options} />

        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <AgencyFilterSheet options={options} />
            <div className="flex items-center gap-2">
              <ViewSwitch ansicht={ansicht} />
              <AgencySortSelect />
            </div>
          </div>

          <div className="mb-5">
            <ActiveFilterChips labels={chips} gruppen={{ umkreis: ["lat", "lng", "radius", "ort"] }} />
          </div>

          {ansicht === "karte" ? (
            <>
              <ResultsMap treffer={kartenTreffer} mitte={umkreis?.mitte ?? null} radiusKm={umkreis?.radiusKm} />
              <p className="mt-3 text-xs text-muted-foreground">
                {kartenTreffer.length} von {formatNumber(total)} Häusern auf der Karte. Häuser ohne eigene
                Koordinate stehen am Stadtmittelpunkt.
              </p>
            </>
          ) : items.length === 0 ? (
            <EmptyResults />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((agency) => (
                  <AgencyCard
                    key={agency.id}
                    agency={{
                      slug: agency.slug,
                      name: agency.name,
                      kind: agency.kind,
                      headline: agency.headline,
                      about: agency.about,
                      coverUrl: agency.coverUrl,
                      cityName: agency.cityName,
                      district: agency.district,
                      city: agency.city,
                      priceFrom: agency.priceFrom,
                      currency: agency.currency,
                      isVerified: agency.isVerified,
                      modelCount: agency._count.profiles,
                      distanzKm: agency.distanzKm,
                      geoeffnet: agency.geoeffnet,
                    }}
                  />
                ))}
              </div>
              <Pagination page={page} pages={pages} baseParams={urlParams} basePath="/agenturen" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyResults() {
  return (
    <div className="rounded-2xl border border-dashed border-border py-20 text-center">
      <SearchX className="mx-auto mb-4 size-10 text-muted-foreground/50" />
      <h2 className="text-lg font-semibold">Keine Häuser gefunden</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Versuche es mit weniger Filtern oder einem grösseren Umkreis.
      </p>
      <Button asChild variant="brand" className="mt-6">
        <Link href="/agenturen">
          <Sparkles className="size-4" /> Alle Häuser zeigen
        </Link>
      </Button>
    </div>
  );
}

function buildAgencyChips(
  query: Record<string, unknown>,
  options: Awaited<ReturnType<typeof loadAgencyFilterOptions>>,
): FilterChip[] {
  const chips: FilterChip[] = [];

  if (typeof query.lat === "number" && typeof query.lng === "number") {
    const ort = typeof query.ort === "string" ? query.ort : "gewählter Ort";
    chips.push({ key: "umkreis", value: "1", label: `${query.radius ?? 25} km um ${ort}` });
  }
  if (typeof query.city === "string") {
    const city = options.cities.find((c) => c.slug === query.city);
    chips.push({ key: "city", value: query.city, label: city?.name ?? query.city });
  }
  if (typeof query.kind === "string") {
    for (const v of query.kind.split(",").filter(Boolean)) {
      chips.push({ key: "kind", value: v, label: AGENCY_KIND_LABEL[v] ?? v });
    }
  }
  if (typeof query.amenity === "string") {
    for (const v of query.amenity.split(",").filter(Boolean)) {
      chips.push({ key: "amenity", value: v, label: AGENCY_AMENITIES.find((a) => a.key === v)?.label ?? v });
    }
  }
  if (query.open === "1") chips.push({ key: "open", value: "1", label: "Jetzt geöffnet" });
  if (query.verified === "1") chips.push({ key: "verified", value: "1", label: "Geprüft" });
  if (query.withModels === "1") chips.push({ key: "withModels", value: "1", label: "Mit Models" });
  if (typeof query.priceMax === "number") {
    chips.push({ key: "priceMax", value: String(query.priceMax), label: `bis CHF ${query.priceMax}` });
  }

  const services = Array.isArray(query.service) ? query.service : query.service ? [query.service as string] : [];
  for (const slug of services) {
    chips.push({ key: "service", value: slug, label: options.services.find((s) => s.slug === slug)?.name ?? slug });
  }
  const langs = Array.isArray(query.lang) ? query.lang : query.lang ? [query.lang as string] : [];
  for (const code of langs) {
    chips.push({ key: "lang", value: code, label: options.languages.find((l) => l.code === code)?.name ?? code });
  }

  return chips;
}

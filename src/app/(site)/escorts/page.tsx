import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { searchParamsSchema } from "@/lib/validators";
import { searchProfiles, searchProfilesForMap } from "@/server/queries/profiles";
import { getFavoriteIds } from "@/server/queries/user";
import { ProfileCard } from "@/components/profile/profile-card";
import { FilterSheet, FilterSidebar, type FilterOptions } from "@/components/search/filter-panel";
import { ActiveFilterChips } from "@/components/search/filter-primitives";
import { SortSelect } from "@/components/search/sort-select";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { SaveSearchButton } from "@/components/search/save-search-button";
import { ViewSwitch } from "@/components/search/view-switch";
import { ResultsMap } from "@/components/map/results-map";
import { formatDistanz } from "@/lib/geo";
import {
  BODY_LABEL,
  CUP_SIZES,
  ETHNICITY_LABEL,
  GENDER_LABEL,
  HAIR_LABEL,
  KIND_LABEL,
  PLACE_LABEL,
} from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const sp = await searchParams;
  const city = typeof sp.city === "string" ? sp.city : undefined;
  const cityName = city
    ? (await db.city.findFirst({ where: { slug: city }, select: { name: true } }))?.name
    : undefined;

  const title = cityName ? `Escorts in ${cityName}` : "Alle Escort-Profile";
  return {
    title,
    description: cityName
      ? `Verifizierte Escorts in ${cityName} — Profile mit Fotos, Preisen, Services und echten Bewertungen.`
      : "Durchsuche tausende verifizierte Escort-Profile nach Stadt, Alter, Service, Sprache und Preis.",
    alternates: { canonical: city ? `/escorts?city=${city}` : "/escorts" },
  };
}

export default async function EscortsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const parsed = searchParamsSchema.safeParse(sp);
  const query = parsed.success ? parsed.data : {};

  const ansicht = query.ansicht === "karte" ? "karte" : "liste";

  const [{ items, total, page, pages, umkreis }, favoriteIds, options, cityName, kartenTreffer] =
    await Promise.all([
      searchProfiles(query),
      getFavoriteIds(),
      loadFilterOptions(),
      query.city ? db.city.findFirst({ where: { slug: query.city }, select: { name: true, seoText: true } }) : null,
      ansicht === "karte" ? searchProfilesForMap(query) : Promise.resolve([]),
    ]);

  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (Array.isArray(value)) value.forEach((v) => urlParams.append(key, v));
    else if (value) urlParams.set(key, value);
  }

  const chips = buildChips(query, options);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <header className="mb-6">
        <nav className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Start
          </Link>
          <span>/</span>
          <span className="text-foreground">Escorts</span>
          {cityName && (
            <>
              <span>/</span>
              <span className="text-foreground">{cityName.name}</span>
            </>
          )}
        </nav>

        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {umkreis && query.ort
            ? `Escorts im Umkreis von ${query.ort}`
            : cityName
              ? `Escorts in ${cityName.name}`
              : query.q
                ? `Suche: „${query.q}“`
                : "Alle Profile"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {formatNumber(total)} {total === 1 ? "Profil" : "Profile"} gefunden
          {umkreis && ` · ${umkreis.radiusKm} km Umkreis`}
          {query.online === "1" && " · jetzt online"}
          {query.verified === "1" && " · verifiziert"}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <FilterSidebar options={options} />

        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FilterSheet options={options} />
              <SaveSearchButton query={urlParams.toString()} />
            </div>
            <div className="flex items-center gap-2">
              <ViewSwitch ansicht={ansicht} />
              <SortSelect />
            </div>
          </div>

          <div className="mb-5">
            <ActiveFilterChips labels={chips} gruppen={{ umkreis: ["lat", "lng", "radius", "ort", "anfahrt"] }} />
          </div>

          {ansicht === "karte" ? (
            <>
              <ResultsMap
                treffer={kartenTreffer}
                mitte={umkreis?.mitte ?? null}
                radiusKm={umkreis?.radiusKm}
              />
              <p className="mt-3 text-xs text-muted-foreground">
                {kartenTreffer.length} von {formatNumber(total)} Profilen auf der Karte. Profile ohne
                freigegebene Adresse werden bewusst nur ungefähr verortet.
              </p>
            </>
          ) : items.length === 0 ? (
            <EmptyResults />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {items.map((profile, i) => (
                  <div key={profile.id} className="relative">
                    <ProfileCard
                      profile={profile}
                      priority={i < 8}
                      favorited={favoriteIds.includes(profile.id)}
                    />
                    {profile.distanzKm != null && (
                      <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-lg bg-background/85 px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm">
                        {formatDistanz(profile.distanzKm)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <Pagination page={page} pages={pages} baseParams={urlParams} basePath="/escorts" />
            </>
          )}

          {cityName?.seoText && (
            <section className="mt-14 rounded-2xl border border-border bg-surface p-6 text-sm leading-relaxed text-muted-foreground">
              <h2 className="mb-3 text-base font-semibold text-foreground">Escorts in {cityName.name}</h2>
              <p>{cityName.seoText}</p>
            </section>
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
      <h2 className="text-lg font-semibold">Keine Profile gefunden</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Versuche es mit weniger Filtern oder erweitere deinen Suchradius.
      </p>
      <Button asChild variant="brand" className="mt-6">
        <Link href="/escorts">
          <Sparkles className="size-4" /> Alle Profile zeigen
        </Link>
      </Button>
    </div>
  );
}

async function loadFilterOptions(): Promise<FilterOptions> {
  const [cities, services, languages] = await Promise.all([
    db.city.findMany({
      where: { profiles: { some: { status: "ACTIVE" } } },
      select: { slug: true, name: true, _count: { select: { profiles: { where: { status: "ACTIVE" } } } } },
      orderBy: { name: "asc" },
      take: 300,
    }),
    db.service.findMany({
      where: { category: { scope: { in: ["BOTH", "PROFILE"] } } },
      select: { slug: true, name: true, category: { select: { name: true } } },
      orderBy: [{ category: { position: "asc" } }, { position: "asc" }],
    }),
    db.language.findMany({ select: { code: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return {
    cities: cities.map((c) => ({ slug: c.slug, name: c.name, count: c._count.profiles })),
    services: services.map((s) => ({ slug: s.slug, name: s.name, category: s.category.name })),
    languages,
  };
}

function buildChips(query: Record<string, unknown>, options: FilterOptions) {
  const chips: { key: string; value: string; label: string }[] = [];
  const multi = (key: string, dict: Record<string, string>) => {
    const raw = query[key];
    if (typeof raw !== "string") return;
    for (const v of raw.split(",").filter(Boolean)) chips.push({ key, value: v, label: dict[v] ?? v });
  };

  if (typeof query.lat === "number" && typeof query.lng === "number") {
    const ort = typeof query.ort === "string" ? query.ort : "gewählter Ort";
    chips.push({ key: "umkreis", value: "1", label: `${query.radius ?? 25} km um ${ort}` });
  }
  if (typeof query.city === "string") {
    const city = options.cities.find((c) => c.slug === query.city);
    chips.push({ key: "city", value: query.city, label: city?.name ?? query.city });
  }
  multi("gender", GENDER_LABEL);
  multi("kind", KIND_LABEL);
  multi("body", BODY_LABEL);
  multi("hair", HAIR_LABEL);
  multi("ethnicity", ETHNICITY_LABEL);
  multi("cup", Object.fromEntries(CUP_SIZES.map((c) => [c, `Cup ${c}`])));
  if (typeof query.place === "string") {
    chips.push({ key: "place", value: query.place, label: PLACE_LABEL[query.place] ?? query.place });
  }
  if (query.online === "1") chips.push({ key: "online", value: "1", label: "Jetzt online" });
  if (query.verified === "1") chips.push({ key: "verified", value: "1", label: "Verifiziert" });
  if (query.withVideo === "1") chips.push({ key: "withVideo", value: "1", label: "Mit Video" });
  if (query.withReviews === "1") chips.push({ key: "withReviews", value: "1", label: "Mit Bewertungen" });

  const services = Array.isArray(query.service) ? query.service : query.service ? [query.service as string] : [];
  for (const slug of services) {
    const svc = options.services.find((s) => s.slug === slug);
    chips.push({ key: "service", value: slug, label: svc?.name ?? slug });
  }
  const langs = Array.isArray(query.lang) ? query.lang : query.lang ? [query.lang as string] : [];
  for (const code of langs) {
    const lang = options.languages.find((l) => l.code === code);
    chips.push({ key: "lang", value: code, label: lang?.name ?? code });
  }

  return chips;
}

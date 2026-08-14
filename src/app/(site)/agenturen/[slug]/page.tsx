import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BadgeCheck, Check, Clock, Globe, Mail, MapPin, Phone } from "lucide-react";
import { db } from "@/lib/db";
import { StoryBadge } from "@/components/stories/story-badge";
import { storyBuendel } from "@/server/queries/stories";
import { profileCardSelect } from "@/server/queries/profiles";
import { istGeoeffnet } from "@/lib/opening-hours";
import { getFavoriteIds } from "@/server/queries/user";
import { ProfileCard } from "@/components/profile/profile-card";
import { LocationCard } from "@/components/profile/location-card";
import { FlagAvatar } from "@/components/ui/flag-avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AGENCY_AMENITIES, AGENCY_KIND_LABEL, WEEKDAY_LABEL } from "@/lib/constants";
import { formatPrice, truncate } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const agency = await db.agency.findUnique({ where: { slug } });
  if (!agency) return { title: "Agentur nicht gefunden" };
  return {
    title: agency.name,
    description: truncate(agency.about ?? `${agency.name} — Escort-Agentur`, 155),
    alternates: { canonical: `/agenturen/${slug}` },
  };
}

export default async function AgencyPage({ params }: { params: Params }) {
  const { slug } = await params;

  const agency = await db.agency.findUnique({
    where: { slug },
    include: {
      profiles: { where: { status: "ACTIVE" }, select: profileCardSelect },
      city: { select: { name: true, slug: true, lat: true, lng: true } },
      hours: { orderBy: { weekday: "asc" } },
      services: { include: { service: { include: { category: true } } } },
      languages: { include: { language: true } },
    },
  });
  if (!agency) notFound();

  const [favoriteIds, stories] = await Promise.all([
    getFavoriteIds(),
    storyBuendel({ art: "AGENCY", id: agency.id }),
  ]);
  const geoeffnet = istGeoeffnet(agency);
  const ausstattung = AGENCY_AMENITIES.filter((a) => agency[a.key]);

  // Services nach Kategorie gruppieren — sonst ist die Liste unlesbar.
  const nachKategorie = new Map<string, string[]>();
  for (const eintrag of agency.services) {
    const kategorie = eintrag.service.category.name;
    nachKategorie.set(kategorie, [...(nachKategorie.get(kategorie) ?? []), eintrag.service.name]);
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <div className="relative mb-8 aspect-21/9 overflow-hidden rounded-3xl bg-muted">
        {agency.coverUrl && <Image src={agency.coverUrl} alt="" fill sizes="100vw" className="object-cover" priority />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">{agency.name}</h1>
            <Badge variant="solid">{AGENCY_KIND_LABEL[agency.kind] ?? agency.kind}</Badge>
            {agency.isVerified && (
              <Badge variant="success">
                <BadgeCheck className="size-3" /> Geprüft
              </Badge>
            )}
            {stories[0] && <StoryBadge buendel={stories[0]} />}
            {geoeffnet !== null && (
              <Badge variant={geoeffnet ? "success" : "neutral"}>
                <Clock className="size-3" /> {geoeffnet ? "Jetzt geöffnet" : "Aktuell geschlossen"}
              </Badge>
            )}
          </div>
          {agency.cityName && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
              <MapPin className="size-4" />
              {[agency.street, agency.zip, agency.cityName].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          {agency.headline && <p className="mb-6 text-lg text-muted-foreground">{agency.headline}</p>}

          {agency.about && (
            <section className="mb-10">
              <h2 className="mb-3 font-display text-2xl font-bold tracking-tight">Über uns</h2>
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{agency.about}</p>
            </section>
          )}

          {ausstattung.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">Ausstattung</h2>
              <div className="flex flex-wrap gap-2">
                {ausstattung.map((a) => (
                  <Badge key={a.key} variant="neutral" size="lg">
                    <Check className="size-3" /> {a.label}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {nachKategorie.size > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">Angebot</h2>
              <div className="space-y-4">
                {[...nachKategorie].map(([kategorie, namen]) => (
                  <div key={kategorie}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {kategorie}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {namen.map((name) => (
                        <Badge key={name} variant="outline" size="lg">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {agency.languages.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">Sprachen</h2>
              <div className="flex flex-wrap gap-3">
                {agency.languages.map(({ language }) => (
                  <span key={language.code} className="flex items-center gap-2 text-sm">
                    <FlagAvatar flag={language.flag} label={language.name} />
                    {language.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-5 font-display text-2xl font-bold tracking-tight">
              Unsere Models <span className="text-muted-foreground">({agency.profiles.length})</span>
            </h2>
            {agency.profiles.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                Aktuell keine aktiven Profile.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {agency.profiles.map((profile) => (
                  <ProfileCard key={profile.id} profile={profile} favorited={favoriteIds.includes(profile.id)} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/*
          Sticky an der ganzen Spalte, nicht an der ersten Karte: Sonst bleibt
          nur die Kontaktkarte stehen, und die Standortkarte darunter schiebt
          sich beim Scrollen dahinter — sie ist im Fluss, die pinnende Karte
          liegt als positioniertes Element darüber.

          Die Höhenbegrenzung sorgt dafür, dass auch auf niedrigen Fenstern
          alles erreichbar bleibt; der Balken erscheint nur, wenn nötig.
        */}
        <aside className="lg:sticky lg:top-24 lg:h-fit lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto">
          <Card className="p-5">
            {agency.priceFrom != null && (
              <p className="mb-4 border-b border-border pb-4">
                <span className="text-xs text-muted-foreground">Ab</span>
                <span className="ml-2 font-display text-2xl font-bold">
                  {formatPrice(agency.priceFrom, agency.currency)}
                </span>
              </p>
            )}

            <h2 className="mb-4 text-base font-semibold">Kontakt</h2>
            <ul className="space-y-3 text-sm">
              {agency.phone && (
                <li>
                  <a href={`tel:${agency.phone}`} className="flex items-center gap-2.5 hover:text-primary">
                    <Phone className="size-4 text-muted-foreground" />
                    {agency.phone}
                  </a>
                </li>
              )}
              {agency.email && (
                <li>
                  <a href={`mailto:${agency.email}`} className="flex items-center gap-2.5 hover:text-primary">
                    <Mail className="size-4 text-muted-foreground" />
                    {agency.email}
                  </a>
                </li>
              )}
              {agency.website && (
                <li>
                  <a
                    href={agency.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex items-center gap-2.5 hover:text-primary"
                  >
                    <Globe className="size-4 text-muted-foreground" />
                    Website
                  </a>
                </li>
              )}
            </ul>
            {(agency.isOpen24h || agency.hours.length > 0) && (
              <>
                <h2 className="mb-3 mt-6 border-t border-border pt-5 text-base font-semibold">Öffnungszeiten</h2>
                {agency.isOpen24h ? (
                  <p className="text-sm text-muted-foreground">Durchgehend geöffnet, 7 Tage die Woche.</p>
                ) : (
                  <ul className="space-y-1.5 text-sm">
                    {[1, 2, 3, 4, 5, 6, 0].map((weekday) => {
                      const tag = agency.hours.find((h) => h.weekday === weekday);
                      return (
                        <li key={weekday} className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">{WEEKDAY_LABEL[weekday]}</span>
                          <span className={tag && !tag.closed ? "tabular-nums" : "text-muted-foreground"}>
                            {tag && !tag.closed && tag.opensAt && tag.closesAt
                              ? `${tag.opensAt}–${tag.closesAt}`
                              : "geschlossen"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}

            <Link href="/agenturen" className="mt-6 block text-xs text-primary hover:underline">
              ← Alle Agenturen
            </Link>
          </Card>

          {(() => {
            const lat = agency.lat ?? agency.city?.lat ?? null;
            const lng = agency.lng ?? agency.city?.lng ?? null;
            if (lat == null || lng == null) return null;
            return (
              <div className="mt-6">
                <LocationCard
                  lat={lat}
                  lng={lng}
                  radiusKm={null}
                  ortName={[agency.street, agency.zip, agency.city?.name ?? agency.cityName]
                    .filter(Boolean)
                    .join(", ")}
                  citySlug={agency.city?.slug}
                  // Häuser sind ortsgebunden und öffentlich — keine Unschärfe.
                  ungefaehr={agency.lat == null}
                />
              </div>
            );
          })()}
        </aside>
      </div>
    </div>
  );
}

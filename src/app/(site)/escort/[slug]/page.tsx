import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import {
  BadgeCheck,
  CalendarRange,
  Car,
  Cigarette,
  Clock,
  Crown,
  Eye,
  Globe,
  Heart,
  Languages,
  MapPin,
  Plane,
  Ruler,
  Star,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser, hashIp } from "@/lib/auth";
import { getProfileBySlug, getSimilarProfiles } from "@/server/queries/profiles";
import { trackProfileViewAction } from "@/server/actions/interactions";
import { Gallery, type GalleryItem } from "@/components/profile/gallery";
import { ContactCard } from "@/components/profile/contact-card";
import { ReviewSection, Stars } from "@/components/profile/reviews";
import { ProfileRail } from "@/components/profile/profile-rail";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LocationCard } from "@/components/profile/location-card";
import { ungefaehr } from "@/lib/geo";
import { FlagAvatar } from "@/components/ui/flag-avatar";
import { ProfileStoryBubble } from "@/components/stories/story-cards";
import { storyBuendel } from "@/server/queries/stories";
import {
  BODY_LABEL,
  BREAST_LABEL,
  ETHNICITY_LABEL,
  EYE_LABEL,
  GENDER_LABEL,
  HAIR_LABEL,
  HAIR_LENGTH_LABEL,
  KIND_LABEL,
  ORIENTATION_LABEL,
  PLACE_LABEL,
  PUBIC_LABEL,
  SMOKER_LABEL,
  VERIFICATION_LABEL,
  WEEKDAYS,
} from "@/lib/constants";
import {
  absoluteUrl,
  ageFromBirthdate,
  formatDate,
  formatNumber,
  formatPrice,
  isOnline,
  timeAgo,
  truncate,
} from "@/lib/utils";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const profile = await db.profile.findFirst({
    where: { slug, status: "ACTIVE" },
    select: {
      displayName: true,
      headline: true,
      about: true,
      metaTitle: true,
      metaDescription: true,
      city: { select: { name: true } },
      media: { where: { moderation: "APPROVED" }, take: 1, select: { url: true } },
    },
  });
  if (!profile) return { title: "Profil nicht gefunden" };

  const title = profile.metaTitle ?? `${profile.displayName}${profile.city ? ` · ${profile.city.name}` : ""}`;
  const description =
    profile.metaDescription ??
    truncate(profile.headline ?? profile.about ?? `Profil von ${profile.displayName}`, 155);

  return {
    title,
    description,
    alternates: { canonical: `/escort/${slug}` },
    openGraph: {
      title,
      description,
      images: profile.media[0]?.url ? [profile.media[0].url] : undefined,
    },
  };
}

export default async function ProfilePage({ params }: { params: Params }) {
  const { slug } = await params;
  const profile = await getProfileBySlug(slug);
  if (!profile) notFound();

  const [user, reviews, similar, gifts, headerList, stories] = await Promise.all([
    getCurrentUser(),
    db.review.findMany({
      where: { profileId: profile.id, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { author: { select: { displayName: true, avatarUrl: true } } },
    }),
    getSimilarProfiles({ id: profile.id, cityId: profile.cityId, gender: profile.gender }),
    db.giftItem.findMany({ where: { active: true }, orderBy: { position: "asc" }, take: 8 }),
    headers(),
    storyBuendel({ art: "PROFILE", id: profile.id }),
  ]);

  const isOwner = user?.id === profile.userId;
  void trackProfileViewAction(
    profile.id,
    hashIp(headerList.get("x-forwarded-for")?.split(",")[0]) ?? undefined,
  ).catch(() => null);

  const [favorite, ownReview] = user
    ? await Promise.all([
        db.favorite.findUnique({ where: { userId_profileId: { userId: user.id, profileId: profile.id } } }),
        db.review.findUnique({ where: { profileId_authorId: { profileId: profile.id, authorId: user.id } } }),
      ])
    : [null, null];

  const age = profile.displayAge ?? ageFromBirthdate(profile.birthDate);
  const online = isOnline(profile.user.lastSeenAt, 15);
  const galleryItems: GalleryItem[] = profile.media.map((m) => ({
    id: m.id,
    url: m.url,
    thumbUrl: m.thumbUrl,
    blurData: m.blurData,
    type: m.type,
    visibility: m.visibility,
    unlockCost: m.unlockCost,
    caption: m.caption,
  }));

  const servicesByCategory = profile.services.reduce<
    Record<string, { name: string; extra?: number | null }[]>
  >((acc, item) => {
    const key = item.service.category.name;
    (acc[key] ??= []).push({ name: item.service.name, extra: item.extraCost });
    return acc;
  }, {});

  const facts = [
    { label: "Alter", value: age ? `${age} Jahre` : null },
    { label: "Grösse", value: profile.heightCm ? `${profile.heightCm} cm` : null },
    { label: "Gewicht", value: profile.weightKg ? `${profile.weightKg} kg` : null },
    { label: "Figur", value: profile.bodyType ? BODY_LABEL[profile.bodyType] : null },
    { label: "Konfektion", value: profile.dressSize },
    {
      label: "Oberweite",
      value: profile.cupSize
        ? `${profile.cupSize}${profile.breastType ? ` (${BREAST_LABEL[profile.breastType]})` : ""}`
        : null,
    },
    {
      label: "Haare",
      value: profile.hairColor
        ? `${HAIR_LABEL[profile.hairColor]}${profile.hairLength ? `, ${HAIR_LENGTH_LABEL[profile.hairLength]}` : ""}`
        : null,
    },
    { label: "Augen", value: profile.eyeColor ? EYE_LABEL[profile.eyeColor] : null },
    { label: "Herkunft", value: profile.ethnicity ? ETHNICITY_LABEL[profile.ethnicity] : null },
    { label: "Nationalität", value: profile.nationality },
    { label: "Intimbereich", value: profile.pubicHair ? PUBIC_LABEL[profile.pubicHair] : null },
    { label: "Tattoos", value: profile.tattoos === null ? null : profile.tattoos ? "Ja" : "Nein" },
    { label: "Piercings", value: profile.piercings === null ? null : profile.piercings ? "Ja" : "Nein" },
    { label: "Raucher:in", value: profile.smoker ? SMOKER_LABEL[profile.smoker] : null },
    { label: "Orientierung", value: profile.orientation ? ORIENTATION_LABEL[profile.orientation] : null },
    { label: "Kategorie", value: KIND_LABEL[profile.kind] },
  ].filter((f) => f.value);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.displayName,
    description: truncate(profile.about ?? profile.headline ?? "", 300),
    image: profile.media[0]?.url ? absoluteUrl(profile.media[0].url) : undefined,
    address: profile.city ? { "@type": "PostalAddress", addressLocality: profile.city.name } : undefined,
    aggregateRating:
      profile.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: profile.ratingAvg.toFixed(1),
            reviewCount: profile.reviewCount,
            bestRating: 5,
          }
        : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Start
          </Link>
          <span>/</span>
          <Link href="/escorts" className="hover:text-foreground">
            Escorts
          </Link>
          {profile.city && (
            <>
              <span>/</span>
              <Link href={`/escorts?city=${profile.city.slug}`} className="hover:text-foreground">
                {profile.city.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground">{profile.displayName}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-10">
            <Gallery items={galleryItems} name={profile.displayName} />

            <header>
              <div className="flex flex-wrap items-center gap-2">
                {profile.isFeatured && (
                  <Badge variant="gold">
                    <Crown className="size-3" /> Premium
                  </Badge>
                )}
                {profile.isVerified && (
                  <Badge variant="success">
                    <BadgeCheck className="size-3" /> {VERIFICATION_LABEL[profile.verificationLevel]}
                  </Badge>
                )}
                {online && (
                  <Badge variant="success">
                    <span className="size-1.5 rounded-xs bg-current" /> Jetzt online
                  </Badge>
                )}
                {profile.isNew && <Badge variant="default">Neu</Badge>}
                {profile.status === "PAUSED" && <Badge variant="warning">Pausiert</Badge>}
              </div>

              {/* Story links neben dem Namen — wie das Profilbild eines Kontos. */}
              <div className="mt-4 flex items-start gap-4">
                {stories[0] && <ProfileStoryBubble buendel={stories[0]} className="shrink-0" />}

                <div className="min-w-0 flex-1">
                  <h1 className="font-display text-4xl font-bold tracking-tight">
                    {profile.displayName}
                    {age && <span className="ml-2 text-2xl font-normal text-muted-foreground">{age}</span>}
                  </h1>

                  {profile.headline && (
                    <p className="mt-2 text-lg text-muted-foreground">{profile.headline}</p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    {profile.city && (
                      <Link
                        href={`/escorts?city=${profile.city.slug}`}
                        className="flex items-center gap-1.5 hover:text-foreground"
                      >
                        <MapPin className="size-4" />
                        {profile.district ? `${profile.district}, ` : ""}
                        {profile.city.name}
                      </Link>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Users className="size-4" /> {GENDER_LABEL[profile.gender]}
                    </span>
                    {profile.reviewCount > 0 && (
                      <a href="#bewertungen" className="flex items-center gap-1.5 hover:text-foreground">
                        <Stars value={profile.ratingAvg} />
                        {profile.ratingAvg.toFixed(1)} ({profile.reviewCount})
                      </a>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Eye className="size-4" /> {formatNumber(profile.viewCount)} Aufrufe
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Heart className="size-4" /> {formatNumber(profile._count.favorites)}
                    </span>
                    {profile.user.lastSeenAt && !online && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-4" /> zuletzt {timeAgo(profile.user.lastSeenAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </header>

            {profile.about && (
              <section>
                <h2 className="mb-3 font-display text-2xl font-bold tracking-tight">Über mich</h2>
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{profile.about}</p>
              </section>
            )}

            {facts.length > 0 && (
              <section>
                <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">Steckbrief</h2>
                <dl className="grid gap-x-8 gap-y-0 sm:grid-cols-2">
                  {facts.map((fact) => (
                    <div
                      key={fact.label}
                      className="flex justify-between gap-4 border-b border-border py-2.5 text-sm"
                    >
                      <dt className="text-muted-foreground">{fact.label}</dt>
                      <dd className="text-right font-medium">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {profile.languages.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
                  <Languages className="size-5 text-primary" /> Sprachen
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((l) => (
                    <span
                      key={l.languageId}
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card py-1.5 pl-1.5 pr-3 text-sm"
                    >
                      <FlagAvatar
                        flag={l.language.flag}
                        code={l.language.code}
                        label={l.language.name}
                        size="lg"
                      />
                      <span className="font-medium">{l.language.name}</span>
                      <span className="text-xs text-muted-foreground/70">{"●".repeat(l.level)}</span>
                    </span>
                  ))}
                </div>
              </section>
            )}

            {Object.keys(servicesByCategory).length > 0 && (
              <section>
                <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">Services</h2>
                <div className="space-y-5">
                  {Object.entries(servicesByCategory).map(([category, services]) => (
                    <div key={category}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {category}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {services.map((service) => (
                          <Badge key={service.name} variant="outline" size="lg">
                            {service.name}
                            {service.extra ? (
                              <span className="ml-1 text-primary">
                                +{formatPrice(service.extra, profile.currency)}
                              </span>
                            ) : null}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {profile.rates.length > 0 && (
              <section>
                <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">Preise</h2>
                <Card className="overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium">Dauer</th>
                        <th className="px-5 py-3 text-left font-medium">Ort</th>
                        <th className="px-5 py-3 text-right font-medium">Preis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.rates.map((rate) => (
                        <tr key={rate.id} className="border-t border-border">
                          <td className="px-5 py-3 font-medium">
                            {rate.label ??
                              (rate.minutes >= 60 ? `${rate.minutes / 60} Std.` : `${rate.minutes} Min.`)}
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">{PLACE_LABEL[rate.place]}</td>
                          <td className="px-5 py-3 text-right font-semibold">
                            {formatPrice(rate.price, profile.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
                {profile.priceNote && (
                  <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
                    {profile.priceNote}
                  </p>
                )}
              </section>
            )}

            {profile.workingHours.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
                  <Clock className="size-5 text-primary" /> Erreichbarkeit
                </h2>
                <Card className="divide-y divide-border">
                  {profile.workingHours.map((wh) => (
                    <div key={wh.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                      <span className="text-muted-foreground">{WEEKDAYS[wh.weekday]}</span>
                      <span className={wh.closed ? "text-muted-foreground" : "font-medium"}>
                        {wh.closed ? "Geschlossen" : `${wh.from} – ${wh.to}`}
                      </span>
                    </div>
                  ))}
                </Card>
              </section>
            )}

            {profile.tours.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
                  <Plane className="size-5 text-primary" /> Tourplan
                </h2>
                <div className="space-y-2">
                  {profile.tours.map((tour) => (
                    <Card key={tour.id} className="flex items-center gap-4 p-4">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <CalendarRange className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{tour.city.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(tour.from)} – {formatDate(tour.to)}
                          {tour.note ? ` · ${tour.note}` : ""}
                        </p>
                      </div>
                      <Link
                        href={`/escorts?city=${tour.city.slug}`}
                        className="shrink-0 text-xs font-medium text-primary hover:underline"
                      >
                        Stadt ansehen
                      </Link>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {(profile.travelsWorldwide || profile.hasCar || profile.acceptsCouples) && (
              <section className="flex flex-wrap gap-2">
                {profile.travelsWorldwide && (
                  <Badge variant="neutral" size="lg">
                    <Globe className="size-3" /> Weltweit buchbar
                  </Badge>
                )}
                {profile.hasCar && (
                  <Badge variant="neutral" size="lg">
                    <Car className="size-3" /> Eigenes Auto
                  </Badge>
                )}
                {profile.acceptsCouples && (
                  <Badge variant="neutral" size="lg">
                    <Users className="size-3" /> Paare willkommen
                  </Badge>
                )}
                {profile.radiusKm ? (
                  <Badge variant="neutral" size="lg">
                    <Ruler className="size-3" /> Umkreis {profile.radiusKm} km
                  </Badge>
                ) : null}
                {profile.smoker === "NO" && (
                  <Badge variant="neutral" size="lg">
                    <Cigarette className="size-3" /> Nichtraucher:in
                  </Badge>
                )}
              </section>
            )}

            {(() => {
              // Eigene Koordinate bevorzugen, sonst der Mittelpunkt der Stadt.
              const eigen = profile.lat != null && profile.lng != null;
              const roh = eigen
                ? { lat: profile.lat!, lng: profile.lng! }
                : profile.city?.lat != null && profile.city?.lng != null
                  ? { lat: profile.city.lat, lng: profile.city.lng }
                  : null;
              if (!roh) return null;

              // Ohne Freigabe der Adresse nur ungefähr verorten.
              const unscharf = eigen && !profile.showAddress;
              const punkt = unscharf ? ungefaehr(roh) : roh;

              return (
                <LocationCard
                  lat={punkt.lat}
                  lng={punkt.lng}
                  radiusKm={profile.radiusKm}
                  ortName={[profile.district, profile.city?.name].filter(Boolean).join(", ") || "Schweiz"}
                  citySlug={profile.city?.slug}
                  ungefaehr={unscharf || !eigen}
                />
              );
            })()}

            <ReviewSection
              profileId={profile.id}
              displayName={profile.displayName}
              reviews={reviews}
              average={profile.ratingAvg}
              canReview={Boolean(user) && !isOwner && !ownReview}
              isLoggedIn={Boolean(user)}
            />
          </div>

          <aside className="lg:sticky lg:top-24 lg:h-fit lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto">
            <ContactCard
              profileId={profile.id}
              profileUserId={profile.userId}
              displayName={profile.displayName}
              phone={profile.phone}
              whatsapp={profile.whatsapp}
              telegram={profile.telegram}
              showPhone={profile.showPhone}
              contactNote={profile.contactNote}
              priceHour={profile.priceHour}
              currency={profile.currency}
              meetingPlace={profile.meetingPlace}
              isFavorited={Boolean(favorite)}
              isLoggedIn={Boolean(user)}
              isOwner={isOwner}
              gifts={gifts}
            />

            {profile.agency && (
              <Card className="mt-3 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Agentur
                </p>
                <Link
                  href={`/agenturen/${profile.agency.slug}`}
                  className="mt-2 block text-sm font-semibold hover:text-primary"
                >
                  {profile.agency.name}
                </Link>
                {profile.agency.cityName && (
                  <p className="mt-1 text-xs text-muted-foreground">{profile.agency.cityName}</p>
                )}
              </Card>
            )}
          </aside>
        </div>
      </div>

      <ProfileRail
        title="Ähnliche Profile"
        subtitle={profile.city ? `Weitere Begleitung in ${profile.city.name}` : undefined}
        profiles={similar}
        href="/escorts"
        eyebrow={
          <>
            <Star className="size-3.5" /> Entdecken
          </>
        }
      />
    </>
  );
}

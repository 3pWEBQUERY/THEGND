import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Crown, Flame, Radio, Sparkles, Star } from "lucide-react";
import { db } from "@/lib/db";
import { SITE } from "@/lib/constants";
import { Hero } from "@/components/marketing/hero";
import { CityGrid } from "@/components/marketing/city-grid";
import { CtaBanner, HowItWorks, ProviderSection, TrustSection } from "@/components/marketing/sections";
import { ProfileRail } from "@/components/profile/profile-rail";
import { StoryCards } from "@/components/stories/story-cards";
import { eigeneStoryQuelle, storyBuendel } from "@/server/queries/stories";
import { Badge } from "@/components/ui/badge";
import {
  getFeaturedProfiles,
  getNewestProfiles,
  getOnlineProfiles,
  getPlatformStats,
  getPopularCities,
  getTopRatedProfiles,
} from "@/server/queries/profiles";
import { getFavoriteIds } from "@/server/queries/user";
import { formatDate, timeAgo } from "@/lib/utils";

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [featured, newest, online, topRated, cities, stats, favoriteIds, cityOptions, articles, buendel, storyQuelle] =
    await Promise.all([
    getFeaturedProfiles(10),
    getNewestProfiles(10),
    getOnlineProfiles(10),
    getTopRatedProfiles(10),
    getPopularCities(12),
    getPlatformStats(),
    getFavoriteIds(),
    db.city.findMany({
      where: { profiles: { some: { status: "ACTIVE" } } },
      select: { slug: true, name: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
    db.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    storyBuendel(),
    eigeneStoryQuelle(),
  ]);

  const gallery = [...new Map(featured.concat(newest).map((p) => [p.id, p])).values()]
    .filter((p) => p.media[0])
    .slice(0, 5)
    .map((p) => ({ slug: p.slug, name: p.displayName, image: p.media[0]?.thumbUrl ?? p.media[0]?.url ?? null }));

  return (
    <>
      <Hero cities={cityOptions} stats={stats} gallery={gallery} />

      <StoryCards
        buendel={buendel}
        quelle={storyQuelle}
        subtitle="Was gerade läuft — direkt aus den Inseraten und Häusern"
        className="pt-10 pb-2"
      />

      <ProfileRail
        title="Spotlight"
        subtitle="Handverlesene Profile mit Premium-Platzierung"
        eyebrow={
          <>
            <Crown className="size-3.5" /> Empfohlen
          </>
        }
        href="/escorts?sort=relevance"
        profiles={featured}
        favoriteIds={favoriteIds}
      />

      <ProfileRail
        title="Jetzt online"
        subtitle="Diese Profile sind gerade erreichbar"
        eyebrow={
          <>
            <Radio className="size-3.5" /> Live
          </>
        }
        href="/escorts?online=1"
        profiles={online}
        favoriteIds={favoriteIds}
      />

      <CityGrid cities={cities} />

      <ProfileRail
        title="Neu auf THEGND"
        subtitle="Frisch verifizierte Profile der letzten Tage"
        eyebrow={
          <>
            <Sparkles className="size-3.5" /> Neuzugänge
          </>
        }
        href="/escorts?sort=new"
        profiles={newest}
        favoriteIds={favoriteIds}
      />

      <TrustSection />

      <ProfileRail
        title="Am besten bewertet"
        subtitle="Echte Bewertungen von verifizierten Treffen"
        eyebrow={
          <>
            <Star className="size-3.5" /> Top-Rating
          </>
        }
        href="/escorts?sort=rating"
        profiles={topRated}
        favoriteIds={favoriteIds}
      />

      <HowItWorks />
      <ProviderSection />

      {articles.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <Flame className="size-3.5" /> Magazin
              </p>
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Wissen, das weiterhilft</h2>
            </div>
            <Link
              href="/magazin"
              className="hidden items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
            >
              Alle Artikel <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {articles.map((post) => (
              <Link
                key={post.id}
                href={`/magazin/${post.slug}`}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="relative aspect-16/9 bg-muted">
                  {post.coverUrl && (
                    <Image
                      src={post.coverUrl}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-5">
                  <Badge variant="neutral" size="sm" className="mb-3 capitalize">
                    {post.category}
                  </Badge>
                  <h3 className="line-clamp-2 text-base font-semibold leading-snug">{post.title}</h3>
                  {post.excerpt && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    {post.publishedAt ? formatDate(post.publishedAt) : timeAgo(post.createdAt)} · {post.readMinutes} Min.
                    Lesezeit
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <CtaBanner />
    </>
  );
}

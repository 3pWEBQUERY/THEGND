import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE } from "@/lib/constants";


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url.replace(/\/$/, "");

  const [profiles, cities, articles, agencies] = await Promise.all([
    db.profile.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
      orderBy: { rankScore: "desc" },
      take: 5000,
    }),
    db.city.findMany({
      where: { profiles: { some: { status: "ACTIVE" } } },
      select: { slug: true },
      take: 1000,
    }),
    db.blogPost.findMany({ where: { published: true }, select: { slug: true, updatedAt: true }, take: 500 }),
    db.agency.findMany({ select: { slug: true, updatedAt: true }, take: 500 }),
  ]);

  const staticRoutes = [
    "",
    "/escorts",
    "/staedte",
    "/agenturen",
    "/touren",
    "/feed",
    "/magazin",
    "/preise",
    "/inserieren",
    "/verifizierung",
    "/faq",
    "/sicherheit",
    "/kontakt",
    "/agb",
    "/datenschutz",
    "/impressum",
    "/richtlinien",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: (path === "" ? "daily" : "weekly") as "daily" | "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  return [
    ...staticRoutes,
    ...profiles.map((p) => ({
      url: `${base}/escort/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...cities.map((c) => ({
      url: `${base}/escorts?city=${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...agencies.map((a) => ({
      url: `${base}/agenturen/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...articles.map((a) => ({
      url: `${base}/magazin/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}

export const dynamic = "force-dynamic";

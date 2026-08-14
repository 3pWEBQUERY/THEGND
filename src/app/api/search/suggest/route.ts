import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ profiles: [], cities: [] });

  const [profiles, cities] = await Promise.all([
    db.profile.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { displayName: { contains: q, mode: "insensitive" } },
          { headline: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: [{ isFeatured: "desc" }, { rankScore: "desc" }],
      take: 6,
      select: {
        slug: true,
        displayName: true,
        isVerified: true,
        city: { select: { name: true } },
        media: {
          where: { moderation: "APPROVED", visibility: "PUBLIC" },
          orderBy: [{ isCover: "desc" }, { position: "asc" }],
          take: 1,
          select: { thumbUrl: true, url: true },
        },
      },
    }),
    db.city.findMany({
      where: { name: { contains: q, mode: "insensitive" }, profiles: { some: { status: "ACTIVE" } } },
      take: 4,
      select: { slug: true, name: true, _count: { select: { profiles: { where: { status: "ACTIVE" } } } } },
    }),
  ]);

  return NextResponse.json({
    profiles: profiles.map((p) => ({
      slug: p.slug,
      displayName: p.displayName,
      city: p.city?.name ?? null,
      cover: p.media[0]?.thumbUrl ?? p.media[0]?.url ?? null,
      verified: p.isVerified,
    })),
    cities: cities.map((c) => ({ slug: c.slug, name: c.name, count: c._count.profiles })),
  });
}

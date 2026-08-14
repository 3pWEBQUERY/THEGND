import type { Metadata } from "next";
import Link from "next/link";
import { HeartOff } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { profileCardSelect } from "@/server/queries/profiles";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { ProfileCard } from "@/components/profile/profile-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Favoriten" };

export default async function FavoritesPage() {
  const user = await requireUser();
  const favorites = await db.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { profile: { select: profileCardSelect } },
  });

  return (
    <>
      <PageHeader
        title="Favoriten"
        description="Deine gemerkten Profile — nur für dich sichtbar."
      />

      {favorites.length === 0 ? (
        <EmptyState
          icon={HeartOff}
          title="Noch keine Favoriten"
          description="Tippe auf das Herz, um Profile hier zu sammeln."
          action={
            <Button asChild variant="brand">
              <Link href="/escorts">Profile entdecken</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {favorites.map((favorite) => (
            <ProfileCard key={favorite.id} profile={favorite.profile} favorited />
          ))}
        </div>
      )}
    </>
  );
}

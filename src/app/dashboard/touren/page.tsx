import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { ToursManager } from "@/components/dashboard/tours-manager";

export const metadata: Metadata = { title: "Tourplan" };

export default async function ToursPage() {
  const user = await requireUser();
  if (!user.profileId) redirect("/onboarding");

  const [tours, cities] = await Promise.all([
    db.tour.findMany({
      where: { profileId: user.profileId },
      orderBy: { from: "asc" },
      include: { city: { select: { name: true } } },
    }),
    db.city.findMany({
      select: { id: true, name: true, lat: true, lng: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Tourplan"
        description="Kündige Reisen an — du erscheinst dann automatisch in der Suche der Zielstadt."
      />
      <ToursManager
        tours={JSON.parse(JSON.stringify(tours))}
        cities={cities}
      />
    </>
  );
}

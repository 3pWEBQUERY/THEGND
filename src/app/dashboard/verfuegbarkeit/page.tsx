import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { WorkingHoursForm } from "@/components/dashboard/working-hours-form";

export const metadata: Metadata = { title: "Erreichbarkeit" };

export default async function AvailabilityPage() {
  const user = await requireUser();
  if (!user.profileId) redirect("/onboarding");

  const hours = await db.workingHour.findMany({
    where: { profileId: user.profileId },
    orderBy: { weekday: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Erreichbarkeit"
        description="Wann bist du erreichbar? Die Zeiten erscheinen öffentlich auf deinem Profil."
      />
      <WorkingHoursForm hours={JSON.parse(JSON.stringify(hours))} />
    </>
  );
}

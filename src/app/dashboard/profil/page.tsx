import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProfileEditor } from "@/components/dashboard/profile-editor";
import { ConvertToAgency } from "@/components/dashboard/convert-to-agency";
import { eigeneMitgliedschaft } from "@/server/queries/agency-access";
import { HOUSE_LIKE_PROFILE_KINDS } from "@/lib/constants";

export const metadata: Metadata = { title: "Profil bearbeiten" };

export default async function ProfileEditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const { eigenes } = await searchParams;
  const mitglied = await eigeneMitgliedschaft();

  /*
   * Wer ein Haus führt, meint mit „Inserat“ die Inserate seines Hauses —
   * dort werden Escorts angelegt und gepflegt. Deshalb führt diese Seite
   * für Häuser zur Model-Verwaltung.
   *
   * `?eigenes=1` übersteuert das: Eine Betreiberin kann daneben ein eigenes
   * Inserat führen, und das soll erreichbar bleiben.
   */
  if (mitglied && eigenes !== "1") redirect("/dashboard/agentur/models");

  if (!user.profileId) {
    if (mitglied) redirect("/dashboard/agentur");
    redirect(user.role === "AGENCY" ? "/onboarding/agentur" : "/onboarding");
  }

  const [profile, cities, serviceCategories, languages] = await Promise.all([
    db.profile.findUnique({
      where: { id: user.profileId },
      include: {
        services: { select: { serviceId: true, extraCost: true } },
        languages: { select: { languageId: true, level: true } },
        rates: { orderBy: { minutes: "asc" } },
      },
    }),
    db.city.findMany({
      select: { id: true, name: true, country: { select: { code: true } } },
      orderBy: { name: "asc" },
      take: 500,
    }),
    db.serviceCategory.findMany({
      // „Haus & Ambiente“ beschreibt ein Lokal, kein persönliches Inserat.
      where: { scope: { in: ["BOTH", "PROFILE"] } },
      orderBy: { position: "asc" },
      include: { services: { orderBy: { position: "asc" } } },
    }),
    db.language.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!profile) redirect("/onboarding");

  // Als Agentur/Club/Studio angelegte Inserate gehören ins Haus-Modell.
  // Bereits archivierte stören niemanden mehr — dann kein Hinweis.
  const alsHausGemeint =
    profile.status !== "ARCHIVED" && (HOUSE_LIKE_PROFILE_KINDS as readonly string[]).includes(profile.kind);

  return (
    <>
      <PageHeader
        title="Profil bearbeiten"
        description="Je vollständiger dein Profil, desto besser platzierst du dich in der Suche."
      />

      {alsHausGemeint && (
        <ConvertToAgency
          kind={profile.kind}
          displayName={profile.displayName}
          hatHaus={Boolean(mitglied)}
        />
      )}
      <ProfileEditor
        profile={JSON.parse(JSON.stringify(profile))}
        cities={cities.map((c) => ({ id: c.id, name: `${c.name} (${c.country.code})` }))}
        serviceCategories={serviceCategories}
        languages={languages}
      />
    </>
  );
}

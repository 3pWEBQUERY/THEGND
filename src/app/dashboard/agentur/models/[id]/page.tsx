import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { s3Configured } from "@/lib/s3";
import { darfBearbeiten, eigeneMitgliedschaft } from "@/server/queries/agency-access";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProfileEditor } from "@/components/dashboard/profile-editor";
import { MediaManager } from "@/components/dashboard/media-manager";
import { ModelStatusBar } from "@/components/dashboard/model-status-bar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { PROFILE_STATUS_LABEL } from "@/lib/constants";

export const metadata: Metadata = { title: "Model bearbeiten" };

export default async function ModelBearbeitenPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const mitglied = await eigeneMitgliedschaft();
  if (!mitglied) redirect("/dashboard/agentur");

  const [profile, cities, serviceCategories, languages, haus] = await Promise.all([
    db.profile.findUnique({
      where: { id },
      include: {
        services: { select: { serviceId: true, extraCost: true } },
        languages: { select: { languageId: true, level: true } },
        rates: { orderBy: { minutes: "asc" } },
        media: { orderBy: [{ isCover: "desc" }, { position: "asc" }] },
        user: { select: { email: true, managedByAgencyId: true } },
      },
    }),
    db.city.findMany({
      select: { id: true, name: true, country: { select: { code: true } } },
      orderBy: { name: "asc" },
      take: 500,
    }),
    db.serviceCategory.findMany({
      where: { scope: { in: ["BOTH", "PROFILE"] } },
      orderBy: { position: "asc" },
      include: { services: { orderBy: { position: "asc" } } },
    }),
    db.language.findMany({ orderBy: { name: "asc" } }),
    // Models arbeiten am Standort ihres Hauses — der steht im Standort-Tab
    // zur Übernahme bereit.
    db.agency.findUnique({
      where: { id: mitglied.agencyId },
      select: {
        cityId: true,
        district: true,
        street: true,
        zip: true,
        lat: true,
        lng: true,
        city: { select: { name: true } },
        cityName: true,
      },
    }),
  ]);

  // Nur Models des eigenen Hauses — und nur mit Schreibrecht.
  if (!profile || profile.agencyId !== mitglied.agencyId) notFound();
  if (!darfBearbeiten(mitglied.rolle)) redirect("/dashboard/agentur/models");

  const verwaltet = profile.user.managedByAgencyId === mitglied.agencyId;

  return (
    <>
      <PageHeader
        title={profile.displayName}
        description={
          verwaltet
            ? "Von deinem Haus angelegt und verwaltet."
            : "Führt ein eigenes Konto — Änderungen sieht die Person sofort."
        }
        action={
          <div className="flex items-center gap-3">
            <Badge size="sm" variant={profile.status === "ACTIVE" ? "success" : "neutral"}>
              {PROFILE_STATUS_LABEL[profile.status] ?? profile.status}
            </Badge>
            {profile.status === "ACTIVE" && (
              <Link
                href={`/escort/${profile.slug}`}
                target="_blank"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Ansehen <ExternalLink className="size-3" />
              </Link>
            )}
          </div>
        }
      />

      <Link
        href="/dashboard/agentur/models"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Alle Models
      </Link>

      <ModelStatusBar
        profileId={profile.id}
        displayName={profile.displayName}
        status={profile.status}
        mediaCount={profile.media.length}
        hasCity={Boolean(profile.cityId)}
        aboutLength={profile.about?.length ?? 0}
        verwaltet={verwaltet}
        email={profile.user.email}
      />

      <Tabs defaultValue="inserat" className="mt-6">
        <TabsList className="mb-6">
          <TabsTrigger value="inserat">Inserat</TabsTrigger>
          <TabsTrigger value="medien">Fotos & Videos ({profile.media.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="inserat">
          <ProfileEditor
            profile={JSON.parse(JSON.stringify(profile))}
            profileId={profile.id}
            hausStandort={
              haus
                ? {
                    cityId: haus.cityId,
                    cityName: haus.city?.name ?? haus.cityName,
                    district: haus.district,
                    street: haus.street,
                    zip: haus.zip,
                    lat: haus.lat,
                    lng: haus.lng,
                  }
                : null
            }
            cities={cities.map((c) => ({ id: c.id, name: c.name }))}
            serviceCategories={serviceCategories}
            languages={languages}
          />
        </TabsContent>

        <TabsContent value="medien">
          {!s3Configured ? (
            <Card className="border-warning/30 bg-warning/8 p-5 text-sm">
              Speicher ist nicht konfiguriert — Uploads sind derzeit nicht möglich.
            </Card>
          ) : (
            <MediaManager media={JSON.parse(JSON.stringify(profile.media))} profileId={profile.id} />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}

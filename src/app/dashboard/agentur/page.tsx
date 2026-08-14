import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ExternalLink, Eye, EyeOff } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { eigenesHaus, darfBearbeiten } from "@/server/queries/agency-access";
import { updateOwnAgencyAction } from "@/server/actions/agency";
import { PageHeader } from "@/components/dashboard/page-header";
import { AgencyEditor } from "@/components/admin/agency-editor";
import { CreateAgencyForm } from "@/components/dashboard/create-agency-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AGENCY_KIND_LABEL } from "@/lib/constants";

export const metadata: Metadata = { title: "Mein Haus" };

export default async function AgenturPage() {
  await requireUser();
  const eigen = await eigenesHaus();

  const [cities, serviceCategories, languages] = await Promise.all([
    db.city.findMany({ select: { id: true, name: true, lat: true, lng: true }, orderBy: { name: "asc" }, take: 500 }),
    db.serviceCategory.findMany({
      // Persönliche Vorlieben gehören ins Inserat, nicht ins Haus.
      where: { scope: { in: ["BOTH", "AGENCY"] } },
      orderBy: { position: "asc" },
      select: { id: true, name: true, services: { orderBy: { position: "asc" }, select: { id: true, name: true } } },
    }),
    db.language.findMany({ orderBy: { name: "asc" }, select: { id: true, code: true, name: true } }),
  ]);

  if (!eigen) {
    return (
      <>
        <PageHeader
          title="Agentur, Club oder Studio anlegen"
          description="Lege dein Haus an, um es im Verzeichnis zu führen und dein Team zu verwalten."
        />
        <CreateAgencyForm cities={cities} />
      </>
    );
  }

  const { agency, rolle } = eigen;
  const schreiben = darfBearbeiten(rolle);

  return (
    <>
      <PageHeader
        title={agency.name}
        description={AGENCY_KIND_LABEL[agency.kind] ?? agency.kind}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={agency.isPublished ? "success" : "neutral"} size="sm">
              {agency.isPublished ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
              {agency.isPublished ? "öffentlich" : "versteckt"}
            </Badge>
            {agency.isPublished && (
              <Link
                href={`/agenturen/${agency.slug}`}
                target="_blank"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Ansehen <ExternalLink className="size-3" />
              </Link>
            )}
          </div>
        }
      />

      {!schreiben && (
        <Card className="mb-6 border-warning/30 bg-warning/8 p-4">
          <p className="flex items-start gap-2 text-sm">
            <Building2 className="mt-0.5 size-4 shrink-0 text-warning" />
            Du hast Leserechte für dieses Haus. Änderungen kann nur die Inhaberin oder eine Verwaltung vornehmen.
          </p>
        </Card>
      )}

      <AgencyEditor
        agency={{
          ...agency,
          serviceIds: agency.services.map((s) => s.serviceId),
          languageIds: agency.languages.map((l) => l.languageId),
        }}
        cities={cities}
        serviceCategories={serviceCategories}
        languages={languages}
        action={updateOwnAgencyAction}
        variant="betreiber"
        nurLesen={!schreiben}
        version={String(agency.updatedAt)}
      />
    </>
  );
}

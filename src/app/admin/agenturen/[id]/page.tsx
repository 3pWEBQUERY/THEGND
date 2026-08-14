import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { AgencyEditor } from "@/components/admin/agency-editor";
import { saveAgencyAction } from "@/server/actions/admin";
import { agenturStammdaten } from "@/app/admin/agenturen/stammdaten";

export const metadata: Metadata = { title: "Haus bearbeiten · Admin" };

export default async function AgenturBearbeitenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [agency, stammdaten] = await Promise.all([
    db.agency.findUnique({
      where: { id },
      include: {
        services: { select: { serviceId: true } },
        languages: { select: { languageId: true } },
        hours: { orderBy: { weekday: "asc" } },
      },
    }),
    agenturStammdaten(),
  ]);
  if (!agency) notFound();

  return (
    <>
      <PageHeader
        title={agency.name}
        description={`/agenturen/${agency.slug}`}
        action={
          <Link
            href={`/agenturen/${agency.slug}`}
            target="_blank"
            className="text-xs text-primary hover:underline"
          >
            Öffentliche Seite ansehen ↗
          </Link>
        }
      />
      <AgencyEditor
        agency={{
          ...agency,
          serviceIds: agency.services.map((s) => s.serviceId),
          languageIds: agency.languages.map((l) => l.languageId),
        }}
        cities={stammdaten.cities}
        serviceCategories={stammdaten.serviceCategories}
        languages={stammdaten.languages}
        action={saveAgencyAction}
        version={String(agency.updatedAt)}
      />
    </>
  );
}

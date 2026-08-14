import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AgencyVerificationReview } from "@/components/admin/agency-verification-review";
import { AGENCY_KIND_LABEL } from "@/lib/constants";

export const metadata: Metadata = { title: "Agenturen · Admin" };

export default async function AdminAgenciesPage() {
  const [agencies, antraege] = await Promise.all([
    db.agency.findMany({
      orderBy: [{ isPublished: "desc" }, { name: "asc" }],
      include: {
        city: { select: { name: true } },
        _count: { select: { profiles: true, services: true } },
      },
    }),
    db.agencyVerification.findMany({
      where: { status: { in: ["SUBMITTED", "IN_REVIEW"] } },
      orderBy: { submittedAt: "asc" },
      select: {
        id: true,
        legalName: true,
        uid: true,
        contactName: true,
        contactRole: true,
        registryKey: true,
        permitKey: true,
        idKey: true,
        submittedAt: true,
        agency: { select: { name: true, slug: true } },
      },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Agenturen & Clubs"
        description="Häuser anlegen, Standort setzen, Öffnungszeiten und Angebot pflegen."
        action={
          <Button asChild variant="brand" size="sm">
            <Link href="/admin/agenturen/neu">
              <Plus className="size-4" /> Neues Haus
            </Link>
          </Button>
        }
      />

      <AgencyVerificationReview antraege={antraege} />

      {agencies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Noch keine Häuser"
          description="Lege das erste Haus an — Agentur, Club, Studio, Massagesalon, Sauna oder Bar."
        />
      ) : (
        <Card className="divide-y divide-border">
          {agencies.map((agency) => (
            <Link
              key={agency.id}
              href={`/admin/agenturen/${agency.id}`}
              className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{agency.name}</p>
                <p className="text-xs text-muted-foreground">
                  /{agency.slug} · {AGENCY_KIND_LABEL[agency.kind] ?? agency.kind} ·{" "}
                  {agency.city?.name ?? agency.cityName ?? "ohne Stadt"} · {agency._count.profiles}{" "}
                  {agency._count.profiles === 1 ? "Model" : "Models"} · {agency._count.services} Services
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {agency.isVerified && (
                  <Badge size="sm" variant="success">
                    geprüft
                  </Badge>
                )}
                <Badge size="sm" variant={agency.isPublished ? "neutral" : "outline"}>
                  {agency.isPublished ? "öffentlich" : "versteckt"}
                </Badge>
              </div>
            </Link>
          ))}
        </Card>
      )}
    </>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { eigeneMitgliedschaft } from "@/server/queries/agency-access";
import { PageHeader } from "@/components/dashboard/page-header";
import { AgencyVerificationForm } from "@/components/dashboard/agency-verification-form";

export const metadata: Metadata = { title: "Prüfung · Mein Haus" };

export default async function AgenturPruefungPage() {
  await requireUser();
  const mitglied = await eigeneMitgliedschaft();
  if (!mitglied) redirect("/dashboard/agentur");

  const haus = await db.agency.findUnique({
    where: { id: mitglied.agencyId },
    select: {
      isVerified: true,
      verification: {
        select: {
          status: true,
          note: true,
          submittedAt: true,
          reviewedAt: true,
          legalName: true,
          uid: true,
          contactName: true,
          contactRole: true,
        },
      },
    },
  });
  if (!haus) redirect("/dashboard/agentur");

  return (
    <>
      <PageHeader
        title="Prüfung beantragen"
        description="Weise nach, dass hinter dem Inserat ein reales Unternehmen steht — und erhalte das Geprüft-Siegel."
      />
      <AgencyVerificationForm
        stand={haus.verification}
        istVerifiziert={haus.isVerified}
        istInhaberin={mitglied.rolle === "OWNER"}
      />
    </>
  );
}

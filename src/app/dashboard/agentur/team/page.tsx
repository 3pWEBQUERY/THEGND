import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { eigeneMitgliedschaft } from "@/server/queries/agency-access";
import { PageHeader } from "@/components/dashboard/page-header";
import { AgencyTeam } from "@/components/dashboard/agency-team";

export const metadata: Metadata = { title: "Team · Mein Haus" };

export default async function AgenturTeamPage() {
  await requireUser();
  const mitglied = await eigeneMitgliedschaft();
  if (!mitglied) redirect("/dashboard/agentur");

  const mitglieder = await db.agencyMember.findMany({
    where: { agencyId: mitglied.agencyId },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      role: true,
      createdAt: true,
      userId: true,
      user: { select: { displayName: true, email: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Team"
        description="Wer dein Haus mitverwalten darf. Zugriff gilt nur für die Hausverwaltung, nicht für Profile."
      />
      <AgencyTeam
        mitglieder={mitglieder.map((m) => ({
          id: m.id,
          role: m.role,
          createdAt: m.createdAt,
          istSelbst: m.userId === mitglied.userId,
          user: m.user,
        }))}
        istInhaberin={mitglied.rolle === "OWNER"}
      />
    </>
  );
}

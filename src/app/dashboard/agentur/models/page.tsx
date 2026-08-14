import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { darfBearbeiten, eigeneMitgliedschaft } from "@/server/queries/agency-access";
import { PageHeader } from "@/components/dashboard/page-header";
import { AgencyModels } from "@/components/dashboard/agency-models";

export const metadata: Metadata = { title: "Models · Mein Haus" };

export default async function AgenturModelsPage() {
  await requireUser();
  const mitglied = await eigeneMitgliedschaft();
  if (!mitglied) redirect("/dashboard/agentur");

  const [models, einladungen, anfragen, cities] = await Promise.all([
    db.profile.findMany({
      where: { agencyId: mitglied.agencyId },
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        slug: true,
        displayName: true,
        status: true,
        isVerified: true,
        user: { select: { managedByAgencyId: true } },
        city: { select: { name: true } },
        media: {
          where: { moderation: "APPROVED", visibility: "PUBLIC" },
          orderBy: [{ isCover: "desc" }, { position: "asc" }],
          take: 1,
          select: { thumbUrl: true, url: true },
        },
      },
    }),
    // Vom Haus verschickt — wir warten auf die Zusage.
    db.agencyInvite.findMany({
      where: { agencyId: mitglied.agencyId, status: "PENDING", origin: "AGENCY" },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, profile: { select: { slug: true, displayName: true } } },
    }),
    // Von Anbieterinnen gestellt — hier entscheiden wir.
    db.agencyInvite.findMany({
      where: { agencyId: mitglied.agencyId, status: "PENDING", origin: "PROFILE" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        message: true,
        profile: { select: { slug: true, displayName: true } },
      },
    }),
    db.city.findMany({ select: { id: true, name: true, lat: true, lng: true }, orderBy: { name: "asc" }, take: 500 }),
  ]);

  return (
    <>
      <PageHeader
        title="Models"
        description="Wer zu deinem Haus gehört. Einladungen werden erst wirksam, wenn die Person zusagt."
      />
      <AgencyModels
        models={models.map((m) => ({
          id: m.id,
          slug: m.slug,
          displayName: m.displayName,
          status: m.status,
          isVerified: m.isVerified,
          coverUrl: m.media[0]?.thumbUrl ?? m.media[0]?.url ?? null,
          cityName: m.city?.name ?? null,
          verwaltet: m.user.managedByAgencyId === mitglied.agencyId,
        }))}
        einladungen={einladungen}
        anfragen={anfragen}
        cities={cities}
        darfBearbeiten={darfBearbeiten(mitglied.rolle)}
      />
    </>
  );
}

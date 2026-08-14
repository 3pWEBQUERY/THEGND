import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { offeneEinladungen } from "@/server/queries/agency-access";
import { PageHeader } from "@/components/dashboard/page-header";
import { AgencyInvites } from "@/components/dashboard/agency-invites";
import { JoinAgency } from "@/components/dashboard/join-agency";

export const metadata: Metadata = { title: "Agentur & Club" };

export default async function ZugehoerigkeitPage() {
  const user = await requireUser();
  if (!user.profileId) redirect("/onboarding");

  const [profil, einladungen, anfrage, haeuser] = await Promise.all([
    db.profile.findUnique({
      where: { id: user.profileId },
      select: { agency: { select: { name: true, slug: true, kind: true, isVerified: true } } },
    }),
    // Einladungen des Hauses an mich — hier sage ich zu.
    offeneEinladungen(user.profileId),
    // Meine eigene laufende Anfrage — hier wartet das Haus.
    db.agencyInvite.findFirst({
      where: { profileId: user.profileId, status: "PENDING", origin: "PROFILE" },
      select: {
        id: true,
        createdAt: true,
        message: true,
        agency: { select: { name: true, slug: true, kind: true } },
      },
    }),
    db.agency.findMany({
      where: { isPublished: true },
      orderBy: [{ isVerified: "desc" }, { name: "asc" }],
      take: 200,
      select: {
        slug: true,
        name: true,
        kind: true,
        cityName: true,
        logoUrl: true,
        isVerified: true,
        city: { select: { name: true } },
        _count: { select: { profiles: { where: { status: "ACTIVE" } } } },
      },
    }),
  ]);

  const gehoertDazu = Boolean(profil?.agency);

  return (
    <>
      <PageHeader
        title="Agentur & Club"
        description="Ob du zu einem Haus gehörst, entscheidest du. Zuordnungen entstehen nur mit deiner Zustimmung."
      />

      <div className="space-y-6">
        <AgencyInvites
          einladungen={einladungen}
          aktuellesHaus={
            profil?.agency
              ? {
                  name: profil.agency.name,
                  slug: profil.agency.slug,
                  kind: profil.agency.kind,
                  isVerified: profil.agency.isVerified,
                }
              : null
          }
        />

        {/* Beitreten kann nur, wer noch zu keinem Haus gehört. */}
        {!gehoertDazu && (
          <JoinAgency
            anfrage={anfrage}
            haeuser={haeuser.map((h) => ({
              slug: h.slug,
              name: h.name,
              kind: h.kind,
              cityName: h.city?.name ?? h.cityName,
              logoUrl: h.logoUrl,
              isVerified: h.isVerified,
              modelCount: h._count.profiles,
            }))}
          />
        )}
      </div>
    </>
  );
}

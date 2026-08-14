import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, StatCard } from "@/components/dashboard/page-header";
import { BoostShop } from "@/components/dashboard/boost-shop";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BOOST_LABEL } from "@/lib/constants";
import { formatDateTime, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Sichtbarkeit & Werbung" };

export default async function BoostsPage() {
  const user = await requireUser();
  if (!user.profileId) redirect("/onboarding");

  const [profile, activeBoosts, history] = await Promise.all([
    db.profile.findUnique({
      where: { id: user.profileId },
      select: { status: true, rankScore: true, bumpedAt: true, isFeatured: true, viewCount: true },
    }),
    db.boost.findMany({
      where: { profileId: user.profileId, active: true, endsAt: { gt: new Date() } },
      orderBy: { endsAt: "asc" },
    }),
    db.boost.findMany({
      where: { profileId: user.profileId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Sichtbarkeit & Werbung"
        description="Mehr Reichweite auf Knopfdruck — flexibel, ohne Abo, jederzeit stoppbar."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Guthaben" value={`${user.credits} C`} />
        <StatCard label="Ranking-Score" value={Math.round(profile?.rankScore ?? 0)} hint="höher = weiter oben" />
        <StatCard label="Zuletzt gepusht" value={profile?.bumpedAt ? timeAgo(profile.bumpedAt) : "—"} />
      </div>

      {activeBoosts.length > 0 && (
        <Card className="mt-6 p-5">
          <h2 className="mb-3 text-base font-semibold">Aktive Kampagnen</h2>
          <ul className="space-y-2">
            {activeBoosts.map((boost) => (
              <li key={boost.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{BOOST_LABEL[boost.type]}</p>
                  <p className="text-xs text-muted-foreground">läuft bis {formatDateTime(boost.endsAt)}</p>
                </div>
                <Badge variant="success" size="sm">
                  aktiv
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <section className="mt-8">
        <h2 className="mb-4 font-display text-xl font-bold tracking-tight">Produkte</h2>
        <BoostShop credits={user.credits} profileActive={profile?.status === "ACTIVE"} />
      </section>

      {history.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 font-display text-xl font-bold tracking-tight">Verlauf</h2>
          <Card className="divide-y divide-border">
            {history.map((boost) => (
              <div key={boost.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span>{BOOST_LABEL[boost.type]}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(boost.createdAt)} · {boost.credits} Credits
                </span>
              </div>
            ))}
          </Card>
        </section>
      )}
    </>
  );
}

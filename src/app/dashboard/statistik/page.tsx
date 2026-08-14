import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Calendar, Eye, Heart, MessageCircle, Star, TrendingUp } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getProfileStats } from "@/server/queries/user";
import { PageHeader, StatCard } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatNumber, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Statistik" };

export default async function StatsPage() {
  const user = await requireUser();
  if (!user.profileId) redirect("/onboarding");

  const [stats, profile, recentViewers, topReferers] = await Promise.all([
    getProfileStats(user.profileId),
    db.profile.findUnique({
      where: { id: user.profileId },
      select: { viewCount: true, favoriteCount: true, ratingAvg: true, reviewCount: true, rankScore: true },
    }),
    db.profileView.findMany({
      where: { profileId: user.profileId, userId: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { user: { select: { displayName: true } } },
    }),
    db.profileView.groupBy({
      by: ["referer"],
      where: { profileId: user.profileId, referer: { not: null } },
      _count: { referer: true },
      orderBy: { _count: { referer: "desc" } },
      take: 6,
    }),
  ]);

  const max = Math.max(1, ...stats.series.map((s) => s.count));
  const best = stats.series.reduce((a, b) => (b.count > a.count ? b : a), stats.series[0] ?? { date: "", count: 0 });

  return (
    <>
      <PageHeader title="Statistik" description="Wie oft dein Profil gesehen wird — und was am besten funktioniert." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Aufrufe gesamt" value={formatNumber(profile?.viewCount ?? 0)} icon={Eye} />
        <StatCard label="Letzte 7 Tage" value={formatNumber(stats.views7)} icon={TrendingUp} />
        <StatCard label="Favoriten" value={formatNumber(stats.favorites)} icon={Heart} />
        <StatCard
          label="Bewertung"
          value={profile?.reviewCount ? `${profile.ratingAvg.toFixed(1)} ★` : "—"}
          hint={`${profile?.reviewCount ?? 0} Bewertungen`}
          icon={Star}
        />
      </div>

      <Card className="mt-6 p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Aufrufe der letzten 30 Tage</h2>
          {best.count > 0 && (
            <Badge variant="neutral" size="sm">
              Bester Tag: {formatDate(best.date)} ({best.count})
            </Badge>
          )}
        </div>

        <div className="flex h-56 items-end gap-1">
          {stats.series.map((point) => (
            <div key={point.date} className="group relative flex h-full flex-1 flex-col justify-end">
              <div
                className="rounded-t bg-brand transition-opacity group-hover:opacity-75"
                style={{ height: `${Math.max(2, (point.count / max) * 100)}%` }}
              />
              <span className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[10px] text-background group-hover:block">
                {formatDate(point.date)}: {point.count}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex justify-between text-[11px] text-muted-foreground">
          <span>{formatDate(stats.series[0]?.date ?? new Date())}</span>
          <span>heute</span>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Eye className="size-4 text-primary" /> Wer hat dich angesehen
          </h2>
          {recentViewers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Noch keine angemeldeten Besucher.</p>
          ) : (
            <ul className="space-y-1">
              {recentViewers.map((view) => (
                <li key={view.id} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
                  <span>{view.user?.displayName ?? "Mitglied"}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(view.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <MessageCircle className="size-4 text-primary" /> Herkunft der Besucher
          </h2>
          {topReferers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Noch keine Daten.</p>
          ) : (
            <ul className="space-y-2">
              {topReferers.map((row) => (
                <li key={row.referer} className="flex items-center justify-between text-sm">
                  <span className="truncate text-muted-foreground">{row.referer}</span>
                  <Badge size="sm" variant="neutral">
                    {row._count.referer}
                  </Badge>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 rounded-xl bg-muted/60 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold">
              <Calendar className="size-3.5" /> Tipp
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Profile, die mindestens zweimal pro Woche „nach oben geschoben“ werden, erhalten im Schnitt 3× mehr
              Aufrufe.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Flag, Images, Star, TrendingUp, UserRound, Users } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader, StatCard } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatPrice, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  const dayAgo = new Date(Date.now() - 864e5);
  const weekAgo = new Date(Date.now() - 7 * 864e5);

  const [
    users,
    newUsers,
    profiles,
    activeProfiles,
    verifiedProfiles,
    pendingProfiles,
    pendingMedia,
    pendingVerifications,
    openReports,
    pendingReviews,
    views7,
    revenue,
    queue,
    logs,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: dayAgo } } }),
    db.profile.count(),
    db.profile.count({ where: { status: "ACTIVE" } }),
    db.profile.count({ where: { isVerified: true } }),
    db.profile.count({ where: { status: "PENDING_REVIEW" } }),
    db.media.count({ where: { moderation: "PENDING" } }),
    db.verification.count({ where: { status: { in: ["SUBMITTED", "IN_REVIEW"] } } }),
    db.report.count({ where: { status: "OPEN" } }),
    db.review.count({ where: { status: "PENDING" } }),
    db.profileView.count({ where: { createdAt: { gte: weekAgo } } }),
    db.order.aggregate({ where: { status: "PAID", paidAt: { gte: weekAgo } }, _sum: { amountCents: true } }),
    db.profile.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { updatedAt: "asc" },
      take: 6,
      select: { id: true, slug: true, displayName: true, updatedAt: true, city: { select: { name: true } } },
    }),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { displayName: true } } },
    }),
  ]);

  const tasks = [
    { label: "Profile freigeben", count: pendingProfiles, href: "/admin/profile", icon: UserRound },
    { label: "Medien prüfen", count: pendingMedia, href: "/admin/medien", icon: Images },
    { label: "Verifizierungen", count: pendingVerifications, href: "/admin/verifizierungen", icon: BadgeCheck },
    { label: "Bewertungen", count: pendingReviews, href: "/admin/bewertungen", icon: Star },
    { label: "Offene Meldungen", count: openReports, href: "/admin/meldungen", icon: Flag },
  ];

  return (
    <>
      <PageHeader title="Übersicht" description="Systemzustand, offene Aufgaben und aktuelle Aktivität." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Nutzer gesamt" value={formatNumber(users)} hint={`+${newUsers} heute`} icon={Users} />
        <StatCard label="Aktive Profile" value={formatNumber(activeProfiles)} hint={`von ${profiles}`} icon={UserRound} />
        <StatCard label="Verifiziert" value={formatNumber(verifiedProfiles)} icon={BadgeCheck} />
        <StatCard
          label="Umsatz (7 T.)"
          value={formatPrice((revenue._sum.amountCents ?? 0) / 100)}
          icon={TrendingUp}
        />
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-base font-semibold">Offene Aufgaben</h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tasks.map((task) => (
            <Link key={task.href} href={task.href}>
              <Card
                className={`p-4 transition-colors hover:border-primary/40 ${task.count > 0 ? "border-primary/30" : ""}`}
              >
                <task.icon className="mb-2 size-4 text-muted-foreground" />
                <p className="font-display text-2xl font-bold">{task.count}</p>
                <p className="text-xs text-muted-foreground">{task.label}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Warteschlange: Profile</h2>
            <Link href="/admin/profile" className="text-xs text-primary hover:underline">
              Alle
            </Link>
          </div>
          {queue.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Keine offenen Profile. 🎉</p>
          ) : (
            <ul className="space-y-2">
              {queue.map((profile) => (
                <li key={profile.id}>
                  <Link
                    href={`/admin/profile#${profile.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm transition-colors hover:border-primary/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{profile.displayName}</span>
                      <span className="block text-xs text-muted-foreground">{profile.city?.name ?? "—"}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(profile.updatedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold">Letzte Team-Aktionen</h2>
          {logs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Noch keine Einträge.</p>
          ) : (
            <ul className="space-y-1">
              {logs.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm last:border-0">
                  <span className="min-w-0">
                    <Badge variant="neutral" size="sm" className="mr-2 font-mono">
                      {entry.action}
                    </Badge>
                    <span className="text-muted-foreground">{entry.user?.displayName ?? "System"}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(entry.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <h2 className="mb-3 text-base font-semibold">Reichweite</h2>
        <p className="text-sm text-muted-foreground">
          {formatNumber(views7)} Profilaufrufe in den letzten 7 Tagen ·{" "}
          {formatNumber(Math.round(views7 / Math.max(1, activeProfiles)))} Aufrufe je aktivem Profil.
        </p>
      </Card>
    </>
  );
}

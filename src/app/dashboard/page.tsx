import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Calendar,
  Coins,
  Eye,
  Heart,
  Images,
  MessageCircle,
  Rocket,
  Sparkles,
  Star,
  UserRound,
  Users,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getProfileStats, getUnreadCounts } from "@/server/queries/user";
import { PageHeader, StatCard } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileCompleteness } from "@/components/dashboard/profile-completeness";
import { AgencyInvites } from "@/components/dashboard/agency-invites";
import { eigeneMitgliedschaft, hausKennzahlen, offeneEinladungen } from "@/server/queries/agency-access";
import { AgencyOverview } from "@/components/dashboard/agency-overview";
import { LOCALE, formatNumber, timeAgo } from "@/lib/utils";
import { BOOKING_STATUS_LABEL } from "@/lib/constants";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();

  const [counts, profile, notifications, bookings, einladungen, mitgliedschaft, konto] = await Promise.all([
    getUnreadCounts(user.id),
    user.profileId
      ? db.profile.findUnique({
          where: { id: user.profileId },
          include: {
            _count: { select: { media: true, services: true, languages: true, reviews: true, boosts: true } },
            verification: { select: { status: true } },
            agency: { select: { name: true, slug: true, kind: true, isVerified: true } },
          },
        })
      : null,
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 6 }),
    db.booking.findMany({
      where: user.profileId ? { OR: [{ clientId: user.id }, { profile: { userId: user.id } }] } : { clientId: user.id },
      orderBy: { startAt: "asc" },
      take: 5,
      include: { profile: { select: { displayName: true, slug: true } }, client: { select: { displayName: true } } },
    }),
    offeneEinladungen(user.profileId),
    eigeneMitgliedschaft(),
    db.user.findUnique({ where: { id: user.id }, select: { onboardedAt: true } }),
  ]);

  // Ein Mitgliedskonto legt kein Inserat an — sein Willkommensschritt ist das
  // Konto selbst. Solange der offen ist, führt jeder Einstieg dorthin.
  const willkommenOffen = user.role === "MEMBER" && !konto?.onboardedAt;

  // Ein Agenturkonto ohne eigenes Escort-Profil bekommt eigene Kennzahlen —
  // die Profilkacheln blieben dort sonst leer.
  const haus = mitgliedschaft ? await hausKennzahlen(mitgliedschaft.agencyId) : null;

  /*
   * Wer ein Haus führt, sieht hier die Zahlen des Hauses. Ein daneben
   * bestehendes persönliches Inserat — oft ein archivierter Rest aus der
   * Zeit, als Haus-Kategorien beim Profil wählbar waren — würde die Seite
   * nur mit einer zweiten Checkliste verstellen. Erreichbar bleibt es über
   * „Mein Haus → Eigenes Inserat“.
   */
  const eigenesInserat = haus ? null : profile;

  const stats = profile ? await getProfileStats(profile.id) : null;

  const trend = stats
    ? Math.round(((stats.views7 - (stats.views30 - stats.views7) / 3) / Math.max(1, (stats.views30 - stats.views7) / 3)) * 100)
    : 0;

  return (
    <>
      <PageHeader
        title={`Hallo, ${user.displayName ?? "willkommen"} 👋`}
        description="Hier siehst du auf einen Blick, was auf deinem Konto passiert."
        action={
          eigenesInserat ? (
            <Button asChild variant="brand">
              <Link href="/dashboard/werbung">
                <Rocket className="size-4" /> Sichtbarkeit erhöhen
              </Link>
            </Button>
          ) : haus ? (
            <Button asChild variant="brand">
              <Link href="/dashboard/agentur">
                <Building2 className="size-4" /> Haus bearbeiten
              </Link>
            </Button>
          ) : user.role === "AGENCY" ? (
            <Button asChild variant="brand">
              <Link href="/onboarding/agentur">
                <Building2 className="size-4" /> Haus anlegen
              </Link>
            </Button>
          ) : willkommenOffen ? (
            <Button asChild variant="brand">
              <Link href="/onboarding/mitglied">
                <UserRound className="size-4" /> Konto einrichten
              </Link>
            </Button>
          ) : user.role === "MEMBER" ? (
            <Button asChild variant="brand">
              <Link href="/escorts">
                <Sparkles className="size-4" /> Profile entdecken
              </Link>
            </Button>
          ) : (
            <Button asChild variant="brand">
              <Link href="/onboarding">
                <Sparkles className="size-4" /> Profil erstellen
              </Link>
            </Button>
          )
        }
      />

      {(einladungen.length > 0 || profile?.agency) && (
        <div className="mb-6">
          <AgencyInvites
            einladungen={einladungen}
            aktuellesHaus={
              profile?.agency
                ? {
                    name: profile.agency.name,
                    slug: profile.agency.slug,
                    kind: profile.agency.kind,
                    isVerified: profile.agency.isVerified,
                  }
                : null
            }
          />
        </div>
      )}

      {haus && (
        <div className="mb-6">
          <AgencyOverview daten={haus} ungeleseneNachrichten={counts.messages} />
        </div>
      )}

      {/* Kein Profil und kein Haus: erklären, wie es weitergeht. */}
      {!eigenesInserat && !haus && (
        <Card className="mb-6 border-primary/25 bg-primary/5 p-6">
          <p className="flex items-start gap-3 text-sm">
            {user.role === "AGENCY" ? (
              <>
                <Building2 className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  <span className="block font-semibold text-foreground">Dein Haus fehlt noch.</span>
                  Lege Agentur, Club oder Studio an — danach kannst du Models einladen und dein Inserat
                  veröffentlichen.
                </span>
              </>
            ) : willkommenOffen ? (
              <>
                <UserRound className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  <span className="block font-semibold text-foreground">Dein Konto ist noch nicht eingerichtet.</span>
                  Name, Bild und Sprache festlegen — danach kannst du Profile merken und Nachrichten schreiben.
                </span>
              </>
            ) : user.role === "MEMBER" ? (
              <>
                <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  <span className="block font-semibold text-foreground">Dein Konto ist eingerichtet.</span>
                  Stöbere in den Profilen — und falls du selbst inserieren willst, geht das jederzeit.
                </span>
              </>
            ) : (
              <>
                <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  <span className="block font-semibold text-foreground">Du hast noch kein Profil.</span>
                  In zwei Minuten angelegt — Fotos und Preise kommen danach.
                </span>
              </>
            )}
          </p>
        </Card>
      )}

      {/* Profilkacheln nur, wenn es ein eigenes Inserat gibt. */}
      {eigenesInserat ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Profilaufrufe (7 T.)"
            value={stats ? formatNumber(stats.views7) : "—"}
            icon={Eye}
            trend={stats && stats.views30 > stats.views7 ? trend : undefined}
            hint="vs. Vorwoche"
          />
          <StatCard label="Favoriten" value={stats ? formatNumber(stats.favorites) : "—"} icon={Heart} />
          <StatCard label="Ungelesene Nachrichten" value={counts.messages} icon={MessageCircle} />
          <StatCard label="Guthaben" value={`${user.credits} C`} icon={Coins} hint="Credits" />
        </div>
      ) : (
        !haus && (
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Ungelesene Nachrichten" value={counts.messages} icon={MessageCircle} />
            <StatCard label="Guthaben" value={`${user.credits} C`} icon={Coins} hint="Credits" />
          </div>
        )
      )}

      {eigenesInserat && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <ProfileCompleteness
            profile={{
              hasAbout: Boolean(eigenesInserat.about && eigenesInserat.about.length > 50),
              hasCity: Boolean(eigenesInserat.cityId),
              mediaCount: eigenesInserat._count.media,
              serviceCount: eigenesInserat._count.services,
              languageCount: eigenesInserat._count.languages,
              hasPrice: Boolean(eigenesInserat.priceHour),
              hasPhone: Boolean(eigenesInserat.phone),
              isVerified: eigenesInserat.isVerified,
              verificationStatus: eigenesInserat.verification?.status ?? "NOT_STARTED",
              status: eigenesInserat.status,
            }}
          />

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Aufrufe (30 Tage)</h2>
              <Link href="/dashboard/statistik" className="text-xs text-primary hover:underline">
                Details
              </Link>
            </div>
            {stats && <MiniChart series={stats.series} />}
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4 text-center">
              <div>
                <p className="font-display text-xl font-bold">{formatNumber(stats?.viewsTotal ?? 0)}</p>
                <p className="text-[11px] text-muted-foreground">Gesamt</p>
              </div>
              <div>
                <p className="font-display text-xl font-bold">{formatNumber(stats?.reviews ?? 0)}</p>
                <p className="text-[11px] text-muted-foreground">Bewertungen</p>
              </div>
              <div>
                <p className="font-display text-xl font-bold">{formatNumber(stats?.bookings ?? 0)}</p>
                <p className="text-[11px] text-muted-foreground">Buchungen</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Anstehende Termine</h2>
            <Link href="/dashboard/buchungen" className="text-xs text-primary hover:underline">
              Alle
            </Link>
          </div>
          {bookings.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Noch keine Termine.</p>
          ) : (
            <ul className="space-y-2.5">
              {bookings.map((booking) => (
                <li key={booking.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Calendar className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {booking.profile.displayName}
                      {booking.client.displayName ? ` · ${booking.client.displayName}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat(LOCALE, { dateStyle: "short", timeStyle: "short" }).format(
                        booking.startAt,
                      )}{" "}
                      · {booking.minutes} Min.
                    </p>
                  </div>
                  <Badge
                    size="sm"
                    variant={
                      booking.status === "ACCEPTED"
                        ? "success"
                        : booking.status === "REQUESTED"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {BOOKING_STATUS_LABEL[booking.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Aktivität</h2>
            <Link href="/dashboard/benachrichtigungen" className="text-xs text-primary hover:underline">
              Alle
            </Link>
          </div>
          {notifications.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Noch keine Aktivität.</p>
          ) : (
            <ul className="space-y-1">
              {notifications.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href ?? "/dashboard"}
                    className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted"
                  >
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                      <NotificationIcon type={n.type} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{n.title}</span>
                      {n.body && <span className="block truncate text-xs text-muted-foreground">{n.body}</span>}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Schnellzugriffe je nach Kontoart — „Fotos hochladen“ führt ohne
            eigenes Inserat ins Leere, „Models einladen“ ohne Haus ebenso. */}
        {(eigenesInserat
          ? [
              { href: "/dashboard/medien", label: "Fotos hochladen", icon: Images },
              { href: "/dashboard/profil", label: "Profil bearbeiten", icon: UserRound },
              { href: "/dashboard/verifizierung", label: "Verifizieren", icon: BadgeCheck },
              { href: "/dashboard/guthaben", label: "Credits kaufen", icon: Coins },
            ]
          : haus
            ? [
                { href: "/dashboard/agentur", label: "Haus bearbeiten", icon: Building2 },
                { href: "/dashboard/agentur/models", label: "Models verwalten", icon: Users },
                { href: "/dashboard/agentur/pruefung", label: "Prüfung beantragen", icon: BadgeCheck },
                { href: "/dashboard/guthaben", label: "Credits kaufen", icon: Coins },
              ]
            : [
                user.role === "AGENCY"
                  ? { href: "/onboarding/agentur", label: "Haus anlegen", icon: Building2 }
                  : willkommenOffen
                    ? { href: "/onboarding/mitglied", label: "Konto einrichten", icon: UserRound }
                    : user.role === "MEMBER"
                      ? { href: "/onboarding?typ=profil", label: "Selbst inserieren", icon: UserRound }
                      : { href: "/onboarding", label: "Profil erstellen", icon: UserRound },
                { href: "/escorts", label: "Profile entdecken", icon: Sparkles },
                { href: "/dashboard/favoriten", label: "Favoriten", icon: Heart },
                { href: "/dashboard/guthaben", label: "Credits kaufen", icon: Coins },
              ]
        ).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
              <item.icon className="size-5" />
            </span>
            <span className="flex-1 text-sm font-medium">{item.label}</span>
            <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </>
  );
}

function NotificationIcon({ type }: { type: string }) {
  const map: Record<string, React.ElementType> = {
    MESSAGE: MessageCircle,
    BOOKING: Calendar,
    REVIEW: Star,
    FAVORITE: Heart,
    PROFILE_VIEW: Eye,
    VERIFICATION: BadgeCheck,
    BOOST: Rocket,
    GIFT: Sparkles,
  };
  const Icon = map[type] ?? Sparkles;
  return <Icon className="size-4" />;
}

function MiniChart({ series }: { series: { date: string; count: number }[] }) {
  const max = Math.max(1, ...series.map((s) => s.count));
  return (
    <div className="flex h-28 items-end gap-1" role="img" aria-label="Profilaufrufe der letzten 30 Tage">
      {series.map((point) => (
        <div key={point.date} className="group relative flex h-full flex-1 flex-col justify-end">
          <div
            className="rounded-t bg-brand transition-opacity group-hover:opacity-80"
            style={{ height: `${Math.max(3, (point.count / max) * 100)}%`, minHeight: 3 }}
          />
          <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background group-hover:block">
            {point.count}
          </span>
        </div>
      ))}
    </div>
  );
}

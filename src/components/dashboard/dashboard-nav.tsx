"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CalendarRange,
  Clapperboard,
  Clock,
  Coins,
  Heart,
  Images,
  KeyRound,
  LayoutDashboard,
  MessageCircle,
  Rss,
  Search,
  Settings,
  Shield,
  Sparkles,
  Star,
  UserRound,
  Users,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Counts = { messages: number; notifications: number; bookings: number };

export function DashboardNav({
  user,
  counts,
  hasProfile,
  eigenesInseratAktiv,
  darfStories,
  agentur,
}: {
  user: SessionUser;
  counts: Counts;
  hasProfile: boolean;
  /**
   * Eigenes Inserat, das tatsächlich geführt wird — also nicht archiviert.
   *
   * Nur dann bekommt eine Betreiberin dafür einen eigenen Menüpunkt. Ein
   * archivierter Rest aus der Zeit, als Haus-Kategorien beim Profil wählbar
   * waren, soll das Menü nicht verstellen.
   */
  eigenesInseratAktiv: boolean;
  /** Darf Stories veröffentlichen — alle Kontoarten ausser Mitglied. */
  darfStories: boolean;
  /** Gehört zu einem Haus — oder darf eines anlegen. */
  agentur: { gehoertDazu: boolean; darfBearbeiten: boolean };
}) {
  const pathname = usePathname();
  const isStaff = user.role === "ADMIN" || user.role === "MODERATOR";

  const groups = [
    {
      title: "Übersicht",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
        { href: "/dashboard/nachrichten", label: "Nachrichten", icon: MessageCircle, badge: counts.messages },
        { href: "/dashboard/benachrichtigungen", label: "Benachrichtigungen", icon: Bell, badge: counts.notifications },
        { href: "/dashboard/buchungen", label: "Buchungen", icon: Calendar, badge: counts.bookings },
      ],
    },
    /*
     * „Mein Inserat“ meint das persönliche Inserat — das gibt es nur bei
     * Anbieterinnen ohne Haus. Wer ein Haus führt, pflegt Inserate unter
     * „Mein Haus → Models“; ein eigenes Inserat bleibt dort als letzter
     * Eintrag erreichbar.
     */
    ...(hasProfile && !agentur.gehoertDazu
      ? [
          {
            title: "Mein Inserat",
            items: [
              { href: "/dashboard/profil", label: "Profil bearbeiten", icon: UserRound },
              { href: "/dashboard/medien", label: "Fotos & Videos", icon: Images },
              { href: "/dashboard/verfuegbarkeit", label: "Erreichbarkeit", icon: Clock },
              { href: "/dashboard/touren", label: "Tourplan", icon: CalendarRange },
              { href: "/dashboard/feed", label: "Pinnwand", icon: Rss },
              ...(darfStories ? [{ href: "/dashboard/stories", label: "Stories", icon: Clapperboard }] : []),
              { href: "/dashboard/bewertungen", label: "Bewertungen", icon: Star },
              { href: "/dashboard/statistik", label: "Statistik", icon: BarChart3 },
              { href: "/dashboard/werbung", label: "Sichtbarkeit", icon: Sparkles },
              { href: "/dashboard/verifizierung", label: "Verifizierung", icon: BadgeCheck },
              { href: "/dashboard/zugehoerigkeit", label: "Agentur & Club", icon: Building2 },
            ],
          },
        ]
      : []),
    // Der Hausbereich erscheint bei bestehender Mitgliedschaft — oder als
    // Einstieg für Anbieterkonten, die noch kein Haus führen.
    ...(agentur.gehoertDazu || user.role === "AGENCY"
      ? [
          {
            title: "Mein Haus",
            items: [
              // Exakt, sonst leuchtet der Eintrag auch auf den Unterseiten mit.
              { href: "/dashboard/agentur", label: "Agentur & Club", icon: Building2, exact: true },
              ...(agentur.gehoertDazu
                ? [
                    { href: "/dashboard/agentur/models", label: "Models", icon: Users },
                    ...(darfStories ? [{ href: "/dashboard/stories", label: "Stories", icon: Clapperboard }] : []),
                    { href: "/dashboard/agentur/pruefung", label: "Prüfung", icon: BadgeCheck },
                    ...(agentur.darfBearbeiten
                      ? [{ href: "/dashboard/agentur/team", label: "Team", icon: KeyRound }]
                      : []),
                    ...(eigenesInseratAktiv
                      ? [
                          {
                            href: "/dashboard/profil?eigenes=1",
                            label: "Eigenes Inserat",
                            icon: UserRound,
                          },
                        ]
                      : []),
                  ]
                : []),
            ],
          },
        ]
      : []),
    {
      title: "Persönlich",
      items: [
        /*
         * Das Profil des Kontos — Name, Bild, Sprache. Für Mitglieder ist es
         * ihr einziges; Anbieterinnen pflegen daneben ihr Inserat, das unter
         * „Mein Inserat“ steht und ganz andere Felder hat.
         */
        { href: "/dashboard/konto", label: "Mein Profil", icon: UserRound },
        { href: "/dashboard/favoriten", label: "Favoriten", icon: Heart },
        { href: "/dashboard/suchen", label: "Suchaufträge", icon: Search },
        { href: "/dashboard/guthaben", label: "Guthaben", icon: Coins },
        { href: "/dashboard/einstellungen", label: "Einstellungen", icon: Settings },
      ],
    },
    ...(isStaff
      ? [{ title: "Team", items: [{ href: "/admin", label: "Administration", icon: Shield }] }]
      : []),
  ];

  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <nav className="sticky top-24 space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(item.href);
                const badge = "badge" in item ? (item.badge as number) : 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {badge > 0 && (
                        <span className="grid min-w-5 place-items-center rounded-md bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

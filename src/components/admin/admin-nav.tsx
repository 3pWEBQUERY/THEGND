"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeCheck, Building2, Flag, Images, LayoutDashboard, Newspaper, Star, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminCounts = {
  profiles: number;
  media: number;
  verifications: number;
  reviews: number;
  reports: number;
};

export function AdminNav({ counts }: { counts: AdminCounts }) {
  const pathname = usePathname();

  const items = [
    { href: "/admin", label: "Übersicht", icon: LayoutDashboard, exact: true },
    { href: "/admin/profile", label: "Profile", icon: UserRound, badge: counts.profiles },
    { href: "/admin/medien", label: "Medien", icon: Images, badge: counts.media },
    { href: "/admin/verifizierungen", label: "Verifizierungen", icon: BadgeCheck, badge: counts.verifications },
    { href: "/admin/bewertungen", label: "Bewertungen", icon: Star, badge: counts.reviews },
    { href: "/admin/meldungen", label: "Meldungen", icon: Flag, badge: counts.reports },
    { href: "/admin/agenturen", label: "Agenturen", icon: Building2 },
    { href: "/admin/nutzer", label: "Nutzer", icon: Users },
    { href: "/admin/magazin", label: "Magazin", icon: Newspaper },
  ];

  return (
    <>
      <aside className="hidden w-56 shrink-0 lg:block">
        <nav className="sticky top-24 space-y-0.5">
          {items.map((item) => {
            const active = "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const badge = "badge" in item ? (item.badge as number) : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {badge > 0 && (
                  <span className="grid min-w-5 place-items-center rounded-md bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:hidden">
        {items.map((item) => {
          const active = "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const badge = "badge" in item ? (item.badge as number) : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium",
                active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
              )}
            >
              <item.icon className="size-3.5" />
              {item.label}
              {badge > 0 && <span className="text-primary">{badge}</span>}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

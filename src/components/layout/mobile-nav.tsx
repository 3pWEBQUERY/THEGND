"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeCheck, Building2, Calendar, Coins, Heart, LogIn, Map, Menu, MessageCircle, Newspaper, Rss, Search, Sparkles, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Dialog, DialogClose, DialogOverlay, DialogPortal, DialogTrigger } from "@/components/ui/primitives";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { SessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/constants";

const LINKS = [
  { href: "/escorts", label: "Escorts entdecken", icon: Search },
  { href: "/staedte", label: "Städte", icon: Map },
  { href: "/agenturen", label: "Agenturen & Clubs", icon: Building2 },
  { href: "/touren", label: "Tourplan", icon: Calendar },
  { href: "/feed", label: "Feed", icon: Rss },
  { href: "/magazin", label: "Magazin", icon: Newspaper },
];

/** Häuser führen ein Haus, kein persönliches Inserat — daher rollenabhängig. */
const userLinks = (rolle: string) => [
  { href: "/dashboard", label: "Dashboard", icon: Sparkles },
  { href: "/dashboard/nachrichten", label: "Nachrichten", icon: MessageCircle },
  { href: "/dashboard/favoriten", label: "Favoriten", icon: Heart },
  { href: "/dashboard/buchungen", label: "Buchungen", icon: Calendar },
  { href: "/dashboard/guthaben", label: "Guthaben", icon: Coins },
  rolle === "AGENCY"
    ? { href: "/dashboard/agentur", label: "Mein Haus", icon: Building2 }
    : { href: "/dashboard/profil", label: "Mein Profil", icon: UserRound },
  ...(rolle === "AGENCY"
    ? []
    : [{ href: "/dashboard/verifizierung", label: "Verifizierung", icon: BadgeCheck }]),
];

export function MobileNav({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => setOpen(false), [pathname]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menü öffnen">
          <Menu className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex w-[88vw] max-w-sm flex-col border-r border-border bg-card shadow-2xl outline-none data-[state=open]:sheet-in-left">
          <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <span className="text-base font-extrabold tracking-[0.16em]">{SITE.name}</span>
            <DialogClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Schliessen">
                <X className="size-4" />
              </Button>
            </DialogClose>
          </div>

          <nav className="flex-1 overflow-y-auto p-3">
            <Section title="Entdecken">
              {LINKS.map((l) => (
                <Item key={l.href} {...l} active={pathname.startsWith(l.href)} />
              ))}
            </Section>

            {user && (
              <Section title="Mein Bereich">
                {userLinks(user.role).map((l) => (
                  <Item key={l.href} {...l} active={pathname === l.href} />
                ))}
              </Section>
            )}
          </nav>

          <div className="space-y-3 border-t border-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Design</span>
              <ThemeToggle />
            </div>
            {user ? (
              <Button asChild variant="brand" className="w-full">
                <Link href="/dashboard">Zum Dashboard</Link>
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline">
                  <Link href="/login">
                    <LogIn className="size-4" /> Anmelden
                  </Link>
                </Button>
                <Button asChild variant="brand">
                  <Link href="/registrieren">Registrieren</Link>
                </Button>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Item({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted",
      )}
    >
      <Icon className="size-4.5 shrink-0 opacity-70" />
      {label}
    </Link>
  );
}

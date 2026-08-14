import Link from "next/link";
import { Bell, Heart, MessageCircle, Plus, Search } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MAIN_NAV, SITE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ThemeToggleCompact } from "@/components/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavLink } from "@/components/layout/nav-link";
import { SearchTrigger } from "@/components/search/search-trigger";

export async function SiteHeader() {
  const user = await getCurrentUser();

  const [unreadMessages, unreadNotifications] = user
    ? await Promise.all([
        db.message.count({
          where: {
            readAt: null,
            senderId: { not: user.id },
            conversation: { participants: { some: { userId: user.id } } },
          },
        }),
        db.notification.count({ where: { userId: user.id, readAt: null } }),
      ])
    : [0, 0];

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 glass">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:h-18 lg:gap-6">
        <MobileNav user={user} />

        <Link href="/" className="group flex items-center gap-2.5" aria-label={`${SITE.name} Startseite`}>
          <span className="grid size-9 place-items-center rounded-xl brand-surface shadow-[0_6px_20px_-8px_var(--primary)] transition-transform group-hover:scale-105">
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
              <path d="M12 2.5 21 12l-9 9.5L3 12z" opacity=".9" />
              <path d="M12 7.2 16.6 12 12 16.8 7.4 12z" fill="currentColor" opacity=".5" />
            </svg>
          </span>
          <span className="hidden text-lg font-extrabold tracking-[0.16em] sm:block">{SITE.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {MAIN_NAV.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <SearchTrigger />

          {user ? (
            <>
              <HeaderIcon href="/dashboard/favoriten" label="Favoriten">
                <Heart className="size-4.5" />
              </HeaderIcon>
              <HeaderIcon href="/dashboard/nachrichten" label="Nachrichten" count={unreadMessages}>
                <MessageCircle className="size-4.5" />
              </HeaderIcon>
              <HeaderIcon href="/dashboard/benachrichtigungen" label="Benachrichtigungen" count={unreadNotifications}>
                <Bell className="size-4.5" />
              </HeaderIcon>
              <ThemeToggleCompact />
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <ThemeToggleCompact />
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Anmelden</Link>
              </Button>
              <Button asChild variant="brand" size="sm">
                <Link href="/inserieren">
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Inserieren</span>
                  <span className="sm:hidden">Start</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function HeaderIcon({
  href,
  label,
  count = 0,
  children,
}: {
  href: string;
  label: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="relative hidden size-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:grid"
    >
      {children}
      {count > 0 && (
        <span className="absolute right-1 top-1 grid min-w-4.5 place-items-center rounded-md bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

export function SearchIconFallback() {
  return <Search className="size-4.5" />;
}

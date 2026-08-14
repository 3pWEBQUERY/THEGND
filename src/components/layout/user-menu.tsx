"use client";

import Link from "next/link";
import { BadgeCheck, BarChart3, Building2, Calendar, Coins, Heart, LayoutDashboard, LogOut, MessageCircle, Settings, Shield, Sparkles, Star, UserRound } from "lucide-react";
import { logoutAction } from "@/server/actions/auth";
import { initials } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";
import {
  AvatarFallback,
  AvatarImage,
  AvatarRoot,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";

export function UserMenu({ user }: { user: SessionUser }) {
  const isProvider = user.role === "ESCORT" || user.role === "AGENCY";
  const isStaff = user.role === "ADMIN" || user.role === "MODERATOR";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="ml-0.5 rounded-xl outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Benutzermenü"
        >
          <AvatarRoot className="size-9 border border-border">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback>{initials(user.displayName ?? user.email)}</AvatarFallback>
          </AvatarRoot>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <AvatarRoot className="size-10">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback>{initials(user.displayName ?? user.email)}</AvatarFallback>
          </AvatarRoot>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.displayName ?? "Mitglied"}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <Link
          href="/dashboard/guthaben"
          className="mx-1.5 mb-1 flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm transition-colors hover:bg-muted"
        >
          <span className="flex items-center gap-2 text-muted-foreground">
            <Coins className="size-4 text-accent" /> Guthaben
          </span>
          <Badge variant="gold" size="sm">
            {user.credits} Credits
          </Badge>
        </Link>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard /> Dashboard
          </Link>
        </DropdownMenuItem>

        {!isProvider && (
          <DropdownMenuItem asChild>
            <Link href="/dashboard/konto">
              <UserRound /> Mein Profil
            </Link>
          </DropdownMenuItem>
        )}

        {isProvider && (
          <>
            <DropdownMenuItem asChild>
              {/* Für Häuser ist „mein Profil“ das Haus, nicht ein Inserat. */}
              {user.role === "AGENCY" ? (
                <Link href="/dashboard/agentur">
                  <Building2 /> Mein Haus
                </Link>
              ) : (
                <Link href="/dashboard/profil">
                  <UserRound /> Mein Profil
                </Link>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/statistik">
                <BarChart3 /> Statistiken
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/werbung">
                <Sparkles /> Sichtbarkeit & Boosts
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/verifizierung">
                <BadgeCheck /> Verifizierung
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuItem asChild>
          <Link href="/dashboard/nachrichten">
            <MessageCircle /> Nachrichten
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/buchungen">
            <Calendar /> Buchungen
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/favoriten">
            <Heart /> Favoriten
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/bewertungen">
            <Star /> Bewertungen
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {isStaff && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Shield /> Administration
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild>
          <Link href="/dashboard/einstellungen">
            <Settings /> Einstellungen
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-danger focus:bg-danger/10 [&_svg]:text-danger"
          onSelect={() => void logoutAction()}
        >
          <LogOut /> Abmelden
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bell, Heart, MessageCircle, UserRound } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { MemberOnboardingForm } from "@/components/dashboard/member-onboarding-form";
import { SITE } from "@/lib/constants";
import { ThemeToggleCompact } from "@/components/theme-toggle";

export const metadata: Metadata = { title: "Konto einrichten" };

export default async function MemberOnboardingPage() {
  const user = await requireUser();

  // Wer bereits inseriert, ist hier falsch — dort gehört das Inserat zum
  // Konto und nicht dieser Schritt.
  if (user.profileId) redirect("/dashboard/profil");

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Dashboard
          </Link>
          <span className="text-sm font-extrabold tracking-[0.16em]">{SITE.name}</span>
          <ThemeToggleCompact />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-10 text-center">
          <span className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl brand-surface shadow-glow">
            <UserRound className="size-7" />
          </span>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Richte dein Konto ein</h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Ein Name, ein Bild, deine Sprache — mehr braucht es nicht, um Profile zu merken, Bewertungen zu
            schreiben und Nachrichten zu senden.
          </p>
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Heart, title: "Favoriten", text: "Profile merken und wiederfinden" },
            { icon: MessageCircle, title: "Nachrichten", text: "Direkt und diskret anfragen" },
            { icon: Bell, title: "Suchaufträge", text: "Melden, wenn etwas Passendes kommt" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-4">
              <Icon className="mb-2 size-5 text-primary" />
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>

        <MemberOnboardingForm
          defaultName={user.displayName ?? ""}
          defaultAvatar={user.avatarUrl ?? null}
          defaultLocale={user.locale}
        />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Du möchtest selbst inserieren?{" "}
          <Link href="/onboarding?typ=profil" className="text-primary hover:underline">
            Escort-Profil erstellen
          </Link>{" "}
          oder{" "}
          <Link href="/onboarding/agentur" className="text-primary hover:underline">
            Haus anlegen
          </Link>
          .
        </p>
      </main>
    </div>
  );
}

export const dynamic = "force-dynamic";

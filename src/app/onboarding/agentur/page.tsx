import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2, KeyRound, ShieldCheck, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { eigeneMitgliedschaft } from "@/server/queries/agency-access";
import { AgencyOnboardingForm } from "@/components/dashboard/agency-onboarding-form";
import { SITE } from "@/lib/constants";
import { ThemeToggleCompact } from "@/components/theme-toggle";

export const metadata: Metadata = { title: "Haus anlegen" };

export default async function AgencyOnboardingPage() {
  await requireUser();

  // Wer schon zu einem Haus gehört, braucht kein zweites.
  const mitglied = await eigeneMitgliedschaft();
  if (mitglied) redirect("/dashboard/agentur");

  const cities = await db.city.findMany({
    select: { id: true, name: true, lat: true, lng: true },
    orderBy: { name: "asc" },
    take: 500,
  });

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
            <Building2 className="size-7" />
          </span>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Lege dein Haus an</h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Agentur, Club, Studio, Massagesalon, Sauna oder Bar — die Basics dauern zwei Minuten.
          </p>
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Users, title: "Team verwalten", text: "Models einladen, Zugänge vergeben" },
            { icon: ShieldCheck, title: "Prüfbar", text: "Geprüft-Siegel nach Nachweis" },
            { icon: KeyRound, title: "Du entscheidest", text: "Veröffentlicht wird auf deine Freigabe" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-4">
              <Icon className="mb-2 size-5 text-primary" />
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>

        <AgencyOnboardingForm cities={cities} />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Du bietest selbst an und suchst kein Haus?{" "}
          <Link href="/onboarding?typ=profil" className="text-primary hover:underline">
            Escort-Profil erstellen
          </Link>
        </p>
      </main>
    </div>
  );
}

export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BadgeCheck, Rocket, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { OnboardingForm } from "@/components/dashboard/onboarding-form";
import { SITE } from "@/lib/constants";
import { ThemeToggleCompact } from "@/components/theme-toggle";

export const metadata: Metadata = { title: "Profil erstellen" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  if (user.profileId) redirect("/dashboard/profil");

  // Agenturkonten legen ein Haus an, kein persönliches Escort-Profil.
  // Mit `?typ=profil` lässt sich das bewusst übersteuern — auch eine
  // Betreiberin kann daneben ein eigenes Inserat führen.
  const { typ } = await searchParams;
  if (user.role === "AGENCY" && typ !== "profil") redirect("/onboarding/agentur");

  // Mitgliedskonten sind Gäste, keine Anbieterinnen: für sie ist der
  // Willkommensschritt das Konto selbst. Wer wirklich inserieren will, kommt
  // über `?typ=profil` hierher — das legt gleichzeitig das Konto auf ESCORT um.
  if (user.role === "MEMBER" && typ !== "profil") redirect("/onboarding/mitglied");

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
            <Rocket className="size-7" />
          </span>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Erstelle dein Profil</h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Die Basics dauern zwei Minuten. Fotos, Preise und Services fügst du danach in Ruhe hinzu.
          </p>
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Sparkles, title: "Kostenlos", text: "Keine Grundgebühr, keine Provision" },
            { icon: BadgeCheck, title: "Verifizierbar", text: "Badge nach Ausweisprüfung" },
            { icon: Rocket, title: "Sofort sichtbar", text: "Nach Freigabe in der Suche" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-4">
              <Icon className="mb-2 size-5 text-primary" />
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>

        <OnboardingForm
          cities={cities}
          defaultName={user.displayName ?? ""}
        />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Du führst eine Agentur, einen Club oder ein Studio?{" "}
          <Link href="/onboarding/agentur" className="text-primary hover:underline">
            Haus anlegen
          </Link>
          {user.role === "MEMBER" && (
            <>
              {" "}
              · Du willst nur suchen?{" "}
              <Link href="/onboarding/mitglied" className="text-primary hover:underline">
                Nur Konto einrichten
              </Link>
            </>
          )}
        </p>
      </main>
    </div>
  );
}

export const dynamic = "force-dynamic";

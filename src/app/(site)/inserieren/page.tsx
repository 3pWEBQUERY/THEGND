import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Camera, Coins, LineChart, Lock, Rocket, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getPlatformStats } from "@/server/queries/profiles";
import { formatCompact } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Kostenlos inserieren",
  description: "Erstelle dein Escort-Profil in 10 Minuten: kostenlos, ohne Provision, jederzeit kündbar.",
  alternates: { canonical: "/inserieren" },
};

const STEPS = [
  { title: "Konto anlegen", text: "E-Mail, Passwort, fertig. Keine Ausweisdaten nötig, um zu starten." },
  { title: "Profil ausfüllen", text: "Beschreibung, Services, Preise, Sprachen, Erreichbarkeit — alles optional erweiterbar." },
  { title: "Fotos hochladen", text: "Drag & Drop, beliebig viele Bilder und Videos, private Alben möglich." },
  { title: "Verifizieren", text: "Ausweis + Selfie hochladen. Kostenlos, meist in unter 24 Stunden geprüft." },
  { title: "Online gehen", text: "Nach der Freigabe erscheinst du in Suche, Stadt und Startseite." },
];

const BENEFITS = [
  { icon: Coins, title: "0 % Provision", text: "Was du verdienst, gehört dir. Wir verdienen nur an optionaler Werbung." },
  { icon: Lock, title: "Volle Kontrolle", text: "Profil pausieren, Nummer verbergen, Nutzer blockieren — jederzeit, sofort." },
  { icon: LineChart, title: "Echte Zahlen", text: "Aufrufe, Favoriten, Herkunft der Besucher — live im Dashboard." },
  { icon: Camera, title: "Private Alben", text: "Sensible Inhalte gegen Credits freischaltbar — du behältst 70 %." },
  { icon: BadgeCheck, title: "Gratis Verifizierung", text: "Das Badge kostet nichts und bringt messbar mehr Anfragen." },
  { icon: Shield, title: "Aktive Moderation", text: "Wir entfernen Fakes, Spam und Belästigung — rund um die Uhr." },
];

export default async function ListingPage() {
  const stats = await getPlatformStats();

  return (
    <div>
      <section className="noise surface-glow relative overflow-hidden border-b border-border">
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <Badge variant="neutral" size="lg" className="mb-6">
            <Rocket className="size-3.5" /> Für Anbieter:innen
          </Badge>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Dein Profil.
            <br />
            <span className="text-brand">Deine Regeln.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Werde Teil von {formatCompact(stats.profiles)} Profilen in {formatCompact(stats.cities)} Städten.
            Kostenlos, ohne Provision, jederzeit pausierbar.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="brand">
              <Link href="/registrieren?role=ESCORT">
                Jetzt kostenlos starten <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/preise">Preise ansehen</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            25 Credits Startguthaben · keine Kreditkarte nötig
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
        <h2 className="mb-10 text-center font-display text-3xl font-bold tracking-tight">In 5 Schritten online</h2>
        <ol className="grid gap-4 md:grid-cols-5">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative rounded-2xl border border-border bg-card p-5">
              <span className="mb-3 grid size-9 place-items-center rounded-xl brand-surface text-sm font-bold text-white">
                {i + 1}
              </span>
              <p className="text-sm font-semibold">{step.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
          <h2 className="mb-10 text-center font-display text-3xl font-bold tracking-tight">Warum THEGND</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <Card key={title} className="p-6">
                <Icon className="mb-3 size-5 text-primary" />
                <p className="text-base font-semibold">{title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight">Bereit?</h2>
        <p className="mt-4 text-muted-foreground">
          Zehn Minuten Zeit sind alles, was du brauchst. Den Rest kannst du jederzeit ergänzen.
        </p>
        <Button asChild size="lg" variant="brand" className="mt-8">
          <Link href="/registrieren?role=ESCORT">
            Profil erstellen <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
}

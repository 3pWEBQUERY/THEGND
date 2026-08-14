import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Camera,
  Coins,
  Eye,
  Fingerprint,
  Heart,
  LineChart,
  Lock,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const TRUST = [
  {
    icon: Fingerprint,
    title: "Echte Verifizierung",
    text: "Ausweisprüfung, Selfie-Abgleich und optionaler Video-Call. Kein Bot, kein Fake — jedes Badge ist manuell geprüft.",
  },
  {
    icon: Lock,
    title: "Diskretion by Design",
    text: "Keine Tracker Dritter, verschlüsselte Nachrichten, unsichtbarer Modus und ein Panik-Logout mit einem Klick.",
  },
  {
    icon: Star,
    title: "Bewertungen mit Substanz",
    text: "Nur Mitglieder mit bestätigtem Treffen können bewerten. Anbieter:innen dürfen öffentlich antworten.",
  },
  {
    icon: ShieldCheck,
    title: "Null Toleranz",
    text: "Zwang, Menschenhandel und Minderjährige haben hier keinen Platz. Meldungen werden binnen 24 h geprüft.",
  },
];

export function TrustSection() {
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Warum THEGND</p>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Vertrauen ist keine Funktion. Es ist die Grundlage.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Wir haben die Plattform gebaut, die wir selbst nutzen würden: transparent, sicher und ohne versteckte
            Kosten.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="group border-border/70 p-6 transition-colors hover:border-primary/40">
              <span className="mb-4 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Icon className="size-5" />
              </span>
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const PROVIDER_FEATURES = [
  { icon: Camera, title: "Galerie & Videos", text: "Unbegrenzte Fotos, Videos, private Alben mit Credit-Freischaltung." },
  { icon: LineChart, title: "Live-Statistiken", text: "Aufrufe, Favoriten, Kontaktklicks und Herkunft in Echtzeit." },
  { icon: Rocket, title: "Boosts & Top-Platzierung", text: "Nach oben schieben, Spotlight, Stadt-Highlight — flexibel per Credits." },
  { icon: CalendarCheck, title: "Buchungskalender", text: "Verfügbarkeiten, Touren, Anfragen bestätigen oder ablehnen." },
  { icon: MessageCircle, title: "Direkt-Messenger", text: "Chatten ohne Telefonnummer, mit Blockier- und Filterfunktion." },
  { icon: Coins, title: "Credits & Geschenke", text: "Verdiene an Geschenken und freigeschalteten Inhalten." },
];

export function ProviderSection() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <Badge variant="gold" size="lg" className="mb-5">
            Für Anbieter:innen
          </Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Dein Profil. Deine Regeln.
            <br />
            <span className="text-brand">Deine Einnahmen.</span>
          </h2>
          <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">
            Erstelle in wenigen Minuten ein Profil, das verkauft: hochauflösende Galerie, klare Preise, Services,
            Sprachen, Tourplan und Verfügbarkeiten. Kostenlos starten — Reichweite dazubuchen, wann immer du willst.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="brand">
              <Link href="/inserieren">
                Kostenlos inserieren <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/preise">Preise ansehen</Link>
            </Button>
          </div>

          <ul className="mt-8 space-y-2.5">
            {[
              "CHF 0.– Grundgebühr — du zahlst nur für zusätzliche Sichtbarkeit",
              "Keine Provision auf deine Buchungen",
              "Jederzeit pausierbar oder löschbar",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-success" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {PROVIDER_FEATURES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <Icon className="mb-3 size-5 text-primary" />
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { icon: Eye, title: "Entdecken", text: "Filtere nach Stadt, Alter, Service, Sprache oder Preis — über 40 Kriterien." },
  { icon: Heart, title: "Merken", text: "Speichere Favoriten und lege Suchaufträge mit E-Mail-Alarm an." },
  { icon: MessageCircle, title: "Kontaktieren", text: "Schreib direkt im Messenger oder per Telefon — ohne Umwege." },
  { icon: CalendarCheck, title: "Treffen", text: "Termin anfragen, Bestätigung erhalten, entspannt geniessen." },
];

export function HowItWorks() {
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">So funktioniert&apos;s</p>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">In vier Schritten zum Date</h2>
        </div>

        <ol className="grid gap-4 md:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="relative rounded-2xl border border-border bg-card p-6">
              <span className="absolute right-5 top-5 font-display text-4xl font-bold text-muted-foreground/15">
                {i + 1}
              </span>
              <span className="mb-4 grid size-11 place-items-center rounded-xl brand-surface">
                <Icon className="size-5" />
              </span>
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function CtaBanner() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
      <div className="noise surface-glow relative overflow-hidden rounded-4xl border border-border bg-card px-6 py-14 text-center sm:px-16">
        <div className="relative mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Bereit, gesehen zu werden?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Über 25.000 Besucher:innen täglich suchen genau nach dir. Erstelle dein Profil in unter 10 Minuten — die
            ersten 25 Credits gehen aufs Haus.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="brand">
              <Link href="/registrieren?role=ESCORT">
                Jetzt starten <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/escorts">Erst mal umschauen</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

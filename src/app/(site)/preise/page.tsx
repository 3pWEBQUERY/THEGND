import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Check, Crown, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/primitives";
import { CREDIT_COSTS } from "@/lib/constants";
import { formatCents } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Preise & Pakete",
  description: "Kostenlos inserieren, Reichweite flexibel dazubuchen. Keine Abos, keine Provision, volle Kostenkontrolle.",
  alternates: { canonical: "/preise" },
};

const FEATURES_FREE = [
  "Unbegrenzt Fotos & Videos",
  "Vollständiges Profil mit Services, Preisen, Sprachen",
  "Direkt-Messenger & Buchungsanfragen",
  "Bewertungen empfangen und beantworten",
  "Tourplan & Erreichbarkeitszeiten",
  "Live-Statistiken",
  "Verifizierung inklusive",
];

const FAQ = [
  {
    q: "Kostet das Inserat wirklich nichts?",
    a: "Ja. Profil erstellen, Fotos hochladen, Nachrichten empfangen und Buchungen verwalten ist dauerhaft kostenlos. Bezahlt wird ausschliesslich zusätzliche Sichtbarkeit — und zwar nur, wenn du sie willst.",
  },
  {
    q: "Nehmt ihr Provision auf meine Buchungen?",
    a: "Nein. Was du mit deinen Kund:innen vereinbarst, geht ausschliesslich dich an. Wir sind ein Verzeichnis, kein Vermittler.",
  },
  {
    q: "Gibt es ein Abo oder eine Kündigungsfrist?",
    a: "Nein. Credits sind Guthaben, das du frei einsetzt. Es gibt keine automatische Verlängerung und keine Mindestlaufzeit.",
  },
  {
    q: "Wie diskret ist die Abrechnung?",
    a: "Auf dem Kontoauszug erscheint eine neutrale Bezeichnung ohne Hinweis auf die Plattform. Rechnungen findest du jederzeit im Dashboard.",
  },
  {
    q: "Verfallen Credits?",
    a: "Nein. Gekaufte Credits bleiben unbegrenzt gültig, solange dein Konto besteht.",
  },
];

export default async function PricingPage() {
  const packages = await db.package.findMany({ where: { active: true }, orderBy: { position: "asc" } });

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6">
      <header className="mx-auto mb-14 max-w-2xl text-center">
        <Badge variant="gold" size="lg" className="mb-5">
          Transparent & fair
        </Badge>
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Kostenlos starten.
          <br />
          <span className="text-brand">Reichweite dazubuchen.</span>
        </h1>
        <p className="mt-5 text-muted-foreground">
          Keine Grundgebühr, keine Provision, keine Abofalle. Du entscheidest, wann und wie viel Sichtbarkeit du
          möchtest.
        </p>
      </header>

      <div className="mb-16 grid gap-6 lg:grid-cols-2">
        <Card className="p-8">
          <Badge variant="neutral" className="mb-4">
            Immer kostenlos
          </Badge>
          <p className="font-display text-4xl font-bold">CHF 0.–</p>
          <p className="mt-1 text-sm text-muted-foreground">für dein vollständiges Profil</p>
          <ul className="mt-6 space-y-2.5">
            {FEATURES_FREE.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-success" />
                {feature}
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" size="lg" className="mt-8 w-full">
            <Link href="/registrieren?role=ESCORT">Kostenloses Profil erstellen</Link>
          </Button>
        </Card>

        <Card className="border-primary/40 p-8">
          <Badge variant="solid" className="mb-4">
            <Crown className="size-3" /> Sichtbarkeit
          </Badge>
          <p className="font-display text-4xl font-bold">ab 20 C</p>
          <p className="mt-1 text-sm text-muted-foreground">pro Aktion — kein Abo</p>
          <ul className="mt-6 space-y-2.5 text-sm">
            {[
              ["Nach oben schieben", CREDIT_COSTS.BUMP],
              ["Top-Platzierung (24 h)", CREDIT_COSTS.TOP_LISTING_DAY],
              ["Startseiten-Spotlight (24 h)", CREDIT_COSTS.SPOTLIGHT_DAY],
              ["Farb-Highlight (7 Tage)", CREDIT_COSTS.HIGHLIGHT_WEEK],
              ["Werbebanner (24 h)", CREDIT_COSTS.BANNER_DAY],
            ].map(([label, price]) => (
              <li key={label as string} className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold">{price} Credits</span>
              </li>
            ))}
          </ul>
          <Button asChild variant="brand" size="lg" className="mt-8 w-full">
            <Link href="/dashboard/guthaben">
              Credits ansehen <ArrowRight className="size-4" />
            </Link>
          </Button>
        </Card>
      </div>

      {packages.length > 0 && (
        <section className="mb-16">
          <h2 className="mb-2 text-center font-display text-3xl font-bold tracking-tight">Credit-Pakete</h2>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            Je grösser das Paket, desto günstiger der einzelne Credit.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative p-6 text-center ${pkg.popular ? "border-primary" : ""}`}
              >
                {pkg.popular && (
                  <Badge variant="solid" size="sm" className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <Sparkles className="size-3" /> Beliebt
                  </Badge>
                )}
                <p className="text-sm font-semibold">{pkg.name}</p>
                <p className="mt-3 font-display text-3xl font-bold">{pkg.credits + pkg.bonus}</p>
                <p className="text-xs text-muted-foreground">Credits</p>
                {pkg.bonus > 0 && <p className="mt-1 text-xs font-medium text-success">+{pkg.bonus} gratis</p>}
                <p className="mt-4 text-lg font-semibold">{formatCents(pkg.priceCents, pkg.currency)}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="mb-16 rounded-3xl border border-border bg-surface p-8 sm:p-12">
        <div className="mx-auto max-w-2xl text-center">
          <BadgeCheck className="mx-auto mb-4 size-10 text-success" />
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Verifizierung ist gratis</h2>
          <p className="mt-3 text-muted-foreground">
            Wir verlangen kein Geld für Vertrauen. Die Ausweisprüfung ist für alle Profile kostenlos — und bringt dir
            besseres Ranking, mehr Anfragen und das blaue Badge.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-center font-display text-3xl font-bold tracking-tight">Häufige Fragen</h2>
        <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-6">
          {FAQ.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}

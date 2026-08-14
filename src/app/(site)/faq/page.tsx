import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Häufige Fragen",
  description: "Antworten zu Konto, Verifizierung, Sicherheit, Bewertungen, Credits und Datenschutz.",
  alternates: { canonical: "/faq" },
};

const SECTIONS = [
  {
    title: "Konto & Einstieg",
    items: [
      { q: "Brauche ich ein Konto, um Profile anzusehen?", a: "Nein. Stöbern, filtern und Profile ansehen geht ohne Anmeldung. Für Nachrichten, Favoriten, Buchungen und Bewertungen brauchst du ein kostenloses Konto." },
      { q: "Wie erstelle ich ein Profil als Anbieter:in?", a: "Registriere dich mit der Auswahl „Ich biete an“, fülle die Basics aus und lade Fotos hoch. Nach deiner Freigabe prüfen wir das Profil, in der Regel innerhalb von zwei Stunden." },
      { q: "Kann ich mein Konto löschen?", a: "Ja, jederzeit unter Einstellungen → Konto löschen. Dein Profil geht sofort offline, personenbezogene Daten werden anonymisiert." },
    ],
  },
  {
    title: "Verifizierung & Vertrauen",
    items: [
      { q: "Was bedeutet das blaue Badge?", a: "Es zeigt, dass wir Ausweis und Selfie geprüft und die Identität bestätigt haben. Verifizierte Profile ranken besser und erhalten deutlich mehr Anfragen." },
      { q: "Was passiert mit meinen Ausweisdaten?", a: "Sie werden verschlüsselt gespeichert, sind nie öffentlich sichtbar und werden spätestens 90 Tage nach Abschluss der Prüfung gelöscht." },
      { q: "Kostet die Verifizierung etwas?", a: "Nein, sie ist dauerhaft kostenlos." },
    ],
  },
  {
    title: "Bewertungen",
    items: [
      { q: "Wer darf bewerten?", a: "Nur registrierte Mitglieder, und nur einmal pro Profil. Bewertungen nach einer bestätigten Buchung werden zusätzlich als „verifiziertes Treffen“ gekennzeichnet." },
      { q: "Kann ich auf eine Bewertung antworten?", a: "Ja. Deine Antwort erscheint öffentlich direkt unter der Bewertung." },
      { q: "Werden Bewertungen geprüft?", a: "Jede Bewertung durchläuft eine Moderation. Beleidigungen, private Details und offensichtliche Fakes werden nicht veröffentlicht." },
    ],
  },
  {
    title: "Credits & Werbung",
    items: [
      { q: "Wofür brauche ich Credits?", a: "Für optionale Sichtbarkeit (nach oben schieben, Top-Platzierung, Spotlight), zum Freischalten privater Inhalte und für Geschenke." },
      { q: "Verfallen Credits?", a: "Nein. Sie bleiben gültig, solange dein Konto besteht." },
      { q: "Wie diskret ist die Abrechnung?", a: "Auf dem Kontoauszug erscheint eine neutrale Bezeichnung ohne Rückschluss auf die Plattform." },
    ],
  },
  {
    title: "Sicherheit",
    items: [
      { q: "Wie schützt ihr vor Fakes?", a: "Durch manuelle Bildprüfung, Verifizierung, Meldefunktion und automatische Erkennung von Duplikaten. Verdächtige Profile werden gesperrt." },
      { q: "Was tun bei Belästigung?", a: "Blockiere die Person direkt in der Unterhaltung und melde sie über die Meldefunktion. Wir prüfen jede Meldung binnen 24 Stunden." },
      { q: "Was passiert bei Verdacht auf Zwang oder Menschenhandel?", a: "Wir sperren das Profil sofort, sichern Beweise und schalten die zuständigen Behörden ein. Es gibt hier null Toleranz." },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-10 text-center">
        <HelpCircle className="mx-auto mb-4 size-10 text-primary" />
        <h1 className="font-display text-4xl font-bold tracking-tight">Häufige Fragen</h1>
        <p className="mt-3 text-muted-foreground">
          Findest du deine Antwort nicht?{" "}
          <Link href="/kontakt" className="text-primary hover:underline">
            Schreib uns
          </Link>
          .
        </p>
      </header>

      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="mb-3 font-display text-xl font-bold tracking-tight">{section.title}</h2>
            <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-6">
              {section.items.map((item, i) => (
                <AccordionItem key={i} value={`${section.title}-${i}`}>
                  <AccordionTrigger className="text-sm">{item.q}</AccordionTrigger>
                  <AccordionContent>{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-border bg-surface p-8 text-center">
        <h2 className="font-display text-xl font-bold">Noch Fragen offen?</h2>
        <p className="mt-2 text-sm text-muted-foreground">Unser Support antwortet in der Regel innerhalb von 24 Stunden.</p>
        <Button asChild variant="brand" className="mt-5">
          <Link href="/kontakt">Kontakt aufnehmen</Link>
        </Button>
      </div>
    </div>
  );
}

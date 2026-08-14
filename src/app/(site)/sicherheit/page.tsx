import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Eye, Lock, Phone, ShieldCheck, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Sicherheit & Schutz",
  description: "Sicherheitstipps, Notfallkontakte und wie wir gegen Zwang, Fakes und Belästigung vorgehen.",
  alternates: { canonical: "/sicherheit" },
};

const TIPS_PROVIDER = [
  "Screening: Bestehe auf Verifizierung per Telefon oder Videocall vor dem ersten Treffen.",
  "Sicherheitskontakt: Teile Ort, Uhrzeit und Namen mit einer Vertrauensperson und melde dich nach dem Termin.",
  "Anzahlung nur über sichere Wege — niemals Gutscheincodes, Krypto-Vorkasse oder „Verifizierungsgebühren“.",
  "Standort: Nutze Hotels mit Rezeption statt privater Wohnungen, wenn du die Person nicht kennst.",
  "Bauchgefühl: Brich ab, wenn etwas nicht stimmt. Kein Termin ist es wert.",
];

const TIPS_CLIENT = [
  "Achte auf das Verifizierungs-Badge und auf Bewertungen mit bestätigten Treffen.",
  "Sei skeptisch bei auffällig niedrigen Preisen oder Druck zur sofortigen Zahlung.",
  "Nie Vorkasse per Gutscheincode, Krypto oder Bargeldtransfer an Unbekannte.",
  "Kommuniziere über den plattforminternen Messenger — das schafft Nachvollziehbarkeit.",
  "Respektiere Grenzen. Ein „Nein“ ist endgültig.",
];

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header className="mb-12 text-center">
        <ShieldCheck className="mx-auto mb-4 size-11 text-primary" />
        <h1 className="font-display text-4xl font-bold tracking-tight">Sicherheit & Schutz</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Sicherheit ist keine Funktion, die man dazubucht. Hier findest du, was wir tun — und was du tun kannst.
        </p>
      </header>

      <Card className="mb-10 border-danger/30 bg-danger/5 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-danger">
          <AlertTriangle className="size-5" /> Notfall & Hilfe
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Bei akuter Gefahr wähle sofort die Polizei <b className="text-foreground">117</b>, die Sanitätsnotrufzentrale{" "}
          <b className="text-foreground">144</b> oder den europäischen Notruf <b className="text-foreground">112</b>.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {[
            ["Die Dargebotene Hand", "143 — kostenlos, 24/7, anonym"],
            ["Beratung für Kinder und Jugendliche (Pro Juventute)", "147 — kostenlos, 24/7"],
            ["Opferhilfe Schweiz", "Beratungsstellen nach Kanton auf opferhilfe-schweiz.ch — kostenlos und vertraulich"],
            ["Fachstellen für Sexarbeit", "ProCoRe listet die regionalen Anlaufstellen — Beratung unabhängig von Behörden"],
          ].map(([name, number]) => (
            <li key={name} className="flex items-start gap-2">
              <Phone className="mt-0.5 size-4 shrink-0 text-danger" />
              <span>
                <b>{name}:</b> {number}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <section className="mb-12 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Eye, title: "Manuelle Bildprüfung", text: "Jedes Foto wird vor Veröffentlichung gesichtet." },
          { icon: Lock, title: "Keine Tracker Dritter", text: "Kein Werbe-Pixel, kein Datenverkauf, TLS-verschlüsselt." },
          { icon: Users, title: "24-h-Moderation", text: "Meldungen werden binnen eines Tages bearbeitet." },
        ].map(({ icon: Icon, title, text }) => (
          <Card key={title} className="p-5">
            <Icon className="mb-3 size-5 text-primary" />
            <p className="text-sm font-semibold">{title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{text}</p>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <Badge variant="default" className="mb-4">
            Für Anbieter:innen
          </Badge>
          <ul className="space-y-3">
            {TIPS_PROVIDER.map((tip) => (
              <li key={tip} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-xs bg-primary" />
                {tip}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <Badge variant="gold" className="mb-4">
            Für Suchende
          </Badge>
          <ul className="space-y-3">
            {TIPS_CLIENT.map((tip) => (
              <li key={tip} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-xs bg-accent" />
                {tip}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <section className="mt-12 rounded-2xl border border-border bg-surface p-8 text-center">
        <h2 className="font-display text-2xl font-bold tracking-tight">Etwas gesehen, das nicht stimmt?</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
          Melde Profile, Nachrichten oder Bewertungen direkt über die Meldefunktion. Jede Meldung wird geprüft — auch
          anonym.
        </p>
        <Button asChild variant="danger" className="mt-6">
          <Link href="/melden">Inhalt melden</Link>
        </Button>
      </section>
    </div>
  );
}

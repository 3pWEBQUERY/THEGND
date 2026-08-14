import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Community-Richtlinien",
  description: "Was auf THEGND erlaubt ist — und was nicht.",
  alternates: { canonical: "/richtlinien" },
};

export default function GuidelinesPage() {
  return (
    <LegalPage
      title="Community-Richtlinien"
      updated="1. August 2026"
      intro="Diese Plattform funktioniert nur, wenn sich alle sicher fühlen. Die folgenden Regeln gelten ausnahmslos — für Anbieter:innen wie für Suchende."
      sections={[
        {
          heading: "Absolute Ausschlusskriterien",
          paragraphs: ["Bei folgenden Verstössen sperren wir Konten sofort und dauerhaft — ohne Vorwarnung:"],
          bullets: [
            "Jede Beteiligung an Menschenhandel, Zwangsprostitution oder Ausbeutung.",
            "Inhalte, die Minderjährige zeigen oder sexualisieren.",
            "Angebote ohne Einvernehmen, Andeutungen von Gewalt oder Nötigung.",
            "Weitergabe oder Verkauf von Daten anderer Nutzender.",
          ],
        },
        {
          heading: "Echte Fotos, echte Angaben",
          bullets: [
            "Verwende ausschliesslich eigene, aktuelle Aufnahmen (nicht älter als 12 Monate).",
            "Keine fremden Bilder, keine KI-generierten Personen, keine irreführenden Retuschen.",
            "Preise und Services müssen der Realität entsprechen.",
          ],
        },
        {
          heading: "Respektvolle Kommunikation",
          bullets: [
            "Keine Beleidigungen, Diskriminierung oder Belästigung.",
            "Ein „Nein“ wird akzeptiert — ohne Nachfragen, ohne Druck.",
            "Keine unaufgeforderten expliziten Bilder.",
            "Keine Verhandlungen über gesetzlich Unzulässiges.",
          ],
        },
        {
          heading: "Bewertungen",
          bullets: [
            "Nur echte Erfahrungen, keine Gefälligkeits- oder Rachebewertungen.",
            "Keine Klarnamen, Adressen, Telefonnummern oder anderen privaten Daten.",
            "Kritik ist erlaubt — Herabwürdigung nicht.",
          ],
        },
        {
          heading: "Meldungen und Konsequenzen",
          paragraphs: [
            "Jeder Inhalt lässt sich über die Meldefunktion beanstanden. Wir prüfen jede Meldung, in der Regel innerhalb von 24 Stunden.",
            "Je nach Schwere reagieren wir mit Hinweis, Inhaltsentfernung, temporärer Sperre oder dauerhafter Löschung. Bei Verdacht auf Straftaten schalten wir die Behörden ein.",
          ],
        },
      ]}
    />
  );
}

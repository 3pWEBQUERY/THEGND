import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Impressum",
  alternates: { canonical: "/impressum" },
  robots: { index: true, follow: false },
};

export default function ImprintPage() {
  return (
    <LegalPage
      title="Impressum"
      updated="1. August 2026"
      notice="Platzhalter: Trage vor dem Livegang die vollständigen Angaben ein — Firmierung, Sitz, Vertretungsberechtigte, Handelsregister- und UID-Nummer sowie die inhaltlich verantwortliche Person. Lass die Angaben vor der Veröffentlichung anwaltlich prüfen."
      sections={[
        {
          heading: "Betreiberin",
          bullets: [
            `${SITE.name} — Betreibergesellschaft`,
            "Musterstrasse 1, 8001 Zürich, Schweiz",
            "Vertreten durch: [Geschäftsführung]",
            "Handelsregister: [Handelsregisteramt, CHE-Nummer]",
            "MWST-Nummer: [CHE-…-… MWST]",
          ],
        },
        {
          heading: "Kontakt",
          bullets: [`E-Mail: ${SITE.email}`, "Telefon: [Rufnummer]", "Support-Formular: /kontakt"],
        },
        {
          heading: "Inhaltlich verantwortliche Person",
          paragraphs: ["[Vor- und Nachname], Anschrift wie oben."],
        },
        {
          heading: "Anwendbares Recht und Gerichtsstand",
          paragraphs: [
            "Es gilt Schweizer Recht. Gerichtsstand ist der Sitz der Betreibergesellschaft, soweit nicht zwingende Bestimmungen etwas anderes vorsehen.",
          ],
        },
        {
          heading: "Haftung für Inhalte und Links",
          paragraphs: [
            "Für eigene Inhalte auf diesen Seiten sind wir nach den allgemeinen Gesetzen verantwortlich. Inhalte von Nutzer:innen prüfen wir nicht vorab; bei Kenntnis einer Rechtsverletzung entfernen wir die betreffenden Inhalte umgehend.",
            "Für Inhalte externer Links ist ausschliesslich deren Betreiber verantwortlich. Zum Zeitpunkt der Verlinkung waren keine Rechtsverstösse erkennbar.",
          ],
        },
      ]}
    />
  );
}

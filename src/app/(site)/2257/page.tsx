import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "18 U.S.C. 2257 Compliance",
  alternates: { canonical: "/2257" },
  robots: { index: true, follow: false },
};

export default function CompliancePage() {
  return (
    <LegalPage
      title="18 U.S.C. § 2257 — Erklärung"
      updated="1. August 2026"
      intro={`${SITE.name} ist ein Verzeichnisdienst mit nutzergenerierten Inhalten und produziert selbst keine visuellen Darstellungen im Sinne von 18 U.S.C. § 2257.`}
      sections={[
        {
          heading: "Rolle des Betreibers",
          paragraphs: [
            "Sämtliche Bilder und Videos werden ausschliesslich von den jeweiligen Nutzenden hochgeladen. Der Betreiber tritt als Hostinganbieter im Sinne von 47 U.S.C. § 230(c) auf und ist gemäss 28 C.F.R. § 75.1(c)(4) von den Aufzeichnungspflichten befreit.",
          ],
        },
        {
          heading: "Altersnachweis der abgebildeten Personen",
          paragraphs: [
            "Mit dem Upload sichern Nutzende zu, dass alle abgebildeten Personen zum Zeitpunkt der Aufnahme mindestens 18 Jahre alt waren und der Veröffentlichung zugestimmt haben. Entsprechende Nachweise sind auf Anfrage vorzulegen.",
          ],
        },
        {
          heading: "Meldung nicht konformer Inhalte",
          paragraphs: [
            `Inhalte, die gegen diese Zusicherung verstossen, werden unverzüglich entfernt und dem NCMEC gemeldet. Meldungen bitte an ${SITE.email} oder über die Meldefunktion auf jedem Profil.`,
          ],
        },
      ]}
    />
  );
}

import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description: "Wie THEGND Personendaten bearbeitet — transparent nach dem Schweizer Datenschutzgesetz (DSG).",
  alternates: { canonical: "/datenschutz" },
  robots: { index: true, follow: false },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Datenschutzerklärung"
      updated="1. August 2026"
      notice="Diese Erklärung ist eine Vorlage nach Schweizer DSG. Ergänze vor dem Livegang deine Firmierung, die Kontaktstelle für Datenschutz sowie die konkret eingesetzten Auftragsbearbeiter — und lasse sie rechtlich prüfen. Wenn du Personen in der EU ansprichst, prüfe zusätzlich die Anforderungen der DSGVO und eine Vertretung in der EU."
      intro="Der Schutz deiner Daten ist zentral für eine Plattform wie diese. Wir erheben so wenig wie möglich, speichern so kurz wie nötig und geben nichts an Werbenetzwerke weiter."
      sections={[
        {
          heading: "Verantwortlicher",
          paragraphs: [
            `Verantwortlich im Sinne des Schweizer Datenschutzgesetzes (DSG) ist die Betreiberin von ${SITE.name}. Die vollständigen Kontaktdaten findest du im Impressum. Datenschutzanfragen richtest du bitte an ${SITE.email}.`,
          ],
        },
        {
          heading: "Welche Daten wir verarbeiten",
          bullets: [
            "Kontodaten: E-Mail-Adresse, Passwort-Hash, Anzeigename, Rolle, Spracheinstellung.",
            "Profildaten: freiwillige Angaben zu Aussehen, Services, Preisen, Standort, Kontaktwegen sowie hochgeladene Medien.",
            "Kommunikationsdaten: Nachrichten, Buchungsanfragen, Bewertungen, Meldungen.",
            "Nutzungsdaten: Profilaufrufe, Zeitstempel, gekürzte bzw. gehashte IP-Adresse, User-Agent zur Missbrauchserkennung.",
            "Zahlungsdaten: Bestellhistorie und Rechnungsnummern. Vollständige Zahlungsmittel werden ausschliesslich beim Zahlungsdienstleister verarbeitet.",
            "Verifizierungsdaten: Ausweisdokumente und Selfie, ausschliesslich zur Identitätsprüfung.",
          ],
        },
        {
          heading: "Zweck und Grundlage der Bearbeitung",
          bullets: [
            "Vertragserfüllung: Konto, Profil, Nachrichten, Buchungen und Zahlungen.",
            "Überwiegendes Interesse an Sicherheit: Missbrauchsabwehr, Betrugserkennung, Reichweitenmessung ohne Personenbezug.",
            "Einwilligung: Newsletter, freiwillige Verifizierung sowie besonders schützenswerte Personendaten.",
            "Gesetzliche Pflichten: Aufbewahrungs-, Auskunfts- und Meldepflichten nach Schweizer Recht.",
          ],
        },
        {
          heading: "Besonders schützenswerte Personendaten",
          paragraphs: [
            "Angaben, die Rückschlüsse auf die Intimsphäre oder die sexuelle Orientierung zulassen, gelten nach DSG als besonders schützenswert. Wir bearbeiten sie ausschliesslich auf Grundlage deiner ausdrücklichen Einwilligung. Du kannst diese jederzeit widerrufen, indem du die entsprechenden Angaben löschst oder dein Profil deaktivierst.",
          ],
        },
        {
          heading: "Speicherdauer",
          bullets: [
            "Kontodaten: bis zur Löschung des Kontos, anschliessend Anonymisierung.",
            "Ausweisdokumente: spätestens 90 Tage nach Abschluss der Verifizierung.",
            "Nachrichten: bis zur Löschung durch die Beteiligten, längstens 24 Monate nach letzter Aktivität.",
            "Rechnungsdaten: 10 Jahre gemäss der Aufbewahrungspflicht des Schweizer Obligationenrechts.",
            "Server-Logdaten: maximal 14 Tage.",
          ],
        },
        {
          heading: "Empfänger und Auftragsverarbeiter",
          paragraphs: [
            "Wir setzen sorgfältig ausgewählte Dienstleister als Auftragsbearbeiter ein, vertraglich zu Vertraulichkeit und Datensicherheit verpflichtet: Hosting und Datenbank (Railway), Objektspeicher für Medien (Railway S3), E-Mail-Versand (Resend). Dabei können Daten in Länder ausserhalb der Schweiz gelangen; die Bekanntgabe erfolgt nur in Staaten mit angemessenem Schutz oder auf Basis der Standardvertragsklauseln. Eine Weitergabe an Werbenetzwerke oder Datenhändler findet nicht statt.",
          ],
        },
        {
          heading: "Cookies und Tracking",
          paragraphs: [
            "Wir verwenden ausschliesslich technisch notwendige Cookies: ein Session-Cookie für die Anmeldung und ein Cookie für die Altersbestätigung. Es kommen keine Analyse- oder Werbe-Cookies Dritter zum Einsatz, daher ist kein Consent-Banner erforderlich.",
          ],
        },
        {
          heading: "Deine Rechte",
          bullets: [
            "Auskunft über die zu deiner Person bearbeiteten Daten.",
            "Berichtigung unrichtiger Daten.",
            "Löschung deiner Daten und Widerspruch gegen eine Bearbeitung.",
            "Herausgabe oder Übertragung deiner Daten in einem gängigen elektronischen Format.",
            "Widerruf einer erteilten Einwilligung — jederzeit und ohne Nachteile.",
            "Anzeige beim Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB).",
          ],
        },
        {
          heading: "Sicherheit",
          paragraphs: [
            "Die Übertragung erfolgt ausschliesslich TLS-verschlüsselt. Passwörter werden mit bcrypt gehasht und niemals im Klartext gespeichert. Der Zugriff auf Verifizierungsdokumente ist auf geschultes Moderationspersonal beschränkt und wird protokolliert.",
          ],
        },
      ]}
    />
  );
}

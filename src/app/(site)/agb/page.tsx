import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Allgemeine Geschäftsbedingungen",
  description: "Nutzungsbedingungen für die Plattform THEGND.",
  alternates: { canonical: "/agb" },
  robots: { index: true, follow: false },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Allgemeine Geschäftsbedingungen"
      updated="1. August 2026"
      notice="Diese Bedingungen sind eine sorgfältig ausgearbeitete Vorlage für einen Betrieb in der Schweiz. Lass sie vor dem Livegang durch eine Rechtsanwältin oder einen Rechtsanwalt für IT- und Medienrecht prüfen und an deinen Unternehmenssitz anpassen — kantonale Vorschriften zur Sexarbeit sind dabei zu berücksichtigen."
      intro={`Diese Bedingungen regeln die Nutzung der Plattform ${SITE.name} (nachfolgend „Plattform“). Mit der Registrierung oder Nutzung erklärst du dich mit ihnen einverstanden.`}
      sections={[
        {
          heading: "Geltungsbereich und Vertragsgegenstand",
          paragraphs: [
            "Die Plattform stellt ausschliesslich technischen Speicherplatz und Suchfunktionen für nutzergenerierte Inserate zur Verfügung. Es kommt zu keinem Zeitpunkt ein Vertrag über Dienstleistungen zwischen dem Betreiber und Nutzenden über Begleitleistungen zustande.",
            "Der Betreiber ist weder Vermittler, Arbeitgeber noch Vertragspartner der zwischen Nutzenden vereinbarten Leistungen. Sämtliche Absprachen erfolgen unmittelbar und ausschliesslich zwischen den Nutzenden.",
          ],
        },
        {
          heading: "Mindestalter und Zugangsvoraussetzungen",
          paragraphs: [
            "Die Nutzung ist ausschliesslich volljährigen Personen (18 Jahre und älter) gestattet. Mit der Registrierung bestätigst du deine Volljährigkeit und Geschäftsfähigkeit.",
            "Bei begründeten Zweifeln am Alter behält sich der Betreiber vor, einen Altersnachweis zu verlangen und das Konto bis zur Klärung zu sperren.",
          ],
        },
        {
          heading: "Registrierung und Konto",
          bullets: [
            "Angaben bei der Registrierung müssen wahrheitsgemäss und vollständig sein.",
            "Zugangsdaten sind geheim zu halten; ihre Weitergabe ist untersagt.",
            "Pro Person ist grundsätzlich ein Konto zulässig; Agenturen verwalten Modelprofile über die Agenturfunktion.",
            "Der Betreiber kann Konten bei Verstössen vorübergehend sperren oder dauerhaft löschen.",
          ],
        },
        {
          heading: "Pflichten der Nutzenden und verbotene Inhalte",
          paragraphs: ["Untersagt sind insbesondere:"],
          bullets: [
            "Inhalte, die gegen geltendes Schweizer Recht verstossen — insbesondere gegen das Strafgesetzbuch, gegen Jugendschutzbestimmungen sowie gegen kantonale Vorschriften zur Sexarbeit.",
            "Angebote oder Hinweise auf Zwangsprostitution, Menschenhandel oder die Ausbeutung Dritter.",
            "Darstellungen von Minderjährigen sowie jede Sexualisierung von Personen unter 18 Jahren.",
            "Fremde Fotos, Bildmaterial ohne Nutzungsrechte oder irreführende Darstellungen (Fake-Profile).",
            "Belästigung, Bedrohung, Diskriminierung, Doxxing oder Weitergabe personenbezogener Daten Dritter.",
            "Automatisiertes Auslesen (Scraping), Spam sowie Werbung für konkurrierende Angebote.",
          ],
        },
        {
          heading: "Verifizierung",
          paragraphs: [
            "Die Verifizierung ist freiwillig und kostenlos. Hochgeladene Ausweisdokumente werden verschlüsselt gespeichert, ausschliesslich zur Identitätsprüfung verwendet und spätestens 90 Tage nach Abschluss der Prüfung gelöscht.",
            "Ein Verifizierungsbadge bestätigt die Identitätsprüfung zum Zeitpunkt der Prüfung. Es stellt keine Zusicherung über Qualität, Verfügbarkeit oder Leistungen dar.",
          ],
        },
        {
          heading: "Credits, Vergütung und Widerruf",
          bullets: [
            "Das Anlegen und Betreiben eines Profils ist kostenlos. Kostenpflichtig sind ausschliesslich optionale Sichtbarkeitsleistungen.",
            "Credits sind ein Vorausguthaben, kein gesetzliches Zahlungsmittel, und werden nicht in Bargeld ausgezahlt.",
            "Ein gesetzliches Widerrufsrecht für Online-Käufe besteht in der Schweiz nicht. Freiwillig erstatten wir nicht eingesetzte Credits innerhalb von 14 Tagen nach dem Kauf auf Anfrage zurück.",
            "Bereits eingesetzte Credits für aktivierte Werbeleistungen werden nicht erstattet.",
          ],
        },
        {
          heading: "Bewertungen",
          paragraphs: [
            "Bewertungen müssen auf tatsächlichen Erfahrungen beruhen. Beleidigende, unwahre oder rechtsverletzende Inhalte werden nicht veröffentlicht oder nachträglich entfernt.",
            "Bewertete Profile erhalten ein öffentliches Antwortrecht. Der Betreiber entscheidet über Veröffentlichung und Entfernung nach billigem Ermessen.",
          ],
        },
        {
          heading: "Rechte an Inhalten",
          paragraphs: [
            "Die Rechte an hochgeladenen Inhalten verbleiben bei den Nutzenden. Für den Betrieb der Plattform wird dem Betreiber ein einfaches, räumlich unbeschränktes und widerrufliches Nutzungsrecht eingeräumt, insbesondere zur Speicherung, Skalierung, Anzeige und Bewerbung des jeweiligen Inserats.",
            "Mit Löschung des Inhalts erlischt dieses Nutzungsrecht, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen.",
          ],
        },
        {
          heading: "Haftung",
          paragraphs: [
            "Der Betreiber haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung von Leben, Körper und Gesundheit. Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt.",
            "Für nutzergenerierte Inhalte wird keine Haftung übernommen; es gelten die Haftungsprivilegien nach dem Digital Services Act und dem Telemediengesetz. Nach Kenntnis von rechtswidrigen Inhalten werden diese unverzüglich entfernt.",
          ],
        },
        {
          heading: "Meldeverfahren und Moderation",
          paragraphs: [
            "Jeder Inhalt kann über die Meldefunktion beanstandet werden. Meldungen werden in der Regel innerhalb von 24 Stunden geprüft. Über das Ergebnis werden meldende Personen informiert, sofern sie angemeldet sind.",
            "Gegen Moderationsentscheidungen kann formlos per E-Mail Widerspruch eingelegt werden.",
          ],
        },
        {
          heading: "Laufzeit und Kündigung",
          paragraphs: [
            "Das Nutzungsverhältnis läuft auf unbestimmte Zeit und kann von beiden Seiten jederzeit ohne Einhaltung einer Frist beendet werden. Nutzende können ihr Konto jederzeit im Dashboard löschen.",
          ],
        },
        {
          heading: "Schlussbestimmungen",
          paragraphs: [
            "Es gilt ausschliesslich Schweizer Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist der Sitz der Betreiberin, soweit keine zwingenden Bestimmungen entgegenstehen.",
            "Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.",
          ],
        },
      ]}
    />
  );
}

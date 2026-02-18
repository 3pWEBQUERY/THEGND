import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'

export default function DatenschutzPage() {
  return (
    <>
      <MinimalistNavigation />
      {/* Hero */}
      <header className="relative h-[50vh] min-h-[400px] bg-neutral-950 bg-gradient-to-b from-black to-neutral-900 border-b border-neutral-800/60">
        <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-thin tracking-wider text-white mb-4">DATENSCHUTZ</h1>
            <div className="w-24 h-px bg-pink-500 mx-auto" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="bg-white text-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
          {/* Header */}
          <div className="mb-8">
            <div className="text-[11px] uppercase tracking-widest text-gray-500">Rechtliche Angaben</div>
            <h2 className="mt-1 text-2xl md:text-3xl font-light tracking-wide text-gray-900">Datenschutzerklärung</h2>
            <div className="mt-3 h-px w-24 bg-pink-500" />
          </div>

          {/* Verantwortlicher / DSB */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Verantwortlicher</div>
              <dl className="mt-3 space-y-1">
                <div>
                  <dt className="sr-only">Name</dt>
                  <dd className="text-base text-gray-900 font-medium">3P WEBQUERY LIMITED</dd>
                </div>
                <div>
                  <dt className="sr-only">Anschrift</dt>
                  <dd className="text-sm text-gray-700">10 Downing Street, SW1A 1AA</dd>
                </div>
                <div>
                  <dt className="sr-only">Ort</dt>
                  <dd className="text-sm text-gray-700">London, United Kingdom</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-widest text-gray-500">E‑Mail</dt>
                  <dd className="text-sm text-gray-800"><a className="underline decoration-pink-400/40 underline-offset-2 hover:text-pink-600" href="mailto:contact@thegnd.net">contact@thegnd.net  </a></dd>
                </div>
              </dl>
            </div>
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Datenschutzbeauftragte:r (falls vorhanden)</div>
              <dl className="mt-3 space-y-1">
                <div>
                  <dt className="sr-only">Name</dt>
                  <dd className="text-sm text-gray-800">Alexander Sulschani</dd>
                </div>
                <div>
                  <dt className="sr-only">Kontakt</dt>
                  <dd className="text-sm text-gray-800"><a className="underline decoration-pink-400/40 underline-offset-2 hover:text-pink-600" href="mailto:contact@thegnd.net">contact@thegnd.net</a></dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Kategorien der verarbeiteten Daten */}
          <section className="mt-4 border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-[11px] uppercase tracking-widest text-gray-500">Kategorien personenbezogener Daten</div>
            <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>Stammdaten (z. B. Name, Geburtsdatum – falls angegeben)</li>
              <li>Kontaktdaten (z. B. E‑Mail, Telefonnummer – falls angegeben)</li>
              <li>Profildaten und Inhalte (z. B. Bilder, Texte, Einstellungen)</li>
              <li>Nutzungs‑ und Metadaten (z. B. Logfiles, Geräte‑/Browser‑Informationen, IP‑Adresse)</li>
              <li>Kommunikationsdaten (z. B. Support‑Anfragen)</li>
              <li>Zahlungs‑/Abrechnungsdaten (falls kostenpflichtige Leistungen genutzt werden)</li>
            </ul>
          </section>

          {/* Zwecke & Rechtsgrundlagen */}
          <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Zwecke der Verarbeitung</div>
              <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Bereitstellung der Plattform, Kontoverwaltung und Inhalte</li>
                <li>Leistungsbereitstellung, Sicherheit, Fehlersuche</li>
                <li>Kommunikation (z. B. Support, Benachrichtigungen)</li>
                <li>Reichweitenmessung und Optimierung (nur mit Einwilligung)</li>
                <li>Abrechnung/Vertragserfüllung (bei kostenpflichtigen Leistungen)</li>
              </ul>
            </div>
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Rechtsgrundlagen (DSGVO)</div>
              <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Art. 6 Abs. 1 lit. b – Vertragserfüllung / vorvertragliche Maßnahmen</li>
                <li>Art. 6 Abs. 1 lit. a – Einwilligung (z. B. für Analyse/Marketing‑Cookies)</li>
                <li>Art. 6 Abs. 1 lit. f – Berechtigte Interessen (z. B. Sicherheit, Betrugsprävention)</li>
                <li>Art. 6 Abs. 1 lit. c – Rechtliche Verpflichtung (z. B. Nachweispflichten)</li>
              </ul>
            </div>
          </section>

          {/* Empfänger & Drittland */}
          <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Empfänger / Auftragsverarbeiter</div>
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                Wir setzen Dienstleister ein (Hosting, E‑Mail, Datei‑Upload/Asset‑Hosting, ggf. Zahlungsdienstleister, Webanalyse), die personenbezogene Daten in unserem Auftrag verarbeiten.
                Mit diesen wurden Verträge zur Auftragsverarbeitung geschlossen.
              </p>
            </div>
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Drittlandübermittlung</div>
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                Eine Übermittlung in Drittländer außerhalb der EU/des EWR kann stattfinden, z. B. bei globalen Infrastrukturanbietern. In solchen Fällen
                greifen geeignete Garantien (Standardvertragsklauseln, zusätzliche Schutzmaßnahmen), sofern kein Angemessenheitsbeschluss vorliegt.
              </p>
            </div>
          </section>

          {/* Speicherdauer */}
          <section className="mt-4 border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-[11px] uppercase tracking-widest text-gray-500">Speicherdauer</div>
            <p className="mt-3 text-sm text-gray-700 leading-relaxed">
              Wir speichern personenbezogene Daten nur so lange, wie es für die jeweiligen Zwecke erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen.
              Nach Wegfall der Zwecke bzw. Ablauf der Fristen löschen oder anonymisieren wir die Daten.
            </p>
          </section>

          {/* Cookies & Tracking */}
          <section className="mt-4 border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-[11px] uppercase tracking-widest text-gray-500">Cookies & Tracking</div>
            <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>Essenzielle Cookies: für Login, Sicherheit, Grundeinstellungen (ohne Einwilligung).</li>
              <li>Funktionale/Komfort‑Cookies: verbessern Nutzererlebnis (ggf. einwilligungsbasiert).</li>
              <li>Analyse/Statistik‑Cookies: Reichweitenmessung und Optimierung (nur mit Einwilligung).</li>
              <li>Marketing‑/Tracking‑Technologien: personalisierte Inhalte/Werbung (nur mit Einwilligung).</li>
            </ul>
            <p className="mt-3 text-sm text-gray-700 leading-relaxed">
              Soweit erforderlich, holen wir deine Einwilligung über ein Consent‑Banner ein. Du kannst deine Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen
              (z. B. über die Einstellungen im Banner oder in den Browser‑/Geräteeinstellungen).
            </p>
          </section>

          {/* Eingesetzte Dienste – Beispiele/Platzhalter */}
          <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Hosting & Bereitstellung</div>
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                Die Plattform wird bei einem professionellen Infrastruktur‑Anbieter betrieben. Dabei werden Server‑Logfiles (IP‑Adresse, Zeitstempel, User‑Agent, Referer)
                zur technischen Bereitstellung und Sicherheit verarbeitet.
              </p>
            </div>
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Datei‑Upload / Asset‑Hosting</div>
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                Für das Hochladen und Bereitstellen von Medien setzen wir einen spezialisierten Dienst ein (z. B. Upload‑/Content‑Hosting). Dabei werden die von dir
                hochgeladenen Dateien sowie technische Metadaten verarbeitet. Rechtsgrundlage ist Vertragserfüllung und unser berechtigtes Interesse an stabiler Bereitstellung.
              </p>
            </div>
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Authentifizierung</div>
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                Zur Anmeldung/Registrierung nutzen wir einen Auth‑Dienst. Dabei werden die zur Kontoerstellung und‑nutzung erforderlichen Daten verarbeitet.
              </p>
            </div>
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Webanalyse (optional)</div>
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                Sofern du einwilligst, setzen wir Analyse‑Tools zur Reichweitenmessung und Verbesserung ein. Es können pseudonyme Profile und Cookies genutzt werden.
                Du kannst deine Einwilligung jederzeit widerrufen.
              </p>
            </div>
          </section>

          {/* Betroffenenrechte */}
          <section className="mt-4 border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-[11px] uppercase tracking-widest text-gray-500">Deine Rechte</div>
            <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung</li>
              <li>Datenübertragbarkeit</li>
              <li>Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen</li>
              <li>Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft</li>
              <li>Beschwerderecht bei einer Aufsichtsbehörde</li>
            </ul>
          </section>

          {/* Widerspruch / Widerruf / Automatisierung */}
          <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Widerruf & Widerspruch</div>
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                Du kannst erteilte Einwilligungen jederzeit widerrufen. Der Widerruf berührt die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung nicht.
                Gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO kannst du Widerspruch einlegen, sofern Gründe vorliegen, die sich aus deiner besonderen
                Situation ergeben.
              </p>
            </div>
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Automatisierte Entscheidungen</div>
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                Eine automatisierte Entscheidungsfindung einschließlich Profiling findet nicht statt, sofern nicht gesondert angegeben.
              </p>
            </div>
          </section>

          {/* Sicherheit & Änderungen */}
          <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Datensicherheit</div>
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                Wir treffen angemessene technische und organisatorische Maßnahmen, um deine Daten vor Verlust, Missbrauch und unberechtigtem Zugriff zu schützen und
                passen diese Maßnahmen regelmäßig an den Stand der Technik an.
              </p>
            </div>
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Änderungen dieser Erklärung</div>
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                Wir können diese Datenschutzerklärung anpassen, wenn sich Rechtslage, Funktionen oder Datenverarbeitungen ändern. Die aktuelle Version ist stets auf dieser Seite abrufbar.
              </p>
            </div>
          </section>

          {/* Kontakt */}
          <section className="mt-4 border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-[11px] uppercase tracking-widest text-gray-500">Kontakt zum Datenschutz</div>
            <p className="mt-3 text-sm text-gray-700 leading-relaxed">
              Bei Fragen oder zur Ausübung deiner Rechte kontaktiere uns unter <a className="underline decoration-pink-400/40 underline-offset-2 hover:text-pink-600" href="mailto:contact@thegnd.net">contact@thegnd.net</a>.
            </p>
            <p className="mt-2 text-xs text-gray-500"><em>Stand:</em> 18.02.2026</p>
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}

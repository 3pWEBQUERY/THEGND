import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'

export default function AGBPage() {
  return (
    <>
      <MinimalistNavigation />
      {/* Hero */}
      <header className="relative h-[50vh] min-h-[400px] bg-neutral-950 bg-gradient-to-b from-black to-neutral-900 border-b border-neutral-800/60">
        <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-thin tracking-wider text-white mb-4">AGB</h1>
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
            <h2 className="mt-1 text-2xl md:text-3xl font-light tracking-wide text-gray-900">Allgemeine Geschäftsbedingungen (AGB)</h2>
            <div className="mt-3 h-px w-24 bg-pink-500" />
          </div>

          {/* Geltungsbereich & Vertragspartner */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Geltungsbereich</div>
              <p className="mt-3 text-sm leading-relaxed text-gray-700">
                Diese AGB regeln die Nutzung der Plattform <strong>THEGND</strong> ("Plattform") sowie aller damit zusammenhängenden Dienste.
                Abweichende Bedingungen der Nutzer finden keine Anwendung, es sei denn, wir stimmen ihrer Geltung ausdrücklich zu.
              </p>
            </div>
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Vertragspartner</div>
              <dl className="mt-3 space-y-1">
                <div>
                  <dt className="sr-only">Anbieter</dt>
                  <dd className="text-base text-gray-900 font-medium">3P WEBQUERY LIMITED</dd>
                </div>
                <div>
                  <dt className="sr-only">Anschrift</dt>
                  <dd className="text-sm text-gray-700">10 Downing Street, London, SW1A 1AA, United Kingdom</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-widest text-gray-500">Kontakt</dt>
                  <dd className="text-sm text-gray-800"><a className="underline decoration-pink-400/40 underline-offset-2 hover:text-pink-600" href="mailto:contact@thegnd.net">contact@thegnd.net</a></dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Begriffsbestimmungen */}
          <section className="mt-4 border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-[11px] uppercase tracking-widest text-gray-500">Begriffsbestimmungen</div>
            <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li><strong>Nutzer</strong>: registrierte und nicht registrierte Personen, die die Plattform verwenden.</li>
              <li><strong>Inhalte</strong>: von Nutzern eingestellte oder generierte Daten (z. B. Texte, Bilder, Videos).</li>
              <li><strong>Dienste</strong>: alle Funktionen der Plattform, einschließlich kostenpflichtiger Zusatzleistungen.</li>
            </ul>
          </section>

          {/* Leistungsbeschreibung */}
          <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Leistungsbeschreibung</div>
              <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Bereitstellung einer Plattform zur Veröffentlichung und Darstellung von Profilen und Inhalten.</li>
                <li>Buchbare Zusatzleistungen (z. B. Hervorhebungen/Marketing‑Pakete) gemäß jeweiliger Beschreibung.</li>
                <li>Stetige Weiterentwicklung; Funktionsumfang kann angepasst werden.</li>
              </ul>
            </div>
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Verfügbarkeit</div>
              <p className="mt-3 text-sm leading-relaxed text-gray-700">
                Wir bemühen uns um eine hohe Verfügbarkeit der Plattform. Wartungen, Updates oder Störungen können jedoch zu temporären Einschränkungen führen.
              </p>
            </div>
          </section>

          {/* Registrierung & Konto */}
          <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Registrierung & Konto</div>
              <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Angaben müssen wahrheitsgemäß, aktuell und vollständig sein.</li>
                <li>Zugangsdaten sind geheim zu halten; Konten sind nicht übertragbar.</li>
                <li>Wir können Registrierungen ablehnen oder Konten sperren, wenn berechtigte Gründe vorliegen.</li>
              </ul>
            </div>
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Nutzungsalter</div>
              <p className="mt-3 text-sm leading-relaxed text-gray-700">Die Nutzung setzt die Volljährigkeit (18+) voraus.</p>
            </div>
          </section>

          {/* Nutzungsverhalten */}
          <section className="mt-4 border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-[11px] uppercase tracking-widest text-gray-500">Nutzungsverhalten & Inhalte</div>
            <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>Keine rechtswidrigen, diskriminierenden, gewaltverherrlichenden oder jugendgefährdenden Inhalte.</li>
              <li>Keine Verletzung von Urheber‑, Marken‑ oder Persönlichkeitsrechten Dritter.</li>
              <li>Keine missbräuchliche Nutzung (Spam, automatisierte Zugriffe, Sicherheitsumgehungen).</li>
              <li>Wir dürfen Inhalte moderieren, sperren oder entfernen, wenn Hinweise auf Rechtsverstöße vorliegen.</li>
            </ul>
          </section>

          {/* Entgelte & Zahlungen */}
          <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Entgelte, Abrechnung, Zahlungen</div>
              <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Für kostenpflichtige Leistungen gelten die jeweils ausgewiesenen Preise inkl. Steuern.</li>
                <li>Abrechnung über die angebotenen Zahlungswege; Rechnungsstellung elektronisch.</li>
                <li>Bei Zahlungsverzug sind wir berechtigt, Leistungen auszusetzen.</li>
              </ul>
            </div>
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Widerruf / Rückerstattung</div>
              <p className="mt-3 text-sm leading-relaxed text-gray-700">Es gelten die gesetzlichen Regelungen. Soweit digitale Inhalte vor Ablauf der Widerrufsfrist bereitgestellt werden, kann das Widerrufsrecht erlöschen.</p>
            </div>
          </section>

          {/* Laufzeit & Kündigung */}
          <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Laufzeit & Kündigung</div>
              <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Unbefristete Nutzung, sofern kein befristeter Tarif gebucht wurde.</li>
                <li>Kündigung jederzeit möglich; bereits erbrachte Leistungen bleiben unberührt.</li>
                <li>Wesentliche Vertragsverstöße berechtigen zur fristlosen Kündigung/Sperrung.</li>
              </ul>
            </div>
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Sperrung/Löschung</div>
              <p className="mt-3 text-sm leading-relaxed text-gray-700">Wir können Konten sperren oder Inhalte entfernen, wenn berechtigte Hinweise auf Verstöße vorliegen oder rechtliche Verpflichtungen bestehen.</p>
            </div>
          </section>

          {/* Rechte, Lizenzen, Haftung */}
          <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Rechte an Inhalten & Lizenzen</div>
              <p className="mt-3 text-sm leading-relaxed text-gray-700">
                Nutzer behalten die Rechte an ihren Inhalten und räumen uns eine einfache, zeitlich und räumlich beschränkte Lizenz zur Darstellung innerhalb der Plattform ein,
                soweit dies zur Vertragserfüllung erforderlich ist. Nutzer stellen sicher, dass sie über die erforderlichen Rechte verfügen.
              </p>
            </div>
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Gewährleistung & Haftung</div>
              <p className="mt-3 text-sm leading-relaxed text-gray-700">
                Wir haften nach den gesetzlichen Vorschriften bei Vorsatz und grober Fahrlässigkeit. Bei einfacher Fahrlässigkeit nur bei Verletzung wesentlicher Vertragspflichten
                (Kardinalpflichten) und beschränkt auf den typischen, vorhersehbaren Schaden. Eine Haftung für fremde Inhalte besteht nicht.
              </p>
            </div>
          </section>

          {/* Datenschutz & Änderungen */}
          <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Datenschutz</div>
              <p className="mt-3 text-sm leading-relaxed text-gray-700">
                Informationen zur Verarbeitung personenbezogener Daten findest du in unserer <a className="underline decoration-pink-400/40 underline-offset-2 hover:text-pink-600" href="/datenschutz">Datenschutzerklärung</a>.
              </p>
            </div>
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Änderungen der AGB</div>
              <p className="mt-3 text-sm leading-relaxed text-gray-700">
                Wir können diese AGB anpassen, wenn sachliche Gründe dies erfordern (z. B. Gesetzesänderung, Funktionsanpassungen). Über wesentliche Änderungen informieren wir angemessen.
              </p>
            </div>
          </section>

          {/* Schlussbestimmungen & Kontakt */}
          <section className="mt-4 border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-[11px] uppercase tracking-widest text-gray-500">Schlussbestimmungen</div>
            <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>Es gilt das Recht von [Land], sofern dem keine zwingenden Vorschriften entgegenstehen.</li>
              <li>Gerichtsstand ist – soweit zulässig – [Sitz des Anbieters].</li>
              <li>Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Regelungen unberührt.</li>
            </ul>
            <div className="mt-6 text-[11px] uppercase tracking-widest text-gray-500">Kontakt</div>
            <p className="mt-3 text-sm leading-relaxed text-gray-700">Fragen zu diesen AGB? Kontaktiere uns unter <a className="underline decoration-pink-400/40 underline-offset-2 hover:text-pink-600" href="mailto:contact@thegnd.net">contact@thegnd.net</a>.</p>
            <p className="mt-2 text-xs text-gray-500"><em>Stand:</em> 18.02.2026</p>
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}

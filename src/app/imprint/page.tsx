import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'

export default function ImprintPage() {
  return (
    <>
      <MinimalistNavigation />
      {/* Hero */}
      <header className="relative h-[50vh] min-h-[400px] bg-neutral-950 bg-gradient-to-b from-black to-neutral-900 border-b border-neutral-800/60">
        <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-thin tracking-wider text-white mb-4">IMPRESSUM</h1>
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
            <h2 className="mt-1 text-2xl md:text-3xl font-light tracking-wide text-gray-900">Angaben gemäß § 5 TMG / Impressum</h2>
            <div className="mt-3 h-px w-24 bg-pink-500" />
          </div>

          {/* Anbieter & Vertretung */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Anbieter</div>
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
                  <dd className="text-sm text-gray-700">London, UK</dd>
                </div>
              </dl>
            </div>
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Vertreten durch</div>
              <dl className="mt-3">
                <div>
                  <dt className="sr-only">Name</dt>
                  <dd className="text-base text-gray-900">Alexander Sulschani</dd>
                </div>
                <div>
                  <dt className="sr-only">Funktion</dt>
                  <dd className="text-sm text-gray-700">(Geschäftsführer)</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Kontakt & Register */}
          <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Kontakt</div>
              <dl className="mt-3 space-y-1">
                <div>
                  <dt className="text-[11px] uppercase tracking-widest text-gray-500">E‑Mail</dt>
                  <dd className="text-sm text-gray-800"><a className="underline decoration-pink-400/40 underline-offset-2 hover:text-pink-600" href="mailto:contact@thegnd.net">contact@thegnd.net</a></dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-widest text-gray-500">Telefon (optional)</dt>
                  <dd className="text-sm text-gray-800">+44 7497 529238</dd>
                </div>
              </dl>
            </div>
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Register &amp; USt‑ID</div>
              <dl className="mt-3 grid grid-cols-1 gap-2">
                <div>
                  <dt className="text-[11px] uppercase tracking-widest text-gray-500">Registergericht</dt>
                  <dd className="text-sm text-gray-800">HMRC</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-widest text-gray-500">Registernummer</dt>
                  <dd className="text-sm text-gray-800">123456789</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-widest text-gray-500">Umsatzsteuer‑ID</dt>
                  <dd className="text-sm text-gray-800">GB123456789</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Verantwortlich */}
          <section className="mt-4 border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-[11px] uppercase tracking-widest text-gray-500">Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)</div>
            <dl className="mt-3 space-y-1">
              <div>
                <dt className="sr-only">Name</dt>
                <dd className="text-sm text-gray-800">3P WEBQUERY LIMITED</dd>
              </div>
              <div>
                <dt className="sr-only">Adresse</dt>
                <dd className="text-sm text-gray-800">10 Downing Street, SW1A 1AA, London, UK</dd>
              </div>
            </dl>
          </section>

          {/* Haftung */}
          <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Haftung für Inhalte</div>
              <p className="mt-3 text-sm leading-relaxed text-gray-700">
                Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte
                können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten
                nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet,
                übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit
                hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt.
                Eine Haftung ist erst ab Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden entsprechender Rechtsverletzungen entfernen wir Inhalte
                umgehend.
              </p>
            </div>
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Haftung für Links</div>
              <p className="mt-3 text-sm leading-relaxed text-gray-700">
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte
                keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich. Die verlinkten Seiten
                wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft; rechtswidrige Inhalte waren zu diesem Zeitpunkt nicht erkennbar. Eine permanente
                inhaltliche Kontrolle der verlinkten Seiten ist ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen
                entfernen wir derartige Links umgehend.
              </p>
            </div>
          </section>

          {/* Urheberrecht, Streitbeilegung */}
          <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Urheberrecht</div>
              <p className="mt-3 text-sm leading-relaxed text-gray-700">
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem Urheberrecht. Die Vervielfältigung, Bearbeitung,
                Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
                Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit Inhalte nicht vom Betreiber erstellt wurden, werden
                die Urheberrechte Dritter beachtet und Inhalte entsprechend gekennzeichnet. Hinweise auf Rechtsverletzungen nehmen wir entgegen und entfernen betroffene Inhalte umgehend.
              </p>
            </div>
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">Hinweis zur Streitbeilegung</div>
              <p className="mt-3 text-sm leading-relaxed text-gray-700">
                Die Europäische Kommission stellt eine Plattform zur Online‑Streitbeilegung (OS) bereit: <a className="underline decoration-pink-400/40 underline-offset-2 hover:text-pink-600" href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr</a>.
                Wir sind weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </div>
          </section>

          {/* Bildnachweis & Gültigkeit */}
          <section className="mt-4 border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-[11px] uppercase tracking-widest text-gray-500">Bildnachweise</div>
            <p className="mt-3 text-sm leading-relaxed text-gray-700">Bildmaterial: [Eigene Bilder / Stockfotos von Anbieter XY]. Sofern nicht anders angegeben, liegen die Rechte beim Betreiber.</p>
            <div className="mt-6 text-[11px] uppercase tracking-widest text-gray-500">Gültigkeit</div>
            <p className="mt-3 text-sm leading-relaxed text-gray-700">
              Dieses Impressum gilt für die Domain <strong>thegnd</strong> und alle dazugehörigen Subdomains sowie für unsere Auftritte in sozialen Netzwerken,
              soweit dort auf dieses Impressum verwiesen wird.
            </p>
            <p className="mt-2 text-xs text-gray-500"><em>Stand:</em> {new Date().toLocaleDateString('de-DE')}</p>
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import Tabs from '@/components/Tabs'
import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'

export const metadata: Metadata = {
  title: 'Preise – THEGND',
  description: 'Transparente Mitgliedschaften und Add-ons für Besucher. Wähle das passende Paket und maximiere deine Sichtbarkeit auf THEGND.',
}

const PRICES = {
  membership: { basis: 24.9, plus: 49.9, premium: 89.9 },
  dayAddon: { 1: 12.9, 3: 29.9, 7: 39.9 },
  weekAddon: { 1: 39.9, 2: 69.9 },
  monthAddon: { 1: 99, 2: 169 },
  cityBoost: { 7: 29.9, 14: 49.9, 30: 79 },
} as const

const eur = (n: number) => n.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })

export default function PreisePage() {
  // Inner tabs for ESCORTS (uses real pricing)
  const escortsInnerTabs = [
    {
      id: 'mitgliedschaften',
      label: 'Mitgliedschaften',
      content: (
        <div>
          <div className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-light tracking-widest text-gray-900">MITGLIEDSCHAFTEN</h2>
            <div className="mt-3 w-24 h-px bg-pink-500" />
            <p className="mt-4 text-sm text-gray-600">
              Wähle das Paket, das zu dir passt – perfekt abgestimmt auf deine Ziele.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* BASIS */}
            <div className="border border-gray-200 p-6 hover:border-pink-300 transition-colors">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">BASIS</h3>
                <div className="text-right">
                  <div className="text-4xl font-semibold text-gray-900">{eur(PRICES.membership.basis)}</div>
                  <div className="text-[11px] uppercase tracking-widest text-gray-500">pro Monat</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600">Ideal für den Einstieg. Präsenz auf THEGND mit Standard-Funktionen.</p>
              <ul className="mt-4 text-sm text-gray-700 space-y-2 list-disc ml-5">
                <li>Standard-Listing in der Suche</li>
                <li>Basis-Profil mit Galerie</li>
                <li>Bis zu 5 Fotos</li>
              </ul>
              <div className="mt-6">
                <Link href="/auth/signup" className="inline-flex w-full items-center justify-center bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-3 text-sm uppercase rounded-none">Jetzt starten</Link>
              </div>
            </div>
            {/* PLUS */}
            <div className="border border-gray-200 p-6 hover:border-pink-300 transition-colors">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">PLUS</h3>
                <div className="text-right">
                  <div className="text-4xl font-semibold text-gray-900">{eur(PRICES.membership.plus)}</div>
                  <div className="text-[11px] uppercase tracking-widest text-gray-500">pro Monat</div>
                </div>
              </div>
              <span className="mt-2 inline-block px-2 py-1 text-[10px] uppercase tracking-widest border border-pink-300 text-pink-600">Empfohlen</span>
              <p className="mt-3 text-sm text-gray-600">Mehr Reichweite, erweiterte Darstellung und priorisierte Listings.</p>
              <ul className="mt-4 text-sm text-gray-700 space-y-2 list-disc ml-5">
                <li>Priorisierung gegenüber BASIS</li>
                <li>Erweiterte Profil-Module</li>
                <li>Bis zu 15 Fotos, 2 Videos</li>
              </ul>
              <div className="mt-6">
                <Link href="/auth/signup" className="inline-flex w-full items-center justify-center bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-3 text-sm uppercase rounded-none">Jetzt starten</Link>
              </div>
            </div>
            {/* PREMIUM */}
            <div className="border border-gray-200 p-6 hover:border-pink-300 transition-colors">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">PREMIUM</h3>
                <div className="text-right">
                  <div className="text-4xl font-semibold text-gray-900">{eur(PRICES.membership.premium)}</div>
                  <div className="text-[11px] uppercase tracking-widest text-gray-500">pro Monat</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600">Maximale Sichtbarkeit, Top-Placement und alle Vorteile.</p>
              <ul className="mt-4 text-sm text-gray-700 space-y-2 list-disc ml-5">
                <li>Top-Placement in den Listen</li>
                <li>Alle Profil-Features freigeschaltet</li>
                <li>Bis zu 30 Fotos, 5 Videos, Stories</li>
              </ul>
              <div className="mt-6">
                <Link href="/auth/signup" className="inline-flex w-full items-center justify-center bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-3 text-sm uppercase rounded-none">Jetzt starten</Link>
              </div>
            </div>
          </div>

          <p className="mt-6 text-xs text-gray-500">
            Hinweis: Der Abschluss erfolgt in deinem Konto. Zahlungen und Buchungen können im Bereich „Mitgliedschaft“ verwaltet werden.
          </p>
        </div>
      ),
    },
    {
      id: 'add-ons',
      label: 'Add-ons',
      content: (
        <div>
          <div className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-light tracking-widest text-gray-900">ADD-ONS</h2>
            <div className="mt-3 w-24 h-px bg-pink-500" />
            <p className="mt-4 text-sm text-gray-600">Flexible Boosts für mehr Sichtbarkeit – wähle die passende Dauer.</p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Escort of the Day */}
            <div className="border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">Escort of the Day</h3>
                <span className="text-sm text-gray-600">ab {eur(PRICES.dayAddon[1])}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Schneller Push für 1–7 Tage mit Startseiten-Highlight.</p>
              <div className="mt-4 overflow-hidden border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-2">Dauer</th>
                      <th className="text-left font-medium px-4 py-2">Preis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2">1 Tag</td>
                      <td className="px-4 py-2">{eur(PRICES.dayAddon[1])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">3 Tage</td>
                      <td className="px-4 py-2">{eur(PRICES.dayAddon[3])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">7 Tage</td>
                      <td className="px-4 py-2">{eur(PRICES.dayAddon[7])}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Städte-Boost */}
            <div className="border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">Städte-Boost</h3>
                <span className="text-sm text-gray-600">ab {eur(PRICES.cityBoost[7])}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Priorisierte Platzierung in Stadt-Listings.</p>
              <div className="mt-4 overflow-hidden border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-2">Dauer</th>
                      <th className="text-left font-medium px-4 py-2">Preis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2">7 Tage</td>
                      <td className="px-4 py-2">{eur(PRICES.cityBoost[7])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">14 Tage</td>
                      <td className="px-4 py-2">{eur(PRICES.cityBoost[14])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">30 Tage</td>
                      <td className="px-4 py-2">{eur(PRICES.cityBoost[30])}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Escort of the Week */}
            <div className="border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">Escort of the Week</h3>
                <span className="text-sm text-gray-600">ab {eur(PRICES.weekAddon[1])}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Top-Sichtbarkeit für 1–2 Wochen.</p>
              <div className="mt-4 overflow-hidden border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-2">Dauer</th>
                      <th className="text-left font-medium px-4 py-2">Preis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2">1 Woche</td>
                      <td className="px-4 py-2">{eur(PRICES.weekAddon[1])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">2 Wochen</td>
                      <td className="px-4 py-2">{eur(PRICES.weekAddon[2])}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Escort of the Month */}
            <div className="border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">Escort of the Month</h3>
                <span className="text-sm text-gray-600">ab {eur(PRICES.monthAddon[1])}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Maximale Sichtbarkeit über 1–2 Monate.</p>
              <div className="mt-4 overflow-hidden border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-2">Dauer</th>
                      <th className="text-left font-medium px-4 py-2">Preis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2">1 Monat</td>
                      <td className="px-4 py-2">{eur(PRICES.monthAddon[1])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">2 Monate</td>
                      <td className="px-4 py-2">{eur(PRICES.monthAddon[2])}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center bg-pink-500 hover:bg-pink-600 text-white text-xs font-light tracking-widest px-6 py-3 uppercase rounded-none"
            >
              Kostenlos registrieren
            </Link>
            <Link
              href="/membership"
              className="inline-flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-pink-50/40 text-xs font-light tracking-widest px-6 py-3 uppercase rounded-none"
            >
              Im Konto buchen
            </Link>
          </div>

          <p className="mt-6 text-xs text-gray-500">
            Alle Preise inkl. MwSt. Änderungen vorbehalten. Aktionen und Placements können abhängig von der Verfügbarkeit variieren.
          </p>
        </div>
      ),
    },
  ]

  // Mitglieder (Visitors) Pricing
  const PRICES_MEMBERS = {
    membership: { basis: 0, plus: 7.9, premium: 14.9 },
    dayAddon: { 1: 1.9, 3: 3.9, 7: 6.9 },
    cityBoost: { 7: 2.9, 14: 4.9, 30: 7.9 },
  } as const

  const membersInnerTabs = [
    {
      id: 'mitgliedschaften',
      label: 'Mitgliedschaften',
      content: (
        <div>
          <div className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-light tracking-widest text-gray-900">MITGLIEDSCHAFTEN</h2>
            <div className="mt-3 w-24 h-px bg-pink-500" />
            <p className="mt-4 text-sm text-gray-600">Wähle dein Level – vom kostenlosen Einstieg bis zu Premium-Vorteilen.</p>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 p-6 hover:border-pink-300 transition-colors">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">BASIS</h3>
                <div className="text-right">
                  <div className="text-4xl font-semibold text-gray-900">{eur(PRICES_MEMBERS.membership.basis)}</div>
                  <div className="text-[11px] uppercase tracking-widest text-gray-500">pro Monat</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600">Kostenlos starten. Entdecken, folgen, speichern.</p>
              <ul className="mt-4 text-sm text-gray-700 space-y-2 list-disc ml-5">
                <li>Favoriten & Folgen</li>
                <li>Standard-Feed</li>
                <li>2 gespeicherte Suchen</li>
              </ul>
            </div>
            <div className="border border-gray-200 p-6 hover:border-pink-300 transition-colors">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">PLUS</h3>
                <div className="text-right">
                  <div className="text-4xl font-semibold text-gray-900">{eur(PRICES_MEMBERS.membership.plus)}</div>
                  <div className="text-[11px] uppercase tracking-widest text-gray-500">pro Monat</div>
                </div>
              </div>
              <span className="mt-2 inline-block px-2 py-1 text-[10px] uppercase tracking-widest border border-pink-300 text-pink-600">Beliebt</span>
              <p className="mt-3 text-sm text-gray-600">Mehr Komfort & Personalisierung.</p>
              <ul className="mt-4 text-sm text-gray-700 space-y-2 list-disc ml-5">
                <li>Werbefreie Ansicht</li>
                <li>Erweiterte Filter</li>
                <li>Unbegrenzte gespeicherte Suchen</li>
              </ul>
            </div>
            <div className="border border-gray-200 p-6 hover:border-pink-300 transition-colors">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">PREMIUM</h3>
                <div className="text-right">
                  <div className="text-4xl font-semibold text-gray-900">{eur(PRICES_MEMBERS.membership.premium)}</div>
                  <div className="text-[11px] uppercase tracking-widest text-gray-500">pro Monat</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600">Exklusive Inhalte & Prioritäten.</p>
              <ul className="mt-4 text-sm text-gray-700 space-y-2 list-disc ml-5">
                <li>Early Access zu Stories</li>
                <li>Profil-Badges</li>
                <li>Priorisierte Support-Antwort</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'add-ons',
      label: 'Add-ons',
      content: (
        <div>
          <div className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-light tracking-widest text-gray-900">ADD-ONS</h2>
            <div className="mt-3 w-24 h-px bg-pink-500" />
            <p className="mt-4 text-sm text-gray-600">Booste deine Sichtbarkeit als Mitglied.</p>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">Profil-Boost (Tage)</h3>
                <span className="text-sm text-gray-600">ab {eur(PRICES_MEMBERS.dayAddon[1])}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Dein Profil prominenter in Feeds & Listen.</p>
              <div className="mt-4 overflow-hidden border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-2">Dauer</th>
                      <th className="text-left font-medium px-4 py-2">Preis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2">1 Tag</td>
                      <td className="px-4 py-2">{eur(PRICES_MEMBERS.dayAddon[1])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">3 Tage</td>
                      <td className="px-4 py-2">{eur(PRICES_MEMBERS.dayAddon[3])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">7 Tage</td>
                      <td className="px-4 py-2">{eur(PRICES_MEMBERS.dayAddon[7])}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">City-Boost</h3>
                <span className="text-sm text-gray-600">ab {eur(PRICES_MEMBERS.cityBoost[7])}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Mehr Sichtbarkeit in deiner Stadt.</p>
              <div className="mt-4 overflow-hidden border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-2">Dauer</th>
                      <th className="text-left font-medium px-4 py-2">Preis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2">7 Tage</td>
                      <td className="px-4 py-2">{eur(PRICES_MEMBERS.cityBoost[7])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">14 Tage</td>
                      <td className="px-4 py-2">{eur(PRICES_MEMBERS.cityBoost[14])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">30 Tage</td>
                      <td className="px-4 py-2">{eur(PRICES_MEMBERS.cityBoost[30])}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ]

  // Agenturen Pricing
  const PRICES_AGENCIES = {
    membership: { basis: 79, plus: 129, premium: 199 },
    dayAddon: { 1: 19, 3: 39, 7: 69 },
    weekAddon: { 1: 99, 2: 179 },
    monthAddon: { 1: 349, 2: 599 },
    cityBoost: { 7: 49, 14: 89, 30: 149 },
  } as const

  const agenciesInnerTabs = [
    {
      id: 'mitgliedschaften',
      label: 'Mitgliedschaften',
      content: (
        <div>
          <div className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-light tracking-widest text-gray-900">MITGLIEDSCHAFTEN</h2>
            <div className="mt-3 w-24 h-px bg-pink-500" />
            <p className="mt-4 text-sm text-gray-600">Skaliere deine Agentur – mehr Reichweite & Tools.</p>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 p-6 hover:border-pink-300 transition-colors">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">BASIS</h3>
                <div className="text-right">
                  <div className="text-4xl font-semibold text-gray-900">{eur(PRICES_AGENCIES.membership.basis)}</div>
                  <div className="text-[11px] uppercase tracking-widest text-gray-500">pro Monat</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600">Für kleine Agenturen.</p>
              <ul className="mt-4 text-sm text-gray-700 space-y-2 list-disc ml-5">
                <li>Agentur-Profil</li>
                <li>Bis zu 5 Escort-Listings</li>
                <li>Standard-Support</li>
              </ul>
            </div>
            <div className="border border-gray-200 p-6 hover:border-pink-300 transition-colors">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">PLUS</h3>
                <div className="text-right">
                  <div className="text-4xl font-semibold text-gray-900">{eur(PRICES_AGENCIES.membership.plus)}</div>
                  <div className="text-[11px] uppercase tracking-widest text-gray-500">pro Monat</div>
                </div>
              </div>
              <span className="mt-2 inline-block px-2 py-1 text-[10px] uppercase tracking-widest border border-pink-300 text-pink-600">Empfohlen</span>
              <p className="mt-3 text-sm text-gray-600">Mehr Slots & Tools.</p>
              <ul className="mt-4 text-sm text-gray-700 space-y-2 list-disc ml-5">
                <li>Bis zu 15 Escort-Listings</li>
                <li>Teamverwaltung</li>
                <li>Erweiterte Statistiken</li>
              </ul>
            </div>
            <div className="border border-gray-200 p-6 hover:border-pink-300 transition-colors">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">PREMIUM</h3>
                <div className="text-right">
                  <div className="text-4xl font-semibold text-gray-900">{eur(PRICES_AGENCIES.membership.premium)}</div>
                  <div className="text-[11px] uppercase tracking-widest text-gray-500">pro Monat</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600">Maximale Kapazität & Priorität.</p>
              <ul className="mt-4 text-sm text-gray-700 space-y-2 list-disc ml-5">
                <li>Unbegrenzte Escort-Listings</li>
                <li>Priorisierter Support</li>
                <li>Partner-Features</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'add-ons',
      label: 'Add-ons',
      content: (
        <div>
          <div className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-light tracking-widest text-gray-900">ADD-ONS</h2>
            <div className="mt-3 w-24 h-px bg-pink-500" />
            <p className="mt-4 text-sm text-gray-600">Kampagnen & Platzierungen für maximale Sichtbarkeit.</p>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">Top-Listing (Tage)</h3>
                <span className="text-sm text-gray-600">ab {eur(PRICES_AGENCIES.dayAddon[1])}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Prominente Platzierung in Ergebnissen.</p>
              <div className="mt-4 overflow-hidden border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-2">Dauer</th>
                      <th className="text-left font-medium px-4 py-2">Preis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2">1 Tag</td>
                      <td className="px-4 py-2">{eur(PRICES_AGENCIES.dayAddon[1])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">3 Tage</td>
                      <td className="px-4 py-2">{eur(PRICES_AGENCIES.dayAddon[3])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">7 Tage</td>
                      <td className="px-4 py-2">{eur(PRICES_AGENCIES.dayAddon[7])}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">Top-Listing (Wochen)</h3>
                <span className="text-sm text-gray-600">ab {eur(PRICES_AGENCIES.weekAddon[1])}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Sichtbarkeit über längere Zeiträume.</p>
              <div className="mt-4 overflow-hidden border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-2">Dauer</th>
                      <th className="text-left font-medium px-4 py-2">Preis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2">1 Woche</td>
                      <td className="px-4 py-2">{eur(PRICES_AGENCIES.weekAddon[1])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">2 Wochen</td>
                      <td className="px-4 py-2">{eur(PRICES_AGENCIES.weekAddon[2])}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="border border-gray-200 bg-white p-6 md:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">Kampagne (Monate)</h3>
                <span className="text-sm text-gray-600">ab {eur(PRICES_AGENCIES.monthAddon[1])}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Langfristige Kampagne mit maximaler Reichweite.</p>
              <div className="mt-4 overflow-hidden border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-2">Dauer</th>
                      <th className="text-left font-medium px-4 py-2">Preis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2">1 Monat</td>
                      <td className="px-4 py-2">{eur(PRICES_AGENCIES.monthAddon[1])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">2 Monate</td>
                      <td className="px-4 py-2">{eur(PRICES_AGENCIES.monthAddon[2])}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ]

  // Clubs Pricing
  const PRICES_CLUBS = {
    membership: { basis: 59, plus: 99, premium: 159 },
    dayAddon: { 1: 14.9, 3: 29.9, 7: 49.9 },
    weekAddon: { 1: 79, 2: 129 },
    cityBoost: { 7: 39, 14: 69, 30: 109 },
  } as const

  const clubsInnerTabs = [
    {
      id: 'mitgliedschaften',
      label: 'Mitgliedschaften',
      content: (
        <div>
          <div className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-light tracking-widest text-gray-900">MITGLIEDSCHAFTEN</h2>
            <div className="mt-3 w-24 h-px bg-pink-500" />
            <p className="mt-4 text-sm text-gray-600">Präsentation deines Clubs mit mehr Reichweite.</p>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 p-6 hover:border-pink-300 transition-colors">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">BASIS</h3>
                <div className="text-right">
                  <div className="text-4xl font-semibold text-gray-900">{eur(PRICES_CLUBS.membership.basis)}</div>
                  <div className="text-[11px] uppercase tracking-widest text-gray-500">pro Monat</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600">Standard-Auftritt & Suche.</p>
              <ul className="mt-4 text-sm text-gray-700 space-y-2 list-disc ml-5">
                <li>Club-Profil</li>
                <li>Standard-Listing</li>
                <li>Bis zu 10 Fotos</li>
              </ul>
            </div>
            <div className="border border-gray-200 p-6 hover:border-pink-300 transition-colors">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">PLUS</h3>
                <div className="text-right">
                  <div className="text-4xl font-semibold text-gray-900">{eur(PRICES_CLUBS.membership.plus)}</div>
                  <div className="text-[11px] uppercase tracking-widest text-gray-500">pro Monat</div>
                </div>
              </div>
              <span className="mt-2 inline-block px-2 py-1 text-[10px] uppercase tracking-widest border border-pink-300 text-pink-600">Beliebt</span>
              <p className="mt-3 text-sm text-gray-600">Mehr Module & Reichweite.</p>
              <ul className="mt-4 text-sm text-gray-700 space-y-2 list-disc ml-5">
                <li>Erweiterte Module</li>
                <li>Priorisierung in Listen</li>
                <li>Bis zu 20 Fotos</li>
              </ul>
            </div>
            <div className="border border-gray-200 p-6 hover:border-pink-300 transition-colors">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">PREMIUM</h3>
                <div className="text-right">
                  <div className="text-4xl font-semibold text-gray-900">{eur(PRICES_CLUBS.membership.premium)}</div>
                  <div className="text-[11px] uppercase tracking-widest text-gray-500">pro Monat</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600">Top-Placement & volle Features.</p>
              <ul className="mt-4 text-sm text-gray-700 space-y-2 list-disc ml-5">
                <li>Top-Placement</li>
                <li>Alle Module</li>
                <li>Stories & Videos</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'add-ons',
      label: 'Add-ons',
      content: (
        <div>
          <div className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-light tracking-widest text-gray-900">ADD-ONS</h2>
            <div className="mt-3 w-24 h-px bg-pink-500" />
            <p className="mt-4 text-sm text-gray-600">Zusätzliche Platzierungen für Events & Aktionen.</p>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">Top-Listing (Tage)</h3>
                <span className="text-sm text-gray-600">ab {eur(PRICES_CLUBS.dayAddon[1])}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Prominente Platzierung über Tage.</p>
              <div className="mt-4 overflow-hidden border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-2">Dauer</th>
                      <th className="text-left font-medium px-4 py-2">Preis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2">1 Tag</td>
                      <td className="px-4 py-2">{eur(PRICES_CLUBS.dayAddon[1])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">3 Tage</td>
                      <td className="px-4 py-2">{eur(PRICES_CLUBS.dayAddon[3])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">7 Tage</td>
                      <td className="px-4 py-2">{eur(PRICES_CLUBS.dayAddon[7])}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">Top-Listing (Wochen)</h3>
                <span className="text-sm text-gray-600">ab {eur(PRICES_CLUBS.weekAddon[1])}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Stetige Sichtbarkeit über Wochen.</p>
              <div className="mt-4 overflow-hidden border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-2">Dauer</th>
                      <th className="text-left font-medium px-4 py-2">Preis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2">1 Woche</td>
                      <td className="px-4 py-2">{eur(PRICES_CLUBS.weekAddon[1])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">2 Wochen</td>
                      <td className="px-4 py-2">{eur(PRICES_CLUBS.weekAddon[2])}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="border border-gray-200 bg-white p-6 md:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">City-Boost</h3>
                <span className="text-sm text-gray-600">ab {eur(PRICES_CLUBS.cityBoost[7])}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Mehr Reichweite in deiner Stadt.</p>
              <div className="mt-4 overflow-hidden border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-2">Dauer</th>
                      <th className="text-left font-medium px-4 py-2">Preis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2">7 Tage</td>
                      <td className="px-4 py-2">{eur(PRICES_CLUBS.cityBoost[7])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">14 Tage</td>
                      <td className="px-4 py-2">{eur(PRICES_CLUBS.cityBoost[14])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">30 Tage</td>
                      <td className="px-4 py-2">{eur(PRICES_CLUBS.cityBoost[30])}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ]

  // Studios Pricing
  const PRICES_STUDIOS = {
    membership: { basis: 49, plus: 89, premium: 139 },
    dayAddon: { 1: 12.9, 3: 24.9, 7: 39.9 },
    weekAddon: { 1: 69, 2: 109 },
    cityBoost: { 7: 29.9, 14: 49.9, 30: 89 },
  } as const

  const studiosInnerTabs = [
    {
      id: 'mitgliedschaften',
      label: 'Mitgliedschaften',
      content: (
        <div>
          <div className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-light tracking-widest text-gray-900">MITGLIEDSCHAFTEN</h2>
            <div className="mt-3 w-24 h-px bg-pink-500" />
            <p className="mt-4 text-sm text-gray-600">Optimiere deine Studio-Präsenz.</p>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 p-6 hover:border-pink-300 transition-colors">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">BASIS</h3>
                <div className="text-right">
                  <div className="text-4xl font-semibold text-gray-900">{eur(PRICES_STUDIOS.membership.basis)}</div>
                  <div className="text-[11px] uppercase tracking-widest text-gray-500">pro Monat</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600">Standard-Reichweite & Module.</p>
              <ul className="mt-4 text-sm text-gray-700 space-y-2 list-disc ml-5">
                <li>Studio-Profil</li>
                <li>Standard-Listing</li>
                <li>Bis zu 10 Fotos</li>
              </ul>
            </div>
            <div className="border border-gray-200 p-6 hover:border-pink-300 transition-colors">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">PLUS</h3>
                <div className="text-right">
                  <div className="text-4xl font-semibold text-gray-900">{eur(PRICES_STUDIOS.membership.plus)}</div>
                  <div className="text-[11px] uppercase tracking-widest text-gray-500">pro Monat</div>
                </div>
              </div>
              <span className="mt-2 inline-block px-2 py-1 text-[10px] uppercase tracking-widest border border-pink-300 text-pink-600">Beliebt</span>
              <p className="mt-3 text-sm text-gray-600">Mehr Sichtbarkeit & Module.</p>
              <ul className="mt-4 text-sm text-gray-700 space-y-2 list-disc ml-5">
                <li>Erweiterte Module</li>
                <li>Priorisierung</li>
                <li>Bis zu 20 Fotos</li>
              </ul>
            </div>
            <div className="border border-gray-200 p-6 hover:border-pink-300 transition-colors">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">PREMIUM</h3>
                <div className="text-right">
                  <div className="text-4xl font-semibold text-gray-900">{eur(PRICES_STUDIOS.membership.premium)}</div>
                  <div className="text-[11px] uppercase tracking-widest text-gray-500">pro Monat</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600">Top-Placement & alle Features.</p>
              <ul className="mt-4 text-sm text-gray-700 space-y-2 list-disc ml-5">
                <li>Top-Placement</li>
                <li>Alle Module</li>
                <li>Stories & Videos</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'add-ons',
      label: 'Add-ons',
      content: (
        <div>
          <div className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-light tracking-widest text-gray-900">ADD-ONS</h2>
            <div className="mt-3 w-24 h-px bg-pink-500" />
            <p className="mt-4 text-sm text-gray-600">Platzierungen & Local-Boosts.</p>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">Top-Listing (Tage)</h3>
                <span className="text-sm text-gray-600">ab {eur(PRICES_STUDIOS.dayAddon[1])}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Prominente Platzierung über Tage.</p>
              <div className="mt-4 overflow-hidden border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-2">Dauer</th>
                      <th className="text-left font-medium px-4 py-2">Preis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2">1 Tag</td>
                      <td className="px-4 py-2">{eur(PRICES_STUDIOS.dayAddon[1])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">3 Tage</td>
                      <td className="px-4 py-2">{eur(PRICES_STUDIOS.dayAddon[3])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">7 Tage</td>
                      <td className="px-4 py-2">{eur(PRICES_STUDIOS.dayAddon[7])}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">Top-Listing (Wochen)</h3>
                <span className="text-sm text-gray-600">ab {eur(PRICES_STUDIOS.weekAddon[1])}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Stetige Sichtbarkeit über Wochen.</p>
              <div className="mt-4 overflow-hidden border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-2">Dauer</th>
                      <th className="text-left font-medium px-4 py-2">Preis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2">1 Woche</td>
                      <td className="px-4 py-2">{eur(PRICES_STUDIOS.weekAddon[1])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">2 Wochen</td>
                      <td className="px-4 py-2">{eur(PRICES_STUDIOS.weekAddon[2])}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="border border-gray-200 bg-white p-6 md:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium tracking-widest text-gray-900 uppercase">City-Boost</h3>
                <span className="text-sm text-gray-600">ab {eur(PRICES_STUDIOS.cityBoost[7])}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Mehr Reichweite in deiner Stadt.</p>
              <div className="mt-4 overflow-hidden border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-2">Dauer</th>
                      <th className="text-left font-medium px-4 py-2">Preis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2">7 Tage</td>
                      <td className="px-4 py-2">{eur(PRICES_STUDIOS.cityBoost[7])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">14 Tage</td>
                      <td className="px-4 py-2">{eur(PRICES_STUDIOS.cityBoost[14])}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">30 Tage</td>
                      <td className="px-4 py-2">{eur(PRICES_STUDIOS.cityBoost[30])}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ]

  const audienceTabs = [
    { id: 'escorts', label: 'Escorts', content: <Tabs tabs={escortsInnerTabs} initialId="mitgliedschaften" /> },
    {
      id: 'mitglieder',
      label: 'Mitglieder',
      content: (
        <Tabs tabs={membersInnerTabs} initialId="mitgliedschaften" />
      ),
    },
    {
      id: 'agenturen',
      label: 'Agenturen',
      content: (
        <Tabs tabs={agenciesInnerTabs} initialId="mitgliedschaften" />
      ),
    },
    {
      id: 'clubs',
      label: 'Clubs',
      content: (
        <Tabs tabs={clubsInnerTabs} initialId="mitgliedschaften" />
      ),
    },
    {
      id: 'studios',
      label: 'Studios',
      content: (
        <Tabs tabs={studiosInnerTabs} initialId="mitgliedschaften" />
      ),
    },
  ]

  return (
    <main className="bg-white">
      {/* Transparent Header over Hero */}
      <MinimalistNavigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/price.jpg"
            alt="Hero Background"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/0 to-white/0 md:to-white/0" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-40 pb-24 md:pt-48 md:pb-40">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-light tracking-[0.25em] text-white">PREISE</h1>
            <div className="mt-4 h-[2px] w-24 bg-gradient-to-r from-pink-600/0 via-pink-500/80 to-pink-600/0" />
            <p className="mt-6 text-neutral-200 text-base md:text-lg leading-relaxed">
              Transparente Mitgliedschaften und flexible Add-ons – optimiere deine Sichtbarkeit auf THEGND.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center bg-pink-500 hover:bg-pink-600 text-white text-xs font-light tracking-widest px-6 py-3 uppercase rounded-none"
              >
                Jetzt registrieren
              </Link>
              <Link
                href="/auth/signin"
                className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white border border-white/30 text-xs font-light tracking-widest px-6 py-3 uppercase rounded-none"
              >
                Anmelden
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tabs: Audience (outer) -> Mitgliedschaften/Add-ons (inner) */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <Tabs tabs={audienceTabs} initialId="escorts" />
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  )
}

import Link from 'next/link'
import { Crown, BadgeCheck, Star, Gift, CreditCard, Calendar, TrendingUp, ShieldCheck, CheckCircle } from 'lucide-react'

export default function MitgliedschaftPreiseTab() {
  return (
    <div className="max-w-7xl">
      <h2 className="text-2xl md:text-3xl font-light tracking-widest text-gray-900 uppercase">MITGLIEDSCHAFT & PREISE</h2>
      <div className="mt-3 w-24 h-px bg-pink-500" />
      <p className="mt-4 text-sm text-gray-600">
        Wähle die passende Mitgliedschaft und buche Add‑ons für mehr Sichtbarkeit. Alle öffentlichen Preise findest
        du auf der Preisseite. Buchungen verwaltest du in deinem Konto.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/preise" className="inline-flex items-center justify-center bg-pink-500 hover:bg-pink-600 text-white text-xs font-light tracking-widest px-6 py-3 uppercase rounded-none">Preise ansehen</Link>
        <Link href="/auth/signup" className="inline-flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-pink-50/40 text-xs font-light tracking-widest px-6 py-3 uppercase rounded-none">Kostenlos registrieren</Link>
      </div>

      <div className="mt-8 space-y-6">
        <section className="border border-gray-200 bg-white p-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Pakete & Inhalte</div>
              <p className="mt-2 text-sm text-gray-700">Transparente Pakete mit klaren Leistungen: Profilfeatures, Medien, Sichtbarkeit und Support. Ein Paket ist immer der Start – Zusätze sind optional.</p>
            </div>
            <div className="md:w-1/2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="border border-gray-200">
                  <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2"><Crown className="h-3.5 w-3.5" /> Basic</div>
                  <div className="p-3 space-y-2 text-[12px] text-gray-700">
                    <div className="h-3 w-24 bg-gray-100" />
                    <div className="h-3 w-28 bg-gray-100" />
                    <div className="h-3 w-20 bg-gray-100" />
                  </div>
                </div>
                <div className="border border-gray-200 ring-1 ring-pink-200 relative">
                  <div className="absolute -top-2 right-2 text-[10px] bg-pink-500 text-white px-2 py-0.5 uppercase tracking-widest">Empfohlen</div>
                  <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2"><BadgeCheck className="h-3.5 w-3.5" /> Pro</div>
                  <div className="p-3 space-y-2 text-[12px] text-gray-700">
                    <div className="h-3 w-28 bg-gray-100" />
                    <div className="h-3 w-32 bg-gray-100" />
                    <div className="h-3 w-24 bg-gray-100" />
                  </div>
                </div>
                <div className="border border-gray-200">
                  <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2"><Star className="h-3.5 w-3.5" /> Plus</div>
                  <div className="p-3 space-y-2 text-[12px] text-gray-700">
                    <div className="h-3 w-24 bg-gray-100" />
                    <div className="h-3 w-28 bg-gray-100" />
                    <div className="h-3 w-20 bg-gray-100" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border border-gray-200 bg-white p-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="border border-gray-200 w-full">
                <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2"><Gift className="h-3.5 w-3.5" /> Add‑ons</div>
                <div className="p-3 flex flex-wrap gap-2 text-[11px] text-gray-700">
                  <span className="px-2 py-1 bg-gray-100">Startseiten‑Banner</span>
                  <span className="px-2 py-1 bg-gray-100">Sponsored Post</span>
                  <span className="px-2 py-1 bg-gray-100">Top‑Listing</span>
                  <span className="px-2 py-1 bg-gray-100">Sidebar‑Tile</span>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Zusätze (Add‑ons)</div>
              <p className="mt-2 text-sm text-gray-700">Buche temporäre Platzierungen für maximale Reichweite – flexibel 7/14/30 Tage. Perfekt für Aktionen, Launches oder saisonale Peaks.</p>
            </div>
          </div>
        </section>

        <section className="border border-gray-200 bg-white p-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Abrechnung & Portal</div>
              <p className="mt-2 text-sm text-gray-700">Bequeme Verwaltung im Portal: Rechnungen herunterladen, Zahlungsmethode ändern, Abos verwalten. Transparent und jederzeit abrufbar.</p>
            </div>
            <div className="md:w-1/2">
              <div className="border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2"><CreditCard className="h-3.5 w-3.5" /> Zahlungsmittel</div>
                <div className="p-3 text-[12px] text-gray-700 space-y-2">
                  <div className="h-3 w-44 bg-gray-100" />
                  <div className="inline-flex items-center gap-2 text-gray-600">
                    <Calendar className="h-3.5 w-3.5" /> Nächste Abbuchung: 01. des Monats
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border border-gray-200 bg-white p-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="border border-gray-200 w-full p-3">
                <div className="flex gap-2">
                  <span className="px-3 py-2 text-[11px] uppercase tracking-widest bg-gray-100 inline-flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5" /> Upgrade</span>
                  <span className="px-3 py-2 text-[11px] uppercase tracking-widest bg-gray-100 inline-flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> Kündigen</span>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Upgrade & Kündigen</div>
              <p className="mt-2 text-sm text-gray-700">Wechsle dein Paket jederzeit oder kündige zum Laufzeitende – direkt im Portal. Änderungen werden sofort im Konto sichtbar.</p>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-start gap-3 border border-gray-200 p-4 hover:border-pink-300 transition-colors transition-shadow transition-transform hover:shadow-md hover:-translate-y-0.5">
          <CheckCircle className="h-4 w-4 text-pink-600 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-gray-700">Transparente Preise & monatliche Pakete</div>
        </div>
        <div className="flex items-start gap-3 border border-gray-200 p-4 hover:border-pink-300 transition-colors transition-shadow transition-transform hover:shadow-md hover:-translate-y-0.5">
          <CheckCircle className="h-4 w-4 text-pink-600 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-gray-700">Add‑ons für schnelle Sichtbarkeit</div>
        </div>
        <div className="flex items-start gap-3 border border-gray-200 p-4 hover:border-pink-300 transition-colors transition-shadow transition-transform hover:shadow-md hover:-translate-y-0.5">
          <CheckCircle className="h-4 w-4 text-pink-600 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-gray-700">Buchungen sicher im Konto verwalten</div>
        </div>
        <div className="flex items-start gap-3 border border-gray-200 p-4 hover:border-pink-300 transition-colors transition-shadow transition-transform hover:shadow-md hover:-translate-y-0.5">
          <CheckCircle className="h-4 w-4 text-pink-600 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-gray-700">Flexibel kündbar, Upgrades jederzeit</div>
        </div>
      </div>
    </div>
  )
}

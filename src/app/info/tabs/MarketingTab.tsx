import Link from 'next/link'
import { Megaphone, LayoutGrid, Image as ImageIcon, TrendingUp } from 'lucide-react'

export default function MarketingTab() {
  return (
    <div className="max-w-7xl">
      <h2 className="text-2xl md:text-3xl font-light tracking-widest text-gray-900 uppercase">MARKETING & PLACEMENTS</h2>
      <div className="mt-3 w-24 h-px bg-pink-500" />
      <p className="mt-4 text-sm text-gray-600">
        Buche Placements wie Startseiten‑Banner, Ergebnislisten‑Top, Sidebar‑Tiles oder Sponsored Posts. Aktive Kampagnen
        werden elegant im Interface integriert und klar gekennzeichnet.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Link href="/marketing" className="inline-flex items-center justify-center bg-pink-500 hover:bg-pink-600 text-white text-xs font-light tracking-widest px-6 py-3 uppercase rounded-none">
          <Megaphone className="h-4 w-4 mr-2" /> Marketing öffnen
        </Link>
        <Link href="/marketing?tab=richtlinien" className="inline-flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-pink-50/40 text-xs font-light tracking-widest px-6 py-3 uppercase rounded-none">
          Richtlinien
        </Link>
      </div>

      <div className="mt-8 space-y-6">
        <section className="border border-gray-200 bg-white p-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Startseiten‑Banner</div>
              <p className="mt-2 text-sm text-gray-700">Prominent platzierter Banner auf der Startseite – ideal für Launches und Aktionen. Markant, sichtbar und im hellen Design integriert.</p>
            </div>
            <div className="md:w-1/2">
              <div className="border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2"><LayoutGrid className="h-3.5 w-3.5" /> Banner</div>
                <div className="p-3">
                  <div className="h-20 bg-gray-100" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border border-gray-200 bg-white p-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600">Ergebnisliste</div>
                <div className="divide-y divide-gray-200">
                  <div className="px-3 py-2 bg-pink-50/40 flex items-center justify-between">
                    <div className="h-3 w-44 bg-gray-100" />
                    <span className="text-[10px] uppercase tracking-widest text-pink-600">Top</span>
                  </div>
                  <div className="px-3 py-2 flex items-center justify-between">
                    <div className="h-3 w-36 bg-gray-100" />
                    <div className="h-3 w-16 bg-gray-100" />
                  </div>
                  <div className="px-3 py-2 flex items-center justify-between">
                    <div className="h-3 w-40 bg-gray-100" />
                    <div className="h-3 w-12 bg-gray-100" />
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Ergebnislisten‑Top</div>
              <p className="mt-2 text-sm text-gray-700">Deine Platzierung wird ganz oben in den Suchergebnissen hervorgehoben – mehr Sichtbarkeit genau dort, wo Nutzer filtern.</p>
            </div>
          </div>
        </section>

        <section className="border border-gray-200 bg-white p-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Sponsored Post</div>
              <p className="mt-2 text-sm text-gray-700">Ein nativer Beitrag im Feed, klar gekennzeichnet, mit Bild und kurzer Copy. Erweitert organische Reichweite auf elegante Weise.</p>
            </div>
            <div className="md:w-1/2">
              <div className="border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2"><ImageIcon className="h-3.5 w-3.5" /> Post <span className="ml-2 text-pink-600">Sponsored</span></div>
                <div className="p-3 space-y-2">
                  <div className="h-20 bg-gray-100" />
                  <div className="h-3 w-3/5 bg-gray-100" />
                  <div className="h-3 w-2/5 bg-gray-100" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border border-gray-200 bg-white p-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600">Sidebar</div>
                <div className="p-3 flex gap-3">
                  <div className="w-28 h-20 bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/5 bg-gray-100" />
                    <div className="h-3 w-2/5 bg-gray-100" />
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Sidebar‑Tile</div>
              <p className="mt-2 text-sm text-gray-700">Eine kompakte Kachel in der Seitenleiste, immer sichtbar beim Scrollen – ideal für permanente Awareness.</p>
            </div>
          </div>
        </section>

        <section className="border border-gray-200 bg-white p-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Laufzeiten & Buchung</div>
              <p className="mt-2 text-sm text-gray-700">Flexible Dauer: 7/14/30 Tage. Buchungen werden im Konto verwaltet und sind jederzeit nachvollziehbar.</p>
            </div>
            <div className="md:w-1/2">
              <div className="border border-gray-200 p-3">
                <div className="flex gap-2 text-[11px] text-gray-700">
                  <span className="px-3 py-1 bg-gray-100">7 Tage</span>
                  <span className="px-3 py-1 bg-gray-100">14 Tage</span>
                  <span className="px-3 py-1 bg-gray-100">30 Tage</span>
                </div>
                <div className="mt-3 text-right">
                  <Link href="/marketing" className="inline-flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-pink-50/40 text-[11px] font-light tracking-widest px-4 py-2 uppercase rounded-none">Buchen</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border border-gray-200 bg-white p-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Analytics & Reichweite</div>
              <p className="mt-2 text-sm text-gray-700">Sieh Impressionen, Klicks und Verlauf. Vergleiche Kampagnen und optimiere deine Sichtbarkeit.</p>
            </div>
            <div className="md:w-1/2">
              <div className="border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5" /> Analytics</div>
                <div className="p-3 space-y-2">
                  <div className="h-16 bg-gray-100" />
                  <div className="h-3 w-3/5 bg-gray-100" />
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-widest text-gray-600">
                    <span className="px-2 py-0.5 bg-gray-100">Impressions</span>
                    <span className="px-2 py-0.5 bg-gray-100">Klicks</span>
                    <span className="px-2 py-0.5 bg-gray-100">CTR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { Search, SlidersHorizontal, MapPin, Tag, Euro, ArrowUpDown, Bookmark, Compass } from 'lucide-react'

export default function SuchenEntdeckenTab() {
  return (
    <div className="max-w-7xl">
      <h2 className="text-2xl md:text-3xl font-light tracking-widest text-gray-900 uppercase">SUCHE & ENTDECKEN</h2>
      <div className="mt-3 w-24 h-px bg-pink-500" />
      <p className="mt-4 text-sm text-gray-600">
        Finde schnell das Passende: Nutze Filter, Standorte, Kategorien und sortiere die Ergebnisse.
        Speichere Suchen oder folge Profilen, um Updates zu sehen.
      </p>

      {/* CTAs */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Link href="/search" aria-label="Jetzt suchen" className="inline-flex items-center justify-center bg-pink-500 hover:bg-pink-600 text-white text-xs font-light tracking-widest px-6 py-3 uppercase rounded-none">
          <Search className="h-4 w-4 mr-2" /> Jetzt suchen
        </Link>
        <Link href="/search" aria-label="Alle Filter ansehen" className="inline-flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-pink-50/40 text-xs font-light tracking-widest px-6 py-3 uppercase rounded-none">
          <SlidersHorizontal className="h-4 w-4 mr-2" /> Alle Filter
        </Link>
      </div>

      {/* Mini-Filterleiste (Visualisierung) */}
      <div className="mt-6 border border-gray-200 bg-white p-4">
        <div className="text-[11px] uppercase tracking-widest text-gray-900">Filterleiste (Beispiel)</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 rounded-none">
            <MapPin className="h-3.5 w-3.5 text-pink-600" aria-hidden="true" /> Standort: Berlin
          </div>
          <div className="inline-flex items-center gap-2 border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 rounded-none">
            <Tag className="h-3.5 w-3.5 text-pink-600" aria-hidden="true" /> Services
          </div>
          <div className="inline-flex items-center gap-2 border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 rounded-none">
            <Euro className="h-3.5 w-3.5 text-pink-600" aria-hidden="true" /> Preis
          </div>
          <div className="inline-flex items-center gap-2 border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 rounded-none">
            <ArrowUpDown className="h-3.5 w-3.5 text-pink-600" aria-hidden="true" /> Sortierung: Neu
          </div>
        </div>
      </div>

      {/* Feature grid */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="border border-gray-200 hover:border-pink-300 transition-colors transition-shadow hover:shadow-md p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-pink-50 text-pink-600">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Filter & Sortierung</div>
              <div className="text-[12px] text-gray-600 leading-tight">Kombiniere Attribute, sortiere Ergebnisse.</div>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 hover:border-pink-300 transition-colors transition-shadow hover:shadow-md p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-pink-50 text-pink-600">
              <MapPin className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Standorte & Umkreis</div>
              <div className="text-[12px] text-gray-600 leading-tight">Städte, Bezirke, Karte.</div>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 hover:border-pink-300 transition-colors transition-shadow hover:shadow-md p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-pink-50 text-pink-600">
              <Bookmark className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Favoriten & Merken</div>
              <div className="text-[12px] text-gray-600 leading-tight">Profile speichern für später.</div>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 hover:border-pink-300 transition-colors transition-shadow hover:shadow-md p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-pink-50 text-pink-600">
              <Compass className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Kategorien & Entdecken</div>
              <div className="text-[12px] text-gray-600 leading-tight">Inspiration nach Themen.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wie funktioniert's? */}
      <div className="mt-8 border border-gray-200 p-6">
        <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Wie funktioniert's?</div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <span className="h-6 w-6 bg-pink-500 text-white text-[11px] leading-none flex items-center justify-center">1</span>
            <div className="text-sm text-gray-700">Filter wählen (z. B. Services, Preis) & Standort setzen</div>
          </div>
          <div className="flex items-start gap-3">
            <span className="h-6 w-6 bg-pink-500 text-white text-[11px] leading-none flex items-center justify-center">2</span>
            <div className="text-sm text-gray-700">Sortieren nach Relevanz, Neu oder Beliebt</div>
          </div>
          <div className="flex items-start gap-3">
            <span className="h-6 w-6 bg-pink-500 text-white text-[11px] leading-none flex items-center justify-center">3</span>
            <div className="text-sm text-gray-700">Suche speichern oder Profilen folgen – Updates im Feed</div>
          </div>
        </div>
      </div>
      <div className="mt-6 border border-gray-200 bg-white p-4 flex items-start gap-3">
        <Search className="h-4 w-4 text-pink-600 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-gray-700">Tipp: Kombiniere mehrere Filter (z. B. Stadt + Services) und speichere deine Suche für später.</p>
      </div>
      <div className="mt-4 border border-gray-200 bg-white p-4 flex items-start gap-3">
        <Bookmark className="h-4 w-4 text-pink-600 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-gray-700">Gespeicherte Suchen und Favoriten findest du in deinem Konto. Folge Profilen, um neue Beiträge im Newsfeed zu sehen.</p>
      </div>
      <ul className="mt-6 text-sm text-gray-700 space-y-2 list-disc ml-5">
        <li className="flex items-center gap-3">Globale Suche:
          <Link href="/search" className="inline-flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-pink-50/40 text-[11px] font-light tracking-widest px-4 py-2 uppercase rounded-none">SUCHEN</Link>
        </li>
        <li>Entdecken‑Navigation mit Kategorien, Stories & Newsfeed</li>
        <li>Stadt‑/Standortbasierte Listen</li>
      </ul>
    </div>
  )
}

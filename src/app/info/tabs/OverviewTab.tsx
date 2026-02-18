import Link from 'next/link'
import { Search, Camera, MessageCircle, Megaphone, CheckCircle } from 'lucide-react'

export default function OverviewTab() {
  return (
    <div className="max-w-7xl">
      <h2 className="text-2xl md:text-3xl font-light tracking-widest text-gray-900 uppercase">WAS IST THEGND?</h2>
      <div className="mt-3 w-24 h-px bg-pink-500" />
      <p className="mt-4 text-sm text-gray-600">
        THEGND ist die moderne Plattform, um Escorts, Agenturen, Clubs und Studios zu entdecken – mit
        einem eleganten professionellen Design, klaren Strukturen und starken Community‑Funktionen. Du kannst Profile
        durchsuchen, Story‑Inhalte ansehen, im Newsfeed interagieren, im Forum diskutieren und alles bequem
        in deinem Konto verwalten.
      </p>
      <p className="mt-3 text-sm text-gray-600">
        Unser Anspruch: eine hochwertige, sichere und schnelle User‑Experience – auf Desktop wie mobil. THEGND
        vereint Inspiration, Information und Interaktion in einem cleanen Interface, das professionelle Anbieterinnen
        ebenso unterstützt wie Besucher, die gezielt suchen oder einfach stöbern möchten.
      </p>
      <p className="mt-3 text-sm text-gray-600">
        Für Anbieter bietet THEGND einen klar strukturierten Einrichtungs‑Prozess, performante Profil‑Darstellungen,
        flexible Medienmodule und wirkungsvolle Marketing‑Placements. Besucher profitieren von präzisen Filtern,
        Standorten, Favoriten, Newsfeed & Stories sowie einer aktiven Community im Forum.
      </p>
      <p className="mt-3 text-sm text-gray-600">
        Unsere Prinzipien: Diskretion, Klarheit, Performance, Sicherheit. Wir setzen auf durchdachte Typografie, ruhige Flächen
        und eine reduzierte Farbführung mit markanten Akzenten – für ein elegantes Gesamtbild und maximale
        Lesbarkeit.
      </p>
      <p className="mt-3 text-sm text-gray-600">
        THEGND vereint drei Kernbereiche: präzise Suche mit smarten Filtern, ausdrucksstarke Profile mit Medien‑Galerien
        sowie Community‑Features (Newsfeed, Stories, Forum). Für Anbieter ergänzen Marketing‑Placements und klare
        Analytics die Sichtbarkeit – alles zentral im Konto steuerbar.
      </p>
      <p className="mt-3 text-sm text-gray-600">
        Technisch setzen wir auf eine moderne, schnelle Web‑Architektur mit responsivem Design und SEO‑Best‑Practices.
        Sicherheit, Moderation und Datenschutz haben hohe Priorität – für Vertrauen auf beiden Seiten.
      </p>

      <p className="mt-3 text-sm text-gray-600">
        Typische Anwendungsfälle: gezielte Suche nach Profilen in einer Stadt, Vergleiche von Leistungen & Preisen,
        Inspiration durch Stories, aktiver Austausch im Forum, sowie das Steigern der Sichtbarkeit über Placements
        – alles zentral, fokussiert und effizient.
      </p>

      {/* Warum THEGND? */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="border border-gray-200 p-4 flex items-start gap-3">
          <CheckCircle className="h-4 w-4 text-pink-600 mt-0.5" aria-hidden="true" />
          <div>
            <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Elegantes Design</div>
            <div className="text-[12px] text-gray-600 leading-tight">Klare Strukturen, ruhige Flächen, markante Akzente.</div>
          </div>
        </div>
        <div className="border border-gray-200 p-4 flex items-start gap-3">
          <CheckCircle className="h-4 w-4 text-pink-600 mt-0.5" aria-hidden="true" />
          <div>
            <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Mehr Sichtbarkeit</div>
            <div className="text-[12px] text-gray-600 leading-tight">Starke Profile, Add‑ons & Placements, klare Analytics.</div>
          </div>
        </div>
        <div className="border border-gray-200 p-4 flex items-start gap-3">
          <CheckCircle className="h-4 w-4 text-pink-600 mt-0.5" aria-hidden="true" />
          <div>
            <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Community & Sicherheit</div>
            <div className="text-[12px] text-gray-600 leading-tight">Newsfeed, Stories, Forum – moderiert und datenschutzkonform.</div>
          </div>
        </div>
      </div>

      {/* Highlights */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="border border-gray-200 hover:border-pink-300 transition-colors transition-shadow hover:shadow-md p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-pink-50 text-pink-600">
              <Search className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Suchen & Entdecken</div>
              <div className="text-[12px] text-gray-600 leading-tight">Finde schnell mit Filtern & Orten.</div>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 hover:border-pink-300 transition-colors transition-shadow hover:shadow-md p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-pink-50 text-pink-600">
              <Camera className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Newsfeed & Stories</div>
              <div className="text-[12px] text-gray-600 leading-tight">Aktuelle Posts & visuelle Updates.</div>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 hover:border-pink-300 transition-colors transition-shadow hover:shadow-md p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-pink-50 text-pink-600">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Forum & Community</div>
              <div className="text-[12px] text-gray-600 leading-tight">Diskutieren, helfen, vernetzen.</div>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 hover:border-pink-300 transition-colors transition-shadow hover:shadow-md p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-pink-50 text-pink-600">
              <Megaphone className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Marketing & Placements</div>
              <div className="text-[12px] text-gray-600 leading-tight">Banner, Top‑Listings, Sponsored Posts.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-200 p-6">
          <h3 className="text-sm font-medium tracking-widest text-gray-900 uppercase">Für Besucher</h3>
          <ul className="mt-3 text-sm text-gray-700 space-y-2 list-disc ml-5">
            <li>Suche & Filter, Standorte, Favoriten</li>
            <li>Newsfeed & Stories ansehen</li>
            <li>Forum lesen & teilnehmen</li>
          </ul>
        </div>
        <div className="border border-gray-200 p-6">
          <h3 className="text-sm font-medium tracking-widest text-gray-900 uppercase">Für Anbieter</h3>
          <ul className="mt-3 text-sm text-gray-700 space-y-2 list-disc ml-5">
            <li>Onboarding für Escorts, Agenturen, Clubs und Studios</li>
            <li>Profile, Medien, Services & Standorte verwalten</li>
            <li>Marketing‑Placements buchen</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/escorts" className="text-xs tracking-widest underline underline-offset-4 text-pink-600">ESCORTS</Link>
        <span className="text-gray-400">•</span>
        <Link href="/agency" className="text-xs tracking-widest underline underline-offset-4 text-pink-600">AGENTUREN</Link>
        <span className="text-gray-400">•</span>
        <Link href="/club-studio" className="text-xs tracking-widest underline underline-offset-4 text-pink-600">CLUBS & STUDIOS</Link>
      </div>

      {/* Wie funktioniert's? */}
      <div className="mt-10 border border-gray-200 p-6">
        <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Wie funktioniert's?</div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <span className="h-6 w-6 bg-pink-500 text-white text-[11px] leading-none flex items-center justify-center">1</span>
            <div className="text-sm text-gray-700">Konto erstellen, Profil anlegen</div>
          </div>
          <div className="flex items-start gap-3">
            <span className="h-6 w-6 bg-pink-500 text-white text-[11px] leading-none flex items-center justify-center">2</span>
            <div className="text-sm text-gray-700">Sichtbar werden mit Stories & Newsfeed</div>
          </div>
          <div className="flex items-start gap-3">
            <span className="h-6 w-6 bg-pink-500 text-white text-[11px] leading-none flex items-center justify-center">3</span>
            <div className="text-sm text-gray-700">Reichweite boosten mit Placements</div>
          </div>
        </div>
      </div>
    </div>
  )
}

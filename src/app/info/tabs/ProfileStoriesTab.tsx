import Link from 'next/link'
import { Camera, PlayCircle, Images, LayoutGrid, Heart } from 'lucide-react'

export default function ProfileStoriesTab() {
  return (
    <div className="max-w-7xl">
      <h2 className="text-2xl md:text-3xl font-light tracking-widest text-gray-900 uppercase">PROFILE, NEWSFEED & STORIES</h2>
      <div className="mt-3 w-24 h-px bg-pink-500" />
      <p className="mt-4 text-sm text-gray-600">
        Profilseiten bündeln alles Relevante an einem Ort: Medien‑Galerien, klare Beschreibungen, Leistungen/Preise,
        Standorte und direkte Kontaktmöglichkeiten. Visuelle Elemente stehen klar im Fokus und sind schnell erfassbar.
      </p>
      <p className="mt-3 text-sm text-gray-600">
        Im Newsfeed erscheinen aktuelle Beiträge in chronologischer oder relevanzbasierter Reihenfolge – mit Interaktionen
        wie Likes und Kommentaren. Detailansichten verlinken direkt auf Profile oder Stories.
      </p>
      <p className="mt-3 text-sm text-gray-600">
        Stories sind kurze, visuelle Sequenzen mit Fotos oder Clips und eignen sich perfekt für spontane Updates,
        Vorschau‑Inhalte und Aktionen. Auf Mobilgeräten sind sie bildschirmfüllend und besonders schnell.
      </p>
      <p className="mt-3 text-sm text-gray-600">
        Alle Bereiche sind für mobile Nutzung optimiert: schnelle Ladezeiten, große Touch‑Ziele, klare Typografie und
        ruhige Flächen. So bleiben Inhalte übersichtlich, elegant und jederzeit gut konsumierbar.
      </p>
      {/* CTAs */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Link
          href="/feed"
          aria-label="Zum Newsfeed"
          className="inline-flex items-center justify-center bg-pink-500 hover:bg-pink-600 text-white text-xs font-light tracking-widest px-6 py-3 uppercase rounded-none"
        >
          <Camera className="h-4 w-4 mr-2" /> Zum Newsfeed
        </Link>
        <Link
          href="/stories"
          aria-label="Stories ansehen"
          className="inline-flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-pink-50/40 text-xs font-light tracking-widest px-6 py-3 uppercase rounded-none"
        >
          <PlayCircle className="h-4 w-4 mr-2" /> Stories ansehen
        </Link>
      </div>

      {/* Visualer Platzhalter: Profil + Galerie */}
      <div className="mt-8 border border-gray-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center bg-gray-100 text-gray-400">
            <Images className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Beispiel: Profilansicht</div>
            <div className="text-[12px] text-gray-600 leading-tight">Header, Avatar, Kurzbeschreibung, Galerie‑Grid.</div>
          </div>
        </div>
        <div className="mt-4 border border-gray-200">
          <div className="bg-gray-50 px-3 py-2 flex items-center justify-between text-[11px] text-gray-600 tracking-widest uppercase">
            <span className="inline-flex items-center gap-2"><LayoutGrid className="h-3.5 w-3.5" /> Galerie</span>
            <span className="inline-flex items-center gap-2"><Heart className="h-3.5 w-3.5" /> 124</span>
          </div>
          <div className="p-3 grid grid-cols-3 gap-2">
            <div className="h-20 bg-gray-100" />
            <div className="h-20 bg-gray-100" />
            <div className="h-20 bg-gray-100" />
            <div className="h-20 bg-gray-100" />
            <div className="h-20 bg-gray-100" />
            <div className="h-20 bg-gray-100" />
          </div>
        </div>
      </div>

      {/* Feature grid */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="border border-gray-200 hover:border-pink-300 transition-colors transition-shadow hover:shadow-md p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-pink-50 text-pink-600">
              <Images className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Medien‑Galerie</div>
              <div className="text-[12px] text-gray-600 leading-tight">Fotos, Layout, schnelle Navigation.</div>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 hover:border-pink-300 transition-colors transition-shadow hover:shadow-md p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-pink-50 text-pink-600">
              <Camera className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Newsfeed‑Posts</div>
              <div className="text-[12px] text-gray-600 leading-tight">Aktuelle Beiträge & Interaktionen.</div>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 hover:border-pink-300 transition-colors transition-shadow hover:shadow-md p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-pink-50 text-pink-600">
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Stories</div>
              <div className="text-[12px] text-gray-600 leading-tight">Schnelle, visuelle Updates.</div>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 hover:border-pink-300 transition-colors transition-shadow hover:shadow-md p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-pink-50 text-pink-600">
              <Heart className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Likes & Kommentare</div>
              <div className="text-[12px] text-gray-600 leading-tight">Interaktion & Feedback.</div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/feed" className="text-xs tracking-widest underline underline-offset-4 text-pink-600">NEWSFEED</Link>
        <span className="text-gray-400">•</span>
        <Link href="/stories" className="text-xs tracking-widest underline underline-offset-4 text-pink-600">STORIES</Link>
      </div>
    </div>
  )
}

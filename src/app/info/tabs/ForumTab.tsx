import Link from 'next/link'
import { Hash, MessageCircle, Reply, Users, Search, ShieldCheck, Bell } from 'lucide-react'

export default function ForumTab() {
  return (
    <div className="max-w-7xl">
      <h2 className="text-2xl md:text-3xl font-light tracking-widest text-gray-900 uppercase">FORUM</h2>
      <div className="mt-3 w-24 h-px bg-pink-500" />
      <p className="mt-4 text-sm text-gray-600">
        Die Community diskutiert in Kategorien, Foren und Threads. Erstelle Themen, antworte und tausche dich
        respektvoll aus. Neueste Beiträge siehst du direkt in den Forenlisten.
      </p>
      {/* Feature Sections */}
      <div className="mt-8 space-y-6">
        {/* 1. Kategorien & Forenstruktur (Text links, Bild rechts) */}
        <section className="border border-gray-200 bg-white p-4 hover:border-pink-300 transition-colors transition-shadow transition-transform hover:shadow-md hover:-translate-y-0.5">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Kategorien & Forenstruktur</div>
              <p className="mt-2 text-sm text-gray-700">Klar gegliedert nach Themen: Kategorien, Unterforen und übersichtliche Listen mit neuesten Beiträgen. Schnellzugriff per Navigation.</p>
            </div>
            <div className="md:w-1/2">
              <div className="border border-gray-200 w-full">
                <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2"><Hash className="h-3.5 w-3.5" /> Kategorien</div>
                <div className="divide-y divide-gray-200">
                  <div className="px-3 py-2 flex items-center justify-between">
                    <div className="h-3 w-40 bg-gray-100" />
                    <div className="h-3 w-16 bg-gray-100" />
                  </div>
                  <div className="px-3 py-2 flex items-center justify-between">
                    <div className="h-3 w-48 bg-gray-100" />
                    <div className="h-3 w-12 bg-gray-100" />
                  </div>
                  <div className="px-3 py-2 flex items-center justify-between">
                    <div className="h-3 w-36 bg-gray-100" />
                    <div className="h-3 w-20 bg-gray-100" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Threads & Antworten (Bild links, Text rechts) */}
        <section className="border border-gray-200 bg-white p-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="border border-gray-200 w-full">
                <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5" /> Thread</div>
                <div className="p-3 space-y-2">
                  <div className="h-3 w-3/5 bg-gray-100" />
                  <div className="h-3 w-2/5 bg-gray-100" />
                  <div className="h-3 w-4/5 bg-gray-100" />
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-600">
                    <Reply className="h-3.5 w-3.5" /> Antworten • <Users className="h-3.5 w-3.5" /> Teilnehmer
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Threads & Antworten</div>
              <p className="mt-2 text-sm text-gray-700">Starte Diskussionen, antworte strukturiert und bleibe beim Thema. Zitate, Formatierung und Benachrichtigungen unterstützen die Unterhaltung.</p>
            </div>
          </div>
        </section>

        {/* 3. Erwähnungen & Benachrichtigungen (Text links, Bild rechts) */}
        <section className="border border-gray-200 bg-white p-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Erwähnungen & Benachrichtigungen</div>
              <p className="mt-2 text-sm text-gray-700">Werde erwähnt und erhalte Hinweise bei Antworten oder Reaktionen. So verpasst du keine relevanten Updates.</p>
            </div>
            <div className="md:w-1/2">
              <div className="border border-gray-200 w-full">
                <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2"><Bell className="h-3.5 w-3.5" /> Benachrichtigungen</div>
                <div className="p-3 space-y-2">
                  <div className="h-3 w-4/5 bg-gray-100" />
                  <div className="h-3 w-3/5 bg-gray-100" />
                  <div className="h-3 w-2/5 bg-gray-100" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Suche & Filter (Bild links, Text rechts) */}
        <section className="border border-gray-200 bg-white p-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="border border-gray-200 w-full">
                <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2"><Search className="h-3.5 w-3.5" /> Forumssuche</div>
                <div className="p-3 space-y-2">
                  <div className="h-9 bg-gray-100" />
                  <div className="h-3 w-2/3 bg-gray-100" />
                  <div className="h-3 w-1/2 bg-gray-100" />
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Suche & Filter</div>
              <p className="mt-2 text-sm text-gray-700">Finde schnell passende Themen mit Suchbegriffen und Filtern nach Kategorien, Datum, Relevanz oder Popularität.</p>
            </div>
          </div>
        </section>

        {/* 5. Moderation & Richtlinien (Text links, Bild rechts) */}
        <section className="border border-gray-200 bg-white p-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Moderation & Richtlinien</div>
              <p className="mt-2 text-sm text-gray-700">Klare Regeln und aktive Moderation sorgen für einen respektvollen Umgang. Melde Inhalte bei Verstößen.</p>
            </div>
            <div className="md:w-1/2">
              <div className="border border-gray-200 w-full">
                <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> Richtlinien</div>
                <div className="p-3 space-y-2">
                  <div className="h-3 w-4/5 bg-gray-100" />
                  <div className="h-3 w-2/3 bg-gray-100" />
                  <div className="h-3 w-1/2 bg-gray-100" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div className="mt-8 border border-gray-200 bg-white p-4 flex items-start gap-3">
        <MessageCircle className="h-4 w-4 text-pink-600 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-gray-700"><span className="font-medium">Pro Tipp:</span> Stelle dich im passenden Bereich vor und nutze klare Titel, um schneller Antworten zu erhalten.</p>
      </div>
      <div className="mt-6">
        <Link href="/forum" className="inline-flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-pink-50/40 text-xs font-light tracking-widest px-6 py-3 uppercase rounded-none">
          Zum Forum
        </Link>
      </div>
    </div>
  )
}

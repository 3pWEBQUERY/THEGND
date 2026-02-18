import Link from 'next/link'
import { Search, Settings, CreditCard, Megaphone, ShieldCheck, HelpCircle, MessageCircle, LifeBuoy } from 'lucide-react'

export default function FaqTab() {
  return (
    <div className="max-w-7xl">
      <h2 className="text-2xl md:text-3xl font-light tracking-widest text-gray-900 uppercase">HÄUFIGE FRAGEN</h2>
      <div className="mt-3 w-24 h-px bg-pink-500" />
      <p className="mt-4 text-sm text-gray-600">Hier findest du kompakte Antworten zu Konto, Preisen, Marketing, Sicherheit und Community. Für Details nutze die Links zu den jeweiligen Seiten.</p>

      {/* FAQ Suche */}
      <div className="mt-6 border border-gray-200 bg-white p-4">
        <div className="text-[11px] uppercase tracking-widest text-gray-900">FAQ durchsuchen</div>
        <div className="mt-3 flex items-center gap-2 border border-gray-200 bg-gray-50 px-3 py-2">
          <Search className="h-4 w-4 text-pink-600" aria-hidden="true" />
          <span className="text-xs text-gray-600">Begriffe eingeben (z. B. Preise, Onboarding, Add‑ons)</span>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/preise" className="inline-flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-pink-50/40 text-[11px] tracking-widest px-4 py-2 uppercase rounded-none">Preise</Link>
        <Link href="/marketing" className="inline-flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-pink-50/40 text-[11px] tracking-widest px-4 py-2 uppercase rounded-none">Marketing</Link>
        <Link href="/forum" className="inline-flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-pink-50/40 text-[11px] tracking-widest px-4 py-2 uppercase rounded-none">Forum</Link>
        <Link href="/kontakt" className="inline-flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-pink-50/40 text-[11px] tracking-widest px-4 py-2 uppercase rounded-none">Support</Link>
      </div>

      {/* Kategorien */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="border border-gray-200 p-4 hover:border-pink-300 transition-colors transition-shadow hover:shadow-md">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-pink-50 text-pink-600">
              <Settings className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Account & Onboarding</div>
              <div className="text-[12px] text-gray-600 leading-tight">Konto, Profil, Setup</div>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 p-4 hover:border-pink-300 transition-colors transition-shadow hover:shadow-md">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-pink-50 text-pink-600">
              <CreditCard className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Preise & Mitgliedschaft</div>
              <div className="text-[12px] text-gray-600 leading-tight">Pakete, Add‑ons, Abrechnung</div>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 p-4 hover:border-pink-300 transition-colors transition-shadow hover:shadow-md">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-pink-50 text-pink-600">
              <Megaphone className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Marketing & Placements</div>
              <div className="text-[12px] text-gray-600 leading-tight">Banner, Top, Sponsored</div>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 p-4 hover:border-pink-300 transition-colors transition-shadow hover:shadow-md">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-pink-50 text-pink-600">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Sicherheit & Richtlinien</div>
              <div className="text-[12px] text-gray-600 leading-tight">Datenschutz, Moderation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Q&A Grid */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border border-gray-200 p-4 hover:border-pink-300 transition-colors transition-shadow transition-transform hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-4 w-4 text-pink-600 mt-0.5" aria-hidden="true" />
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900">Wie starte ich?</div>
              <p className="mt-1 text-[12px] text-gray-700">Konto erstellen und Onboarding folgen. Du kannst später alles im Dashboard anpassen.</p>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 p-4 hover:border-pink-300 transition-colors transition-shadow transition-transform hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-start gap-3">
            <CreditCard className="h-4 w-4 text-pink-600 mt-0.5" aria-hidden="true" />
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900">Was kostet THEGND?</div>
              <p className="mt-1 text-[12px] text-gray-700">Öffentliche Preise unter <Link href="/preise" className="text-pink-600 underline underline-offset-4">/preise</Link>. Buchungen verwaltest du im Konto.</p>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 p-4 hover:border-pink-300 transition-colors transition-shadow transition-transform hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-start gap-3">
            <Megaphone className="h-4 w-4 text-pink-600 mt-0.5" aria-hidden="true" />
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900">Wie erhöhe ich meine Sichtbarkeit?</div>
              <p className="mt-1 text-[12px] text-gray-700">Nutze Placements im <Link href="/marketing" className="text-pink-600 underline underline-offset-4">Marketing</Link> und bleibe aktiv im Newsfeed & Stories.</p>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 p-4 hover:border-pink-300 transition-colors transition-shadow transition-transform hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-start gap-3">
            <MessageCircle className="h-4 w-4 text-pink-600 mt-0.5" aria-hidden="true" />
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900">Gibt es eine Community?</div>
              <p className="mt-1 text-[12px] text-gray-700">Ja, im <Link href="/forum" className="text-pink-600 underline underline-offset-4">Forum</Link> diskutierst du mit – respektvoll und themenbasiert.</p>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 p-4 hover:border-pink-300 transition-colors transition-shadow transition-transform hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-4 w-4 text-pink-600 mt-0.5" aria-hidden="true" />
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900">Wie geht ihr mit Sicherheit um?</div>
              <p className="mt-1 text-[12px] text-gray-700">Siehe <Link href="/datenschutz" className="text-pink-600 underline underline-offset-4">Datenschutz</Link> und unsere <Link href="/agb" className="text-pink-600 underline underline-offset-4">AGB</Link>. Moderation und Meldesystem sind aktiv.</p>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 p-4 hover:border-pink-300 transition-colors transition-shadow transition-transform hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-start gap-3">
            <Settings className="h-4 w-4 text-pink-600 mt-0.5" aria-hidden="true" />
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900">Kann ich später alles ändern?</div>
              <p className="mt-1 text-[12px] text-gray-700">Ja, im Dashboard lassen sich Profil, Medien, Services und Buchungen jederzeit anpassen.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Not found */}
      <div className="mt-6 border border-gray-200 bg-white p-4 flex items-start gap-3">
        <LifeBuoy className="h-4 w-4 text-pink-600 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-gray-700">Nicht fündig geworden? Schreibe uns über das <Link href="/kontakt" className="text-pink-600 underline underline-offset-4">Kontaktformular</Link>.</p>
      </div>
    </div>
  )
}

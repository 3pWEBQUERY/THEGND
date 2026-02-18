import Link from 'next/link'
import { FileText, Lock, BadgeCheck, Flag, AlertTriangle, KeyRound, LifeBuoy, Mail, MessageCircle, ShieldCheck } from 'lucide-react'

export default function SicherheitSupportTab() {
  return (
    <div className="max-w-7xl">
      <h2 className="text-2xl md:text-3xl font-light tracking-widest text-gray-900 uppercase">SICHERHEIT & SUPPORT</h2>
      <div className="mt-3 w-24 h-px bg-pink-500" />
      <p className="mt-4 text-sm text-gray-600">
        Wir legen Wert auf Sicherheit, klare Richtlinien und Datenschutz. Melde Inhalte bei Verstößen und lies
        unsere AGB & Datenschutzhinweise.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Link href="/agb" className="inline-flex items-center justify-center bg-pink-500 hover:bg-pink-600 text-white text-xs font-light tracking-widest px-6 py-3 uppercase rounded-none">
          <FileText className="h-4 w-4 mr-2" /> Richtlinien lesen
        </Link>
        <Link href="/datenschutz" className="inline-flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-pink-50/40 text-xs font-light tracking-widest px-6 py-3 uppercase rounded-none">
          Datenschutz
        </Link>
        <Link href="/kontakt" className="inline-flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-pink-50/40 text-xs font-light tracking-widest px-6 py-3 uppercase rounded-none">
          Support
        </Link>
      </div>

      <div className="mt-8 space-y-6">
        <section className="border border-gray-200 bg-white p-4 hover:border-pink-300 transition-colors transition-shadow transition-transform hover:shadow-md hover:-translate-y-0.5">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Richtlinien & Compliance</div>
              <p className="mt-2 text-sm text-gray-700">Transparente Nutzungsbedingungen und klare Community‑Regeln. Verstöße werden konsequent moderiert.</p>
            </div>
            <div className="md:w-1/2">
              <div className="border border-gray-200 w-full">
                <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Richtlinien</div>
                <div className="p-3 space-y-2">
                  <div className="h-3 w-3/5 bg-gray-100" />
                  <div className="h-3 w-2/5 bg-gray-100" />
                  <div className="h-3 w-4/5 bg-gray-100" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border border-gray-200 bg-white p-4 hover:border-pink-300 transition-colors transition-shadow transition-transform hover:shadow-md hover:-translate-y-0.5">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2"><Lock className="h-3.5 w-3.5" /> Datenschutz</div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  <div className="h-10 bg-gray-100" />
                  <div className="h-10 bg-gray-100" />
                  <div className="h-10 bg-gray-100" />
                  <div className="h-10 bg-gray-100" />
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Datenschutz & Privatsphäre</div>
              <p className="mt-2 text-sm text-gray-700">Datensparsamkeit, klare Opt‑ins und Kontrolle über Sichtbarkeit. Wir setzen auf sichere Übertragung und zeitgemäße Speicherung.</p>
            </div>
          </div>
        </section>

        <section className="border border-gray-200 bg-white p-4 hover:border-pink-300 transition-colors transition-shadow transition-transform hover:shadow-md hover:-translate-y-0.5">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Verifizierung & Vertrauen</div>
              <p className="mt-2 text-sm text-gray-700">Optionale Verifizierung schafft Vertrauen. Kennzeichnung direkt am Profil.</p>
            </div>
            <div className="md:w-1/2">
              <div className="border border-gray-200 w-full">
                <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2"><BadgeCheck className="h-3.5 w-3.5" /> Verifiziert</div>
                <div className="p-3 flex items-center gap-2">
                  <div className="h-8 w-8 bg-gray-100" />
                  <div className="h-3 w-32 bg-gray-100" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border border-gray-200 bg-white p-4 hover:border-pink-300 transition-colors transition-shadow transition-transform hover:shadow-md hover:-translate-y-0.5">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="border border-gray-200 w-full">
                <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2"><Flag className="h-3.5 w-3.5" /> Melden</div>
                <div className="divide-y divide-gray-200">
                  <div className="px-3 py-2 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-pink-600" />
                    <div className="h-3 w-40 bg-gray-100" />
                  </div>
                  <div className="px-3 py-2 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-pink-600" />
                    <div className="h-3 w-28 bg-gray-100" />
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Meldungen & Moderation</div>
              <p className="mt-2 text-sm text-gray-700">Einfaches Melden von Inhalten. Unser Team prüft klar definiert und informiert bei Maßnahmen.</p>
            </div>
          </div>
        </section>

        <section className="border border-gray-200 bg-white p-4 hover:border-pink-300 transition-colors transition-shadow transition-transform hover:shadow-md hover:-translate-y-0.5">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Sicherheit des Kontos</div>
              <p className="mt-2 text-sm text-gray-700">Starke Passwörter, Sitzungsverwaltung, optional 2‑Faktor‑Authentifizierung.</p>
            </div>
            <div className="md:w-1/2">
              <div className="border border-gray-200 p-3">
                <div className="text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2"><KeyRound className="h-3.5 w-3.5" /> 2FA</div>
                <div className="mt-2 flex gap-2 text-[11px] text-gray-700">
                  <span className="px-2 py-1 bg-gray-100">E‑Mail</span>
                  <span className="px-2 py-1 bg-gray-100">App</span>
                  <span className="px-2 py-1 bg-gray-100">Backup‑Codes</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border border-gray-200 bg-white p-4 hover:border-pink-300 transition-colors transition-shadow transition-transform hover:shadow-md hover:-translate-y-0.5">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="border border-gray-200 w-full">
                <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2"><LifeBuoy className="h-3.5 w-3.5" /> Hilfe</div>
                <div className="p-3 space-y-2 text-[12px] text-gray-700">
                  <div className="inline-flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> E‑Mail</div>
                  <div className="inline-flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5" /> Kontaktformular</div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Support & Hilfe</div>
              <p className="mt-2 text-sm text-gray-700">Schneller Kontakt über E‑Mail oder Formular. Wir antworten so schnell wie möglich.</p>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-8 border border-gray-200 bg-white p-4 flex items-start gap-3">
        <ShieldCheck className="h-4 w-4 text-pink-600 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-gray-700">Wir schützen Daten nach aktuellem Standard und sorgen für transparente Community‑Richtlinien.</p>
      </div>
      <ul className="mt-6 text-sm text-gray-700 space-y-2 list-disc ml-5">
        <li><Link href="/agb" className="text-pink-600 underline underline-offset-4">AGB</Link> &nbsp;·&nbsp; <Link href="/datenschutz" className="text-pink-600 underline underline-offset-4">Datenschutz</Link></li>
        <li>Transparente Richtlinien & Community‑Standards</li>
        <li>Support über das Konto bzw. Kontaktseiten</li>
      </ul>
    </div>
  )
}

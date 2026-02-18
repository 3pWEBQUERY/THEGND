import Link from 'next/link'
import { LogIn, UserPlus, Settings, Image as ImageIcon, MapPin, ClipboardList } from 'lucide-react'

export default function KontenOnboardingTab() {
  return (
    <div className="max-w-7xl">
      <h2 className="text-2xl md:text-3xl font-light tracking-widest text-gray-900 uppercase">KONTEN & ONBOARDING</h2>
      <div className="mt-3 w-24 h-px bg-pink-500" />
      <p className="mt-4 text-sm text-gray-600">
        Lege ein Konto an und starte das Onboarding passend zu deinem Typ: Escort, Agentur, Club oder Studio.
        Die Schritte sind klar gegliedert (Profil, Medien, Services, Kontakt, Standort u. a.) und können später
        im Edit‑Modus angepasst werden.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Link href="/auth/signin" aria-label="Jetzt anmelden" className="inline-flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-pink-50/40 text-xs font-light tracking-widest px-6 py-3 uppercase rounded-none">
          <LogIn className="h-4 w-4 mr-2" /> Anmelden
        </Link>
        <Link href="/auth/signup" aria-label="Kostenlos registrieren" className="inline-flex items-center justify-center bg-pink-500 hover:bg-pink-600 text-white text-xs font-light tracking-widest px-6 py-3 uppercase rounded-none">
          <UserPlus className="h-4 w-4 mr-2" /> Registrieren
        </Link>
      </div>
      <p className="mt-2 text-[11px] text-gray-500">
        Mit der Registrierung stimmst du unseren <Link href="/agb" className="underline underline-offset-4 hover:text-pink-600">AGB</Link> und der{' '}
        <Link href="/datenschutz" className="underline underline-offset-4 hover:text-pink-600">Datenschutzerklärung</Link> zu.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="border border-gray-200 hover:border-pink-300 transition-colors transition-shadow hover:shadow-md p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-pink-50 text-pink-600">
              <UserPlus className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Konto erstellen</div>
              <div className="text-[12px] text-gray-600 leading-tight">Schnell starten, E‑Mail verifizieren.</div>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 hover:border-pink-300 transition-colors p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-pink-50 text-pink-600">
              <Settings className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Profil & Einstellungen</div>
              <div className="text-[12px] text-gray-600 leading-tight">Daten, Services, Kontakt, Socials.</div>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 hover:border-pink-300 transition-colors transition-shadow hover:shadow-md p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-pink-50 text-pink-600">
              <ImageIcon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Medien & Galerie</div>
              <div className="text-[12px] text-gray-600 leading-tight">Logo, Fotos, optional Videos.</div>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 hover:border-pink-300 transition-colors p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-pink-50 text-pink-600">
              <MapPin className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gray-900 leading-tight">Standort & Karte</div>
              <div className="text-[12px] text-gray-600 leading-tight">Google Autocomplete & Map‑Pin.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 border border-gray-200 bg-white p-4 flex items-start gap-3">
        <ClipboardList className="h-4 w-4 text-pink-600 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-gray-700">Alle Schritte sind später im <span className="font-medium">Edit‑Modus</span> anpassbar. Du kannst zwischendurch speichern und fortfahren.</p>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-start gap-3">
          <span className="h-6 w-6 bg-pink-500 text-white text-[11px] leading-none flex items-center justify-center">1</span>
          <div className="text-sm text-gray-700">Registrieren oder anmelden</div>
        </div>
        <div className="flex items-start gap-3">
          <span className="h-6 w-6 bg-pink-500 text-white text-[11px] leading-none flex items-center justify-center">2</span>
          <div className="text-sm text-gray-700">Profil, Medien, Services, Kontakt ergänzen</div>
        </div>
        <div className="flex items-start gap-3">
          <span className="h-6 w-6 bg-pink-500 text-white text-[11px] leading-none flex items-center justify-center">3</span>
          <div className="text-sm text-gray-700">Sichtbar werden – optional mit Placements</div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <section>
          <h3 className="text-sm font-medium tracking-widest text-gray-900 uppercase">Account</h3>
          <ul className="mt-2 text-sm text-gray-700 space-y-2 list-disc ml-5">
            <li>Registrieren unter <Link href="/auth/signup" className="text-pink-600 underline underline-offset-4">/auth/signup</Link></li>
            <li>Anmelden unter <Link href="/auth/signin" className="text-pink-600 underline underline-offset-4">/auth/signin</Link></li>
            <li>Dashboard & Profilverwaltung im eingeloggten Bereich</li>
          </ul>
        </section>
        <section>
          <h3 className="text-sm font-medium tracking-widest text-gray-900 uppercase">Onboarding</h3>
          <ul className="mt-2 text-sm text-gray-700 space-y-2 list-disc ml-5">
            <li>Schritt‑für‑Schritt Erfassung von Stammdaten</li>
            <li>Medienupload (Logo, Galerie), Services, Socials</li>
            <li>Standort mit Google Maps Autocomplete & Karte</li>
          </ul>
        </section>
      </div>
    </div>
  )
}

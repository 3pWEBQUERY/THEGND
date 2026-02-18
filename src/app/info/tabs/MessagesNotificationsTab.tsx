import Link from 'next/link'
import { MessageCircle, Bell, Inbox, Paperclip, Smile, Send, Check, CheckCheck, Search } from 'lucide-react'

export default function MessagesNotificationsTab() {
  return (
    <div className="max-w-7xl">
      <h2 className="text-2xl md:text-3xl font-light tracking-widest text-gray-900 uppercase">NACHRICHTEN & BENACHRICHTIGUNGEN</h2>
      <div className="mt-3 w-24 h-px bg-pink-500" />
      <p className="mt-4 text-sm text-gray-600">
        Bleibe auf dem Laufenden: Erhalte Benachrichtigungen zu Antworten, Follows oder System‑Hinweisen und
        nutze die Nachrichtenfunktionen, um direkt zu kommunizieren.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Link href="/messages" aria-label="Nachrichten öffnen" className="inline-flex items-center justify-center bg-pink-500 hover:bg-pink-600 text-white text-xs font-light tracking-widest px-6 py-3 uppercase rounded-none">
          <MessageCircle className="h-4 w-4 mr-2" /> Nachrichten öffnen
        </Link>
        <Link href="/notifications" aria-label="Benachrichtigungen ansehen" className="inline-flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-pink-50/40 text-xs font-light tracking-widest px-6 py-3 uppercase rounded-none">
          <Bell className="h-4 w-4 mr-2" /> Benachrichtigungen
        </Link>
      </div>

      <div className="mt-8 space-y-6">
        <section className="border border-gray-200 bg-white p-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Inbox & Übersicht</div>
              <p className="mt-2 text-sm text-gray-700">Alle Unterhaltungen auf einen Blick mit Lesestatus, Zeitstempel und Vorschau. Unread‑Badges helfen, Wichtiges zu priorisieren.</p>
            </div>
            <div className="md:w-1/2">
              <div className="border border-gray-200 w-full">
                <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2"><Inbox className="h-3.5 w-3.5" /> Inbox</div>
                <div className="divide-y divide-gray-200">
                  <div className="px-3 py-2 flex items-center justify-between">
                    <div className="h-3 w-40 bg-gray-100" />
                    <span className="h-2 w-2 bg-pink-500 rounded-full" />
                  </div>
                  <div className="px-3 py-2 flex items-center justify-between">
                    <div className="h-3 w-48 bg-gray-100" />
                    <div className="h-3 w-12 bg-gray-100" />
                  </div>
                  <div className="px-3 py-2 flex items-center justify-between">
                    <div className="h-3 w-36 bg-gray-100" />
                    <div className="h-3 w-16 bg-gray-100" />
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
                <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5" /> Chat</div>
                <div className="p-3 space-y-2">
                  <div className="max-w-[65%] h-4 bg-gray-100" />
                  <div className="ml-auto max-w-[55%] h-4 bg-gray-200" />
                  <div className="max-w-[70%] h-4 bg-gray-100" />
                  <div className="ml-auto max-w-[50%] h-4 bg-gray-200" />
                </div>
                <div className="border-t border-gray-200 px-3 py-2 flex items-center justify-between text-[11px] text-gray-600">
                  <div className="inline-flex items-center gap-3">
                    <Paperclip className="h-3.5 w-3.5" />
                    <Smile className="h-3.5 w-3.5" />
                  </div>
                  <div className="inline-flex items-center gap-2 uppercase tracking-widest">
                    <Send className="h-3.5 w-3.5" /> Senden
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Thread‑Ansicht & Composer</div>
              <p className="mt-2 text-sm text-gray-700">Dialoge in klaren Bubbles, schnelle Eingabe mit Emoji‑Picker und Datei‑Upload. Alles fokussiert und leichtgewichtig.</p>
            </div>
          </div>
        </section>

        <section className="border border-gray-200 bg-white p-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Benachrichtigungen</div>
              <p className="mt-2 text-sm text-gray-700">Hinweise zu neuen Nachrichten, Antworten und System‑Events landen zentral und übersichtlich in deiner Glocke.</p>
            </div>
            <div className="md:w-1/2">
              <div className="border border-gray-200 w-full">
                <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2"><Bell className="h-3.5 w-3.5" /> Center</div>
                <div className="p-3 space-y-2">
                  <div className="h-3 w-4/5 bg-gray-100" />
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
              <div className="border border-gray-200 w-full">
                <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2">Status</div>
                <div className="p-3 space-y-2 text-[11px] text-gray-700">
                  <div className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5" /> Gesendet</div>
                  <div className="inline-flex items-center gap-2"><CheckCheck className="h-3.5 w-3.5" /> Gelesen</div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Lesestatus</div>
              <p className="mt-2 text-sm text-gray-700">Transparente Zustellung mit Sende‑ und Lese‑Status. Sieh schnell, ob eine Nachricht angekommen ist.</p>
            </div>
          </div>
        </section>

        <section className="border border-gray-200 bg-white p-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2">
              <div className="text-sm font-medium tracking-widest text-gray-900 uppercase">Suche & Filter</div>
              <p className="mt-2 text-sm text-gray-700">Finde Konversationen nach Namen, Stichworten oder Zeitraum. Filtere nach ungelesen oder markiert.</p>
            </div>
            <div className="md:w-1/2">
              <div className="border border-gray-200 w-full">
                <div className="bg-gray-50 px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 inline-flex items-center gap-2"><Search className="h-3.5 w-3.5" /> Nachrichtensuche</div>
                <div className="p-3 space-y-2">
                  <div className="h-9 bg-gray-100" />
                  <div className="flex gap-2">
                    <div className="h-6 w-24 bg-gray-100" />
                    <div className="h-6 w-24 bg-gray-100" />
                    <div className="h-6 w-24 bg-gray-100" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <ul className="mt-6 text-sm text-gray-700 space-y-2 list-disc ml-5">
        <li>Glocke im Header für schnelle Übersicht</li>
        <li>Lesestatus und Zeitstempel</li>
        <li>Direkte Navigation zu Details</li>
      </ul>
    </div>
  )
}

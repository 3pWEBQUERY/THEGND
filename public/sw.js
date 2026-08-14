/*
 * Service Worker von THEGND.
 *
 * Aufgaben, bewusst knapp gehalten:
 *   1. Die App startet auch ohne Netz — mit einer eigenen Offline-Seite
 *      statt der Fehlerseite des Browsers.
 *   2. Statische Bausteine und Bilder kommen beim zweiten Mal aus dem
 *      Zwischenspeicher, das spart Ladezeit und Datenvolumen.
 *
 * Was hier bewusst NICHT passiert: persönliche Seiten zwischenspeichern.
 * Dashboard, Verwaltung und alle Schnittstellen laufen immer über das Netz —
 * auf geteilten Geräten hätte sonst der nächste Blick auf fremde Daten.
 */

const VERSION = "v1";
const SEITEN = `thegnd-seiten-${VERSION}`;
const STATISCH = `thegnd-statisch-${VERSION}`;
const BILDER = `thegnd-bilder-${VERSION}`;
const UNSERE = [SEITEN, STATISCH, BILDER];

// Absolut, damit der Abgleich im Zwischenspeicher unabhängig vom Aufrufpfad trifft.
const OFFLINE = new URL("/offline", self.location.origin).href;
/** Im Entwicklungsbetrieb nichts Gebautes zwischenspeichern — sonst hängt man an alten Bündeln. */
const ENTWICKLUNG = new URL(self.location.href).searchParams.get("modus") === "dev";

/** Persönliche Bereiche: nie zwischenspeichern. */
const PRIVAT = [/^\/dashboard/, /^\/admin/, /^\/api\//, /^\/login/, /^\/registrieren/, /^\/reset-password/];

/** Wie viele Bilder wir höchstens behalten. */
const BILDER_MAX = 80;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SEITEN)
      .then((speicher) => speicher.addAll([OFFLINE]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((namen) => Promise.all(namen.filter((name) => !UNSERE.includes(name)).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "uebernehmen") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const anfrage = event.request;
  if (anfrage.method !== "GET") return;

  const url = new URL(anfrage.url);
  if (url.origin !== self.location.origin) return;
  if (PRIVAT.some((muster) => muster.test(url.pathname))) return;

  // Seitenaufrufe: erst das Netz, sonst das zuletzt Gesehene, sonst offline.
  if (anfrage.mode === "navigate") {
    event.respondWith(seiteHolen(anfrage));
    return;
  }

  // Gebaute Dateien tragen einen Fingerabdruck im Namen und ändern sich nie.
  if (!ENTWICKLUNG && (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/flags/"))) {
    event.respondWith(zuerstSpeicher(anfrage, STATISCH));
    return;
  }

  // Bilder: sofort aus dem Speicher zeigen, im Hintergrund auffrischen.
  if (
    url.pathname.startsWith("/media/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/_next/image")
  ) {
    event.respondWith(sofortUndAuffrischen(anfrage, BILDER));
  }
});

/** Seitenaufruf: Netz zuerst, damit Inhalte aktuell bleiben. */
async function seiteHolen(anfrage) {
  const speicher = await caches.open(SEITEN);
  try {
    const antwort = await fetch(anfrage);
    if (antwort.ok && !ENTWICKLUNG) speicher.put(anfrage, antwort.clone());
    return antwort;
  } catch {
    return (await speicher.match(anfrage)) ?? (await speicher.match(OFFLINE)) ?? Response.error();
  }
}

async function zuerstSpeicher(anfrage, name) {
  const speicher = await caches.open(name);
  const bekannt = await speicher.match(anfrage);
  if (bekannt) return bekannt;

  const antwort = await fetch(anfrage);
  if (antwort.ok) speicher.put(anfrage, antwort.clone());
  return antwort;
}

async function sofortUndAuffrischen(anfrage, name) {
  const speicher = await caches.open(name);
  const bekannt = await speicher.match(anfrage);

  const frisch = fetch(anfrage)
    .then((antwort) => {
      if (antwort.ok) {
        speicher.put(anfrage, antwort.clone());
        void aufraeumen(name, BILDER_MAX);
      }
      return antwort;
    })
    .catch(() => bekannt ?? Response.error());

  return bekannt ?? frisch;
}

/** Ältestes zuerst entfernen, damit der Speicher nicht unbegrenzt wächst. */
async function aufraeumen(name, hoechstens) {
  const speicher = await caches.open(name);
  const schluessel = await speicher.keys();
  if (schluessel.length <= hoechstens) return;
  await Promise.all(schluessel.slice(0, schluessel.length - hoechstens).map((k) => speicher.delete(k)));
}

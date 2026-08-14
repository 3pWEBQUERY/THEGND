"use client";

import * as React from "react";
import { CloudOff, Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Installierbarkeit und Offline-Betrieb.
 *
 * Zwei Dinge in einem Baustein, weil sie zusammengehören: der Service Worker
 * wird angemeldet, und wer die App installieren kann, bekommt ein dezentes
 * Angebot dazu. Beides läuft still im Hintergrund, bis der Browser wirklich
 * bereit ist — ungefragte Aufforderungen gibt es nicht.
 */

const ABGELEHNT = "thegnd:install-abgelehnt";
/** Nach einem Nein vier Wochen Ruhe. */
const RUHE_MS = 28 * 24 * 60 * 60 * 1000;

type InstallEreignis = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function PwaProvider() {
  const [angebot, setAngebot] = React.useState<InstallEreignis | null>(null);
  const [iosHinweis, setIosHinweis] = React.useState(false);
  const [laeuft, setLaeuft] = React.useState(false);

  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Im Entwicklungsbetrieb ohne Zwischenspeicher für gebaute Dateien —
    // sonst zeigt der Browser nach jeder Änderung noch das alte Bündel.
    const adresse = process.env.NODE_ENV === "production" ? "/sw.js" : "/sw.js?modus=dev";
    const anmelden = () => navigator.serviceWorker.register(adresse).catch(() => undefined);

    if (document.readyState === "complete") void anmelden();
    else {
      window.addEventListener("load", anmelden, { once: true });
      return () => window.removeEventListener("load", anmelden);
    }
  }, []);

  React.useEffect(() => {
    const schonInstalliert =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (schonInstalliert) return;

    const gesperrtBis = Number(localStorage.getItem(ABGELEHNT) ?? 0);
    if (gesperrtBis > Date.now()) return;

    const merken = (event: Event) => {
      // Ohne das übernimmt Chrome mit einem eigenen Balken.
      event.preventDefault();
      setAngebot(event as InstallEreignis);
    };
    window.addEventListener("beforeinstallprompt", merken);

    // Safari kennt kein Installationsereignis — dort hilft nur die Anleitung.
    const istIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (istIos) {
      const zeigen = window.setTimeout(() => setIosHinweis(true), 8000);
      return () => {
        window.clearTimeout(zeigen);
        window.removeEventListener("beforeinstallprompt", merken);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", merken);
  }, []);

  React.useEffect(() => {
    const fertig = () => {
      setAngebot(null);
      setIosHinweis(false);
    };
    window.addEventListener("appinstalled", fertig);
    return () => window.removeEventListener("appinstalled", fertig);
  }, []);

  const schliessen = () => {
    localStorage.setItem(ABGELEHNT, String(Date.now() + RUHE_MS));
    setAngebot(null);
    setIosHinweis(false);
  };

  const installieren = async () => {
    if (!angebot) return;
    setLaeuft(true);
    await angebot.prompt();
    await angebot.userChoice.catch(() => undefined);
    setLaeuft(false);
    setAngebot(null);
  };

  return (
    <>
      <OfflineHinweis />

      {(angebot || iosHinweis) && (
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:left-auto sm:right-6 sm:w-96 sm:px-0",
            "animate-in-up",
          )}
          role="dialog"
          aria-label={`${SITE.name} installieren`}
        >
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-xl">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl brand-surface">
              {iosHinweis ? <Share className="size-5" /> : <Download className="size-5" />}
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{SITE.name} als App</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {iosHinweis
                  ? "Teilen-Symbol antippen, dann „Zum Home-Bildschirm“ — diskret als eigenes Symbol, ohne Browserleiste."
                  : "Schneller Start vom Startbildschirm, ohne Browserleiste, mit Offline-Zugriff auf zuletzt Gesehenes."}
              </p>

              {!iosHinweis && (
                <div className="mt-3 flex gap-2">
                  <Button type="button" variant="brand" size="sm" loading={laeuft} onClick={installieren}>
                    Installieren
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={schliessen}>
                    Später
                  </Button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={schliessen}
              aria-label="Hinweis schliessen"
              className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Streifen, sobald das Netz weg ist.
 *
 * In einer installierten App merkt man den Ausfall sonst erst am leeren
 * Bildschirm — hier steht sofort da, woran es liegt.
 */
function OfflineHinweis() {
  const [offline, setOffline] = React.useState(false);

  React.useEffect(() => {
    const pruefen = () => setOffline(!navigator.onLine);
    pruefen();
    window.addEventListener("online", pruefen);
    window.addEventListener("offline", pruefen);
    return () => {
      window.removeEventListener("online", pruefen);
      window.removeEventListener("offline", pruefen);
    };
  }, []);

  if (!offline) return null;

  return (
    <p className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 border-b border-warning/40 bg-warning/20 px-4 py-1.5 pt-[calc(0.375rem+env(safe-area-inset-top))] text-xs font-medium text-warning backdrop-blur-sm">
      <CloudOff className="size-3.5" /> Keine Verbindung — du siehst gespeicherte Inhalte.
    </p>
  );
}

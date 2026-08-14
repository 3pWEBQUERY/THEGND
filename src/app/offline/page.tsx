import type { Metadata } from "next";
import Link from "next/link";
import { CloudOff, RefreshCw } from "lucide-react";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

/**
 * Ersatzseite ohne Netz.
 *
 * Bewusst ohne Datenzugriff — sie liegt im Zwischenspeicher des Service
 * Workers und muss auch dann funktionieren, wenn gar nichts erreichbar ist.
 */
export default function OfflinePage() {
  return (
    <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
      <div>
        <span className="mx-auto mb-6 grid size-14 place-items-center rounded-2xl border border-border bg-card text-muted-foreground">
          <CloudOff className="size-7" />
        </span>

        <h1 className="font-display text-3xl font-bold tracking-tight">Keine Verbindung</h1>
        <p className="mt-3 text-muted-foreground">
          {SITE.name} braucht kurz Netz. Zuletzt geöffnete Seiten funktionieren weiter — alles andere, sobald du
          wieder online bist.
        </p>

        <div className="mt-8 flex flex-col gap-2">
          {/* Bewusst ein einfacher Link: ein Neuladen ist genau das, was hilft. */}
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RefreshCw className="size-4" /> Erneut versuchen
          </a>
          <Link
            href="/escorts"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Zuletzt angesehene Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

/**
 * Grossansicht für Medien.
 *
 * Eine Umsetzung für alle Stellen — Galerie eines Inserats, Bilder im Feed,
 * später alles Weitere. Bedienung überall gleich: Pfeiltasten und Knöpfe zum
 * Blättern, Klick daneben oder Escape zum Schliessen, Schliessen-Knopf im
 * Bild statt daneben.
 */

export type LightboxItem = {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO" | "AUDIO";
  caption?: string | null;
  /** Standbild für Videos. */
  poster?: string | null;
  /** Gesperrtes Medium — bleibt unscharf. */
  gesperrt?: boolean;
};

export function MediaLightbox({
  items,
  titel,
  start = 0,
  offen,
  onOpenChange,
}: {
  items: LightboxItem[];
  /** Für Vorlesehilfen — etwa „Galerie von Angie“. */
  titel: string;
  start?: number;
  offen: boolean;
  onOpenChange: (offen: boolean) => void;
}) {
  const [index, setIndex] = React.useState(start);

  React.useEffect(() => {
    if (offen) setIndex(start);
  }, [offen, start]);

  React.useEffect(() => {
    if (!offen || items.length < 2) return;
    const taste = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") setIndex((i) => (i + 1) % items.length);
      if (event.key === "ArrowLeft") setIndex((i) => (i - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", taste);
    return () => window.removeEventListener("keydown", taste);
  }, [offen, items.length]);

  const aktuell = items[index];
  if (!aktuell) return null;

  return (
    <Dialog open={offen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl border-0 bg-transparent p-0 shadow-none" hideClose>
        <DialogTitle className="sr-only">{titel}</DialogTitle>

        <div className="relative mx-auto w-full max-w-3xl">
          <div className="relative aspect-3/4 max-h-[82dvh] w-full overflow-hidden rounded-2xl bg-black">
            {aktuell.type === "VIDEO" ? (
              <video
                key={aktuell.id}
                src={aktuell.url}
                poster={aktuell.poster ?? undefined}
                controls
                playsInline
                className={cn("size-full object-contain", aktuell.gesperrt && "blur-xl")}
              />
            ) : (
              <Image
                key={aktuell.id}
                src={aktuell.url}
                alt={aktuell.caption ?? titel}
                fill
                // Sofort laden: wer die Grossansicht öffnet, will das Bild
                // jetzt sehen — nicht erst, wenn ein Beobachter anspringt.
                priority
                sizes="90vw"
                className={cn("object-contain", aktuell.gesperrt && "blur-xl")}
              />
            )}

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 grid size-10 place-items-center rounded-xl bg-black/60 text-white backdrop-blur-md transition-colors hover:bg-black/80"
              aria-label="Schliessen"
            >
              <X className="size-5" />
            </button>

            {items.length > 1 && (
              <>
                <NavKnopf dir="left" onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)} />
                <NavKnopf dir="right" onClick={() => setIndex((i) => (i + 1) % items.length)} />
              </>
            )}
          </div>

          {(items.length > 1 || aktuell.caption) && (
            <p className="mt-3 text-center text-sm text-white/70">
              {items.length > 1 ? `${index + 1} / ${items.length}` : ""}
              {items.length > 1 && aktuell.caption ? " · " : ""}
              {aktuell.caption ?? ""}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NavKnopf({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  const Icon = dir === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "left" ? "Vorheriges Bild" : "Nächstes Bild"}
      className={cn(
        "absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-xl bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-black/75",
        dir === "left" ? "left-2" : "right-2",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}

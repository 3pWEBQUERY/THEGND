"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, Lock, Play } from "lucide-react";
import { MediaLightbox } from "@/components/media/media-lightbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type GalleryItem = {
  id: string;
  url: string;
  thumbUrl: string | null;
  blurData: string | null;
  type: "IMAGE" | "VIDEO" | "AUDIO";
  visibility: "PUBLIC" | "MEMBERS" | "PRIVATE";
  unlockCost: number;
  caption: string | null;
};

export function Gallery({ items, name, locked }: { items: GalleryItem[]; name: string; locked?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  // Laufende Nummer im Streifen — für die Anzeige „3 / 8“ und die Pfeile.
  const [aktiv, setAktiv] = React.useState(0);
  const streifen = React.useRef<HTMLDivElement>(null);

  const openAt = (i: number) => {
    setIndex(i);
    setOpen(true);
  };

  /** Welches Bild steht gerade links an? */
  const beobachten = React.useCallback(() => {
    const bahn = streifen.current;
    if (!bahn) return;
    const kinder = [...bahn.children] as HTMLElement[];
    const naechstes = kinder.findIndex((kind) => kind.offsetLeft >= bahn.scrollLeft - 8);
    setAktiv(naechstes < 0 ? kinder.length - 1 : naechstes);
  }, []);

  const schieben = (richtung: -1 | 1) => {
    const bahn = streifen.current;
    if (!bahn) return;
    const kinder = [...bahn.children] as HTMLElement[];
    const zielNr = Math.min(kinder.length - 1, Math.max(0, aktiv + richtung));
    const ziel = kinder[zielNr];
    if (!ziel) return;
    // Sofort mitzählen, statt auf das Scroll-Ereignis zu warten — die Pfeile
    // sollen ohne Verzögerung reagieren.
    setAktiv(zielNr);
    bahn.scrollTo({ left: ziel.offsetLeft, behavior: "smooth" });
  };

  if (!items.length) {
    return (
      <div className="grid aspect-16/10 place-items-center rounded-2xl border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
        Noch keine Fotos hinterlegt
      </div>
    );
  }

  return (
    <>
      {/*
       * Streifen statt Mosaik: alle Fotos nebeneinander im Hochformat, mit
       * angeschnittenem nächsten Bild als Hinweis, dass es weitergeht.
       * Gezogen wird mit Finger, Rad oder Pfeilen; ein Klick öffnet gross.
       */}
      <div className="relative">
        <div
          ref={streifen}
          onScroll={beobachten}
          className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto"
        >
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={() => openAt(i)}
              aria-label={`Foto ${i + 1} von ${items.length} gross ansehen`}
              className="group relative aspect-3/4 h-[52dvh] max-h-[560px] min-h-72 shrink-0 snap-start overflow-hidden rounded-2xl bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-[62dvh]"
            >
              <Media
                item={item}
                alt={i === 0 ? name : `${name} Foto ${i + 1}`}
                priority={i === 0}
                sizes="(max-width: 640px) 80vw, 420px"
              />
              <span className="absolute top-3 right-3 grid size-9 place-items-center rounded-xl bg-black/50 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                <Expand className="size-4" />
              </span>
            </button>
          ))}
        </div>

        {items.length > 1 && (
          <>
            {aktiv > 0 && <StreifenKnopf dir="left" onClick={() => schieben(-1)} />}
            {aktiv < items.length - 1 && <StreifenKnopf dir="right" onClick={() => schieben(1)} />}
            <span className="pointer-events-none absolute right-3 bottom-3 rounded-lg bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {aktiv + 1} / {items.length}
            </span>
          </>
        )}
      </div>

      <MediaLightbox
        items={items.map((item) => ({
          id: item.id,
          url: item.url,
          type: item.type,
          caption: item.caption,
          poster: item.thumbUrl,
          gesperrt: item.visibility === "PRIVATE",
        }))}
        titel={`Galerie von ${name}`}
        start={index}
        offen={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

/** Pfeil am Rand des Streifens — schiebt um genau ein Foto weiter. */
function StreifenKnopf({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  const Icon = dir === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "left" ? "Vorheriges Foto" : "Nächstes Foto"}
      className={cn(
        "absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-xl bg-black/55 text-white backdrop-blur-md transition-colors hover:bg-black/80",
        dir === "left" ? "left-3" : "right-3",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}

/** Vorschau im Streifen — die Grossansicht macht der Lightbox-Baustein. */
function Media({
  item,
  alt,
  sizes,
  priority,
}: {
  item?: GalleryItem;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  if (!item) return null;

  const isLocked = item.visibility === "PRIVATE";

  if (item.type === "VIDEO") {
    return (
      <>
        <video src={item.url} poster={item.thumbUrl ?? undefined} muted playsInline className="size-full object-cover" />
        <span className="pointer-events-none absolute top-3 left-3">
          <Badge variant="glass" size="sm">
            <Play className="size-3" /> Video
          </Badge>
        </span>
      </>
    );
  }

  return (
    <>
      <Image
        src={item.thumbUrl ?? item.url}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        placeholder={item.blurData ? "blur" : undefined}
        blurDataURL={item.blurData ?? undefined}
        className={cn("object-cover", isLocked && "blur-xl")}
      />
      {isLocked && (
        <span className="absolute inset-0 grid place-items-center">
          <span className="flex flex-col items-center gap-2 rounded-2xl bg-black/55 px-5 py-4 text-white backdrop-blur-md">
            <Lock className="size-5" />
            <span className="text-xs font-medium">
              {item.unlockCost > 0 ? `${item.unlockCost} Credits` : "Privat"}
            </span>
          </span>
        </span>
      )}
    </>
  );
}

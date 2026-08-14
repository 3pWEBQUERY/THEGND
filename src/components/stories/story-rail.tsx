"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { StoryViewer } from "@/components/stories/story-viewer";
import { StoryComposer } from "@/components/stories/story-composer";
import type { StoryBuendel, StoryQuelle } from "@/server/queries/stories";
import { cn } from "@/lib/utils";

/**
 * Kachelleiste der laufenden Stories.
 *
 * Eine Kachel je Urheber — egal, wie viele Teile dahinterstehen. Noch nicht
 * Gesehenes trägt einen kräftigen Rahmen, Gesehenes einen ruhigen; die eigene
 * Kachel steht vorn und lässt sich direkt erweitern.
 */
export function StoryRail({
  buendel,
  quelle,
  className,
}: {
  buendel: StoryBuendel[];
  /** Gesetzt, wenn das angemeldete Konto selbst Stories veröffentlichen darf. */
  quelle: StoryQuelle | null;
  className?: string;
}) {
  const router = useRouter();
  const [betrachter, setBetrachter] = React.useState<number | null>(null);
  const [aufnahme, setAufnahme] = React.useState(false);
  const leisteRef = React.useRef<HTMLDivElement>(null);
  const [pfeile, setPfeile] = React.useState({ links: false, rechts: false });

  const eigenes = quelle ? buendel.find((b) => b.eigene) ?? null : null;
  const fremde = quelle ? buendel.filter((b) => !b.eigene) : buendel;

  const pfeilePruefen = React.useCallback(() => {
    const leiste = leisteRef.current;
    if (!leiste) return;
    setPfeile({
      links: leiste.scrollLeft > 8,
      rechts: leiste.scrollLeft + leiste.clientWidth < leiste.scrollWidth - 8,
    });
  }, []);

  React.useEffect(() => {
    pfeilePruefen();
    window.addEventListener("resize", pfeilePruefen);
    return () => window.removeEventListener("resize", pfeilePruefen);
  }, [pfeilePruefen, buendel.length]);

  const schieben = (richtung: 1 | -1) => {
    leisteRef.current?.scrollBy({ left: richtung * 320, behavior: "smooth" });
  };

  if (!quelle && buendel.length === 0) return null;

  return (
    <section className={cn("relative", className)}>
      <div
        ref={leisteRef}
        onScroll={pfeilePruefen}
        className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth pb-1"
      >
        {quelle && (
          <EigeneKachel
            quelle={quelle}
            buendel={eigenes}
            onAnsehen={() => setBetrachter(buendel.findIndex((b) => b.eigene))}
            onHinzufuegen={() => setAufnahme(true)}
          />
        )}

        {fremde.map((eintrag) => (
          <Kachel
            key={eintrag.key}
            eintrag={eintrag}
            onClick={() => setBetrachter(buendel.findIndex((b) => b.key === eintrag.key))}
          />
        ))}
      </div>

      {pfeile.links && <Schiebeknopf seite="links" onClick={() => schieben(-1)} />}
      {pfeile.rechts && <Schiebeknopf seite="rechts" onClick={() => schieben(1)} />}

      {betrachter !== null && betrachter >= 0 && (
        <StoryViewer
          buendel={buendel}
          start={betrachter}
          offen
          onOpenChange={(offen) => {
            if (offen) return;
            setBetrachter(null);
            // Gesehen-Vermerke und gelöschte Teile schlagen sich in der
            // Leiste nieder, sobald der Server neu rechnet.
            router.refresh();
          }}
          onGeloescht={() => router.refresh()}
        />
      )}

      {quelle && (
        <StoryComposer
          quelle={quelle}
          offen={aufnahme}
          onOpenChange={setAufnahme}
          laufendeTeile={eigenes?.teile.length ?? 0}
        />
      )}
    </section>
  );
}

/** Kachel eines fremden Urhebers. */
function Kachel({ eintrag, onClick }: { eintrag: StoryBuendel; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group w-[74px] shrink-0 text-center outline-none">
      <Rahmen ungesehen={eintrag.ungesehen}>
        <Vorschau eintrag={eintrag} />
        {eintrag.teile.length > 1 && (
          <span className="absolute right-1 bottom-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {eintrag.teile.length}
          </span>
        )}
      </Rahmen>
      <span className="mt-1.5 flex items-center justify-center gap-0.5">
        <span
          className={cn(
            "truncate text-[11px]",
            eintrag.ungesehen ? "font-medium text-foreground" : "text-muted-foreground",
          )}
        >
          {eintrag.name}
        </span>
        {eintrag.isVerified && <BadgeCheck className="size-3 shrink-0 text-primary" />}
      </span>
    </button>
  );
}

/** Eigene Kachel — ansehen und erweitern in einem. */
function EigeneKachel({
  quelle,
  buendel,
  onAnsehen,
  onHinzufuegen,
}: {
  quelle: StoryQuelle;
  buendel: StoryBuendel | null;
  onAnsehen: () => void;
  onHinzufuegen: () => void;
}) {
  return (
    <div className="w-[74px] shrink-0 text-center">
      <div className="relative">
        <button
          type="button"
          onClick={buendel ? onAnsehen : onHinzufuegen}
          className="block w-full outline-none"
          aria-label={buendel ? "Eigene Story ansehen" : "Story hinzufügen"}
        >
          {buendel ? (
            <Rahmen ungesehen={buendel.ungesehen}>
              <Vorschau eintrag={buendel} />
              {buendel.teile.length > 1 && (
                <span className="absolute top-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                  {buendel.teile.length}
                </span>
              )}
            </Rahmen>
          ) : (
            <span className="grid aspect-square w-full place-items-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
              {quelle.bildUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={quelle.bildUrl} alt="" className="size-full object-cover opacity-60" />
              ) : (
                <Plus className="size-5" />
              )}
            </span>
          )}
        </button>

        {/* Zweiter Knopf, damit „ansehen“ und „hinzufügen“ nicht kollidieren. */}
        <button
          type="button"
          onClick={onHinzufuegen}
          aria-label="Story hinzufügen"
          title="Story hinzufügen"
          className="absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-lg border-2 border-background bg-primary text-primary-foreground transition-transform hover:scale-105"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      <span className="mt-1.5 block truncate text-[11px] font-medium">Deine Story</span>
    </div>
  );
}

/**
 * Rahmen um eine Kachel.
 *
 * Statt des runden Rings anderer Netzwerke eine Kachel im Hausformat: aussen
 * die Markenfarbe, wenn noch etwas offen ist, sonst eine ruhige Kante.
 */
function Rahmen({ ungesehen, children }: { ungesehen: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "block rounded-2xl transition-colors",
        // Neues fällt auf, Gesehenes bleibt sichtbar — nur ruhiger.
        ungesehen ? "bg-primary p-[3px] shadow-glow" : "bg-muted-foreground/35 p-[2px]",
      )}
    >
      <span className="relative block aspect-square overflow-hidden rounded-[0.85rem] border-2 border-background bg-muted">
        {children}
      </span>
    </span>
  );
}

/** Standbild der jüngsten Story eines Urhebers. */
function Vorschau({ eintrag }: { eintrag: StoryBuendel }) {
  const neuester = eintrag.teile[eintrag.teile.length - 1]!;

  if (neuester.mediaType === "VIDEO") {
    return (
      <video
        // `#t=0.1` zwingt den Browser, das erste Bild zu zeigen.
        src={`${neuester.mediaUrl}#t=0.1`}
        className="size-full object-cover"
        muted
        playsInline
        preload="metadata"
      />
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={neuester.mediaUrl} alt="" className="size-full object-cover" />;
}

function Schiebeknopf({ seite, onClick }: { seite: "links" | "rechts"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={seite === "links" ? "Zurück" : "Weiter"}
      className={cn(
        "absolute top-[38px] hidden -translate-y-1/2 place-items-center rounded-xl border border-border bg-card p-1.5 text-muted-foreground transition-colors hover:text-foreground sm:grid",
        seite === "links" ? "-left-3" : "-right-3",
      )}
    >
      {seite === "links" ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
    </button>
  );
}

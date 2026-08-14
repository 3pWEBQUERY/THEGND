"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, ChevronLeft, ChevronRight, Clapperboard, Plus } from "lucide-react";
import { StoryViewer } from "@/components/stories/story-viewer";
import { StoryComposer } from "@/components/stories/story-composer";
import { Button } from "@/components/ui/button";
import type { StoryBuendel, StoryQuelle, StoryTeil } from "@/server/queries/stories";
import { cn } from "@/lib/utils";

/**
 * Stories als Karten.
 *
 * Die grosse Schwester der Kachelleiste: hochformatige Karten, auf denen das
 * Medium selbst zu sehen ist — für Flächen, auf denen Stories eine eigene
 * Sektion sind statt einer Zeile über dem Feed.
 *
 * Zwei Ausprägungen: `StoryCards` zeigt je Urheber eine Karte (Startseite),
 * `ProfileStoryBubble` bündelt alle Teile eines Urhebers zu einem Kreis über
 * dem Namen seines Inserats.
 */

/* ── Startseite: eine Karte je Urheber ───────────────────────────────────── */

export function StoryCards({
  buendel,
  quelle,
  title = "Stories",
  subtitle,
  className,
}: {
  buendel: StoryBuendel[];
  quelle: StoryQuelle | null;
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  const router = useRouter();
  const [betrachter, setBetrachter] = React.useState<number | null>(null);
  const [aufnahme, setAufnahme] = React.useState(false);
  const bahn = React.useRef<HTMLDivElement>(null);

  const eigenes = quelle ? (buendel.find((b) => b.eigene) ?? null) : null;
  const fremde = quelle ? buendel.filter((b) => !b.eigene) : buendel;

  if (buendel.length === 0 && !quelle) return null;

  return (
    <section className={cn("mx-auto max-w-[1400px] px-4 py-10 sm:px-6", className)}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            <Clapperboard className="size-3.5" /> 24 Stunden
          </p>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        <Bahnknoepfe bahn={bahn} />
      </div>

      <div ref={bahn} className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth pb-1">
        {quelle && (
          <NeueStoryKarte
            quelle={quelle}
            vorschau={eigenes?.teile[eigenes.teile.length - 1] ?? null}
            teile={eigenes?.teile.length ?? 0}
            onAnsehen={() => setBetrachter(buendel.findIndex((b) => b.eigene))}
            onHinzufuegen={() => setAufnahme(true)}
          />
        )}

        {fremde.map((eintrag) => (
          <StoryKarte
            key={eintrag.key}
            teil={eintrag.teile[eintrag.teile.length - 1]!}
            name={eintrag.name}
            bildUrl={eintrag.bildUrl}
            isVerified={eintrag.isVerified}
            ungesehen={eintrag.ungesehen}
            anzahl={eintrag.teile.length}
            onClick={() => setBetrachter(buendel.findIndex((b) => b.key === eintrag.key))}
          />
        ))}
      </div>

      {betrachter !== null && betrachter >= 0 && (
        <StoryViewer
          buendel={buendel}
          start={betrachter}
          offen
          onOpenChange={(offen) => {
            if (offen) return;
            setBetrachter(null);
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

/* ── Inserat: ein Kreis für alle Teile ───────────────────────────────────── */

/**
 * Story-Kreis über dem Namen eines Inserats.
 *
 * Bewusst genau einer, egal wie viele Teile laufen — angetippt läuft die
 * ganze Abfolge durch, wie man es von Stories kennt. Ohne Beschriftung: der
 * Ring sagt, dass es etwas gibt, und die Plakette, dass es neu ist. Die
 * Rundung ist hier ausdrücklich gewünscht und die einzige Stelle, an der die
 * Seite von ihren Kacheln abweicht.
 */
export function ProfileStoryBubble({
  buendel,
  className,
}: {
  buendel: StoryBuendel;
  className?: string;
}) {
  const router = useRouter();
  const [offen, setOffen] = React.useState(false);
  const neuester = buendel.teile[buendel.teile.length - 1]!;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOffen(true)}
        aria-label={`Story von ${buendel.name} ansehen — ${buendel.teile.length} ${
          buendel.teile.length === 1 ? "Teil" : "Teile"
        }${buendel.ungesehen ? ", neu" : ""}`}
        title={`Story ansehen · ${buendel.teile.length} ${buendel.teile.length === 1 ? "Teil" : "Teile"}`}
        className="group relative shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <span
          className={cn(
            "block rounded-full transition-colors",
            // Neu: kräftiger Markenring mit Schein. Gesehen: ein klar
            // sichtbarer, ruhiger Ring — der Kreis soll nicht verschwinden,
            // nur seine Dringlichkeit verlieren.
            buendel.ungesehen ? "bg-primary p-[3px] shadow-glow" : "bg-muted-foreground/35 p-[2px]",
          )}
        >
          <span className="block overflow-hidden rounded-full border-2 border-background bg-muted">
            {neuester.mediaType === "VIDEO" ? (
              <video
                src={`${neuester.mediaUrl}#t=0.1`}
                className="size-16 object-cover sm:size-[72px]"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={neuester.mediaUrl} alt="" className="size-16 object-cover sm:size-[72px]" />
            )}
          </span>
        </span>

        {buendel.ungesehen && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border-2 border-background bg-primary px-1.5 py-px text-[10px] leading-tight font-bold text-primary-foreground">
            Neu
          </span>
        )}
      </button>

      {offen && (
        <StoryViewer
          buendel={[buendel]}
          start={0}
          offen
          onOpenChange={(auf) => {
            if (auf) return;
            setOffen(false);
            router.refresh();
          }}
          onGeloescht={() => router.refresh()}
        />
      )}
    </div>
  );
}

/* ── Bausteine ───────────────────────────────────────────────────────────── */

function StoryKarte({
  teil,
  name,
  bildUrl,
  isVerified,
  ungesehen,
  anzahl,
  mitAvatar = true,
  onClick,
}: {
  teil: StoryTeil;
  name: string;
  bildUrl: string | null;
  isVerified?: boolean;
  ungesehen: boolean;
  anzahl?: number;
  /**
   * Bild des Urhebers oben links. Bei einer Sektion, in der ohnehin nur ein
   * Urheber vorkommt, wäre es auf jeder Karte dasselbe — dort trägt statt
   * dessen der Kartenrahmen den Hinweis auf Ungesehenes.
   */
  mitAvatar?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative aspect-9/16 w-[132px] shrink-0 overflow-hidden rounded-2xl bg-muted text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/25 sm:w-[150px]",
        // Neues trägt einen kräftigen Markenrahmen, Gesehenes einen ruhigen.
        ungesehen ? "border-2 border-primary" : "border border-border",
      )}
    >
      {teil.mediaType === "VIDEO" ? (
        <video
          src={`${teil.mediaUrl}#t=0.1`}
          className="size-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={teil.mediaUrl} alt="" className="size-full object-cover" />
      )}

      {/* Urheberbild oben links, hervorgehoben solange etwas offen ist. */}
      {mitAvatar && (
        <span
          className={cn(
            "absolute top-2.5 left-2.5 grid size-9 place-items-center overflow-hidden rounded-xl border-2 bg-black/40 text-[10px] font-bold text-white backdrop-blur-sm",
            ungesehen ? "border-primary" : "border-white/60",
          )}
        >
          {bildUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bildUrl} alt="" className="size-full object-cover" />
          ) : (
            name.slice(0, 2).toUpperCase()
          )}
        </span>
      )}

      <span className="absolute top-2.5 right-2.5 flex items-center gap-1">
        {ungesehen && (
          <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
            Neu
          </span>
        )}
        {anzahl && anzahl > 1 ? (
          <span className="rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {anzahl}
          </span>
        ) : null}
      </span>

      <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-black/45 px-2.5 py-2 backdrop-blur-sm">
        <span className="truncate text-xs font-medium text-white">{name}</span>
        {isVerified && <BadgeCheck className="size-3 shrink-0 text-white" />}
      </span>
    </button>
  );
}

/** Karte zum Aufgeben — steht vorn, wenn das Konto selbst posten darf. */
function NeueStoryKarte({
  quelle,
  vorschau,
  teile,
  onAnsehen,
  onHinzufuegen,
}: {
  quelle: StoryQuelle;
  vorschau: StoryTeil | null;
  teile: number;
  onAnsehen: () => void;
  onHinzufuegen: () => void;
}) {
  return (
    <div className="relative aspect-9/16 w-[132px] shrink-0 overflow-hidden rounded-2xl border border-border bg-muted sm:w-[150px]">
      <button
        type="button"
        onClick={vorschau ? onAnsehen : onHinzufuegen}
        aria-label={vorschau ? "Eigene Story ansehen" : "Story hinzufügen"}
        className="block size-full outline-none"
      >
        {vorschau ? (
          vorschau.mediaType === "VIDEO" ? (
            <video
              src={`${vorschau.mediaUrl}#t=0.1`}
              className="size-full object-cover"
              muted
              preload="metadata"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vorschau.mediaUrl} alt="" className="size-full object-cover opacity-90" />
          )
        ) : quelle.bildUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={quelle.bildUrl} alt="" className="size-full object-cover opacity-50" />
        ) : (
          <span className="grid size-full place-items-center text-muted-foreground">
            <Clapperboard className="size-6" />
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={onHinzufuegen}
        className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-card px-2.5 py-2 text-left transition-colors hover:bg-muted"
      >
        <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Plus className="size-3.5" />
        </span>
        <span className="truncate text-xs font-medium">
          {teile > 0 ? `Story erweitern · ${teile}` : "Story erstellen"}
        </span>
      </button>
    </div>
  );
}

/** Pfeile zum Schieben — erscheinen nur, wenn es etwas zu schieben gibt. */
function Bahnknoepfe({ bahn }: { bahn: React.RefObject<HTMLDivElement | null> }) {
  const [zeigen, setZeigen] = React.useState(false);

  React.useEffect(() => {
    const pruefen = () => {
      const el = bahn.current;
      setZeigen(Boolean(el && el.scrollWidth > el.clientWidth + 8));
    };
    pruefen();
    window.addEventListener("resize", pruefen);
    return () => window.removeEventListener("resize", pruefen);
  }, [bahn]);

  if (!zeigen) return null;

  const schieben = (richtung: -1 | 1) => {
    const el = bahn.current;
    if (el) el.scrollBy({ left: richtung * Math.min(el.clientWidth * 0.85, 700), behavior: "smooth" });
  };

  return (
    <div className="hidden gap-1 sm:flex">
      <Button variant="outline" size="icon-sm" onClick={() => schieben(-1)} aria-label="Zurück">
        <ChevronLeft />
      </Button>
      <Button variant="outline" size="icon-sm" onClick={() => schieben(1)} aria-label="Weiter">
        <ChevronRight />
      </Button>
    </div>
  );
}

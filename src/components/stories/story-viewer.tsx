"use client";

import * as React from "react";
import Link from "next/link";
import { BadgeCheck, ChevronLeft, ChevronRight, Eye, Loader2, Pause, Play, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/primitives";
import { deleteStoryAction, markStorySeenAction } from "@/server/actions/stories";
import type { StoryBuendel } from "@/server/queries/stories";
import { cn, timeAgo } from "@/lib/utils";

/**
 * Story-Betrachter.
 *
 * Eine Kachel öffnet die Abfolge eines Urhebers: jeder Teil läuft ab, dann
 * kommt der nächste, danach der nächste Urheber. Bedient wird wie gewohnt —
 * links tippen zurück, rechts weiter, gedrückt halten pausiert, Wischen
 * wechselt den Urheber. Tastatur und Fokus funktionieren gleichwertig, damit
 * die Abfolge nicht nur mit dem Daumen bedienbar ist.
 */

/** Anzeigedauer eines Bildes. Videos laufen so lang, wie sie dauern. */
const BILD_DAUER_MS = 5000;

export function StoryViewer({
  buendel,
  start,
  startTeil,
  offen,
  onOpenChange,
  onGeloescht,
}: {
  buendel: StoryBuendel[];
  /** Index des Urhebers, mit dem geöffnet wird. */
  start: number;
  /**
   * Teil, mit dem begonnen wird. Ohne Angabe läuft die Abfolge beim ersten
   * noch nicht gesehenen los — wer aber eine bestimmte Karte antippt, will
   * genau diese sehen.
   */
  startTeil?: number;
  offen: boolean;
  onOpenChange: (offen: boolean) => void;
  onGeloescht?: () => void;
}) {
  const [gruppe, setGruppe] = React.useState(start);
  const [teil, setTeil] = React.useState(0);
  const [fortschritt, setFortschritt] = React.useState(0);
  const [pausiert, setPausiert] = React.useState(false);
  const [loescht, setLoescht] = React.useState(false);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const buehneRef = React.useRef<HTMLDivElement>(null);
  const gemeldet = React.useRef<Set<string>>(new Set());
  const halten = React.useRef<number | null>(null);
  const wischStart = React.useRef<number | null>(null);

  const aktuelleGruppe = buendel[gruppe];
  const aktuellerTeil = aktuelleGruppe?.teile[teil];

  // Beim Öffnen an der angetippten Kachel beginnen — und beim ersten noch
  // nicht gesehenen Teil, nicht stur von vorn.
  React.useEffect(() => {
    if (!offen) return;
    setGruppe(start);
    if (startTeil !== undefined) {
      setTeil(startTeil);
    } else {
      const ersterOffener = buendel[start]?.teile.findIndex((t) => !t.gesehen) ?? 0;
      setTeil(ersterOffener > 0 ? ersterOffener : 0);
    }
    setFortschritt(0);
    setPausiert(false);
  }, [offen, start, startTeil, buendel]);

  const weiter = React.useCallback(() => {
    setFortschritt(0);
    const teile = buendel[gruppe]?.teile.length ?? 0;
    if (teil + 1 < teile) {
      setTeil((t) => t + 1);
      return;
    }
    if (gruppe + 1 < buendel.length) {
      setGruppe((g) => g + 1);
      setTeil(0);
      return;
    }
    onOpenChange(false);
  }, [buendel, gruppe, teil, onOpenChange]);

  const zurueck = React.useCallback(() => {
    setFortschritt(0);
    if (teil > 0) {
      setTeil((t) => t - 1);
      return;
    }
    if (gruppe > 0) {
      const vorige = gruppe - 1;
      setGruppe(vorige);
      setTeil(Math.max(0, (buendel[vorige]?.teile.length ?? 1) - 1));
    }
  }, [buendel, gruppe, teil]);

  const gruppeWechseln = React.useCallback(
    (richtung: 1 | -1) => {
      const ziel = gruppe + richtung;
      if (ziel < 0 || ziel >= buendel.length) return;
      setGruppe(ziel);
      setTeil(0);
      setFortschritt(0);
    },
    [buendel.length, gruppe],
  );

  // Gesehen-Vermerk — einmal je Teil, ohne den Ablauf aufzuhalten.
  React.useEffect(() => {
    if (!offen || !aktuellerTeil || aktuelleGruppe?.eigene) return;
    if (gemeldet.current.has(aktuellerTeil.id)) return;
    gemeldet.current.add(aktuellerTeil.id);
    void markStorySeenAction(aktuellerTeil.id);
  }, [offen, aktuellerTeil, aktuelleGruppe?.eigene]);

  // Ablauf eines Bildes. Videos melden ihren Fortschritt selbst.
  React.useEffect(() => {
    if (!offen || pausiert || !aktuellerTeil || aktuellerTeil.mediaType === "VIDEO") return;

    const beginn = performance.now();
    const start = fortschritt;
    let frame = 0;

    const takt = (jetzt: number) => {
      const anteil = start + (jetzt - beginn) / BILD_DAUER_MS;
      if (anteil >= 1) {
        weiter();
        return;
      }
      setFortschritt(anteil);
      frame = requestAnimationFrame(takt);
    };
    frame = requestAnimationFrame(takt);
    return () => cancelAnimationFrame(frame);
    // `fortschritt` bewusst nicht in den Abhängigkeiten: der Takt liest den
    // Startwert einmal und zählt selbst weiter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offen, pausiert, aktuellerTeil?.id, weiter]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (pausiert) video.pause();
    else void video.play().catch(() => undefined);
  }, [pausiert, aktuellerTeil?.id]);

  React.useEffect(() => {
    if (!offen) return;
    const taste = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") weiter();
      if (event.key === "ArrowLeft") zurueck();
      if (event.key === "ArrowDown") gruppeWechseln(1);
      if (event.key === "ArrowUp") gruppeWechseln(-1);
      if (event.key === " ") {
        event.preventDefault();
        setPausiert((p) => !p);
      }
    };
    window.addEventListener("keydown", taste);
    return () => window.removeEventListener("keydown", taste);
  }, [offen, weiter, zurueck, gruppeWechseln]);

  const loeschen = async () => {
    if (!aktuellerTeil) return;
    if (!confirm("Diese Story löschen? Das lässt sich nicht rückgängig machen.")) return;
    setLoescht(true);
    const res = await deleteStoryAction(aktuellerTeil.id);
    setLoescht(false);
    if (res.ok) {
      toast.success(res.message ?? "Gelöscht.");
      onOpenChange(false);
      onGeloescht?.();
    } else {
      toast.error(res.message ?? "Löschen fehlgeschlagen.");
    }
  };

  if (!aktuelleGruppe || !aktuellerTeil) return null;

  return (
    <Dialog open={offen} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="w-full max-w-[440px] overflow-visible border-0 bg-transparent p-0 shadow-none"
        onPointerDownOutside={() => onOpenChange(false)}
        // Ohne das liegt der Fokus auf dem ersten Knopf und malt einen Ring
        // über die Story. Die Bühne selbst nimmt ihn auf.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          buehneRef.current?.focus();
        }}
      >
        <DialogTitle className="sr-only">Story von {aktuelleGruppe.name}</DialogTitle>

        <div className="relative">
          {/* Bühne — bewusst dunkel, unabhängig vom gewählten Erscheinungsbild:
              Medien sollen ohne farbigen Rahmen wirken. */}
          <div
            ref={buehneRef}
            tabIndex={-1}
            className="relative aspect-9/16 max-h-[86dvh] w-full overflow-hidden rounded-2xl bg-black outline-none select-none"
            onPointerDown={(event) => {
              wischStart.current = event.clientX;
              halten.current = window.setTimeout(() => setPausiert(true), 220);
            }}
            onPointerUp={(event) => {
              const gehalten = halten.current === null;
              if (halten.current !== null) {
                clearTimeout(halten.current);
                halten.current = null;
              }
              setPausiert(false);

              const von = wischStart.current;
              wischStart.current = null;
              if (von !== null && Math.abs(event.clientX - von) > 60) {
                gruppeWechseln(event.clientX < von ? 1 : -1);
                return;
              }
              // Nach langem Halten war die Berührung zum Pausieren gedacht.
              if (gehalten) return;

              const kasten = event.currentTarget.getBoundingClientRect();
              if (event.clientX - kasten.left < kasten.width * 0.32) zurueck();
              else weiter();
            }}
            onPointerLeave={() => {
              if (halten.current !== null) {
                clearTimeout(halten.current);
                halten.current = null;
              }
              setPausiert(false);
            }}
          >
            {aktuellerTeil.mediaType === "VIDEO" ? (
              <video
                key={aktuellerTeil.id}
                ref={videoRef}
                src={aktuellerTeil.mediaUrl}
                className="size-full object-contain"
                autoPlay
                playsInline
                controls={false}
                onTimeUpdate={(event) => {
                  const video = event.currentTarget;
                  if (video.duration) setFortschritt(video.currentTime / video.duration);
                }}
                onEnded={weiter}
              />
            ) : (
              // Bewusst <img>: die Quelle ist eine beliebige Bucket-Adresse.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={aktuellerTeil.id}
                src={aktuellerTeil.mediaUrl}
                alt={aktuellerTeil.caption ?? `Story von ${aktuelleGruppe.name}`}
                className="size-full object-contain"
                draggable={false}
              />
            )}

            {/* Laufbalken je Teil */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex gap-1 p-3">
              {aktuelleGruppe.teile.map((t, i) => (
                <span key={t.id} className="h-0.5 flex-1 overflow-hidden rounded-sm bg-white/30">
                  <span
                    className="block h-full bg-white"
                    style={{ width: `${i < teil ? 100 : i === teil ? Math.min(100, fortschritt * 100) : 0}%` }}
                  />
                </span>
              ))}
            </div>

            {/* Kopfzeile */}
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-3 bg-black/35 px-3 pt-7 pb-3 backdrop-blur-sm">
              <Link
                href={aktuelleGruppe.href}
                className="pointer-events-auto flex min-w-0 items-center gap-2.5"
                onClick={() => onOpenChange(false)}
              >
                <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/25 bg-white/10 text-xs font-semibold text-white">
                  {aktuelleGruppe.bildUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={aktuelleGruppe.bildUrl} alt="" className="size-full object-cover" />
                  ) : (
                    aktuelleGruppe.name.slice(0, 2).toUpperCase()
                  )}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-sm font-semibold text-white">
                    <span className="truncate">{aktuelleGruppe.name}</span>
                    {aktuelleGruppe.isVerified && <BadgeCheck className="size-3.5 shrink-0 text-white" />}
                  </span>
                  <span className="block text-[11px] text-white/70">{timeAgo(aktuellerTeil.createdAt)}</span>
                </span>
              </Link>

              <div className="pointer-events-auto ml-auto flex items-center gap-1">
                {aktuelleGruppe.eigene && (
                  <>
                    <span className="flex items-center gap-1 rounded-lg bg-black/40 px-2 py-1 text-[11px] text-white backdrop-blur-sm">
                      <Eye className="size-3.5" /> {aktuellerTeil.views}
                    </span>
                    <SteuerKnopf label="Story löschen" onClick={loeschen} disabled={loescht}>
                      {loescht ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </SteuerKnopf>
                  </>
                )}
                <SteuerKnopf
                  label={pausiert ? "Fortsetzen" : "Pausieren"}
                  onClick={() => setPausiert((p) => !p)}
                >
                  {pausiert ? <Play className="size-4" /> : <Pause className="size-4" />}
                </SteuerKnopf>
                <SteuerKnopf label="Schliessen" onClick={() => onOpenChange(false)}>
                  <X className="size-4" />
                </SteuerKnopf>
              </div>
            </div>

            {aktuellerTeil.caption && (
              <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/55 px-4 py-3 text-sm text-white backdrop-blur-sm">
                {aktuellerTeil.caption}
              </p>
            )}
          </div>

          {/* Wechsel zwischen Urhebern — auf grossen Bildschirmen neben der Bühne. */}
          {gruppe > 0 && (
            <SeitenKnopf seite="links" label="Vorheriger Urheber" onClick={() => gruppeWechseln(-1)} />
          )}
          {gruppe + 1 < buendel.length && (
            <SeitenKnopf seite="rechts" label="Nächster Urheber" onClick={() => gruppeWechseln(1)} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SteuerKnopf({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      className="grid size-8 place-items-center rounded-lg bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/70 disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function SeitenKnopf({
  seite,
  label,
  onClick,
}: {
  seite: "links" | "rechts";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "absolute top-1/2 hidden -translate-y-1/2 place-items-center rounded-xl border border-white/20 bg-black/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/80 sm:grid",
        seite === "links" ? "-left-14" : "-right-14",
      )}
    >
      {seite === "links" ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
    </button>
  );
}

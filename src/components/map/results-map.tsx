"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { SCHWEIZ, formatDistanz, type Punkt } from "@/lib/geo";
import { formatPrice } from "@/lib/utils";

const LeafletMap = dynamic(() => import("@/components/map/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[28rem] w-full place-items-center rounded-xl border border-border bg-muted">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  ),
});

export type KartenTreffer = {
  id: string;
  slug: string;
  displayName: string;
  lat: number;
  lng: number;
  cityName: string | null;
  priceHour: number | null;
  currency: string;
  distanzKm: number | null;
  /** Koordinate ist auf ~500 m gerundet, weil keine Adresse freigegeben wurde. */
  ungefaehr: boolean;
};

/**
 * Karte der Suchtreffer. Zeigt beim Klick eine kleine Vorschau mit Link
 * zum Profil.
 */
export function ResultsMap({
  treffer,
  mitte,
  radiusKm,
}: {
  treffer: KartenTreffer[];
  mitte?: Punkt | null;
  radiusKm?: number;
}) {
  const [gewaehlt, setGewaehlt] = React.useState<KartenTreffer | null>(null);

  const marker = React.useMemo(
    () =>
      treffer.map((t) => ({
        id: t.id,
        lat: t.lat,
        lng: t.lng,
        aktiv: gewaehlt?.id === t.id,
        onClick: () => setGewaehlt(t),
      })),
    [treffer, gewaehlt],
  );

  return (
    <div className="relative">
      <LeafletMap
        center={mitte ?? SCHWEIZ.center}
        zoom={mitte ? 11 : SCHWEIZ.zoom}
        marker={marker}
        radiusKm={radiusKm}
        radiusUm={mitte ?? undefined}
        autoZoom={!mitte}
        hoehe="h-[28rem]"
      />

      {gewaehlt && (
        <div className="absolute bottom-4 left-4 right-4 z-[500] rounded-xl border border-border bg-card p-4 sm:right-auto sm:w-80">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={`/escort/${gewaehlt.slug}`} className="block truncate font-semibold hover:text-primary">
                {gewaehlt.displayName}
              </Link>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {gewaehlt.cityName ?? "—"}
                {gewaehlt.distanzKm != null && ` · ${formatDistanz(gewaehlt.distanzKm)} entfernt`}
              </p>
              {gewaehlt.priceHour != null && (
                <p className="mt-1 text-sm font-semibold">
                  {formatPrice(gewaehlt.priceHour, gewaehlt.currency)}
                  <span className="text-xs font-normal text-muted-foreground"> / Stunde</span>
                </p>
              )}
              {gewaehlt.ungefaehr && (
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Ungefähre Lage — die genaue Adresse ist nicht öffentlich.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setGewaehlt(null)}
              aria-label="Vorschau schliessen"
              className="shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
            >
              Schliessen
            </button>
          </div>
        </div>
      )}

      {treffer.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[500] grid place-items-center">
          <p className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground">
            Keine Profile mit Koordinaten in diesem Ausschnitt.
          </p>
        </div>
      )}
    </div>
  );
}

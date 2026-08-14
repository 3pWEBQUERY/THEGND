"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Info, Loader2, MapPinned } from "lucide-react";
import { PlaceSearch } from "@/components/map/place-search";
import { Slider } from "@/components/ui/primitives";
import { RADIUS_STANDARD, SCHWEIZ, type Ort, type Punkt } from "@/lib/geo";
import { cn } from "@/lib/utils";

/** Leaflet greift auf `window` zu — deshalb nur im Browser laden. */
const LeafletMap = dynamic(() => import("@/components/map/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="grid h-80 w-full place-items-center rounded-xl border border-border bg-muted">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  ),
});

export type StandortWert = {
  lat: number | null;
  lng: number | null;
  radiusKm: number;
  /** Freitext der zuletzt gewählten Adresse — nur zur Anzeige. */
  label?: string;
};

/**
 * Standort auf der Karte setzen: suchen, klicken oder den Marker ziehen.
 *
 * Schreibt `lat`, `lng` und `radiusKm` in versteckte Felder, damit das
 * umgebende Formular sie ganz normal per FormData mitschickt — keine
 * Sonderbehandlung in der Server Action nötig.
 */
export function LocationPicker({
  name = { lat: "lat", lng: "lng", radius: "radiusKm" },
  start,
  /** Meldet Adressbestandteile aus der Rückwärtssuche (PLZ, Ort, Strasse). */
  onAdresse,
  mitRadius = true,
  hinweis,
  className,
  karteAktiv = true,
}: {
  name?: { lat: string; lng: string; radius: string };
  start?: Partial<StandortWert>;
  onAdresse?: (adresse: { stadt?: string; plz?: string; strasse?: string; stadtteil?: string }) => void;
  mitRadius?: boolean;
  hinweis?: string;
  className?: string;
  /**
   * Karte einhängen? Die versteckten Felder bleiben immer bestehen.
   *
   * In einem ausgeblendeten Tab hätte der Kartenbehälter keine Grösse und
   * Leaflet würde nur eine Kachel zeichnen. Statt die Grösse nachträglich zu
   * korrigieren, wird die Karte erst aufgebaut, wenn sie sichtbar ist.
   */
  karteAktiv?: boolean;
}) {
  const [punkt, setPunkt] = React.useState<Punkt | null>(
    start?.lat != null && start?.lng != null ? { lat: start.lat, lng: start.lng } : null,
  );
  const [radius, setRadius] = React.useState(start?.radiusKm ?? RADIUS_STANDARD);
  const [label, setLabel] = React.useState(start?.label ?? "");
  const [sucheLaeuft, setSucheLaeuft] = React.useState(false);

  const adresseRef = React.useRef(onAdresse);
  adresseRef.current = onAdresse;

  /** Nach dem Verschieben die Adresse nachziehen — bewusst erst beim Loslassen. */
  const adresseHolen = React.useCallback(async (p: Punkt) => {
    setSucheLaeuft(true);
    try {
      const res = await fetch(`/api/geo/adresse?lat=${p.lat}&lng=${p.lng}`);
      if (!res.ok) return;
      const a = await res.json();
      const text = [a.strasse, [a.plz, a.stadt].filter(Boolean).join(" ")].filter(Boolean).join(", ");
      if (text) setLabel(text);
      adresseRef.current?.({
        stadt: a.stadt ?? undefined,
        plz: a.plz ?? undefined,
        strasse: a.strasse ?? undefined,
        stadtteil: a.stadtteil ?? undefined,
      });
    } finally {
      setSucheLaeuft(false);
    }
  }, []);

  const setzen = React.useCallback(
    (p: Punkt, neuesLabel?: string) => {
      setPunkt(p);
      if (neuesLabel !== undefined) setLabel(neuesLabel);
      else void adresseHolen(p);
    },
    [adresseHolen],
  );

  const ortGewaehlt = (ort: Ort) => {
    setzen({ lat: ort.lat, lng: ort.lng }, ort.label);
    void adresseHolen({ lat: ort.lat, lng: ort.lng });
  };

  const marker = React.useMemo(
    () => (punkt ? [{ id: "eigen", lat: punkt.lat, lng: punkt.lng, aktiv: true }] : []),
    [punkt],
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Werte für das umgebende Formular */}
      <input type="hidden" name={name.lat} value={punkt?.lat ?? ""} />
      <input type="hidden" name={name.lng} value={punkt?.lng ?? ""} />
      {mitRadius && <input type="hidden" name={name.radius} value={radius} />}

      <PlaceSearch
        wert={label}
        onWahl={ortGewaehlt}
        onLeeren={() => {
          setPunkt(null);
          setLabel("");
        }}
        placeholder="Adresse oder Ort suchen …"
      />

      {karteAktiv && (
        <LeafletMap
          center={punkt ?? SCHWEIZ.center}
          zoom={punkt ? 13 : SCHWEIZ.zoom}
          marker={marker}
          ziehbar
          onMarkerZiehen={(p) => setzen(p)}
          onKlick={(p) => setzen(p)}
          radiusKm={mitRadius && punkt ? radius : undefined}
          radiusUm={punkt ?? undefined}
          hoehe="h-80"
        />
      )}

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        {sucheLaeuft ? (
          <Loader2 className="mt-0.5 size-3 shrink-0 animate-spin" />
        ) : (
          <MapPinned className="mt-0.5 size-3 shrink-0" />
        )}
        {punkt
          ? `Gesetzt auf ${punkt.lat.toFixed(4)}, ${punkt.lng.toFixed(4)} — Marker ziehen oder in die Karte klicken, um zu korrigieren.`
          : "Ort suchen oder direkt in die Karte klicken."}
      </p>

      {mitRadius && (
        <div className="rounded-xl border border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">Anfahrtsradius</span>
            <span className="text-sm tabular-nums text-muted-foreground">{radius} km</span>
          </div>
          <Slider
            min={0}
            max={200}
            step={5}
            value={[radius]}
            onValueChange={(v) => setRadius(v[0])}
            aria-label="Anfahrtsradius in Kilometern"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            In diesem Umkreis wirst du bei der Umkreissuche gefunden — auch von ausserhalb deiner Stadt.
          </p>
        </div>
      )}

      {hinweis && (
        <p className="flex items-start gap-1.5 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          {hinweis}
        </p>
      )}
    </div>
  );
}

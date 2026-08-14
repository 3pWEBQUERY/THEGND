"use client";

import * as React from "react";
import { Crosshair } from "lucide-react";
import { PlaceSearch } from "@/components/map/place-search";
import { Slider, Switch } from "@/components/ui/primitives";
import { RADIUS_STANDARD, RADIUS_STUFEN, type Ort } from "@/lib/geo";
import { cn } from "@/lib/utils";

/**
 * Umkreissuche im Filterbereich: Ort wählen, Radius schieben.
 *
 * Schreibt `lat`, `lng`, `radius` und `ort` in die URL — damit bleibt die
 * Suche teilbar, ist im Verlauf zurücknavigierbar und lässt sich wie jeder
 * andere Filter speichern.
 */
export function RadiusFilter({
  lat,
  lng,
  radius,
  ort,
  anfahrt,
  onAendern,
}: {
  lat?: number;
  lng?: number;
  radius?: number;
  ort?: string;
  anfahrt?: boolean;
  onAendern: (werte: {
    lat?: number;
    lng?: number;
    radius?: number;
    ort?: string;
    anfahrt?: boolean;
  }) => void;
}) {
  const aktiv = lat !== undefined && lng !== undefined;
  const [wert, setWert] = React.useState(radius ?? RADIUS_STANDARD);

  React.useEffect(() => setWert(radius ?? RADIUS_STANDARD), [radius]);

  const ortGewaehlt = (treffer: Ort) =>
    onAendern({ lat: treffer.lat, lng: treffer.lng, radius: wert, ort: treffer.label, anfahrt });

  return (
    <div className="space-y-3">
      <PlaceSearch
        wert={ort}
        onWahl={ortGewaehlt}
        onLeeren={() => onAendern({})}
        placeholder="Ort, PLZ oder Adresse …"
      />

      <div className={cn("space-y-2.5", !aktiv && "pointer-events-none opacity-45")}>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Crosshair className="size-3.5" /> Umkreis
          </span>
          <span className="tabular-nums font-medium">{wert} km</span>
        </div>

        <Slider
          min={1}
          max={200}
          step={1}
          value={[wert]}
          onValueChange={(v) => setWert(v[0])}
          onValueCommit={(v) => onAendern({ lat, lng, radius: v[0], ort, anfahrt })}
          aria-label="Suchradius in Kilometern"
        />

        <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-border p-3">
          <span className="text-xs">
            Anfahrt einbeziehen
            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              Zeigt auch Profile weiter weg, die laut eigenem Anfahrtsradius zu dir kommen.
            </span>
          </span>
          <Switch
            checked={Boolean(anfahrt)}
            onCheckedChange={(v) => onAendern({ lat, lng, radius: wert, ort, anfahrt: v })}
          />
        </label>

        <div className="flex flex-wrap gap-1.5">
          {RADIUS_STUFEN.map((stufe) => (
            <button
              key={stufe}
              type="button"
              onClick={() => {
                setWert(stufe);
                onAendern({ lat, lng, radius: stufe, ort, anfahrt });
              }}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs transition-colors",
                wert === stufe
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary",
              )}
            >
              {stufe} km
            </button>
          ))}
        </div>
      </div>

      {!aktiv && (
        <p className="text-xs text-muted-foreground">
          Wähle einen Ort — oder tippe auf das Fadenkreuz im Feld, um deinen Standort zu verwenden.
        </p>
      )}
    </div>
  );
}

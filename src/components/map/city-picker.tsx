"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import { PlaceSearch } from "@/components/map/place-search";
import { Select } from "@/components/ui/select";
import { distanzKm, formatDistanz, type Ort } from "@/lib/geo";
import { cn } from "@/lib/utils";

export type StadtOption = { id: string; name: string; lat: number | null; lng: number | null };

/**
 * Stadtauswahl mit Ortssuche.
 *
 * Getippt wird ein beliebiger Ort — die nächstgelegene Stadt aus unserer
 * Liste wird automatisch zugeordnet. Die Auswahlliste bleibt darunter
 * sichtbar, damit die Zuordnung jederzeit korrigierbar ist und das Feld auch
 * ohne Ortssuche funktioniert.
 */
export function CityPicker({
  name = "cityId",
  staedte,
  start,
  required,
  /** Meldet die tatsächlich gesuchten Koordinaten mit. */
  onKoordinate,
  className,
}: {
  name?: string;
  staedte: StadtOption[];
  start?: string;
  required?: boolean;
  onKoordinate?: (punkt: { lat: number; lng: number } | null) => void;
  className?: string;
}) {
  const [cityId, setCityId] = React.useState(start ?? "");
  const [hinweis, setHinweis] = React.useState<string | null>(null);
  const [ortLabel, setOrtLabel] = React.useState("");

  const koordinateRef = React.useRef(onKoordinate);
  koordinateRef.current = onKoordinate;

  const zuordnen = (ort: Ort) => {
    setOrtLabel(ort.label);
    koordinateRef.current?.({ lat: ort.lat, lng: ort.lng });

    const mitKoordinate = staedte.filter((s) => s.lat != null && s.lng != null);
    if (mitKoordinate.length === 0) return;

    const naechste = mitKoordinate
      .map((s) => ({ stadt: s, km: distanzKm({ lat: ort.lat, lng: ort.lng }, { lat: s.lat!, lng: s.lng! }) }))
      .sort((a, b) => a.km - b.km)[0];

    setCityId(naechste.stadt.id);
    setHinweis(
      naechste.km < 1
        ? `Zugeordnet: ${naechste.stadt.name}`
        : `Zugeordnet: ${naechste.stadt.name} — ${formatDistanz(naechste.km)} entfernt`,
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      <PlaceSearch
        wert={ortLabel}
        onWahl={zuordnen}
        onLeeren={() => {
          setOrtLabel("");
          setHinweis(null);
          koordinateRef.current?.(null);
        }}
        placeholder="Ort oder PLZ suchen …"
        mitStandort
      />

      <Select name={name} value={cityId} onValueChange={setCityId} required={required}>
        <option value="">Stadt wählen</option>
        {staedte.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>

      {hinweis && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3 shrink-0" />
          {hinweis}
        </p>
      )}
    </div>
  );
}

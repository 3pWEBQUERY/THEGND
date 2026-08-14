"use client";

import * as React from "react";
import { Loader2, MapPin, Navigation, X } from "lucide-react";
import type { Ort } from "@/lib/geo";
import { cn } from "@/lib/utils";

/**
 * Ortssuche mit Vorschlägen — Adresse, PLZ oder Ortsname.
 *
 * Die Anfragen laufen über `/api/geo/orte`, also über unseren Server. Die
 * Vorschlagsliste ist bewusst selbst gebaut (keine Datalist), damit sie sich
 * wie die übrigen Auswahlfelder der Seite verhält.
 */
export function PlaceSearch({
  wert,
  onWahl,
  onLeeren,
  placeholder = "Adresse, PLZ oder Ort …",
  mitStandort = true,
  className,
  id,
}: {
  /** Angezeigter Text des aktuell gewählten Orts. */
  wert?: string;
  onWahl: (ort: Ort) => void;
  onLeeren?: () => void;
  placeholder?: string;
  /** Schaltfläche „Mein Standort“ anbieten. */
  mitStandort?: boolean;
  className?: string;
  id?: string;
}) {
  const [eingabe, setEingabe] = React.useState(wert ?? "");
  const [treffer, setTreffer] = React.useState<Ort[]>([]);
  const [offen, setOffen] = React.useState(false);
  const [laedt, setLaedt] = React.useState(false);
  const [aktiv, setAktiv] = React.useState(-1);
  const [fehler, setFehler] = React.useState<string | null>(null);
  const huelle = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setEingabe(wert ?? ""), [wert]);

  // Tippen entprellen — die Geocoder haben Ratenbegrenzungen.
  React.useEffect(() => {
    const text = eingabe.trim();
    if (text.length < 2 || text === wert) {
      setTreffer([]);
      return;
    }
    const abbruch = new AbortController();
    const timer = setTimeout(async () => {
      setLaedt(true);
      setFehler(null);
      try {
        const res = await fetch(`/api/geo/orte?q=${encodeURIComponent(text)}`, { signal: abbruch.signal });
        const daten = await res.json();
        if (!res.ok) throw new Error(daten.fehler ?? "Suche fehlgeschlagen.");
        setTreffer(daten.orte ?? []);
        setOffen(true);
        setAktiv(-1);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setFehler((error as Error).message);
      } finally {
        setLaedt(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      abbruch.abort();
    };
  }, [eingabe, wert]);

  // Klick daneben schliesst die Liste.
  React.useEffect(() => {
    const zu = (event: MouseEvent) => {
      if (!huelle.current?.contains(event.target as Node)) setOffen(false);
    };
    document.addEventListener("mousedown", zu);
    return () => document.removeEventListener("mousedown", zu);
  }, []);

  const waehlen = (ort: Ort) => {
    setEingabe(ort.label);
    setOffen(false);
    setTreffer([]);
    onWahl(ort);
  };

  const eigenerStandort = () => {
    if (!navigator.geolocation) {
      setFehler("Dein Browser gibt den Standort nicht frei.");
      return;
    }
    setLaedt(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(`/api/geo/adresse?lat=${lat}&lng=${lng}`);
          const a = await res.json();
          const label = [a.strasse, a.stadt].filter(Boolean).join(", ") || "Mein Standort";
          waehlen({ id: "eigener-standort", label, detail: a.plz ?? "", lat, lng, typ: "standort" });
        } catch {
          waehlen({ id: "eigener-standort", label: "Mein Standort", detail: "", lat, lng, typ: "standort" });
        } finally {
          setLaedt(false);
        }
      },
      () => {
        setLaedt(false);
        setFehler("Standort nicht verfügbar. Bitte den Ort eintippen.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  };

  const tasten = (event: React.KeyboardEvent) => {
    if (!offen || treffer.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setAktiv((i) => (i + 1) % treffer.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setAktiv((i) => (i - 1 + treffer.length) % treffer.length);
    } else if (event.key === "Enter" && aktiv >= 0) {
      event.preventDefault();
      waehlen(treffer[aktiv]);
    } else if (event.key === "Escape") {
      setOffen(false);
    }
  };

  const listeOffen = offen && treffer.length > 0;

  return (
    // Solange Vorschläge offen sind, hebt sich das Feld samt Liste über
    // benachbarte Inhalte — direkt darunter liegt oft eine Karte.
    <div ref={huelle} className={cn("relative", listeOffen && "z-[1100]", className)}>
      <div className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-3 focus-within:border-ring">
        <MapPin className="size-4 shrink-0 text-muted-foreground" />
        <input
          id={id}
          value={eingabe}
          onChange={(event) => setEingabe(event.target.value)}
          onFocus={() => treffer.length && setOffen(true)}
          onKeyDown={tasten}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={offen}
          aria-autocomplete="list"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
        />
        {laedt && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />}
        {!laedt && eingabe && (
          <button
            type="button"
            aria-label="Ort entfernen"
            onClick={() => {
              setEingabe("");
              setTreffer([]);
              onLeeren?.();
            }}
            className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
        {mitStandort && !eingabe && (
          <button
            type="button"
            onClick={eigenerStandort}
            title="Meinen Standort verwenden"
            aria-label="Meinen Standort verwenden"
            className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Navigation className="size-3.5" />
          </button>
        )}
      </div>

      {fehler && <p className="mt-1.5 text-xs text-danger">{fehler}</p>}

      {listeOffen && (
        <ul
          role="listbox"
          // `bg-card` statt `bg-popover`: Letzteres ist kein Token dieses
          // Projekts und blieb daher durchsichtig — über der Karte fiel das auf.
          className="absolute z-[1100] mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border border-border bg-card p-1"
        >
          {treffer.map((ort, i) => (
            <li key={ort.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === aktiv}
                onMouseEnter={() => setAktiv(i)}
                onClick={() => waehlen(ort)}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left transition-colors",
                  i === aktiv ? "bg-muted" : "hover:bg-muted",
                )}
              >
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="block truncate text-sm">{ort.label}</span>
                  {ort.detail && (
                    <span className="block truncate text-xs text-muted-foreground">{ort.detail}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

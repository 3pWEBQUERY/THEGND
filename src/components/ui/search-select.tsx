"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/primitives";
import { FlagAvatar } from "@/components/ui/flag-avatar";
import { cn } from "@/lib/utils";

/**
 * Auswahlfeld mit Suche.
 *
 * Für Listen, die zu lang zum Durchscrollen sind — Sprachen, Länder,
 * Nationalitäten. Getippt wird in ein Suchfeld über der Liste; getroffen
 * wird auf Name, Zweitname und Kürzel, und zwar ohne Rücksicht auf Akzente,
 * damit „Espanol“ genauso findet wie „Español“.
 *
 * Gezeichnet wird die Liste von der App, nicht vom Browser — wie beim
 * einfachen Auswahlfeld. Der Wert landet über ein verstecktes Feld im
 * FormData, Server Actions funktionieren also unverändert.
 */

export type SuchOption = {
  value: string;
  label: string;
  /** Zweite Zeile — etwa der Eigenname der Sprache. */
  zusatz?: string;
  /** Weitere Begriffe, auf die die Suche anspringt. */
  suchbegriffe?: string[];
  /** Länderkürzel für die Flagge; `null` zeigt stattdessen das Kürzel. */
  land?: string | null;
  /** Überschrift, unter der die Option steht (nur ohne Suchbegriff sichtbar). */
  gruppe?: string;
};

/** Kleinschreibung ohne Akzente — „Español“ und „espanol“ sind dasselbe. */
function normalisieren(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function SearchSelect({
  name,
  value,
  defaultValue,
  onValueChange,
  optionen,
  placeholder = "Bitte wählen",
  suchPlatzhalter = "Suchen …",
  leerText = "Kein Treffer.",
  mitFlagge = false,
  required,
  disabled,
  id,
  className,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  optionen: readonly SuchOption[];
  placeholder?: string;
  suchPlatzhalter?: string;
  leerText?: string;
  /** Flaggenkachel vor jedem Eintrag. */
  mitFlagge?: boolean;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}) {
  const kontrolliert = value !== undefined;
  const [intern, setIntern] = React.useState(defaultValue ?? "");
  const aktuell = kontrolliert ? value : intern;

  const [offen, setOffen] = React.useState(false);
  const [suche, setSuche] = React.useState("");
  const [aktiv, setAktiv] = React.useState(0);

  const listeRef = React.useRef<HTMLDivElement>(null);
  const feldRef = React.useRef<HTMLInputElement>(null);

  const gewaehlt = optionen.find((o) => o.value === aktuell);

  const gefiltert = React.useMemo(() => {
    const q = normalisieren(suche.trim());
    if (!q) return optionen;
    return optionen.filter((o) =>
      [o.label, o.zusatz, o.value, ...(o.suchbegriffe ?? [])]
        .filter(Boolean)
        .some((feld) => normalisieren(feld as string).includes(q)),
    );
  }, [optionen, suche]);

  // Beim Öffnen auf den aktuellen Wert springen, beim Tippen an den Anfang.
  React.useEffect(() => {
    if (!offen) return;
    setSuche("");
    const index = optionen.findIndex((o) => o.value === aktuell);
    setAktiv(index < 0 ? 0 : index);
  }, [offen, optionen, aktuell]);

  React.useEffect(() => {
    if (offen) setAktiv(0);
  }, [suche, offen]);

  // Den hervorgehobenen Eintrag im Blick behalten.
  React.useEffect(() => {
    if (!offen) return;
    listeRef.current?.querySelector('[data-aktiv="true"]')?.scrollIntoView({ block: "nearest" });
  }, [aktiv, offen]);

  const waehlen = (option: SuchOption) => {
    if (!kontrolliert) setIntern(option.value);
    onValueChange?.(option.value);
    setOffen(false);
  };

  const tastatur = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (gefiltert.length === 0) return;
      const richtung = event.key === "ArrowDown" ? 1 : -1;
      setAktiv((i) => (i + richtung + gefiltert.length) % gefiltert.length);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const treffer = gefiltert[aktiv];
      if (treffer) waehlen(treffer);
    }
  };

  let letzteGruppe: string | undefined;

  return (
    <>
      {name && <input type="hidden" name={name} value={aktuell ?? ""} />}

      <Popover open={offen} onOpenChange={setOffen}>
        <PopoverAnchor asChild>
          <button
            id={id}
            type="button"
            role="combobox"
            aria-expanded={offen}
            aria-required={required || undefined}
            disabled={disabled}
            onClick={() => setOffen((o) => !o)}
            className={cn(
              "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 text-left text-sm text-foreground shadow-xs transition-colors outline-none",
              "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25",
              "data-[state=open]:border-ring disabled:cursor-not-allowed disabled:opacity-60",
              className,
            )}
            data-state={offen ? "open" : "closed"}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              {mitFlagge && gewaehlt && (
                <FlagAvatar land={gewaehlt.land} code={gewaehlt.value} label={gewaehlt.label} size="sm" />
              )}
              <span className={cn("truncate", gewaehlt ? "" : "text-muted-foreground/70")}>
                {gewaehlt?.label ?? placeholder}
              </span>
            </span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                offen && "rotate-180",
              )}
            />
          </button>
        </PopoverAnchor>

        <PopoverContent
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            feldRef.current?.focus();
          }}
          className="w-[var(--radix-popover-trigger-width)] overflow-hidden p-0"
        >
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              ref={feldRef}
              value={suche}
              onChange={(event) => setSuche(event.target.value)}
              onKeyDown={tastatur}
              placeholder={suchPlatzhalter}
              className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
          </div>

          <div ref={listeRef} role="listbox" className="max-h-72 overflow-y-auto p-1.5">
            {gefiltert.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">{leerText}</p>
            ) : (
              gefiltert.map((option, index) => {
                const kopf = !suche.trim() && option.gruppe && option.gruppe !== letzteGruppe ? option.gruppe : null;
                letzteGruppe = option.gruppe;
                const gewaehltHier = option.value === aktuell;

                return (
                  <React.Fragment key={option.value}>
                    {kopf && (
                      <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                        {kopf}
                      </p>
                    )}
                    <button
                      type="button"
                      role="option"
                      aria-selected={gewaehltHier}
                      data-aktiv={index === aktiv}
                      onClick={() => waehlen(option)}
                      onMouseMove={() => setAktiv(index)}
                      className={cn(
                        "relative flex w-full cursor-pointer items-center gap-2.5 rounded-lg py-2 pr-8 pl-3 text-left text-sm transition-colors",
                        index === aktiv && "bg-muted",
                        gewaehltHier && "font-medium text-primary",
                      )}
                    >
                      {mitFlagge && (
                        <FlagAvatar land={option.land} code={option.value} label={option.label} size="sm" />
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        {option.label}
                        {option.zusatz && option.zusatz !== option.label && (
                          <span className="ml-2 text-xs text-muted-foreground">{option.zusatz}</span>
                        )}
                      </span>
                      {gewaehltHier && <Check className="absolute right-2.5 size-4" />}
                    </button>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}

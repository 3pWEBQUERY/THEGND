"use client";

import * as React from "react";
import { Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Auswahl von Angebot und Sprachen eines Hauses.
 *
 * Die Auswahl liegt im Zustand, ins Formular gehen nur versteckte Felder für
 * das Gewählte. Damit lässt sich die sichtbare Liste gefahrlos durchsuchen —
 * würde man nicht passende Einträge einfach ausblenden und wären es echte
 * Checkboxen, ginge ihr Zustand beim Absenden verloren.
 */

type Eintrag = { id: string; name: string };
type Kategorie = { id: string; name: string; services: Eintrag[] };

export function AgencyOfferPicker({
  kategorien,
  sprachen,
  gewaehlteServices,
  gewaehlteSprachen,
}: {
  kategorien: Kategorie[];
  sprachen: { id: string; name: string }[];
  gewaehlteServices: string[];
  gewaehlteSprachen: string[];
}) {
  const [services, setServices] = React.useState(() => new Set(gewaehlteServices));
  const [languages, setLanguages] = React.useState(() => new Set(gewaehlteSprachen));
  const [suche, setSuche] = React.useState("");

  const umschalten = (menge: Set<string>, setzen: (m: Set<string>) => void, id: string) => {
    const neu = new Set(menge);
    neu.has(id) ? neu.delete(id) : neu.add(id);
    setzen(neu);
  };

  const begriff = suche.trim().toLowerCase();
  const passt = (name: string) => !begriff || name.toLowerCase().includes(begriff);

  const gefiltert = kategorien
    .map((k) => ({ ...k, treffer: k.services.filter((s) => passt(s.name)) }))
    .filter((k) => k.treffer.length > 0);

  const gesamt = kategorien.reduce((n, k) => n + k.services.length, 0);

  const kategorieAlle = (kategorie: Kategorie, an: boolean) => {
    const neu = new Set(services);
    for (const s of kategorie.services) (an ? neu.add(s.id) : neu.delete(s.id));
    setServices(neu);
  };

  return (
    <div className="space-y-6">
      {/* Werte fürs Formular */}
      {[...services].map((id) => (
        <input key={id} type="hidden" name="serviceIds" value={id} />
      ))}
      {[...languages].map((id) => (
        <input key={id} type="hidden" name="languageIds" value={id} />
      ))}

      {/* ── Sprachen ─────────────────────────────────────────────────────── */}
      <div>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold">Sprachen</p>
          <span className="text-xs text-muted-foreground">{languages.size} gewählt</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sprachen.map((sprache) => (
            <Chip
              key={sprache.id}
              label={sprache.name}
              aktiv={languages.has(sprache.id)}
              onClick={() => umschalten(languages, setLanguages, sprache.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Angebot ──────────────────────────────────────────────────────── */}
      <div className="border-t border-border pt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold">
            Angebot <span className="font-normal text-muted-foreground">({services.size} von {gesamt})</span>
          </p>

          <div className="flex h-9 min-w-56 items-center gap-2 rounded-xl border border-border bg-background px-3">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              value={suche}
              onChange={(event) => setSuche(event.target.value)}
              placeholder="Angebot suchen …"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
            {suche && (
              <button
                type="button"
                onClick={() => setSuche("")}
                aria-label="Suche leeren"
                className="grid size-5 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>

        {gefiltert.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            Nichts gefunden für „{suche}“.
          </p>
        ) : (
          <div className="space-y-5">
            {gefiltert.map((kategorie) => {
              const gewaehltInKategorie = kategorie.services.filter((s) => services.has(s.id)).length;
              const alleGewaehlt = gewaehltInKategorie === kategorie.services.length;

              return (
                <div key={kategorie.id}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {kategorie.name}
                      {gewaehltInKategorie > 0 && (
                        <span className="ml-1.5 font-normal normal-case tracking-normal text-primary">
                          {gewaehltInKategorie}
                        </span>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => kategorieAlle(kategorie, !alleGewaehlt)}
                      className="text-xs text-muted-foreground transition-colors hover:text-primary"
                    >
                      {alleGewaehlt ? "keine" : "alle"}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {kategorie.treffer.map((service) => (
                      <Chip
                        key={service.id}
                        label={service.name}
                        aktiv={services.has(service.id)}
                        onClick={() => umschalten(services, setServices, service.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ label, aktiv, onClick }: { label: string; aktiv: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktiv}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
        aktiv
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {aktiv && <Check className="size-3 shrink-0" />}
      {label}
    </button>
  );
}

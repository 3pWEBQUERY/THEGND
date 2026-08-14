"use client";

import * as React from "react";
import { CalendarClock, Copy, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/primitives";
import { WEEKDAY_LABEL, WEEKDAY_SHORT } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Öffnungszeiten eines Hauses.
 *
 * Schreibt weiterhin `opensAt_N`, `closesAt_N` und `closed_N` in versteckte
 * Felder — die Server Action bleibt unverändert. Die Zeiten kommen aus
 * eigenen Auswahlfeldern statt aus `input[type=time]`: Letzteres öffnet die
 * Uhr des Betriebssystems, und die soll auf dieser Seite nirgends auftauchen.
 */

/** Montag zuerst — So ist in der Datenbank die 0. */
const WOCHE = [1, 2, 3, 4, 5, 6, 0] as const;

const SCHRITT = 30;
const RASTER = Array.from({ length: (24 * 60) / SCHRITT }, (_, i) => {
  const m = i * SCHRITT;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});

const zuMinuten = (zeit: string) => {
  const [h, m] = zeit.split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
};

/** Dauer in Minuten, Zeiten über Mitternacht eingerechnet. */
function dauerMinuten(von: string, bis: string) {
  const a = zuMinuten(von);
  const b = zuMinuten(bis);
  if (a === null || b === null) return null;
  return b > a ? b - a : 1440 - a + b;
}

const formatDauer = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h}:${String(m).padStart(2, "0")} h`;
};

type Tag = { geoeffnet: boolean; von: string; bis: string };
type Zeile = { weekday: number; opensAt: string | null; closesAt: string | null; closed: boolean };

const VORLAGEN = [
  { label: "Tagsüber", hinweis: "Mo–Sa 10–22, So zu", von: "10:00", bis: "22:00", tage: [1, 2, 3, 4, 5, 6] },
  { label: "Abends", hinweis: "Mo–Sa 18–02, So zu", von: "18:00", bis: "02:00", tage: [1, 2, 3, 4, 5, 6] },
  { label: "Täglich", hinweis: "alle Tage 12–24", von: "12:00", bis: "00:00", tage: [0, 1, 2, 3, 4, 5, 6] },
] as const;

export function AgencyHoursEditor({ stunden, isOpen24h }: { stunden: Zeile[]; isOpen24h: boolean }) {
  const [offen24, setOffen24] = React.useState(isOpen24h);

  const [tage, setTage] = React.useState<Record<number, Tag>>(() => {
    const start: Record<number, Tag> = {};
    for (const d of WOCHE) {
      const vorhanden = stunden.find((h) => h.weekday === d);
      start[d] = {
        geoeffnet: Boolean(vorhanden && !vorhanden.closed && vorhanden.opensAt && vorhanden.closesAt),
        von: vorhanden?.opensAt ?? "10:00",
        bis: vorhanden?.closesAt ?? "22:00",
      };
    }
    return start;
  });

  const setzen = (weekday: number, teil: Partial<Tag>) =>
    setTage((t) => ({ ...t, [weekday]: { ...t[weekday], ...teil } }));

  /** Einen Tag auf alle übrigen übertragen — spart sechsmal dasselbe Tippen. */
  const aufAlle = (weekday: number) => {
    const quelle = tage[weekday];
    setTage(Object.fromEntries(WOCHE.map((d) => [d, { ...quelle }])) as Record<number, Tag>);
  };

  const vorlageAnwenden = (v: (typeof VORLAGEN)[number]) =>
    setTage(
      Object.fromEntries(
        WOCHE.map((d) => [
          d,
          (v.tage as readonly number[]).includes(d)
            ? { geoeffnet: true, von: v.von, bis: v.bis }
            : { ...tage[d], geoeffnet: false },
        ]),
      ) as Record<number, Tag>,
    );

  const alleSchliessen = () =>
    setTage(Object.fromEntries(WOCHE.map((d) => [d, { ...tage[d], geoeffnet: false }])) as Record<number, Tag>);

  // Zeiten, die nicht auf dem 30-Minuten-Raster liegen, bleiben wählbar —
  // Bestandsdaten sollen sich nicht stillschweigend verschieben.
  const optionen = React.useMemo(() => {
    const extra = new Set<string>();
    for (const d of WOCHE) {
      for (const zeit of [tage[d].von, tage[d].bis]) {
        if (zeit && !RASTER.includes(zeit)) extra.add(zeit);
      }
    }
    return [...RASTER, ...extra].sort();
  }, [tage]);

  const zusammenfassung = React.useMemo(() => fasseZusammen(tage), [tage]);

  return (
    <div className="space-y-5">
      <label className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
        <span>
          Durchgehend geöffnet (24/7)
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Dann werden keine einzelnen Zeiten gespeichert.
          </span>
        </span>
        <Switch name="isOpen24h" checked={offen24} onCheckedChange={setOffen24} />
      </label>

      {offen24 ? (
        <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Dein Haus gilt rund um die Uhr als geöffnet — in der Suche erscheinst du damit immer unter „Jetzt
          geöffnet“.
        </p>
      ) : (
        <>
          {/* Vorlagen: der häufigste Fall in einem Klick statt in vierzehn. */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Vorlage:</span>
            {VORLAGEN.map((v) => (
              <Button key={v.label} type="button" variant="outline" size="sm" onClick={() => vorlageAnwenden(v)}>
                {v.label}
                <span className="text-muted-foreground">· {v.hinweis}</span>
              </Button>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={alleSchliessen}>
              Alle schliessen
            </Button>
          </div>

          <div className="divide-y divide-border rounded-xl border border-border">
            {WOCHE.map((weekday) => {
              const tag = tage[weekday];
              const dauer = tag.geoeffnet ? dauerMinuten(tag.von, tag.bis) : null;
              const ueberMitternacht =
                tag.geoeffnet && (zuMinuten(tag.bis) ?? 0) <= (zuMinuten(tag.von) ?? 0);

              return (
                <div key={weekday} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
                  {/* Versteckte Felder — Vertrag mit der Server Action */}
                  <input type="hidden" name={`opensAt_${weekday}`} value={tag.geoeffnet ? tag.von : ""} />
                  <input type="hidden" name={`closesAt_${weekday}`} value={tag.geoeffnet ? tag.bis : ""} />
                  <input type="hidden" name={`closed_${weekday}`} value={tag.geoeffnet ? "" : "1"} />

                  <span className="w-24 shrink-0 text-sm font-medium">
                    <span className="sm:hidden">{WEEKDAY_SHORT[weekday]}</span>
                    <span className="hidden sm:inline">{WEEKDAY_LABEL[weekday]}</span>
                  </span>

                  <Switch
                    checked={tag.geoeffnet}
                    onCheckedChange={(v) => setzen(weekday, { geoeffnet: v })}
                    aria-label={`${WEEKDAY_LABEL[weekday]} geöffnet`}
                  />

                  {tag.geoeffnet ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Select
                          value={tag.von}
                          onValueChange={(v) => setzen(weekday, { von: v })}
                          aria-label={`${WEEKDAY_LABEL[weekday]} — Öffnung`}
                          className="h-9 w-24 px-3"
                          contentClassName="max-h-72"
                        >
                          {optionen.map((z) => (
                            <option key={z} value={z}>
                              {z}
                            </option>
                          ))}
                        </Select>
                        <span className="text-muted-foreground">–</span>
                        <Select
                          value={tag.bis}
                          onValueChange={(v) => setzen(weekday, { bis: v })}
                          aria-label={`${WEEKDAY_LABEL[weekday]} — Schliessung`}
                          className="h-9 w-24 px-3"
                          contentClassName="max-h-72"
                        >
                          {optionen.map((z) => (
                            <option key={z} value={z}>
                              {z}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {ueberMitternacht && (
                          <span className="flex items-center gap-1" title="Sperrstunde nach Mitternacht">
                            <Moon className="size-3" /> über Mitternacht
                          </span>
                        )}
                        {dauer !== null && <span className="tabular-nums">{formatDauer(dauer)}</span>}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">geschlossen</span>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={() => aufAlle(weekday)}
                    title="Diese Zeiten auf alle Wochentage übertragen"
                  >
                    <Copy className="size-3.5" /> Auf alle
                  </Button>
                </div>
              );
            })}
          </div>

          <p className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3 text-sm">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              <span className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                So erscheint es auf deiner Seite
              </span>
              <span className={cn("mt-0.5 block", zusammenfassung === "geschlossen" && "text-muted-foreground")}>
                {zusammenfassung}
              </span>
            </span>
          </p>
        </>
      )}
    </div>
  );
}

/**
 * Gleiche Tage zusammenfassen — „Mo–Do 18:00–02:00 · Fr–Sa 18:00–04:00 · So
 * geschlossen“ statt sieben einzelner Zeilen.
 */
function fasseZusammen(tage: Record<number, Tag>): string {
  const beschreibung = (d: number) => {
    const t = tage[d];
    return t.geoeffnet ? `${t.von}–${t.bis}` : "geschlossen";
  };

  const bloecke: { von: number; bis: number; text: string }[] = [];
  for (const d of WOCHE) {
    const text = beschreibung(d);
    const letzter = bloecke.at(-1);
    if (letzter && letzter.text === text) letzter.bis = d;
    else bloecke.push({ von: d, bis: d, text });
  }

  if (bloecke.length === 1 && bloecke[0].text === "geschlossen") return "geschlossen";

  return bloecke
    .map((b) => {
      const tage = b.von === b.bis ? WEEKDAY_SHORT[b.von] : `${WEEKDAY_SHORT[b.von]}–${WEEKDAY_SHORT[b.bis]}`;
      return `${tage} ${b.text}`;
    })
    .join(" · ");
}

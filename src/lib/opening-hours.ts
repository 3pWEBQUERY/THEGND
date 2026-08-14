import { LOCALE } from "@/lib/utils";

/**
 * Öffnungszeiten auswerten.
 *
 * Reine Logik ohne Datenbankzugriff — deshalb hier und nicht bei den
 * Abfragen: so lässt sie sich auch im Browser und in Tests verwenden.
 */

export type Oeffnungszeit = {
  weekday: number;
  opensAt: string | null;
  closesAt: string | null;
  closed: boolean;
};

/** Wochentag und Minuten seit Mitternacht in der Schweizer Zeitzone. */
function jetztInZuerich(now = new Date()) {
  const teile = new Intl.DateTimeFormat(LOCALE, {
    timeZone: "Europe/Zurich",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const finde = (typ: string) => teile.find((t) => t.type === typ)?.value ?? "";
  const tage: Record<string, number> = { So: 0, Mo: 1, Di: 2, Mi: 3, Do: 4, Fr: 5, Sa: 6 };
  return {
    weekday: tage[finde("weekday").slice(0, 2)] ?? now.getDay(),
    minuten: Number(finde("hour")) * 60 + Number(finde("minute")),
  };
}

const zuMinuten = (zeit: string) => {
  const [h, m] = zeit.split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
};

/**
 * Hat das Haus gerade offen?
 *
 * `null` bedeutet „keine Angabe“ — dann behaupten wir weder offen noch zu.
 * Öffnungszeiten über Mitternacht („18:00–04:00“) sind in dieser Branche die
 * Regel, nicht die Ausnahme; deshalb wird zusätzlich der Vortag geprüft.
 */
export function istGeoeffnet(
  agentur: { isOpen24h: boolean; hours: Oeffnungszeit[] },
  now = new Date(),
): boolean | null {
  if (agentur.isOpen24h) return true;
  if (agentur.hours.length === 0) return null;

  const { weekday, minuten } = jetztInZuerich(now);

  const spanne = (tag: number) => {
    const eintrag = agentur.hours.find((h) => h.weekday === tag);
    if (!eintrag || eintrag.closed || !eintrag.opensAt || !eintrag.closesAt) return null;
    const auf = zuMinuten(eintrag.opensAt);
    const zu = zuMinuten(eintrag.closesAt);
    return auf === null || zu === null ? null : { auf, zu };
  };

  const heute = spanne(weekday);
  if (heute) {
    // Endet die Spanne nach Mitternacht, gilt heute „offen ab auf“.
    const ueberMitternacht = heute.zu <= heute.auf;
    if (ueberMitternacht ? minuten >= heute.auf : minuten >= heute.auf && minuten < heute.zu) return true;
  }

  // Noch von gestern her offen — die Sperrstunde liegt nach Mitternacht.
  const gestern = spanne((weekday + 6) % 7);
  if (gestern && gestern.zu <= gestern.auf && minuten < gestern.zu) return true;

  return false;
}

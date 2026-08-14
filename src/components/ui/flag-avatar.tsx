import { cn } from "@/lib/utils";

/**
 * Länderflagge als gefüllte Kachel mit abgerundeten Ecken.
 *
 * Gerendert wird eine echte SVG-Grafik aus `public/flags` (quadratische
 * Varianten von `flag-icons`, MIT) — kein Emoji. Emojis sehen auf jedem
 * Betriebssystem anders aus und fehlen unter Windows komplett.
 *
 * Das Länderkürzel wird aus dem in der Datenbank hinterlegten Flaggen-Emoji
 * abgeleitet; alternativ dient `code` als Quelle. Fehlt beides oder gibt es
 * keine Grafik, erscheint das Kürzel als Text.
 */

/** 🇩🇪 → "DE" — Flaggen-Emojis bestehen aus zwei Regional-Indicator-Zeichen. */
export function countryCodeFromFlag(flag?: string | null) {
  if (!flag) return null;
  const letters = [...flag]
    .map((char) => char.codePointAt(0) ?? 0)
    .filter((cp) => cp >= 0x1f1e6 && cp <= 0x1f1ff)
    .map((cp) => String.fromCharCode(cp - 0x1f1e6 + 65));
  return letters.length === 2 ? letters.join("") : null;
}

const SIZES = {
  sm: { box: "size-5 rounded", text: "text-[8px]" },
  md: { box: "size-6 rounded-md", text: "text-[9px]" },
  lg: { box: "size-8 rounded-lg", text: "text-[11px]" },
  xl: { box: "size-10 rounded-lg", text: "text-xs" },
} as const;

export function FlagAvatar({
  flag,
  code,
  land,
  label,
  size = "md",
  className,
}: {
  /** Flaggen-Emoji aus der Datenbank — dient nur zur Ermittlung des Länderkürzels. */
  flag?: string | null;
  /** Länder- oder Sprachkürzel als Rückfallebene. */
  code?: string | null;
  /**
   * Ausdrückliches Länder- oder Regionskürzel für die Grafik, auch
   * mehrteilig („gb-sct“). Ist es angegeben — und sei es als `null` —, wird
   * `code` nur noch als Text verwendet. Das ist für Sprachen wichtig:
   * Esperanto hat kein Land, und `/flags/eo.svg` gibt es nicht.
   */
  land?: string | null;
  label?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  const country =
    countryCodeFromFlag(flag) ??
    (land !== undefined
      ? land && /^[a-z]{2}(-[a-z]{2,3})?$/i.test(land)
        ? land.toUpperCase()
        : null
      : code?.length === 2
        ? code.toUpperCase()
        : null);

  const tile = cn(
    "grid shrink-0 place-items-center overflow-hidden border border-border/70 bg-muted",
    s.box,
    className,
  );

  if (!country) {
    return (
      <span role="img" aria-label={label} title={label} className={cn(tile, s.text, "font-bold uppercase text-muted-foreground")}>
        {code?.slice(0, 2) ?? "??"}
      </span>
    );
  }

  return (
    <span role="img" aria-label={label} title={label} className={tile}>
      {/* Lokales SVG — bewusst ohne next/image, das SVGs nur mit dangerouslyAllowSVG ausliefert. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/flags/${country.toLowerCase()}.svg`}
        alt=""
        loading="lazy"
        decoding="async"
        className="size-full object-cover"
      />
    </span>
  );
}

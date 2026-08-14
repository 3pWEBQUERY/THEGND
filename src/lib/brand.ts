/**
 * Markenfarbe für Kontexte ausserhalb von CSS.
 *
 * In der Oberfläche gilt ausschliesslich der CSS-Token `--brand` aus
 * `src/app/globals.css`. Manche Ausgabekanäle können keine CSS-Variablen
 * auflösen — E-Mail-Clients und das `theme-color`-Meta-Tag brauchen einen
 * literalen Wert. Damit es trotzdem nur eine Quelle gibt, stehen hier die
 * gleichen HSL-Kanäle; der Hex-Wert wird daraus berechnet, nie abgetippt.
 *
 * Farbe ändern: hier und in `globals.css` denselben HSL-Wert setzen.
 */

export const BRAND_HSL = { h: 345.3, s: 82.7, l: 40.8 } as const;

function hslToHex(h: number, s: number, l: number) {
  const sat = s / 100;
  const lig = l / 100;
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lig - c / 2;

  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];

  const channel = (value: number) =>
    Math.round((value + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function shift(lightness: number) {
  return hslToHex(BRAND_HSL.h, BRAND_HSL.s, Math.min(100, Math.max(0, BRAND_HSL.l + lightness)));
}

/** Markenfarbe als Hex — identisch zum CSS-Token `--brand`. */
export const BRAND_HEX = hslToHex(BRAND_HSL.h, BRAND_HSL.s, BRAND_HSL.l);
export const BRAND_HEX_HOVER = shift(6);
export const BRAND_HEX_DARK = shift(-14);
export const BRAND_CSS = `hsl(${BRAND_HSL.h} ${BRAND_HSL.s}% ${BRAND_HSL.l}%)`;

/**
 * Neutrale Flächen für E-Mails. E-Mail-Clients unterstützen weder CSS-Variablen
 * noch `color-mix`, deshalb liegen die Werte hier gebündelt statt verstreut in
 * den Templates.
 */
export const EMAIL_THEME = {
  brand: BRAND_HEX,
  brandDark: BRAND_HEX_DARK,
  onBrand: "#ffffff",
  page: "#0f0d12",
  card: "#17141b",
  cardAlt: "#1e1a24",
  border: "#2a2530",
  heading: "#ffffff",
  text: "#c8c2cf",
  textStrong: "#e6e1ee",
  textMuted: "#7c7488",
  link: "#9b93a8",
} as const;

/** Flächenfarben für `theme-color` (Browser-UI unter iOS/Android). */
export const THEME_COLOR = {
  light: "#fdfcfb",
  dark: "#151219",
} as const;

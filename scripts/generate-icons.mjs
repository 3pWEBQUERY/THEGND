/*
 * App-Symbole erzeugen.
 *
 * Quelle ist das Rautenzeichen aus der Kopfzeile plus die Markenfarbe aus
 * `src/lib/brand.ts`. Ändert sich die Farbe, hier den Wert angleichen und
 *   node scripts/generate-icons.mjs
 * laufen lassen — die erzeugten Dateien liegen in `public/icons` und
 * `src/app` und gehören ins Repository.
 */

import sharp from "sharp";
import { writeFileSync } from "node:fs";

const BRAND = "#be123c";
const DUNKEL = "#151219";

/** Rautenzeichen wie im Kopfbereich der Seite. */
const marke = (groesse, deckung = 1) => `
  <g transform="translate(${groesse / 2} ${groesse / 2}) scale(${(groesse * deckung) / 24}) translate(-12 -12)" fill="#ffffff">
    <path d="M12 2.5 21 12l-9 9.5L3 12z" opacity=".92"/>
    <path d="M12 7.2 16.6 12 12 16.8 7.4 12z" opacity=".5"/>
  </g>`;

/** Icon mit abgerundeter Kante — für Kontexte ohne eigene Maske. */
const rund = (g) => `<svg xmlns="http://www.w3.org/2000/svg" width="${g}" height="${g}" viewBox="0 0 ${g} ${g}">
  <rect width="${g}" height="${g}" rx="${g * 0.22}" fill="${BRAND}"/>${marke(g, 0.52)}
</svg>`;

/** Vollflächig — Android schneidet selbst zu, das Zeichen bleibt im sicheren Bereich. */
const maskierbar = (g) => `<svg xmlns="http://www.w3.org/2000/svg" width="${g}" height="${g}" viewBox="0 0 ${g} ${g}">
  <rect width="${g}" height="${g}" fill="${BRAND}"/>${marke(g, 0.4)}
</svg>`;

const dateien = [
  ["public/icons/icon-192.png", rund(192), 192],
  ["public/icons/icon-512.png", rund(512), 512],
  ["public/icons/icon-maskable-192.png", maskierbar(192), 192],
  ["public/icons/icon-maskable-512.png", maskierbar(512), 512],
  ["src/app/apple-icon.png", maskierbar(180), 180],
];

for (const [pfad, svg, groesse] of dateien) {
  const puffer = await sharp(Buffer.from(svg)).resize(groesse, groesse).png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(pfad, puffer);
  console.log(`${pfad} — ${(puffer.length / 1024).toFixed(1)} kB`);
}

// Favicon als SVG: skaliert verlustfrei und ist winzig.
writeFileSync("src/app/icon.svg", rund(64).replace(/\n\s+/g, "\n  "));
console.log("src/app/icon.svg");

// Vorschaubild fürs Installieren (Play-Store-artige Ansicht in Chrome).
const schirm = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <rect width="1080" height="1920" fill="${DUNKEL}"/>
  <g transform="translate(540 860)">
    <rect x="-140" y="-140" width="280" height="280" rx="62" fill="${BRAND}"/>
    <g transform="scale(6) translate(-12 -12)" fill="#ffffff">
      <path d="M12 2.5 21 12l-9 9.5L3 12z" opacity=".92"/>
      <path d="M12 7.2 16.6 12 12 16.8 7.4 12z" opacity=".5"/>
    </g>
  </g>
  <text x="540" y="1120" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="72" font-weight="700" letter-spacing="12" fill="#ffffff">THEGND</text>
  <text x="540" y="1190" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="34" fill="#ffffffaa">Das Premium-Verzeichnis</text>
</svg>`;
const s = await sharp(Buffer.from(schirm)).png({ compressionLevel: 9 }).toBuffer();
writeFileSync("public/icons/screenshot-mobile.png", s);
console.log(`public/icons/screenshot-mobile.png — ${(s.length / 1024).toFixed(1)} kB`);

/**
 * Mapping of featured cities to their Kanton (CH) / Bundesland (DE, AT).
 * Used by FeaturedPlacesSection to link cities to state‑level escort searches.
 * The values match what Google Places returns as `administrative_area_level_1`.
 */
export const CITY_TO_STATE: Record<string, string> = {
  // 🇨🇭 Schweiz — Kantone
  'Zürich': 'Zürich',
  'Genf': 'Genève',
  'Basel': 'Basel-Stadt',
  'Bern': 'Bern',
  'Lausanne': 'Vaud',
  'Luzern': 'Luzern',
  'St. Gallen': 'St. Gallen',
  'Winterthur': 'Zürich',
  'Zug': 'Zug',
  'Biel/Bienne': 'Bern',
  'Thun': 'Bern',
  'Lugano': 'Ticino',

  // 🇦🇹 Österreich — Bundesländer
  'Wien': 'Wien',
  'Graz': 'Steiermark',
  'Linz': 'Oberösterreich',
  'Salzburg': 'Salzburg',
  'Innsbruck': 'Tirol',
  'Klagenfurt': 'Kärnten',
  'Villach': 'Kärnten',
  'Wels': 'Oberösterreich',
  'Sankt Pölten': 'Niederösterreich',
  'Dornbirn': 'Vorarlberg',

  // 🇩🇪 Deutschland — Bundesländer
  'Berlin': 'Berlin',
  'Hamburg': 'Hamburg',
  'München': 'Bayern',
  'Köln': 'Nordrhein-Westfalen',
  'Frankfurt': 'Hessen',
  'Stuttgart': 'Baden-Württemberg',
  'Düsseldorf': 'Nordrhein-Westfalen',
  'Leipzig': 'Sachsen',
  'Hannover': 'Niedersachsen',
  'Dresden': 'Sachsen',
  'Nürnberg': 'Bayern',
  'Bremen': 'Bremen',
}

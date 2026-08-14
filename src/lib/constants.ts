export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "THEGND",
  tagline: "Das Premium-Verzeichnis für Escorts, Agenturen & Clubs",
  description:
    "Verifizierte Escort-Profile, echte Bewertungen, direkte Kontaktaufnahme. Diskret, sicher und ohne Umwege — in der ganzen Schweiz.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  email: "support@thegnd.net",
} as const;

export const GENDER_LABEL: Record<string, string> = {
  FEMALE: "Frau",
  MALE: "Mann",
  TRANS_FEMALE: "Trans (w)",
  TRANS_MALE: "Trans (m)",
  NON_BINARY: "Non-binär",
  COUPLE: "Paar",
};

/**
 * Alle Kategorien, die in Bestandsdaten vorkommen können — für Anzeige und
 * Filter. Zum *Auswählen* siehe `PROFILE_KIND_LABEL`.
 */
export const KIND_LABEL: Record<string, string> = {
  INDEPENDENT: "Independent",
  AGENCY_MODEL: "Agentur-Model",
  AGENCY: "Agentur",
  CLUB: "Club",
  STUDIO: "Studio",
  MASSAGE: "Massage",
  TRANS: "Trans",
  COUPLE: "Paar",
};

/**
 * Kategorien für ein *persönliches* Inserat.
 *
 * Agentur, Club, Studio und Massagesalon sind Häuser und werden über
 * `Agency` geführt — mit Standort, Öffnungszeiten, Team und eigener
 * Prüfung. Standen sie hier zur Auswahl, legten Betreiberinnen versehentlich
 * ein Escort-Profil an und hatten danach kein Haus.
 */
export const PROFILE_KIND_LABEL: Record<string, string> = {
  INDEPENDENT: "Independent",
  AGENCY_MODEL: "Agentur-Model",
  TRANS: "Trans",
  COUPLE: "Paar",
};

/** Kategorien, die eigentlich ein Haus beschreiben. */
export const HOUSE_LIKE_PROFILE_KINDS = ["AGENCY", "CLUB", "STUDIO", "MASSAGE"] as const;

export const ORIENTATION_LABEL: Record<string, string> = {
  HETERO: "Hetero",
  HOMO: "Homosexuell",
  BI: "Bisexuell",
  PAN: "Pansexuell",
  ASK: "Frag mich",
};

export const BODY_LABEL: Record<string, string> = {
  SLIM: "Schlank",
  ATHLETIC: "Sportlich",
  AVERAGE: "Normal",
  CURVY: "Kurvig",
  BBW: "Mollig",
  MUSCULAR: "Muskulös",
};

export const HAIR_LABEL: Record<string, string> = {
  BLONDE: "Blond",
  BROWN: "Braun",
  BLACK: "Schwarz",
  RED: "Rot",
  GREY: "Grau",
  COLORED: "Gefärbt",
  BALD: "Glatze",
};

export const HAIR_LENGTH_LABEL: Record<string, string> = {
  SHORT: "Kurz",
  MEDIUM: "Mittel",
  LONG: "Lang",
};

export const EYE_LABEL: Record<string, string> = {
  BLUE: "Blau",
  GREEN: "Grün",
  BROWN: "Braun",
  GREY: "Grau",
  HAZEL: "Haselnuss",
  BLACK: "Schwarz",
};

export const ETHNICITY_LABEL: Record<string, string> = {
  EUROPEAN: "Europäisch",
  LATIN: "Latina/Latino",
  ASIAN: "Asiatisch",
  AFRICAN: "Afrikanisch",
  ARABIC: "Arabisch",
  MIXED: "Gemischt",
  OTHER: "Andere",
};

export const SMOKER_LABEL: Record<string, string> = {
  NO: "Nichtraucher:in",
  OCCASIONALLY: "Gelegentlich",
  YES: "Raucher:in",
};

export const PUBIC_LABEL: Record<string, string> = {
  SHAVED: "Rasiert",
  TRIMMED: "Getrimmt",
  NATURAL: "Natur",
  PARTIAL: "Teilrasur",
};

export const BREAST_LABEL: Record<string, string> = {
  NATURAL: "Natur",
  SILICONE: "Silikon",
};

export const PLACE_LABEL: Record<string, string> = {
  INCALL: "Bei mir",
  OUTCALL: "Hausbesuch / Hotel",
  BOTH: "Bei mir & unterwegs",
};

export const BOOKING_STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Angefragt",
  ACCEPTED: "Bestätigt",
  DECLINED: "Abgelehnt",
  CANCELLED: "Storniert",
  COMPLETED: "Abgeschlossen",
  NO_SHOW: "Nicht erschienen",
};

export const PROFILE_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Entwurf",
  PENDING_REVIEW: "In Prüfung",
  ACTIVE: "Online",
  PAUSED: "Pausiert",
  REJECTED: "Abgelehnt",
  ARCHIVED: "Archiviert",
};

export const VERIFICATION_LABEL: Record<string, string> = {
  NONE: "Nicht verifiziert",
  PHOTO: "Foto-verifiziert",
  ID: "Ausweis-verifiziert",
  PREMIUM: "Premium-verifiziert",
};

export const BOOST_LABEL: Record<string, string> = {
  BUMP: "Nach oben schieben",
  TOP_LISTING: "Top-Platzierung",
  SPOTLIGHT: "Startseiten-Spotlight",
  BANNER: "Werbebanner",
  HIGHLIGHT: "Farb-Highlight",
  STORY_PIN: "Story anheften",
};

export const REPORT_REASON_LABEL: Record<string, string> = {
  FAKE: "Fake-Profil / falsche Bilder",
  SPAM: "Spam oder Werbung",
  ILLEGAL: "Illegale Inhalte",
  UNDERAGE: "Verdacht auf Minderjährigkeit",
  HARASSMENT: "Belästigung",
  COPYRIGHT: "Urheberrechtsverletzung",
  TRAFFICKING: "Verdacht auf Zwang / Menschenhandel",
  OTHER: "Sonstiges",
};

export const CUP_SIZES = ["A", "B", "C", "D", "DD", "E", "F", "G", "H+"];
export const DRESS_SIZES = ["32", "34", "36", "38", "40", "42", "44", "46", "48+"];
export const SHOE_SIZES = ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46+"];

export const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
export const WEEKDAYS_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

export const DURATIONS = [
  { minutes: 30, label: "30 Min" },
  { minutes: 60, label: "1 Stunde" },
  { minutes: 90, label: "1,5 Stunden" },
  { minutes: 120, label: "2 Stunden" },
  { minutes: 180, label: "3 Stunden" },
  { minutes: 360, label: "6 Stunden" },
  { minutes: 720, label: "12 Stunden" },
  { minutes: 1440, label: "24 Stunden" },
];

/** Credit-Preise für kostenpflichtige Aktionen. */
export const CREDIT_COSTS = {
  BUMP: 20,
  TOP_LISTING_DAY: 60,
  SPOTLIGHT_DAY: 150,
  HIGHLIGHT_WEEK: 90,
  STORY_PIN: 25,
  BANNER_DAY: 200,
  UNLOCK_PRIVATE_MEDIA: 15,
  CONTACT_REVEAL: 5,
} as const;

export const MAIN_NAV = [
  { href: "/escorts", label: "Escorts" },
  { href: "/staedte", label: "Städte" },
  { href: "/agenturen", label: "Agenturen & Clubs" },
  { href: "/feed", label: "Feed" },
  { href: "/magazin", label: "Magazin" },
] as const;

export const FOOTER_NAV = [
  {
    title: "Entdecken",
    links: [
      { href: "/escorts", label: "Alle Profile" },
      { href: "/escorts?verified=1", label: "Verifizierte Profile" },
      { href: "/escorts?online=1", label: "Jetzt online" },
      { href: "/escorts?sort=new", label: "Neu dabei" },
      { href: "/touren", label: "Tourplan" },
      { href: "/staedte", label: "Städte A–Z" },
    ],
  },
  {
    title: "Für Anbieter:innen",
    links: [
      { href: "/inserieren", label: "Kostenlos inserieren" },
      { href: "/preise", label: "Preise & Pakete" },
      { href: "/verifizierung", label: "Verifizierung" },
      { href: "/ratgeber/sicherheit", label: "Sicherheits-Guide" },
      { href: "/dashboard", label: "Mein Dashboard" },
    ],
  },
  {
    title: "Hilfe",
    links: [
      { href: "/faq", label: "Häufige Fragen" },
      { href: "/kontakt", label: "Kontakt" },
      { href: "/sicherheit", label: "Sicherheit & Schutz" },
      { href: "/melden", label: "Inhalt melden" },
    ],
  },
  {
    title: "Rechtliches",
    links: [
      { href: "/agb", label: "AGB" },
      { href: "/datenschutz", label: "Datenschutz" },
      { href: "/impressum", label: "Impressum" },
      { href: "/richtlinien", label: "Community-Richtlinien" },
      { href: "/2257", label: "18 U.S.C. 2257" },
    ],
  },
] as const;

export const AGENCY_KIND_LABEL: Record<string, string> = {
  AGENCY: "Escort-Agentur",
  CLUB: "Nachtclub",
  STUDIO: "Studio / Laufhaus",
  MASSAGE: "Massagesalon",
  SAUNA: "Sauna- / FKK-Club",
  BAR: "Bar & Cabaret",
};

/** Ausstattungsmerkmale von Häusern — Schlüssel = Spalte in `Agency`. */
export const AGENCY_AMENITIES = [
  { key: "isOpen24h", label: "24 h geöffnet" },
  { key: "hasParking", label: "Parkplätze" },
  { key: "hasBar", label: "Bar vor Ort" },
  { key: "acceptsCards", label: "Kartenzahlung" },
  { key: "barrierFree", label: "Barrierefrei" },
] as const;

export const AGENCY_SORT_OPTIONS = [
  { value: "relevance", label: "Empfohlen" },
  { value: "models", label: "Meiste Models" },
  { value: "new", label: "Neueste zuerst" },
  { value: "name", label: "Name A–Z" },
  { value: "price_asc", label: "Preis aufsteigend" },
] as const;

export const WEEKDAY_LABEL = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
export const WEEKDAY_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

export const SORT_OPTIONS = [
  { value: "relevance", label: "Empfohlen" },
  { value: "new", label: "Neueste zuerst" },
  { value: "online", label: "Zuletzt online" },
  { value: "rating", label: "Beste Bewertung" },
  { value: "price_asc", label: "Preis aufsteigend" },
  { value: "price_desc", label: "Preis absteigend" },
  { value: "views", label: "Beliebteste" },
] as const;

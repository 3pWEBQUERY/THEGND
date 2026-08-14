/**
 * Seed für THEGND.
 *   npm run db:push && npm run db:seed
 *
 * Legt Stammdaten (Länder, Städte, Sprachen, Services, Pakete, Geschenke),
 * Magazin-Artikel sowie ein Admin-Konto und Demo-Profile an.
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const pick = <T>(arr: readonly T[], i: number) => arr[i % arr.length];
const rand = (min: number, max: number, seed: number) =>
  min + Math.floor((Math.sin(seed) * 10000 - Math.floor(Math.sin(seed) * 10000)) * (max - min + 1));

// ── Stammdaten ───────────────────────────────────────────────────────────────

const COUNTRIES = [
  // Start ausschliesslich in der Schweiz — weitere Länder folgen später.
  { code: "CH", name: "Switzerland", nameDe: "Schweiz", flag: "🇨🇭" },
];

const CITIES: Record<string, { name: string; lat: number; lng: number; region?: string; popular?: boolean }[]> = {
  CH: [
    { name: "Zürich", lat: 47.3769, lng: 8.5417, region: "Zürich", popular: true },
    { name: "Genf", lat: 46.2044, lng: 6.1432, region: "Genf", popular: true },
    { name: "Basel", lat: 47.5596, lng: 7.5886, region: "Basel-Stadt", popular: true },
    { name: "Bern", lat: 46.948, lng: 7.4474, region: "Bern", popular: true },
    { name: "Lausanne", lat: 46.5197, lng: 6.6323, region: "Waadt", popular: true },
    { name: "Luzern", lat: 47.0502, lng: 8.3093, region: "Luzern", popular: true },
    { name: "Winterthur", lat: 47.5001, lng: 8.7501, region: "Zürich", popular: true },
    { name: "St. Gallen", lat: 47.4245, lng: 9.3767, region: "St. Gallen", popular: true },
    { name: "Lugano", lat: 46.0037, lng: 8.9511, region: "Tessin", popular: true },
    { name: "Biel/Bienne", lat: 47.1368, lng: 7.2467, region: "Bern" },
    { name: "Thun", lat: 46.758, lng: 7.6279, region: "Bern" },
    { name: "Köniz", lat: 46.9245, lng: 7.4148, region: "Bern" },
    { name: "La Chaux-de-Fonds", lat: 47.0995, lng: 6.8259, region: "Neuenburg" },
    { name: "Freiburg", lat: 46.8065, lng: 7.1615, region: "Freiburg" },
    { name: "Schaffhausen", lat: 47.6979, lng: 8.6308, region: "Schaffhausen" },
    { name: "Chur", lat: 46.8508, lng: 9.5320, region: "Graubünden" },
    { name: "Neuenburg", lat: 46.9925, lng: 6.9311, region: "Neuenburg" },
    { name: "Sitten", lat: 46.2331, lng: 7.3606, region: "Wallis" },
    { name: "Vernier", lat: 46.2170, lng: 6.0854, region: "Genf" },
    { name: "Uster", lat: 47.3473, lng: 8.7210, region: "Zürich" },
    { name: "Zug", lat: 47.1662, lng: 8.5155, region: "Zug" },
    { name: "Yverdon-les-Bains", lat: 46.7785, lng: 6.6410, region: "Waadt" },
    { name: "Emmen", lat: 47.0800, lng: 8.3000, region: "Luzern" },
    { name: "Kriens", lat: 47.0347, lng: 8.2789, region: "Luzern" },
    { name: "Rapperswil-Jona", lat: 47.2265, lng: 8.8180, region: "St. Gallen" },
    { name: "Dübendorf", lat: 47.3970, lng: 8.6180, region: "Zürich" },
    { name: "Dietikon", lat: 47.4017, lng: 8.4004, region: "Zürich" },
    { name: "Montreux", lat: 46.4312, lng: 6.9107, region: "Waadt" },
    { name: "Frauenfeld", lat: 47.5536, lng: 8.8986, region: "Thurgau" },
    { name: "Wil", lat: 47.4625, lng: 9.0450, region: "St. Gallen" },
    { name: "Baden", lat: 47.4762, lng: 8.3064, region: "Aargau" },
    { name: "Aarau", lat: 47.3925, lng: 8.0442, region: "Aargau" },
    { name: "Olten", lat: 47.3500, lng: 7.9039, region: "Solothurn" },
    { name: "Solothurn", lat: 47.2088, lng: 7.5323, region: "Solothurn" },
    { name: "Bellinzona", lat: 46.1944, lng: 9.0175, region: "Tessin" },
    { name: "Locarno", lat: 46.1700, lng: 8.7990, region: "Tessin" },
    { name: "Kreuzlingen", lat: 47.6500, lng: 9.1747, region: "Thurgau" },
    { name: "Wetzikon", lat: 47.3264, lng: 8.7975, region: "Zürich" },
    { name: "Horgen", lat: 47.2597, lng: 8.5981, region: "Zürich" },
    { name: "Interlaken", lat: 46.6863, lng: 7.8632, region: "Bern" },
    { name: "Davos", lat: 46.8027, lng: 9.8360, region: "Graubünden" },
    { name: "St. Moritz", lat: 46.4908, lng: 9.8355, region: "Graubünden" },
    { name: "Zermatt", lat: 46.0207, lng: 7.7491, region: "Wallis" },
    { name: "Liestal", lat: 47.4840, lng: 7.7350, region: "Basel-Landschaft" },
    { name: "Schwyz", lat: 47.0207, lng: 8.6530, region: "Schwyz" },
    { name: "Herisau", lat: 47.3860, lng: 9.2790, region: "Appenzell Ausserrhoden" },
    { name: "Glarus", lat: 47.0404, lng: 9.0680, region: "Glarus" },
    { name: "Altdorf", lat: 46.8804, lng: 8.6440, region: "Uri" },
    { name: "Sarnen", lat: 46.8958, lng: 8.2455, region: "Obwalden" },
    { name: "Stans", lat: 46.9580, lng: 8.3660, region: "Nidwalden" },
    { name: "Delsberg", lat: 47.3644, lng: 7.3441, region: "Jura" },
    { name: "Appenzell", lat: 47.3316, lng: 9.4090, region: "Appenzell Innerrhoden" },
  ],
};

const LANGUAGES = [
  { code: "de", name: "Deutsch", nameEn: "German", flag: "🇩🇪" },
  { code: "en", name: "Englisch", nameEn: "English", flag: "🇬🇧" },
  { code: "fr", name: "Französisch", nameEn: "French", flag: "🇫🇷" },
  { code: "es", name: "Spanisch", nameEn: "Spanish", flag: "🇪🇸" },
  { code: "it", name: "Italienisch", nameEn: "Italian", flag: "🇮🇹" },
  { code: "ru", name: "Russisch", nameEn: "Russian", flag: "🇷🇺" },
  { code: "pl", name: "Polnisch", nameEn: "Polish", flag: "🇵🇱" },
  { code: "ro", name: "Rumänisch", nameEn: "Romanian", flag: "🇷🇴" },
  { code: "hu", name: "Ungarisch", nameEn: "Hungarian", flag: "🇭🇺" },
  { code: "cs", name: "Tschechisch", nameEn: "Czech", flag: "🇨🇿" },
  { code: "tr", name: "Türkisch", nameEn: "Turkish", flag: "🇹🇷" },
  { code: "pt", name: "Portugiesisch", nameEn: "Portuguese", flag: "🇵🇹" },
  { code: "th", name: "Thailändisch", nameEn: "Thai", flag: "🇹🇭" },
  { code: "zh", name: "Chinesisch", nameEn: "Chinese", flag: "🇨🇳" },
  { code: "ar", name: "Arabisch", nameEn: "Arabic", flag: "🇸🇦" },
];

/**
 * Dienstleistungs-Katalog.
 *
 * `scope` steuert, wo eine Kategorie zur Auswahl steht:
 *   BOTH    — persönliche Inserate und Häuser
 *   PROFILE — nur persönliche Inserate
 *   AGENCY  — nur Häuser (Club, Studio, Sauna, Bar)
 */
const SERVICE_CATEGORIES: {
  name: string;
  nameEn: string;
  icon: string;
  scope?: "BOTH" | "PROFILE" | "AGENCY";
  services: [string, string][];
}[] = [
  {
    name: "Begleitung",
    nameEn: "Companionship",
    icon: "sparkles",
    services: [
      ["Dinner-Date", "Dinner date"],
      ["Übernachtung", "Overnight"],
      ["Reisebegleitung", "Travel companion"],
      ["Event-Begleitung", "Event companion"],
      ["Städtereise", "City trip"],
      ["Kino & Theater", "Cinema & theatre"],
      ["Business-Begleitung", "Business companion"],
      ["Wochenende", "Weekend"],
      ["Messe & Kongress", "Trade fair & congress"],
      ["Shopping-Begleitung", "Shopping companion"],
      ["Wellness & Spa", "Wellness & spa"],
      ["Fotoshooting", "Photo shoot"],
    ],
  },
  {
    name: "Massage",
    nameEn: "Massage",
    icon: "hand",
    services: [
      ["Erotische Massage", "Erotic massage"],
      ["Tantra-Massage", "Tantra massage"],
      ["Nuru-Massage", "Nuru massage"],
      ["Ganzkörpermassage", "Full body massage"],
      ["Prostata-Massage", "Prostate massage"],
      ["Body-to-Body", "Body to body"],
      ["Öl-Massage", "Oil massage"],
      ["Hot-Stone-Massage", "Hot stone massage"],
      ["Vier-Hände-Massage", "Four hands massage"],
      ["Fussmassage", "Foot massage"],
      ["Kopf- & Nackenmassage", "Head & neck massage"],
    ],
  },
  {
    name: "Service",
    nameEn: "Service",
    icon: "heart",
    services: [
      ["Küssen", "Kissing"],
      ["Französisch", "Oral"],
      ["Girlfriend Experience", "Girlfriend experience"],
      ["Pornstar Experience", "Pornstar experience"],
      ["Zungenküsse", "French kissing"],
      ["Duschen zusammen", "Shower together"],
      ["Striptease", "Striptease"],
      ["Dirty Talk", "Dirty talk"],
      ["69", "69"],
      ["Handentspannung", "Hand relief"],
      ["Kuscheln", "Cuddling"],
      ["Gemeinsam baden", "Bathing together"],
      ["Telefon- & Videoservice", "Phone & video service"],
      ["Sexting", "Sexting"],
    ],
  },
  {
    name: "Vorlieben",
    nameEn: "Preferences",
    icon: "flame",
    scope: "PROFILE",
    services: [
      ["Rollenspiele", "Role play"],
      ["Dessous", "Lingerie"],
      ["Highheels", "High heels"],
      ["Fusserotik", "Foot fetish"],
      ["Latex & Lack", "Latex & PVC"],
      ["Bondage (soft)", "Soft bondage"],
      ["Dominanz", "Domination"],
      ["Devot", "Submissive"],
      ["Nylons & Strümpfe", "Nylons & stockings"],
      ["Uniformen", "Uniforms"],
      ["Cosplay", "Cosplay"],
      ["Augenbinde", "Blindfold"],
      ["Federspiele", "Feather play"],
      ["Spanking (leicht)", "Light spanking"],
      ["Toys", "Toys"],
      ["Wachsspiele", "Wax play"],
    ],
  },
  {
    name: "Konstellation",
    nameEn: "Constellation",
    icon: "users",
    services: [
      ["Paare", "Couples"],
      ["Duo-Service", "Duo service"],
      ["Gruppen", "Groups"],
      ["Damenbesuch", "Female clients"],
      ["Behinderte willkommen", "Disabled welcome"],
      ["Senioren willkommen", "Seniors welcome"],
      ["Trio", "Threesome"],
      ["Swinger", "Swingers"],
      ["Paare mit Anleitung", "Coaching for couples"],
      ["Junggesellenabschied", "Stag & hen party"],
    ],
  },
  {
    // Nur für Häuser: beschreibt das Haus, nicht eine Person.
    name: "Haus & Ambiente",
    nameEn: "Venue & amenities",
    icon: "building",
    scope: "AGENCY",
    services: [
      ["Bar & Getränke", "Bar & drinks"],
      ["Buffet", "Buffet"],
      ["Sauna", "Sauna"],
      ["Dampfbad", "Steam bath"],
      ["Whirlpool", "Whirlpool"],
      ["Pool", "Pool"],
      ["Separées", "Private booths"],
      ["Bühne & Show", "Stage & show"],
      ["Themenabende", "Theme nights"],
      ["Zimmer stundenweise", "Rooms by the hour"],
      ["Übernachtung im Haus", "Overnight stay on site"],
      ["Duschen & Garderobe", "Showers & lockers"],
      ["Shuttle-Service", "Shuttle service"],
      ["Raucherbereich", "Smoking area"],
    ],
  },
];

const PACKAGES = [
  // Beträge in Rappen (CHF).
  { name: "Starter", credits: 100, bonus: 0, priceCents: 1000, description: "Zum Ausprobieren." },
  { name: "Standard", credits: 300, bonus: 30, priceCents: 2500, description: "Der Klassiker.", popular: true },
  { name: "Pro", credits: 750, bonus: 125, priceCents: 4900, description: "Für regelmässige Sichtbarkeit." },
  { name: "Business", credits: 2000, bonus: 500, priceCents: 11900, description: "Für Agenturen & Clubs." },
];

const GIFTS = [
  { name: "Rose", emoji: "🌹", credits: 10 },
  { name: "Sekt", emoji: "🥂", credits: 25 },
  { name: "Pralinen", emoji: "🍫", credits: 40 },
  { name: "Parfum", emoji: "💐", credits: 75 },
  { name: "Diamant", emoji: "💎", credits: 150 },
  { name: "Krone", emoji: "👑", credits: 300 },
  { name: "Herz", emoji: "❤️", credits: 15 },
  { name: "Cocktail", emoji: "🍸", credits: 20 },
];

type Oeffnung = Record<number, [string, string] | undefined>;

/** Abend-/Nachtbetrieb: Mo–Do 18–02, Fr/Sa 18–04, So geschlossen. */
const NACHT: Oeffnung = {
  1: ["18:00", "02:00"],
  2: ["18:00", "02:00"],
  3: ["18:00", "02:00"],
  4: ["18:00", "02:00"],
  5: ["18:00", "04:00"],
  6: ["18:00", "04:00"],
};
/** Tagesbetrieb: Mo–Sa 10–22, So geschlossen. */
const TAG: Oeffnung = {
  1: ["10:00", "22:00"],
  2: ["10:00", "22:00"],
  3: ["10:00", "22:00"],
  4: ["10:00", "22:00"],
  5: ["10:00", "22:00"],
  6: ["10:00", "22:00"],
};
/** Bürozeiten einer Agentur: täglich 12–24. */
const BUERO: Oeffnung = {
  0: ["14:00", "24:00"],
  1: ["12:00", "24:00"],
  2: ["12:00", "24:00"],
  3: ["12:00", "24:00"],
  4: ["12:00", "24:00"],
  5: ["12:00", "24:00"],
  6: ["12:00", "24:00"],
};

const AGENCIES: {
  slug: string;
  name: string;
  kind: "AGENCY" | "CLUB" | "STUDIO" | "MASSAGE" | "SAUNA" | "BAR";
  headline: string;
  about: string;
  city: string;
  district?: string;
  street: string;
  zip: string;
  phone: string;
  lat: number;
  lng: number;
  priceFrom?: number;
  verified?: boolean;
  open24?: boolean;
  parking?: boolean;
  bar?: boolean;
  cards?: boolean;
  barrierFree?: boolean;
  hours: Oeffnung;
  services: string[];
  langs: string[];
}[] = [
  {
    slug: "maison-noir-zuerich",
    name: "Maison Noir",
    kind: "AGENCY",
    headline: "Diskrete Begleitagentur seit 2014",
    about:
      "Seit 2014 stehen wir für diskrete, hochwertige Begleitung in Zürich und der ganzen Deutschschweiz. Alle Models sind persönlich bekannt, verifiziert und arbeiten selbstbestimmt. Anfragen bearbeiten wir täglich von 12 bis 24 Uhr — auf Wunsch auch mit kurzfristiger Vermittlung.",
    city: "Zürich",
    district: "Altstadt",
    street: "Bahnhofstrasse 1",
    zip: "8001",
    phone: "+41 44 123 45 67",
    lat: 47.3712,
    lng: 8.5394,
    priceFrom: 400,
    verified: true,
    cards: true,
    hours: BUERO,
    services: ["dinner-date", "uebernachtung", "reisebegleitung", "event-begleitung", "business-begleitung"],
    langs: ["de", "en", "fr", "it"],
  },
  {
    slug: "club-velvet-zuerich",
    name: "Club Velvet",
    kind: "CLUB",
    headline: "Nachtclub im Kreis 4",
    about:
      "Sechs Zimmer, eigene Bar und ein Team, das seit Jahren zusammenarbeitet. Getränke und Zimmer werden getrennt abgerechnet, alle Preise hängen sichtbar aus. Ab 23 Uhr gilt Türauswahl.",
    city: "Zürich",
    district: "Kreis 4",
    street: "Langstrasse 88",
    zip: "8004",
    phone: "+41 44 222 33 44",
    lat: 47.3782,
    lng: 8.5299,
    priceFrom: 150,
    verified: true,
    bar: true,
    cards: true,
    parking: true,
    hours: NACHT,
    services: ["erotische-massage", "striptease", "duschen-zusammen", "girlfriend-experience"],
    langs: ["de", "en", "es", "pt"],
  },
  {
    slug: "studio-lumiere-basel",
    name: "Studio Lumière",
    kind: "STUDIO",
    headline: "Privatstudio mit vier Zimmern",
    about:
      "Ruhiges Studio in Gehdistanz zum Bahnhof SBB. Vier individuell eingerichtete Zimmer, eigener Eingang, Duschen auf jeder Etage. Termine nach Vereinbarung, spontane Besuche nach telefonischer Rückfrage.",
    city: "Basel",
    street: "Güterstrasse 120",
    zip: "4053",
    phone: "+41 61 333 22 11",
    lat: 47.5459,
    lng: 7.5892,
    priceFrom: 180,
    verified: true,
    barrierFree: true,
    cards: true,
    hours: TAG,
    services: ["erotische-massage", "tantra-massage", "ganzkoerpermassage", "nuru-massage"],
    langs: ["de", "en", "fr"],
  },
  {
    slug: "sauna-aurora-bern",
    name: "Sauna Aurora",
    kind: "SAUNA",
    headline: "FKK- und Saunaclub mit grossem Wellnessbereich",
    about:
      "Finnische Sauna, Dampfbad, Whirlpool und ein grosser Ruhebereich. Der Eintritt deckt Sauna, Buffet und alkoholfreie Getränke ab; Zimmerzeiten werden direkt mit den Damen vereinbart. Parkplätze im Haus.",
    city: "Bern",
    street: "Industriestrasse 14",
    zip: "3007",
    phone: "+41 31 444 55 66",
    lat: 46.9385,
    lng: 7.4243,
    priceFrom: 90,
    verified: true,
    parking: true,
    bar: true,
    cards: true,
    barrierFree: true,
    hours: {
      1: ["11:00", "23:00"],
      2: ["11:00", "23:00"],
      3: ["11:00", "23:00"],
      4: ["11:00", "01:00"],
      5: ["11:00", "03:00"],
      6: ["11:00", "03:00"],
      0: ["13:00", "23:00"],
    },
    services: ["erotische-massage", "paare", "duo-service", "duschen-zusammen"],
    langs: ["de", "fr", "en"],
  },
  {
    slug: "le-rendezvous-geneve",
    name: "Le Rendez-vous",
    kind: "AGENCY",
    headline: "Agence d'escorte internationale",
    about:
      "Zweisprachige Agentur mit Sitz in Genf. Wir vermitteln Begleitung für Abendessen, Empfänge und Reisen — auch kurzfristig und über die Kantonsgrenze hinaus. Buchungen bevorzugt schriftlich mit Vorlauf.",
    city: "Genf",
    district: "Pâquis",
    street: "Rue de Berne 42",
    zip: "1201",
    phone: "+41 22 777 88 99",
    lat: 46.2116,
    lng: 6.1470,
    priceFrom: 500,
    verified: true,
    cards: true,
    hours: BUERO,
    services: ["dinner-date", "reisebegleitung", "event-begleitung", "uebernachtung"],
    langs: ["fr", "en", "de", "it", "es"],
  },
  {
    slug: "oasis-massage-lausanne",
    name: "Oasis Massage",
    kind: "MASSAGE",
    headline: "Salon de massage — Tantra & Wellness",
    about:
      "Kleiner Salon mit drei Behandlungsräumen, geführt von einem festen Team. Schwerpunkt auf Tantra- und Körpermassagen, jeweils 60 oder 90 Minuten. Termine online oder telefonisch.",
    city: "Lausanne",
    street: "Avenue de la Gare 17",
    zip: "1003",
    phone: "+41 21 555 66 77",
    lat: 46.5178,
    lng: 6.6320,
    priceFrom: 140,
    barrierFree: true,
    hours: TAG,
    services: ["tantra-massage", "erotische-massage", "ganzkoerpermassage", "body-to-body"],
    langs: ["fr", "en", "pt"],
  },
  {
    slug: "casa-rosa-lugano",
    name: "Casa Rosa",
    kind: "CLUB",
    headline: "Club privato vicino al lago",
    about:
      "Familiär geführter Club mit sechs Zimmern, Terrasse und Bar. Im Sommer ist die Terrasse bis Mitternacht offen. Wir sprechen Italienisch, Deutsch und Englisch.",
    city: "Lugano",
    street: "Via Nassa 25",
    zip: "6900",
    phone: "+41 91 222 11 00",
    lat: 46.0018,
    lng: 8.9477,
    priceFrom: 160,
    bar: true,
    parking: true,
    hours: NACHT,
    services: ["erotische-massage", "paare", "striptease"],
    langs: ["it", "de", "en"],
  },
  {
    slug: "nachtbar-embassy-winterthur",
    name: "Nachtbar Embassy",
    kind: "BAR",
    headline: "Cabaret-Bar mit Begleitung",
    about:
      "Klassische Nachtbar mit Bühne und Separées. Eintritt frei, Konsumation ab CHF 60. Begleitung an der Bar nach Absprache — Zimmerzeiten im Haus nebenan.",
    city: "Winterthur",
    street: "Technikumstrasse 8",
    zip: "8400",
    phone: "+41 52 111 22 33",
    lat: 47.4988,
    lng: 8.7245,
    priceFrom: 60,
    bar: true,
    cards: true,
    hours: NACHT,
    services: ["striptease", "dessous", "dirty-talk"],
    langs: ["de", "en", "hu", "ro"],
  },
  {
    slug: "residenz-24-st-gallen",
    name: "Residenz 24",
    kind: "STUDIO",
    headline: "Laufhaus — durchgehend geöffnet",
    about:
      "Zwölf eigenständig vermietete Zimmer auf drei Etagen, rund um die Uhr besetzt. Jede Mieterin bestimmt Preise und Leistungen selbst. Empfang und Sicherheitsdienst sind permanent vor Ort.",
    city: "St. Gallen",
    street: "Zürcherstrasse 204",
    zip: "9000",
    phone: "+41 71 888 99 00",
    lat: 47.4222,
    lng: 9.3453,
    priceFrom: 100,
    open24: true,
    parking: true,
    barrierFree: true,
    hours: {},
    services: ["erotische-massage", "franzoesisch", "girlfriend-experience", "duschen-zusammen"],
    langs: ["de", "en", "ro", "hu", "th"],
  },
  {
    slug: "belle-epoque-luzern",
    name: "Belle Époque",
    kind: "AGENCY",
    headline: "Begleitung für Anlässe in der Zentralschweiz",
    about:
      "Kleine Agentur mit acht festen Models. Wir arbeiten ohne Vermittlungsgebühr für Gäste; abgerechnet wird direkt mit dem Model. Anfragen beantworten wir in der Regel innerhalb einer Stunde.",
    city: "Luzern",
    street: "Pilatusstrasse 30",
    zip: "6003",
    phone: "+41 41 333 44 55",
    lat: 47.0475,
    lng: 8.3045,
    priceFrom: 350,
    verified: true,
    hours: BUERO,
    services: ["dinner-date", "event-begleitung", "uebernachtung", "staedtereise"],
    langs: ["de", "en", "fr"],
  },
];

const ARTICLES = [
  {
    title: "Sicher unterwegs: Der Screening-Leitfaden für Anbieter:innen",
    category: "sicherheit",
    excerpt: "Vom ersten Kontakt bis zum Türöffnen — ein praxiserprobter Ablauf, der Risiken deutlich senkt.",
    tags: ["sicherheit", "screening", "praxis"],
    readMinutes: 8,
    body: `Sicherheit beginnt lange vor dem Termin. Wer ein festes Verfahren hat, muss im Einzelfall nicht improvisieren — und genau das ist der Punkt.

## Der erste Kontakt
Achte darauf, wie jemand schreibt. Respektvolle Anfragen mit klaren Angaben zu Zeit, Ort und Wunschdauer sind ein gutes Zeichen. Druck, Feilschen oder Grenzüberschreitungen im Chat sind ein Ausschlusskriterium — konsequent, ohne Diskussion.

## Verifikation
- Kurzer Telefon- oder Videocall vor der Zusage
- Bei Hotelbesuchen: Anruf über die Rezeption
- Bei Hausbesuchen: vollständige Adresse und Klingelname im Voraus

## Der Sicherheitskontakt
Teile einer Vertrauensperson Ort, Uhrzeit und den Namen des Kontakts mit. Vereinbart eine Rückmeldezeit und ein Codewort für den Notfall. Es gibt Apps, die einen Timer mit automatischem Alarm bieten.

## Zahlung
Vereinbare den Betrag vorab schriftlich. Kein Bargeldtransfer an Unbekannte, keine Gutscheincodes, keine Krypto-Vorkasse an neue Kontakte — das sind die häufigsten Betrugsmuster.

## Abbruchkriterien
Alkohol- oder Drogeneinfluss, Missachtung von Grenzen, unerwartete weitere Personen vor Ort: In all diesen Fällen ist Abbruch die richtige Entscheidung. Kein Termin ist ein Risiko wert.`,
  },
  {
    title: "Ein Profil, das gebucht wird: Fotos, Text und Preise richtig setzen",
    category: "ratgeber",
    excerpt: "Warum die ersten drei Sekunden entscheiden — und wie du sie für dich nutzt.",
    tags: ["profil", "marketing", "fotos"],
    readMinutes: 6,
    body: `Ein Profil ist ein Schaufenster. Es muss in Sekunden vermitteln, wer du bist und was Gäste erwartet.

## Das Titelbild
Ein scharfes, gut ausgeleuchtetes Bild schlägt jedes aufwendig bearbeitete. Natürliches Licht am Fenster, ruhiger Hintergrund, Blick in die Kamera. Keine überzogenen Filter — Enttäuschung vor Ort ist der teuerste Fehler.

## Der Text
Schreib in deiner eigenen Stimme. Drei kurze Absätze reichen:
- Wer du bist und was dir wichtig ist
- Wie ein Treffen mit dir abläuft
- Was du dir von Gästen wünschst

Vermeide Textbausteine und Superlative. Konkretes wirkt.

## Preise
Transparente Preise filtern Anfragen vor und sparen beiden Seiten Zeit. Staffelungen für 30 Minuten, eine Stunde und längere Buchungen sind Standard. Aufpreise gehören sichtbar ins Profil, nicht in die Nachverhandlung.

## Aktualität
Profile, die regelmässig gepflegt und nach oben geschoben werden, erhalten deutlich mehr Aufrufe. Ein Update pro Woche genügt.`,
  },
  {
    title: "Etikette für Gäste: Was einen guten Eindruck macht",
    category: "ratgeber",
    excerpt: "Höflichkeit ist keine Formalität, sondern die Grundlage für ein entspanntes Treffen.",
    tags: ["etikette", "gäste"],
    readMinutes: 5,
    body: `Wer sich an ein paar einfache Regeln hält, bekommt schneller Zusagen und angenehmere Treffen.

## Die Anfrage
Stell dich kurz vor, nenne Wunschtermin, Dauer und Ort. Verzichte auf explizite Details in der ersten Nachricht. Eine klare, freundliche Anfrage wird fast immer beantwortet.

## Pünktlichkeit und Hygiene
Sei pünktlich — nicht zu früh, nicht zu spät. Dusche vorher, frische Kleidung, geputzte Zähne. Das ist die Mindestvoraussetzung, keine Zusatzleistung.

## Grenzen
Die Angaben im Profil sind verbindlich. Nachverhandeln vor Ort ist ein Tabu. Ein "Nein" ist endgültig und braucht keine Begründung.

## Diskretion
Keine Fotos, keine Aufnahmen, keine Weitergabe von Kontaktdaten. Diskretion gilt in beide Richtungen und ist die Basis des Vertrauens.`,
  },
  {
    title: "Selbstständig als Escort in der Schweiz: Anmeldung, Steuern, Buchhaltung",
    category: "business",
    excerpt: "Ein nüchterner Überblick über die formalen Pflichten — und warum vieles vom Kanton abhängt.",
    tags: ["steuern", "ahv", "business", "schweiz"],
    readMinutes: 9,
    body: `Dieser Artikel ersetzt keine Rechts- oder Steuerberatung. Er zeigt, worum du dich kümmern solltest — und wo du die verbindliche Auskunft bekommst.

## Sexarbeit ist legal — geregelt wird kantonal
In der Schweiz ist Sexarbeit eine erlaubte Erwerbstätigkeit. Die konkreten Regeln setzen aber die Kantone und teilweise die Gemeinden: Melde- und Bewilligungspflichten, zulässige Zonen und Betriebsvorschriften unterscheiden sich deutlich. Was in Zürich gilt, gilt nicht automatisch in Genf, Bern oder im Tessin.

**Erste Anlaufstelle:** die Kantonspolizei bzw. die zuständige kantonale Stelle deines Arbeitsorts. Frag dort vor dem Start nach, was für dich gilt — schriftlich, damit du es belegen kannst.

## Selbstständig oder angestellt
Diese Einordnung entscheidet über deine Sozialversicherungen. Wer selbstständig arbeitet, meldet sich bei der kantonalen AHV-Ausgleichskasse an; diese prüft und bestätigt den Status. Ohne diese Anerkennung kann eine vermeintliche Selbstständigkeit im Nachhinein als Anstellung eingestuft werden — mit Nachzahlungen.

## Sozialversicherungen
- AHV/IV/EO über die Ausgleichskasse — Beiträge auf dem Erwerbseinkommen
- Krankenversicherung: obligatorisch, individuell abzuschliessen
- Unfall und Vorsorge (Säule 3a): bei Selbstständigkeit freiwillig, aber dringend zu empfehlen

## Steuern
- Einkommenssteuer bei Bund, Kanton und Gemeinde auf dem Gewinn
- Mehrwertsteuer erst ab dem gesetzlichen Umsatzschwellenwert — die aktuelle Grenze und die Abrechnungsart erfährst du bei der Eidgenössischen Steuerverwaltung
- Steuersätze sind kantonal sehr unterschiedlich; plane Rückstellungen von Beginn an ein

## Ausländische Staatsangehörigkeit
Ob und wie du arbeiten darfst, hängt von deinem Aufenthaltstitel ab. Kläre das vor der ersten Buchung mit dem kantonalen Migrationsamt. Das Meldeverfahren für kurze Einsätze hat eigene Fristen.

## Buchhaltung
Führe von Anfang an eine einfache Einnahmen-Ausgaben-Rechnung. Belege für Fahrtkosten, Hotel, Werbung, Kleidung und Hygieneartikel sammeln — vieles davon ist abzugsfähig. Ein separates Konto für das Geschäft macht die Steuererklärung erheblich einfacher.

## Beratung
Fachstellen für Sexarbeit beraten in der Schweiz kostenlos und vertraulich — zu Recht, Gesundheit und Steuern. Diese Beratung ist unabhängig von Behörden und lohnt sich vor dem Start.`,
  },
  {
    title: "Fake-Profile erkennen: Sieben Warnsignale",
    category: "sicherheit",
    excerpt: "Woran du unseriöse Inserate erkennst, bevor du Zeit oder Geld verlierst.",
    tags: ["fakes", "sicherheit", "betrug"],
    readMinutes: 4,
    body: `Verifizierte Profile reduzieren das Risiko erheblich. Wo das Badge fehlt, hilft ein prüfender Blick.

## Die Warnsignale
- Preise deutlich unter dem Marktniveau
- Ausschliesslich professionelle Studiofotos ohne Alltagsbilder
- Drängen auf Vorkasse, besonders per Gutscheincode oder Krypto
- Ausweichende Antworten auf einfache Rückfragen
- Kontaktverlagerung auf externe Messenger in der ersten Nachricht
- Identische Texte auf mehreren Portalen
- Keine oder ausschliesslich generische Bewertungen

## Der Gegencheck
Eine umgekehrte Bildersuche entlarvt gestohlene Fotos in Sekunden. Und: Seriöse Anbieter:innen haben kein Problem mit einem kurzen Videocall.

Melde verdächtige Profile — jede Meldung hilft allen anderen.`,
  },
  {
    title: "Verifizierung: Warum sich das blaue Badge auszahlt",
    category: "plattform",
    excerpt: "Was hinter der Prüfung steckt, was mit den Daten passiert und was es bringt.",
    tags: ["verifizierung", "vertrauen"],
    readMinutes: 4,
    body: `Das Verifizierungs-Badge ist mehr als Dekoration: Es ist der wichtigste Vertrauensfaktor auf jeder Plattform dieser Art.

## Was geprüft wird
Ein amtliches Ausweisdokument und ein Selfie mit handschriftlichem Code. Beides wird manuell abgeglichen — kein Automatismus, keine Gesichtserkennung Dritter.

## Was mit den Daten passiert
Dokumente werden verschlüsselt gespeichert, sind ausschliesslich für geprüftes Moderationspersonal einsehbar und werden spätestens 90 Tage nach der Prüfung gelöscht.

## Was es bringt
- Das Badge in Suche, Liste und Profil
- Ein spürbarer Ranking-Bonus
- Deutlich mehr und ernsthaftere Anfragen

Die Verifizierung ist kostenlos und freiwillig — aber praktisch immer die richtige Entscheidung.`,
  },
];

// ── Demo-Profile ─────────────────────────────────────────────────────────────

const NAMES = [
  "Sophia", "Valentina", "Amelie", "Luna", "Elena", "Mia", "Isabella", "Nina",
  "Carmen", "Yara", "Alina", "Jasmin", "Chiara", "Leonie", "Vanessa", "Marie",
  "Anastasia", "Emilia", "Nora", "Selina", "Lara", "Melissa", "Diana", "Larissa",
];

const HEADLINES = [
  "Diskrete Begleitung mit Niveau",
  "Zeit für echte Zweisamkeit",
  "Elegant, herzlich, unkompliziert",
  "Dein Gegenüber auf Augenhöhe",
  "Stilvolle Momente, ehrlich gelebt",
  "Charme trifft Leidenschaft",
  "Mehr als nur ein schöner Abend",
  "Natürlich, warmherzig, aufmerksam",
];

const ABOUTS = [
  `Ich mag Gespräche, die nicht bei Small Talk stehen bleiben, gutes Essen und Abende, die man nicht plant. Wenn du jemanden suchst, der wirklich zuhört und nicht auf die Uhr schaut, bist du bei mir richtig.

Ich lege Wert auf gegenseitigen Respekt, Hygiene und Diskretion — das ist für mich keine Verhandlungssache, sondern Grundlage. Termine gerne mit etwas Vorlauf, spontan geht manchmal auch.`,

  `Aufgewachsen zwischen zwei Kulturen, seit einigen Jahren in dieser Stadt zu Hause. Ich reise gern, lese noch lieber und koche für Menschen, die ich mag.

Bei mir bekommst du keine Schablone, sondern ein echtes Gegenüber. Ich nehme mir Zeit, frage nach und interessiere mich wirklich. Was daraus wird, entscheiden wir gemeinsam — in deinem Tempo.`,

  `Ich bin gerne unterwegs: Restaurant, Konzert, Wochenendtrip. Genauso gerne bleibe ich zu Hause mit gutem Wein und einem langen Gespräch.

Erwarte keine Show. Erwarte jemanden, der entspannt ist, lacht und dir das Gefühl gibt, willkommen zu sein. Anfragen bitte mit ein paar Worten zu dir — das macht es für uns beide leichter.`,

  `Nach einem langen Tag brauchst du kein Programm, sondern jemanden, bei dem du ankommen kannst. Genau das kann ich gut.

Ich bin ehrlich, humorvoll und ziemlich neugierig. Meine Fotos sind aktuell und unbearbeitet — was du siehst, ist was dich erwartet. Diskretion ist selbstverständlich, in beide Richtungen.`,
];

async function main() {
  console.info("→ Seed startet…");

  // Länder & Städte
  for (const country of COUNTRIES) {
    const created = await db.country.upsert({
      where: { code: country.code },
      update: {},
      create: { ...country, slug: slugify(country.nameDe) },
    });

    for (const city of CITIES[country.code] ?? []) {
      await db.city.upsert({
        where: { countryId_slug: { countryId: created.id, slug: slugify(city.name) } },
        update: { isPopular: city.popular ?? false, region: city.region },
        create: {
          name: city.name,
          slug: slugify(city.name),
          lat: city.lat,
          lng: city.lng,
          region: city.region,
          isPopular: city.popular ?? false,
          countryId: created.id,
          heroImage: `https://picsum.photos/seed/${slugify(city.name)}-city/600/750`,
          seoText: `Begleitung in ${city.name} finden: verifizierte Profile mit Fotos, klaren Preisen, Services und echten Bewertungen. Filtere nach Alter, Sprache, Figur oder Verfügbarkeit und nimm direkt Kontakt auf — diskret und ohne Vermittlung.`,
        },
      });
    }
  }
  console.info("  ✓ Länder & Städte");

  // Sprachen
  for (const language of LANGUAGES) {
    await db.language.upsert({ where: { code: language.code }, update: {}, create: language });
  }
  console.info("  ✓ Sprachen");

  // Services
  for (const [index, category] of SERVICE_CATEGORIES.entries()) {
    const created = await db.serviceCategory.upsert({
      where: { slug: slugify(category.name) },
      update: { position: index, scope: category.scope ?? "BOTH" },
      create: {
        slug: slugify(category.name),
        name: category.name,
        nameEn: category.nameEn,
        icon: category.icon,
        position: index,
        scope: category.scope ?? "BOTH",
      },
    });

    for (const [pos, [name, nameEn]] of category.services.entries()) {
      await db.service.upsert({
        where: { slug: slugify(name) },
        update: { position: pos },
        create: { slug: slugify(name), name, nameEn, categoryId: created.id, position: pos },
      });
    }
  }
  console.info("  ✓ Services");

  // Pakete & Geschenke
  for (const [index, pkg] of PACKAGES.entries()) {
    await db.package.upsert({
      where: { slug: slugify(pkg.name) },
      update: { ...pkg, slug: slugify(pkg.name), position: index },
      create: { ...pkg, slug: slugify(pkg.name), position: index },
    });
  }
  for (const [index, gift] of GIFTS.entries()) {
    await db.giftItem.upsert({
      where: { slug: slugify(gift.name) },
      update: {},
      create: { ...gift, slug: slugify(gift.name), position: index },
    });
  }
  console.info("  ✓ Pakete & Geschenke");

  // Magazin
  for (const [index, article] of ARTICLES.entries()) {
    await db.blogPost.upsert({
      where: { slug: slugify(article.title) },
      update: {},
      create: {
        slug: slugify(article.title),
        title: article.title,
        excerpt: article.excerpt,
        body: article.body,
        category: article.category,
        tags: article.tags,
        readMinutes: article.readMinutes,
        published: true,
        publishedAt: new Date(Date.now() - index * 5 * 864e5),
        coverUrl: `https://picsum.photos/seed/gnd-article-${index}/1200/675`,
      },
    });
  }
  console.info("  ✓ Magazin");

  // Admin
  const adminEmail = process.env.ADMIN_EMAILS?.split(",")[0]?.trim() || "admin@thegnd.net";
  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", status: "ACTIVE" },
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash("Admin1234!", 12),
      displayName: "Administration",
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
      ageConfirmedAt: new Date(),
      termsAcceptedAt: new Date(),
      credits: 10000,
      referralCode: "admin-root",
    },
  });
  console.info(`  ✓ Admin: ${admin.email} / Admin1234!`);

  // Demo-Mitglied
  const member = await db.user.upsert({
    where: { email: "demo@thegnd.net" },
    update: {},
    create: {
      email: "demo@thegnd.net",
      passwordHash: await bcrypt.hash("Demo1234!", 12),
      displayName: "Demo Mitglied",
      role: "MEMBER",
      status: "ACTIVE",
      emailVerified: new Date(),
      ageConfirmedAt: new Date(),
      termsAcceptedAt: new Date(),
      credits: 500,
      referralCode: "demo-member",
      lastSeenAt: new Date(),
    },
  });

  // Demo-Profile
  const cities = await db.city.findMany({ select: { id: true, name: true } });
  const services = await db.service.findMany({ select: { id: true } });
  const languages = await db.language.findMany({ select: { id: true, code: true } });
  const passwordHash = await bcrypt.hash("Demo1234!", 12);

  const genders = ["FEMALE", "FEMALE", "FEMALE", "FEMALE", "TRANS_FEMALE", "MALE"] as const;
  const bodies = ["SLIM", "ATHLETIC", "AVERAGE", "CURVY"] as const;
  const hairs = ["BLONDE", "BROWN", "BLACK", "RED"] as const;
  const eyes = ["BLUE", "GREEN", "BROWN", "GREY"] as const;
  const ethnicities = ["EUROPEAN", "LATIN", "ASIAN", "MIXED", "ARABIC"] as const;
  const cups = ["A", "B", "C", "D", "DD", "E"];

  let created = 0;

  for (const [index, name] of NAMES.entries()) {
    const email = `${slugify(name)}${index}@demo.thegnd.net`;
    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) continue;

    const city = pick(cities, index * 3 + 1);
    const age = rand(21, 38, index + 1);
    const priceHour = [150, 180, 200, 250, 300, 350, 400, 500][index % 8];
    const verified = index % 3 !== 2;
    const online = index % 4 === 0;

    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        displayName: name,
        role: "ESCORT",
        status: "ACTIVE",
        emailVerified: new Date(),
        ageConfirmedAt: new Date(),
        termsAcceptedAt: new Date(),
        credits: 250,
        referralCode: `${slugify(name)}-${index}`,
        lastSeenAt: online ? new Date() : new Date(Date.now() - rand(1, 96, index) * 36e5),
      },
    });

    const profileServices = services
      .filter((_, i) => (i + index) % 4 === 0)
      .slice(0, 12)
      .map((service) => ({ serviceId: service.id }));

    const profileLanguages = languages
      .filter((_, i) => i < 2 || (i + index) % 7 === 0)
      .slice(0, 4)
      .map((language, i) => ({ languageId: language.id, level: i === 0 ? 5 : rand(2, 4, index + i) }));

    const mediaData: Prisma.MediaCreateWithoutProfileInput[] = Array.from({ length: rand(4, 8, index) }, (_, i) => ({
      key: `demo/${slugify(name)}-${i}.jpg`,
      url: `https://picsum.photos/seed/gnd-${slugify(name)}-${i}/900/1200`,
      thumbUrl: `https://picsum.photos/seed/gnd-${slugify(name)}-${i}/600/800`,
      type: "IMAGE",
      width: 900,
      height: 1200,
      position: i,
      isCover: i === 0,
      moderation: "APPROVED",
      visibility: i > 4 ? "PRIVATE" : "PUBLIC",
      unlockCost: i > 4 ? 15 : 0,
    }));

    const profile = await db.profile.create({
      data: {
        userId: user.id,
        slug: `${slugify(name)}-${city.name.toLowerCase().slice(0, 3)}${index}`,
        displayName: name,
        headline: pick(HEADLINES, index),
        about: pick(ABOUTS, index),
        status: "ACTIVE",
        kind: index % 9 === 0 ? "AGENCY_MODEL" : index % 11 === 0 ? "MASSAGE" : "INDEPENDENT",
        gender: pick(genders, index),
        orientation: index % 3 === 0 ? "BI" : "HETERO",
        birthDate: new Date(Date.now() - age * 31557600000),
        displayAge: age,
        nationality: pick(["Deutsch", "Italienisch", "Spanisch", "Rumänisch", "Ungarisch", "Brasilianisch"], index),
        ethnicity: pick(ethnicities, index),
        heightCm: rand(160, 180, index + 3),
        weightKg: rand(50, 68, index + 5),
        bodyType: pick(bodies, index),
        cupSize: pick(cups, index),
        breastType: index % 4 === 0 ? "SILICONE" : "NATURAL",
        dressSize: pick(["34", "36", "38", "40"], index),
        hairColor: pick(hairs, index),
        hairLength: pick(["SHORT", "MEDIUM", "LONG"] as const, index),
        eyeColor: pick(eyes, index),
        pubicHair: pick(["SHAVED", "TRIMMED", "NATURAL"] as const, index),
        smoker: index % 5 === 0 ? "OCCASIONALLY" : "NO",
        tattoos: index % 3 === 0,
        piercings: index % 4 === 0,
        hasCar: index % 3 === 0,
        acceptsCouples: index % 3 === 0,
        travelsWorldwide: index % 6 === 0,
        phone: `+41 44 ${100 + index} ${10 + index} ${20 + index}`,
        showPhone: index % 5 !== 0,
        whatsapp: index % 3 === 0 ? `+4144${1000000 + index * 137}` : null,
        contactNote: "Anfragen bitte mit Wunschtermin und Dauer. Ich antworte in der Regel innerhalb einer Stunde.",
        cityId: city.id,
        district: pick(["Altstadt", "Kreis 4", "Zentrum", "Nord", "West"], index),
        meetingPlace: index % 4 === 0 ? "INCALL" : index % 4 === 1 ? "OUTCALL" : "BOTH",
        radiusKm: 50,
        currency: "CHF",
        priceHalfHour: Math.round(priceHour * 0.65),
        priceHour,
        priceTwoHours: priceHour * 2 - 50,
        priceNight: priceHour * 8,
        priceNote: "Die Preise verstehen sich inklusive Anfahrt im Stadtgebiet. Hotelbesuche nach Absprache.",
        isVerified: verified,
        verificationLevel: verified ? (index % 5 === 0 ? "PREMIUM" : "ID") : "NONE",
        isFeatured: index % 7 === 0,
        isNew: index % 6 === 0,
        viewCount: rand(120, 9800, index + 11),
        favoriteCount: rand(3, 240, index + 13),
        rankScore: rand(10, 100, index + 17),
        bumpedAt: new Date(Date.now() - rand(1, 72, index) * 36e5),
        publishedAt: new Date(Date.now() - rand(1, 240, index) * 864e5),
        lastActiveAt: online ? new Date() : new Date(Date.now() - rand(1, 96, index) * 36e5),
        media: { create: mediaData },
        services: { create: profileServices },
        languages: { create: profileLanguages },
        rates: {
          create: [
            { minutes: 30, price: Math.round(priceHour * 0.65), place: "BOTH", position: 0 },
            { minutes: 60, price: priceHour, place: "BOTH", position: 1 },
            { minutes: 120, price: priceHour * 2 - 50, place: "BOTH", position: 2 },
            { minutes: 720, price: priceHour * 8, place: "OUTCALL", position: 3 },
          ],
        },
        workingHours: {
          create: Array.from({ length: 7 }, (_, weekday) => ({
            weekday,
            from: weekday === 0 ? "14:00" : "11:00",
            to: weekday >= 5 ? "03:00" : "23:00",
            closed: weekday === 1 && index % 4 === 0,
          })),
        },
        verification: {
          create: {
            status: verified ? "APPROVED" : "NOT_STARTED",
            level: verified ? "ID" : "NONE",
            reviewedAt: verified ? new Date() : null,
          },
        },
      },
    });

    // Touren für einige Profile
    if (index % 4 === 0) {
      const tourCity = pick(cities, index * 7 + 3);
      if (tourCity.id !== city.id) {
        const from = new Date(Date.now() + rand(3, 40, index) * 864e5);
        await db.tour.create({
          data: {
            profileId: profile.id,
            cityId: tourCity.id,
            from,
            to: new Date(from.getTime() + rand(2, 6, index) * 864e5),
            note: "Hotelbesuche und Dinner-Dates möglich.",
          },
        });
      }
    }

    // Beiträge
    if (index % 3 === 0) {
      await db.post.create({
        data: {
          profileId: profile.id,
          body: pick(
            [
              "Diese Woche noch zwei Termine frei — schreibt mir gerne. ✨",
              "Neue Bilder sind online. Ich freue mich über Feedback!",
              "Ab Freitag bin ich für ein paar Tage in einer anderen Stadt — Details im Tourplan.",
              "Danke für die vielen lieben Nachrichten. Ich antworte nach und nach auf alle.",
            ],
            index,
          ),
          mediaUrl: index % 6 === 0 ? `https://picsum.photos/seed/gnd-post-${index}/1000/750` : null,
          mediaType: index % 6 === 0 ? "IMAGE" : null,
          likeCount: rand(2, 90, index),
          moderation: "APPROVED",
          createdAt: new Date(Date.now() - rand(1, 200, index) * 36e5),
        },
      });
    }

    // Bewertungen
    if (index % 2 === 0) {
      const rating = rand(4, 5, index);
      await db.review.create({
        data: {
          profileId: profile.id,
          authorId: member.id,
          rating,
          ratingLooks: rating,
          ratingService: rating,
          ratingCharm: rating,
          ratingHygiene: 5,
          ratingValue: rand(4, 5, index + 2),
          title: pick(["Absolut empfehlenswert", "Sehr angenehmer Abend", "Genau wie beschrieben"], index),
          body: "Sehr sympathisch, pünktlich und exakt so wie im Profil beschrieben. Die Kommunikation vorab war unkompliziert und klar. Ein rundum entspannter Abend, gerne wieder.",
          status: "PUBLISHED",
          isVerifiedMeeting: index % 4 === 0,
          createdAt: new Date(Date.now() - rand(2, 90, index) * 864e5),
        },
      });

      const stats = await db.review.aggregate({
        where: { profileId: profile.id, status: "PUBLISHED" },
        _avg: { rating: true },
        _count: true,
      });
      await db.profile.update({
        where: { id: profile.id },
        data: { ratingAvg: stats._avg.rating ?? 0, reviewCount: stats._count },
      });
    }

    created++;
  }

  console.info(`  ✓ ${created} Demo-Profile`);

  // ── Agenturen, Clubs & Studios ────────────────────────────────────────────
  const stadtNach = new Map(cities.map((c) => [c.name, c.id]));
  const alleServices = await db.service.findMany({ select: { id: true, slug: true } });
  const serviceNach = new Map(alleServices.map((s) => [s.slug, s.id]));
  const alleSprachen = await db.language.findMany({ select: { id: true, code: true } });
  const spracheNach = new Map(alleSprachen.map((l) => [l.code, l.id]));

  let agenturen = 0;
  for (const haus of AGENCIES) {
    const cityId = stadtNach.get(haus.city);
    if (!cityId) continue;

    const daten = {
      name: haus.name,
      kind: haus.kind,
      headline: haus.headline,
      about: haus.about,
      logoUrl: `https://picsum.photos/seed/${haus.slug}-logo/200/200`,
      coverUrl: `https://picsum.photos/seed/${haus.slug}-cover/1600/700`,
      website: "https://example.com",
      phone: haus.phone,
      email: `kontakt@${haus.slug}.example.com`,
      street: haus.street,
      zip: haus.zip,
      cityName: haus.city,
      district: haus.district ?? null,
      cityId,
      countryCode: "CH",
      lat: haus.lat,
      lng: haus.lng,
      priceFrom: haus.priceFrom ?? null,
      currency: "CHF",
      isOpen24h: haus.open24 ?? false,
      hasParking: haus.parking ?? false,
      hasBar: haus.bar ?? false,
      acceptsCards: haus.cards ?? false,
      barrierFree: haus.barrierFree ?? false,
      isVerified: haus.verified ?? false,
      isPublished: true,
    } as const;

    const agency = await db.agency.upsert({
      where: { slug: haus.slug },
      update: daten,
      create: { slug: haus.slug, ...daten },
    });

    // Verknüpfungen jedes Mal neu setzen, damit der Seed wiederholbar bleibt.
    await db.agencyService.deleteMany({ where: { agencyId: agency.id } });
    await db.agencyService.createMany({
      data: haus.services.flatMap((slug) => {
        const serviceId = serviceNach.get(slug);
        return serviceId ? [{ agencyId: agency.id, serviceId }] : [];
      }),
      skipDuplicates: true,
    });

    await db.agencyLanguage.deleteMany({ where: { agencyId: agency.id } });
    await db.agencyLanguage.createMany({
      data: haus.langs.flatMap((code) => {
        const languageId = spracheNach.get(code);
        return languageId ? [{ agencyId: agency.id, languageId }] : [];
      }),
      skipDuplicates: true,
    });

    await db.agencyHour.deleteMany({ where: { agencyId: agency.id } });
    if (!haus.open24) {
      await db.agencyHour.createMany({
        data: [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
          const zeiten = haus.hours[weekday];
          return zeiten
            ? { agencyId: agency.id, weekday, opensAt: zeiten[0], closesAt: zeiten[1], closed: false }
            : { agencyId: agency.id, weekday, closed: true };
        }),
      });
    }
    agenturen++;
  }

  // Demo-Models auf die Häuser ihrer Stadt verteilen — sonst steht überall 0.
  const haeuser = await db.agency.findMany({ select: { id: true, cityId: true } });
  const nachStadt = new Map<string, string>();
  for (const h of haeuser) if (h.cityId && !nachStadt.has(h.cityId)) nachStadt.set(h.cityId, h.id);

  const demoModels = await db.profile.findMany({
    where: { agencyId: null, user: { email: { endsWith: "@demo.thegnd.net" } } },
    select: { id: true, cityId: true },
  });
  let zugeordnet = 0;
  for (const [index, model] of demoModels.entries()) {
    if (index % 2 !== 0 || !model.cityId) continue; // nur etwa die Hälfte
    const agencyId = nachStadt.get(model.cityId);
    if (!agencyId) continue;
    await db.profile.update({ where: { id: model.id }, data: { agencyId, kind: "AGENCY_MODEL" } });
    zugeordnet++;
  }

  // Betreiber-Konto für „Maison Noir“ — damit der Hausbereich im Dashboard
  // ohne Handarbeit ausprobierbar ist.
  const maison = await db.agency.findUnique({ where: { slug: "maison-noir-zuerich" }, select: { id: true } });
  if (maison) {
    const betreiber = await db.user.upsert({
      where: { email: "agentur@demo.thegnd.net" },
      update: {},
      create: {
        email: "agentur@demo.thegnd.net",
        passwordHash: await bcrypt.hash("Demo1234!", 12),
        displayName: "Maison Noir — Verwaltung",
        role: "AGENCY",
        status: "ACTIVE",
        emailVerified: new Date(),
        ageConfirmedAt: new Date(),
        termsAcceptedAt: new Date(),
      },
    });
    await db.agencyMember.upsert({
      where: { agencyId_userId: { agencyId: maison.id, userId: betreiber.id } },
      update: { role: "OWNER" },
      create: { agencyId: maison.id, userId: betreiber.id, role: "OWNER" },
    });
  }

  console.info(`  ✓ ${agenturen} Häuser · ${zugeordnet} Models zugeordnet`);

  console.info("✅ Seed abgeschlossen.\n");
  console.info("   Admin:  " + adminEmail + " / Admin1234!");
  console.info("   Member: demo@thegnd.net / Demo1234!");
  console.info("   Escort: sophia0@demo.thegnd.net / Demo1234!");
  console.info("   Haus:   agentur@demo.thegnd.net / Demo1234!\n");
}

main()
  .catch((error) => {
    console.error("❌ Seed fehlgeschlagen:", error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

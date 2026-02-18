"use client";

import { Calendar, Droplets, Eye, Link2, Puzzle, Smile, Waves } from "lucide-react";

type Props = {
  value: string;
  label: string;
};

export type Category =
  | "social"
  | "bdsm"
  | "massage"
  | "oral"
  | "anal"
  | "fetish"
  | "toys"
  | "fluids"
  | "roleplay"
  | "other";

// Explicit overrides for specific service keys (values from SERVICES_DE)
const CATEGORY_OVERRIDES: Record<string, Category> = {
  gfe: "social",
  "girlfriend-massage": "massage",
  "escort-dinner": "social",
  "couple-service": "social",
  "duo-service": "social",
  "overnight": "social",
  "travel-companion": "social",
  "photo-video-allowed": "other",
};

const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  social: "Dates & Begleitung außerhalb des Zimmers (Dinner, Reisen, Events)",
  bdsm: "Dominanz, Submission, Bondage und verwandte Praktiken",
  massage: "Entspannungs- und Wellnessmassagen (z. B. Tantra, Nuru)",
  oral: "Mündliche Stimulation und verwandte Services",
  anal: "Analbezogene Spiele (z. B. Rimming, Strap-on)",
  fetish: "Fetisch- und Vorlieben (z. B. Heels, Latex, Worship)",
  toys: "Einsatz von Toys (z. B. Dildo, Vibrator)",
  fluids: "Flüssigkeiten (z. B. CIM, COB, Squirting, Natursekt)",
  roleplay: "Rollenspiele & Verkleidungen (Uniformen, Szenarien)",
  other: "Sonstige Services",
};

// Optional: service-spezifische Beschreibungen
const SERVICE_DESCRIPTIONS: Record<string, string> = {
  bbbj: "Französisch ohne Kondom (nach Absprache)",
  cbj: "Französisch mit Kondom",
  "deep-throat": "Tiefer Rachen (Deepthroat)",
  facesitting: "Gesichtssitzen",
  "tantra-massage": "Intuitive, sinnliche Massage (Tantra)",
  "nuru-massage": "Körper-zu-Körper Massage mit Gel",
  "strap-on-pegging": "Strap-On Einsatz (Pegging)",
  rimming: "Anale Stimulation mit Zunge (aktiv oder passiv)",
  "escort-dinner": "Begleitung zu Dinner/Veranstaltungen",
  "travel-companion": "Reisebegleitung",
  gfe: "Girlfriend Experience – vertrauter, naher Stil",
};

export function getCategoryDescription(cat: Category): string {
  return CATEGORY_DESCRIPTIONS[cat] || CATEGORY_DESCRIPTIONS.other;
}

function getBubbleTone(category: Category): { bubble: string; arrowBg: string; arrowBorder: string } {
  switch (category) {
    case 'social':
      return { bubble: 'bg-blue-50 border-blue-200', arrowBg: 'bg-blue-50', arrowBorder: 'border-blue-200' }
    case 'bdsm':
      return { bubble: 'bg-purple-50 border-purple-200', arrowBg: 'bg-purple-50', arrowBorder: 'border-purple-200' }
    case 'massage':
      return { bubble: 'bg-amber-50 border-amber-200', arrowBg: 'bg-amber-50', arrowBorder: 'border-amber-200' }
    case 'oral':
      return { bubble: 'bg-pink-50 border-pink-200', arrowBg: 'bg-pink-50', arrowBorder: 'border-pink-200' }
    case 'anal':
      return { bubble: 'bg-rose-50 border-rose-200', arrowBg: 'bg-rose-50', arrowBorder: 'border-rose-200' }
    case 'fetish':
      return { bubble: 'bg-teal-50 border-teal-200', arrowBg: 'bg-teal-50', arrowBorder: 'border-teal-200' }
    case 'toys':
      return { bubble: 'bg-indigo-50 border-indigo-200', arrowBg: 'bg-indigo-50', arrowBorder: 'border-indigo-200' }
    case 'fluids':
      return { bubble: 'bg-cyan-50 border-cyan-200', arrowBg: 'bg-cyan-50', arrowBorder: 'border-cyan-200' }
    case 'roleplay':
      return { bubble: 'bg-green-50 border-green-200', arrowBg: 'bg-green-50', arrowBorder: 'border-green-200' }
    default:
      return { bubble: 'bg-gray-50 border-gray-200', arrowBg: 'bg-gray-50', arrowBorder: 'border-gray-200' }
  }
}

export function getCategory(value: string):
  | "social"
  | "bdsm"
  | "massage"
  | "oral"
  | "anal"
  | "fetish"
  | "toys"
  | "fluids"
  | "roleplay"
  | "other" {
  const ov = CATEGORY_OVERRIDES[value];
  if (ov) return ov;
  const v = value.toLowerCase();
  if (
    v.includes("date") ||
    v.includes("companion") ||
    v.includes("travel") ||
    v.includes("dinner") ||
    v.includes("event") ||
    v.includes("party") ||
    v.includes("club") ||
    v.includes("spa") ||
    v.includes("sauna") ||
    v.includes("shopping") ||
    v.includes("museum") ||
    v.includes("festival") ||
    v.includes("yacht") ||
    v.includes("drive") ||
    v.includes("trip")
  )
    return "social";

  if (
    v.includes("bdsm") ||
    v.includes("bondage") ||
    v.includes("domination") ||
    v.includes("submission") ||
    v.includes("spanking") ||
    v.includes("cbt") ||
    v.includes("ballbusting") ||
    v.includes("shibari") ||
    v.includes("chastity") ||
    v.includes("humiliation")
  )
    return "bdsm";

  if (
    v.includes("massage") ||
    v.includes("tantra") ||
    v.includes("nuru") ||
    v.includes("aroma") ||
    v.includes("thai") ||
    v.includes("sports-massage") ||
    v.includes("hot-stone") ||
    v.includes("foot-massage") ||
    v.includes("back-massage") ||
    v.includes("head-massage")
  )
    return "massage";

  if (
    v.includes("oral") ||
    v.includes("bbbj") ||
    v.includes("cbj") ||
    v.includes("handjob") ||
    v.includes("titjob") ||
    v.includes("footjob") ||
    v.includes("deep-throat") ||
    v.includes("facesitting")
  )
    return "oral";

  if (v.includes("anal") || v.includes("rimming") || v.includes("atm") || v.includes("strap-on")) return "anal";

  if (
    v.includes("fetish") ||
    v.includes("heels") ||
    v.includes("latex") ||
    v.includes("leather") ||
    v.includes("stockings") ||
    v.includes("pantyhose") ||
    v.includes("worship") ||
    v.includes("smell") ||
    v.includes("voyeur") ||
    v.includes("exhibition")
  )
    return "fetish";

  if (v.includes("toy") || v.includes("dildo") || v.includes("vibrator")) return "toys";

  if (
    v.includes("cum") ||
    v.includes("cim") ||
    v.includes("cob") ||
    v.includes("squirting") ||
    v.includes("watersports") ||
    v.includes("creampie")
  )
    return "fluids";

  if (v.includes("roleplay") || v.includes("uniform") || v.includes("teacher") || v.includes("nurse") || v.includes("maid") || v.includes("police") || v.includes("boss-secretary") || v.includes("cosplay"))
    return "roleplay";

  return "other";
}

export function getClasses(category: ReturnType<typeof getCategory>) {
  switch (category) {
    case "social":
      return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
    case "bdsm":
      return "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100";
    case "massage":
      return "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100";
    case "oral":
      return "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100";
    case "anal":
      return "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100";
    case "fetish":
      return "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100";
    case "toys":
      return "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100";
    case "fluids":
      return "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100";
    case "roleplay":
      return "bg-green-50 text-green-700 border-green-200 hover:bg-green-100";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100";
  }
}

function getAccentBarClass(category: Category): string {
  switch (category) {
    case "social":
      return "bg-blue-500";
    case "bdsm":
      return "bg-purple-500";
    case "massage":
      return "bg-amber-500";
    case "oral":
      return "bg-pink-500";
    case "anal":
      return "bg-rose-500";
    case "fetish":
      return "bg-teal-500";
    case "toys":
      return "bg-indigo-500";
    case "fluids":
      return "bg-cyan-500";
    case "roleplay":
      return "bg-green-500";
    default:
      return "bg-gray-300";
  }
}

export function getIcon(category: ReturnType<typeof getCategory>) {
  switch (category) {
    case "massage":
      return <Waves className="h-3.5 w-3.5" />;
    case "bdsm":
      return <Link2 className="h-3.5 w-3.5" />;
    case "fetish":
      return <Eye className="h-3.5 w-3.5" />;
    case "toys":
      return <Puzzle className="h-3.5 w-3.5" />;
    case "roleplay":
      return <Calendar className="h-3.5 w-3.5" />;
    case "fluids":
      return <Droplets className="h-3.5 w-3.5" />;
    case "oral":
      return <Smile className="h-3.5 w-3.5" />;
    default:
      return null;
  }
}

export default function ServiceTag({ value, label }: Props) {
  const category = getCategory(value);
  const classes = getClasses(category);
  const Icon = getIcon(category);
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1.5 border text-xs font-medium rounded-none ${classes}`}>
      {Icon}
      <span>{label}</span>
    </span>
  );
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Wir starten ausschliesslich in der Schweiz: Schweizer Formate, Franken. */
export const LOCALE = "de-CH";
export const CURRENCY = "CHF";

export function formatPrice(value?: number | null, currency = CURRENCY) {
  if (value === null || value === undefined) return "auf Anfrage";
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCents(cents: number, currency = CURRENCY) {
  return new Intl.NumberFormat(LOCALE, { style: "currency", currency }).format(cents / 100);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat(LOCALE).format(value);
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

const RTF = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
const DIVISIONS: [number, Intl.RelativeTimeFormatUnit][] = [
  [60, "second"],
  [60, "minute"],
  [24, "hour"],
  [7, "day"],
  [4.34524, "week"],
  [12, "month"],
  [Number.POSITIVE_INFINITY, "year"],
];

export function timeAgo(date: Date | string | number) {
  let duration = (new Date(date).getTime() - Date.now()) / 1000;
  for (const [amount, unit] of DIVISIONS) {
    if (Math.abs(duration) < amount) return RTF.format(Math.round(duration), unit);
    duration /= amount;
  }
  return RTF.format(Math.round(duration), "year");
}

export function formatDate(date: Date | string, opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", ...opts }).format(new Date(date));
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

export function ageFromBirthdate(birthDate?: Date | string | null) {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  const diff = Date.now() - b.getTime();
  return Math.floor(diff / 31557600000);
}

export function isOnline(lastSeenAt?: Date | string | null, windowMinutes = 10) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < windowMinutes * 60_000;
}

export function initials(name?: string | null) {
  if (!name) return "??";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function truncate(text: string, length = 160) {
  if (text.length <= length) return text;
  return `${text.slice(0, length).trimEnd()}…`;
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/** Macht aus einem app-relativen Pfad eine absolute URL. Bereits absolute
 *  Adressen (z. B. CDN-Medien) bleiben unverändert. */
export function absoluteUrl(path = "") {
  if (/^https?:\/\//i.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out;
}

export function range(n: number) {
  return Array.from({ length: n }, (_, i) => i);
}

/** Deterministischer Pseudo-Zufall für stabile Platzhalter-Bilder. */
export function hashCode(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

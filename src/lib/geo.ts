/**
 * Geo-Helfer für die Umkreissuche.
 *
 * Bewusst ohne PostGIS: die Datenmengen sind klein genug, dass eine
 * Haversine-Berechnung mit vorgeschaltetem Bounding-Box-Filter reicht.
 * Läuft auf Server und Client.
 */

export const ERDRADIUS_KM = 6371;

/** Grobe Begrenzung der Schweiz — begrenzt Geocoding und Kartenausschnitt. */
export const SCHWEIZ = {
  /** Kartenmittelpunkt beim ersten Öffnen (nahe Luzern). */
  center: { lat: 46.8182, lng: 8.2275 },
  zoom: 8,
  /** [Süd, West, Nord, Ost] — inklusive kleinem Puffer über die Grenze. */
  bounds: { south: 45.7, west: 5.8, north: 47.9, east: 10.6 },
} as const;

export type Punkt = { lat: number; lng: number };

/** Ein Treffer der Ortssuche (`/api/geo/orte`). */
export type Ort = {
  id: string;
  label: string;
  detail: string;
  lat: number;
  lng: number;
  typ: string;
};

const grad = (x: number) => (x * Math.PI) / 180;

/** Luftlinie zwischen zwei Punkten in Kilometern. */
export function distanzKm(a: Punkt, b: Punkt): number {
  const dLat = grad(b.lat - a.lat);
  const dLng = grad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(grad(a.lat)) * Math.cos(grad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * ERDRADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Bounding-Box um einen Punkt. Wird der eigentlichen Distanzrechnung
 * vorgeschaltet, damit Postgres den Index auf (lat, lng) nutzen kann.
 */
export function boundingBox(punkt: Punkt, radiusKm: number) {
  const dLat = radiusKm / 111.32;
  // Längengrade rücken zu den Polen hin zusammen; nahe 90° gegen Division
  // durch null absichern.
  const cos = Math.max(0.01, Math.cos(grad(punkt.lat)));
  const dLng = radiusKm / (111.32 * cos);
  return {
    minLat: punkt.lat - dLat,
    maxLat: punkt.lat + dLat,
    minLng: punkt.lng - dLng,
    maxLng: punkt.lng + dLng,
  };
}

export function istInSchweiz(punkt: Punkt): boolean {
  const b = SCHWEIZ.bounds;
  return punkt.lat >= b.south && punkt.lat <= b.north && punkt.lng >= b.west && punkt.lng <= b.east;
}

/**
 * Koordinate auf ein Raster runden, bevor sie öffentlich wird.
 *
 * Sicherheitsrelevant: Wer keine Adresse freigegeben hat, soll auf der
 * öffentlichen Karte nicht an der Haustür stehen. 0.005° entsprechen rund
 * 500 m — genug für „in dieser Gegend“, zu wenig für „in diesem Haus“.
 */
export function ungefaehr(punkt: Punkt, raster = 0.005): Punkt {
  return {
    lat: Math.round(punkt.lat / raster) * raster,
    lng: Math.round(punkt.lng / raster) * raster,
  };
}

/** Zahl aus einem Query-Parameter, nur wenn sie eine gültige Koordinate ist. */
export function parseKoordinate(wert: unknown, art: "lat" | "lng"): number | undefined {
  const zahl = typeof wert === "number" ? wert : Number(wert);
  if (!Number.isFinite(zahl)) return undefined;
  const grenze = art === "lat" ? 90 : 180;
  return Math.abs(zahl) <= grenze ? zahl : undefined;
}

/** Vorgabewerte für den Umkreis-Regler (km). */
export const RADIUS_STUFEN = [5, 10, 25, 50, 100, 200] as const;
export const RADIUS_STANDARD = 25;

export function formatDistanz(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1).replace(".", ",")} km`;
  return `${Math.round(km)} km`;
}

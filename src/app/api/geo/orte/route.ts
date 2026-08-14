import { NextResponse, type NextRequest } from "next/server";
import { SCHWEIZ, type Ort } from "@/lib/geo";
import { SITE } from "@/lib/constants";

/**
 * Ortssuche über Photon (OpenStreetMap-Daten, komoot).
 *
 * Kostenlos und ohne Schlüssel. Wir rufen den Dienst ausschliesslich vom
 * Server aus auf — so erfährt der Anbieter weder die IP-Adresse noch den
 * User-Agent der Suchenden, was auf dieser Plattform wichtiger ist als die
 * eingesparte Latenz.
 *
 * Fällt Photon aus, übernimmt Nominatim.
 */

export const runtime = "nodejs";

const PHOTON = "https://photon.komoot.io/api/";
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const KONTAKT = process.env.GEOCODING_CONTACT ?? SITE.email;

/** Nominatim verlangt einen aussagekräftigen User-Agent mit Kontaktadresse. */
const kopfzeilen = {
  "User-Agent": `${SITE.name} Umkreissuche (${KONTAKT})`,
  "Accept-Language": "de-CH,de;q=0.9,fr;q=0.8,it;q=0.7",
};

function beschriftung(p: Record<string, string | undefined>) {
  const ort = p.city ?? p.town ?? p.village ?? p.name;
  const teile = [p.name && p.name !== ort ? p.name : null, ort].filter(Boolean);
  const detail = [p.postcode, p.district && p.district !== ort ? p.district : null, p.state]
    .filter(Boolean)
    .join(" · ");
  return { label: teile.join(", ") || (p.name ?? "Unbekannt"), detail };
}

async function viaPhoton(q: string, signal: AbortSignal): Promise<Ort[]> {
  const url = new URL(PHOTON);
  url.searchParams.set("q", q);
  url.searchParams.set("lang", "de");
  url.searchParams.set("limit", "8");
  // Treffer in der Nähe der Schweiz bevorzugen …
  url.searchParams.set("lat", String(SCHWEIZ.center.lat));
  url.searchParams.set("lon", String(SCHWEIZ.center.lng));
  // … und alles ausserhalb des Rechtecks gar nicht erst laden.
  const b = SCHWEIZ.bounds;
  url.searchParams.set("bbox", `${b.west},${b.south},${b.east},${b.north}`);

  const res = await fetch(url, { headers: kopfzeilen, signal, next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Photon ${res.status}`);

  const data = (await res.json()) as {
    features?: { geometry: { coordinates: [number, number] }; properties: Record<string, string> }[];
  };

  return (data.features ?? []).map((f, i) => {
    const { label, detail } = beschriftung(f.properties);
    return {
      id: `photon-${f.properties.osm_id ?? i}`,
      label,
      detail,
      lng: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
      typ: f.properties.osm_value ?? f.properties.type ?? "ort",
    };
  });
}

async function viaNominatim(q: string, signal: AbortSignal): Promise<Ort[]> {
  const url = new URL(NOMINATIM);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");
  url.searchParams.set("countrycodes", "ch");

  const res = await fetch(url, { headers: kopfzeilen, signal, next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);

  const data = (await res.json()) as {
    place_id: number;
    lat: string;
    lon: string;
    name?: string;
    display_name: string;
    type?: string;
    address?: Record<string, string>;
  }[];

  return data.map((t) => {
    const a = t.address ?? {};
    const { label, detail } = beschriftung({
      name: t.name || t.display_name.split(",")[0],
      city: a.city ?? a.town ?? a.village,
      postcode: a.postcode,
      state: a.state,
    });
    return {
      id: `nominatim-${t.place_id}`,
      label,
      detail,
      lat: Number(t.lat),
      lng: Number(t.lon),
      typ: t.type ?? "ort",
    };
  });
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ orte: [] });

  const abbruch = AbortSignal.timeout(6000);

  let orte: Ort[] = [];
  try {
    orte = await viaPhoton(q, abbruch);
  } catch {
    try {
      orte = await viaNominatim(q, abbruch);
    } catch {
      return NextResponse.json(
        { orte: [], fehler: "Die Ortssuche ist gerade nicht erreichbar." },
        { status: 503 },
      );
    }
  }

  // Doppelte Beschriftungen zusammenfassen — beide Dienste liefern gern
  // mehrere Einträge für denselben Ort.
  const gesehen = new Set<string>();
  const eindeutig = orte.filter((o) => {
    const schluessel = `${o.label}|${o.lat.toFixed(3)}|${o.lng.toFixed(3)}`;
    if (gesehen.has(schluessel)) return false;
    gesehen.add(schluessel);
    return true;
  });

  return NextResponse.json(
    { orte: eindeutig },
    { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } },
  );
}

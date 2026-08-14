import { NextResponse, type NextRequest } from "next/server";
import { parseKoordinate } from "@/lib/geo";
import { SITE } from "@/lib/constants";

/**
 * Rückwärtssuche: Koordinate → Adresse. Wird gebraucht, wenn jemand den
 * Marker auf der Karte verschiebt und PLZ, Ort und Strasse mitwandern sollen.
 *
 * Nominatim ist kostenlos und ohne Schlüssel nutzbar, erlaubt aber nur etwa
 * eine Anfrage pro Sekunde. Deshalb läuft der Aufruf über den Server, wird
 * zwischengespeichert, und die Oberfläche fragt erst nach dem Loslassen an.
 */

export const runtime = "nodejs";

const NOMINATIM = "https://nominatim.openstreetmap.org/reverse";
const KONTAKT = process.env.GEOCODING_CONTACT ?? SITE.email;

export async function GET(request: NextRequest) {
  const lat = parseKoordinate(request.nextUrl.searchParams.get("lat"), "lat");
  const lng = parseKoordinate(request.nextUrl.searchParams.get("lng"), "lng");
  if (lat === undefined || lng === undefined) {
    return NextResponse.json({ fehler: "Ungültige Koordinate." }, { status: 400 });
  }

  const url = new URL(NOMINATIM);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "18");

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": `${SITE.name} Umkreissuche (${KONTAKT})`,
        "Accept-Language": "de-CH,de;q=0.9,fr;q=0.8,it;q=0.7",
      },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(String(res.status));

    const data = (await res.json()) as { address?: Record<string, string>; display_name?: string };
    const a = data.address ?? {};

    return NextResponse.json(
      {
        stadt: a.city ?? a.town ?? a.village ?? a.municipality ?? null,
        stadtteil: a.suburb ?? a.city_district ?? a.neighbourhood ?? null,
        plz: a.postcode ?? null,
        strasse: [a.road, a.house_number].filter(Boolean).join(" ") || null,
        kanton: a.state ?? null,
        land: a.country_code?.toUpperCase() ?? null,
        anzeige: data.display_name ?? null,
      },
      { headers: { "Cache-Control": "public, max-age=3600" } },
    );
  } catch {
    return NextResponse.json({ fehler: "Adresssuche gerade nicht erreichbar." }, { status: 503 });
  }
}

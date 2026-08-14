"use client";

import * as React from "react";
import type * as L from "leaflet";
import { SCHWEIZ, type Punkt } from "@/lib/geo";
import { cn } from "@/lib/utils";

/**
 * Basiskarte auf Leaflet mit OpenStreetMap-Kacheln — kostenlos, ohne
 * Schlüssel, ohne Konto.
 *
 * Leaflet greift beim Import direkt auf `window` zu, deshalb wird das Modul
 * erst im Effekt geladen. Das Stylesheet liegt in `globals.css`, damit die
 * Anpassungen dort durch die Reihenfolge gewinnen.
 *
 * Die Standard-Marker verweisen auf Bilddateien, die Bundler regelmässig
 * verlieren; wir zeichnen sie stattdessen selbst als `divIcon` — das passt
 * ausserdem zur Markenfarbe.
 */

export type MarkerDaten = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  /** Wird beim Klick auf den Marker gemeldet. */
  onClick?: () => void;
  /** Hebt den Marker farblich hervor. */
  aktiv?: boolean;
};

export type KartenProps = {
  center?: Punkt;
  zoom?: number;
  marker?: MarkerDaten[];
  /** Kreis um den Mittelpunkt — Radius in Kilometern. */
  radiusKm?: number;
  radiusUm?: Punkt;
  /** Marker mit der Maus verschiebbar; meldet die neue Position. */
  ziehbar?: boolean;
  onMarkerZiehen?: (punkt: Punkt) => void;
  /** Klick in die Karte setzt die Position. */
  onKlick?: (punkt: Punkt) => void;
  /** Karte automatisch auf alle Marker einpassen. */
  autoZoom?: boolean;
  className?: string;
  hoehe?: string;
};

const KACHELN = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const HERKUNFT = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende';

function markerHtml(aktiv: boolean) {
  return `<span class="gnd-pin${aktiv ? " gnd-pin--aktiv" : ""}"><span class="gnd-pin__punkt"></span></span>`;
}

export function LeafletMap({
  center = SCHWEIZ.center,
  zoom = SCHWEIZ.zoom,
  marker = [],
  radiusKm,
  radiusUm,
  ziehbar = false,
  onMarkerZiehen,
  onKlick,
  autoZoom = false,
  className,
  hoehe = "h-80",
}: KartenProps) {
  const behaelter = React.useRef<HTMLDivElement>(null);
  const karte = React.useRef<L.Map | null>(null);
  const ebene = React.useRef<L.LayerGroup | null>(null);
  const kreis = React.useRef<L.Circle | null>(null);
  const leaflet = React.useRef<typeof L | null>(null);
  const [bereit, setBereit] = React.useState(false);

  // Callbacks über Refs, damit ein neu erzeugter Handler die Karte nicht
  // jedes Mal neu aufbaut.
  const klickRef = React.useRef(onKlick);
  const ziehRef = React.useRef(onMarkerZiehen);
  klickRef.current = onKlick;
  ziehRef.current = onMarkerZiehen;

  // ── Karte aufbauen (genau einmal) ─────────────────────────────────────────
  React.useEffect(() => {
    let abgebrochen = false;

    void (async () => {
      const mod = await import("leaflet");
      if (abgebrochen || !behaelter.current || karte.current) return;

      leaflet.current = mod.default ?? (mod as unknown as typeof L);
      const Lf = leaflet.current;

      const k = Lf.map(behaelter.current, {
        center: [center.lat, center.lng],
        zoom,
        scrollWheelZoom: false,
        attributionControl: true,
      });
      Lf.tileLayer(KACHELN, { attribution: HERKUNFT, maxZoom: 19 }).addTo(k);
      // Zoom per Rad erst nach einem Klick — sonst „fängt“ die Karte das
      // Scrollen der Seite ein.
      k.on("click", (event: L.LeafletMouseEvent) => {
        k.scrollWheelZoom.enable();
        klickRef.current?.({ lat: event.latlng.lat, lng: event.latlng.lng });
      });
      k.on("mouseout", () => k.scrollWheelZoom.disable());

      ebene.current = Lf.layerGroup().addTo(k);
      karte.current = k;
      setBereit(true);
    })();

    return () => {
      abgebrochen = true;
      karte.current?.remove();
      karte.current = null;
      ebene.current = null;
      kreis.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Grösse nachführen ─────────────────────────────────────────────────────
  // Leaflet rechnet die Kachelanordnung einmal beim Aufbau aus. Steckt die
  // Karte in einem zunächst ausgeblendeten Bereich — etwa einem inaktiven
  // Tab —, ist der Behälter dabei 0 px hoch und die Karte bliebe leer.
  React.useEffect(() => {
    const el = behaelter.current;
    if (!bereit || !el || !karte.current) return;

    const beobachter = new ResizeObserver(() => {
      if (el.offsetWidth > 0 && el.offsetHeight > 0) karte.current?.invalidateSize();
    });
    beobachter.observe(el);
    return () => beobachter.disconnect();
  }, [bereit]);

  // ── Marker zeichnen ───────────────────────────────────────────────────────
  React.useEffect(() => {
    const Lf = leaflet.current;
    const k = karte.current;
    if (!bereit || !Lf || !k || !ebene.current) return;

    ebene.current.clearLayers();

    for (const m of marker) {
      const pin = Lf.marker([m.lat, m.lng], {
        draggable: ziehbar,
        icon: Lf.divIcon({
          className: "gnd-pin-wrapper",
          html: markerHtml(Boolean(m.aktiv)),
          iconSize: [28, 36],
          iconAnchor: [14, 34],
          popupAnchor: [0, -30],
        }),
      });
      if (m.label) pin.bindPopup(m.label);
      if (m.onClick) pin.on("click", m.onClick);
      if (ziehbar) {
        pin.on("dragend", () => {
          const p = pin.getLatLng();
          ziehRef.current?.({ lat: p.lat, lng: p.lng });
        });
      }
      pin.addTo(ebene.current);
    }

    if (autoZoom && marker.length > 1) {
      k.fitBounds(Lf.latLngBounds(marker.map((m) => [m.lat, m.lng] as [number, number])).pad(0.2));
    }
  }, [marker, ziehbar, autoZoom, bereit]);

  // ── Radiuskreis ───────────────────────────────────────────────────────────
  React.useEffect(() => {
    const Lf = leaflet.current;
    const k = karte.current;
    if (!bereit || !Lf || !k) return;

    const mitte = radiusUm ?? (marker.length === 1 ? { lat: marker[0].lat, lng: marker[0].lng } : null);
    if (!radiusKm || !mitte) {
      kreis.current?.remove();
      kreis.current = null;
      return;
    }

    // Farbe aus dem Markentoken lesen, damit hier kein Farbwert fest steht.
    const farbe =
      getComputedStyle(document.documentElement).getPropertyValue("--brand").trim() || "currentColor";

    if (kreis.current) {
      kreis.current.setLatLng([mitte.lat, mitte.lng]).setRadius(radiusKm * 1000);
    } else {
      kreis.current = Lf.circle([mitte.lat, mitte.lng], {
        radius: radiusKm * 1000,
        color: farbe,
        weight: 1.5,
        fillColor: farbe,
        fillOpacity: 0.08,
      }).addTo(k);
    }
    k.fitBounds(kreis.current.getBounds().pad(0.1));
  }, [radiusKm, radiusUm, marker, bereit]);

  // ── Mittelpunkt nachziehen ────────────────────────────────────────────────
  React.useEffect(() => {
    if (!bereit || !karte.current || radiusKm) return;
    karte.current.setView([center.lat, center.lng], karte.current.getZoom());
  }, [center.lat, center.lng, radiusKm, bereit]);

  return (
    <div
      ref={behaelter}
      role="application"
      aria-label="Karte"
      className={cn("w-full overflow-hidden rounded-xl border border-border bg-muted", hoehe, className)}
    />
  );
}

export default LeafletMap;

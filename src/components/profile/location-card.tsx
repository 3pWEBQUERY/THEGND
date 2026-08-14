"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Loader2, MapPin, Ruler, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

const LeafletMap = dynamic(() => import("@/components/map/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="grid h-64 w-full place-items-center rounded-xl border border-border bg-muted">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  ),
});

/**
 * Einsatzgebiet auf der Karte.
 *
 * Die Koordinate ist bereits serverseitig gerundet, wenn keine Adresse
 * freigegeben wurde — hier kommt nie eine genaue Hausposition an.
 */
export function LocationCard({
  lat,
  lng,
  radiusKm,
  ortName,
  citySlug,
  ungefaehr,
}: {
  lat: number;
  lng: number;
  radiusKm: number | null;
  ortName: string;
  citySlug?: string | null;
  ungefaehr: boolean;
}) {
  return (
    <Card className="p-6">
      <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold tracking-tight">
        <MapPin className="size-5 text-primary" /> Einsatzgebiet
      </h2>

      <LeafletMap
        center={{ lat, lng }}
        zoom={radiusKm ? 10 : 12}
        marker={[{ id: "profil", lat, lng, aktiv: true }]}
        radiusKm={radiusKm ?? undefined}
        radiusUm={{ lat, lng }}
        hoehe="h-64"
      />

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPin className="size-4" />
          {citySlug ? (
            <Link href={`/escorts?city=${citySlug}`} className="hover:text-foreground">
              {ortName}
            </Link>
          ) : (
            ortName
          )}
        </span>
        {radiusKm ? (
          <span className="flex items-center gap-1.5">
            <Ruler className="size-4" /> Anfahrt bis {radiusKm} km
          </span>
        ) : null}
      </div>

      {ungefaehr && (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
          Die Karte zeigt bewusst nur die ungefähre Lage. Die genaue Adresse gibt es erst nach Absprache.
        </p>
      )}
    </Card>
  );
}

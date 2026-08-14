"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Archive, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { archiveOwnProfileAction, convertProfileToAgencyAction } from "@/server/actions/agency";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KIND_LABEL } from "@/lib/constants";

/**
 * Hinweis für Inserate, die eigentlich ein Haus beschreiben.
 *
 * Zwei Fälle, seit „Agentur“, „Club“, „Studio“ und „Massage“ auch beim
 * persönlichen Profil wählbar waren:
 *   ohne Haus  → umwandeln, die Angaben werden übernommen
 *   mit Haus   → das übriggebliebene Inserat archivieren
 */
export function ConvertToAgency({
  kind,
  displayName,
  hatHaus,
}: {
  kind: string;
  displayName: string;
  hatHaus: boolean;
}) {
  const router = useRouter();
  const [laeuft, setLaeuft] = React.useState(false);

  const archivieren = async () => {
    const bestaetigt = confirm(
      `„${displayName}“ archivieren?\n\n` +
        "Das Inserat ist danach nicht mehr öffentlich und verschwindet aus deinem Dashboard. " +
        "Gelöscht wird nichts — wir können es jederzeit wieder aktivieren.",
    );
    if (!bestaetigt) return;

    setLaeuft(true);
    const res = await archiveOwnProfileAction();
    if (res.ok) {
      toast.success(res.message ?? "Archiviert.");
      router.push("/dashboard/agentur");
    } else {
      toast.error(res.message ?? "Fehlgeschlagen.");
      setLaeuft(false);
    }
  };

  const umwandeln = async () => {
    const bestaetigt = confirm(
      `„${displayName}“ in ein Haus umwandeln?\n\n` +
        "Name, Beschreibung, Kontakt, Standort, Preis, Services und Sprachen werden übernommen. " +
        "Das bisherige Inserat wird archiviert — es geht nichts verloren, ist aber nicht mehr öffentlich.\n\n" +
        "Das neue Haus startet unveröffentlicht, damit du die Texte vorher durchsehen kannst.",
    );
    if (!bestaetigt) return;

    setLaeuft(true);
    const res = await convertProfileToAgencyAction();
    if (res.ok) {
      toast.success(res.message ?? "Umgewandelt.");
      router.push("/dashboard/agentur");
    } else {
      toast.error(res.message ?? "Fehlgeschlagen.");
      setLaeuft(false);
    }
  };

  return (
    <Card className="mb-6 border-warning/30 bg-warning/8 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="flex min-w-0 items-start gap-3 text-sm">
          <Building2 className="mt-0.5 size-5 shrink-0 text-warning" />
          <span>
            <span className="block font-semibold text-foreground">
              Dieses Inserat ist als „{KIND_LABEL[kind] ?? kind}“ angelegt — das beschreibt ein Haus.
            </span>
            <span className="text-muted-foreground">
              {hatHaus
                ? "Du führst dein Haus bereits separat. Dieses persönliche Inserat ist vermutlich versehentlich entstanden und wird nicht mehr gebraucht."
                : "Häuser werden getrennt geführt, mit Standort, Öffnungszeiten, Team und eigener Prüfung. Als persönliches Profil fehlen dir all diese Möglichkeiten."}
            </span>
          </span>
        </p>

        {hatHaus ? (
          <Button type="button" variant="outline" size="sm" disabled={laeuft} onClick={archivieren}>
            {laeuft ? <Loader2 className="size-4 animate-spin" /> : <Archive className="size-4" />}
            Inserat archivieren
          </Button>
        ) : (
          <Button type="button" variant="brand" size="sm" disabled={laeuft} onClick={umwandeln}>
            {laeuft ? <Loader2 className="size-4 animate-spin" /> : <Building2 className="size-4" />}
            In ein Haus umwandeln
          </Button>
        )}
      </div>
    </Card>
  );
}

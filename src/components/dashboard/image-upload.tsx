"use client";

import * as React from "react";
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Bild-Upload mit Vorschau — für öffentlich sichtbare Medien wie Logo und
 * Titelbild eines Hauses.
 *
 * Die Datei geht per vorsigniertem PUT direkt in den Railway Bucket; ins
 * Formular kommt die Auslieferungsadresse (`/media/…`). Anders als beim
 * Upload für Prüfdokumente ist hier die URL gefragt, weil sie so im
 * Datensatz landet und öffentlich ausgeliefert wird.
 */

const ERLAUBT = "image/jpeg,image/png,image/webp,image/avif";

export function ImageUploadField({
  label,
  hint,
  name,
  wert,
  onChange,
  /** Seitenverhältnis der Vorschau. */
  format = "quadratisch",
  scope = "agency",
  error,
  className,
}: {
  label: string;
  hint?: string;
  name: string;
  wert: string | null;
  onChange: (url: string | null) => void;
  format?: "quadratisch" | "breit";
  /** Ablagebereich im Bucket — bestimmt Präfix und Zugriffsregel. */
  scope?: "agency" | "profile";
  error?: string;
  className?: string;
}) {
  const [fortschritt, setFortschritt] = React.useState<number | null>(null);
  const dateiRef = React.useRef<HTMLInputElement>(null);
  const laeuft = fortschritt !== null;

  const hochladen = async (datei: File) => {
    setFortschritt(0);
    try {
      const res = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          filename: datei.name,
          contentType: datei.type,
          size: datei.size,
        }),
      });
      if (!res.ok) {
        const { error: fehler } = await res.json().catch(() => ({ error: "Upload fehlgeschlagen." }));
        throw new Error(fehler);
      }
      const presign = await res.json();

      // XHR statt fetch, weil nur damit der Fortschritt ablesbar ist.
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presign.url);
        xhr.setRequestHeader("Content-Type", datei.type);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) setFortschritt(Math.round((event.loaded / event.total) * 100));
        };
        xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload fehlgeschlagen (${xhr.status})`)));
        xhr.onerror = () => reject(new Error("Netzwerkfehler beim Upload."));
        xhr.send(datei);
      });

      onChange(presign.publicUrl as string);
      toast.success("Bild hochgeladen.");
    } catch (fehler) {
      toast.error((fehler as Error).message);
    } finally {
      setFortschritt(null);
      if (dateiRef.current) dateiRef.current.value = "";
    }
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <p className="text-sm font-medium">{label}</p>

      {/* Wert fürs Formular — bleibt eine ganz normale FormData-Eingabe. */}
      <input type="hidden" name={name} value={wert ?? ""} />

      <div
        className={cn(
          "relative overflow-hidden rounded-xl border bg-muted",
          format === "breit" ? "aspect-16/9" : "aspect-square max-w-40",
          error ? "border-danger" : "border-border",
        )}
      >
        {wert ? (
          // Bewusst <img>: die Quelle ist eine beliebige Bucket-Adresse und
          // muss nicht durch die Bildoptimierung.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={wert} alt="" className="size-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => dateiRef.current?.click()}
            disabled={laeuft}
            className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {laeuft ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
            <span className="text-xs">{laeuft ? `${fortschritt} %` : "Bild auswählen"}</span>
          </button>
        )}

        {laeuft && wert && (
          <div className="absolute inset-0 grid place-items-center bg-background/70">
            <span className="flex items-center gap-2 text-xs">
              <Loader2 className="size-4 animate-spin" /> {fortschritt} %
            </span>
          </div>
        )}
      </div>

      {wert && (
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={laeuft} onClick={() => dateiRef.current?.click()}>
            <RefreshCw className="size-3.5" /> Ersetzen
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={laeuft} onClick={() => onChange(null)}>
            <Trash2 className="size-3.5" /> Entfernen
          </Button>
        </div>
      )}

      <input
        ref={dateiRef}
        type="file"
        accept={ERLAUBT}
        className="hidden"
        onChange={(event) => {
          const datei = event.target.files?.[0];
          if (datei) void hochladen(datei);
        }}
      />

      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Clapperboard, ImagePlus, Loader2, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createStoryAction } from "@/server/actions/stories";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import type { StoryQuelle } from "@/server/queries/stories";
import type { ActionState } from "@/server/action-utils";

/**
 * Story aufgeben.
 *
 * Ein Schritt: Medium wählen, optional beschriften, veröffentlichen. Läuft
 * bereits eine Story, hängt sich die neue hinten an — es entsteht keine
 * zweite Kachel, sondern ein weiterer Teil derselben Abfolge.
 */

const ERLAUBT = "image/jpeg,image/png,image/webp,image/avif,video/mp4,video/quicktime,video/webm";

export function StoryComposer({
  quelle,
  offen,
  onOpenChange,
  laufendeTeile = 0,
}: {
  quelle: StoryQuelle;
  offen: boolean;
  onOpenChange: (offen: boolean) => void;
  /** Wie viele Teile bereits laufen — nur für den Hinweis. */
  laufendeTeile?: number;
}) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(createStoryAction, {});
  const [medium, setMedium] = React.useState<{ url: string; typ: "IMAGE" | "VIDEO" } | null>(null);
  const [fortschritt, setFortschritt] = React.useState<number | null>(null);
  const dateiRef = React.useRef<HTMLInputElement>(null);
  const laeuft = fortschritt !== null;

  React.useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success(state.message);
      setMedium(null);
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(state.message);
    }
  }, [state, onOpenChange, router]);

  const hochladen = async (datei: File) => {
    setFortschritt(0);
    try {
      const res = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "story",
          filename: datei.name,
          contentType: datei.type,
          size: datei.size,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Upload fehlgeschlagen." }));
        throw new Error(error);
      }
      const presign = await res.json();

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

      setMedium({ url: presign.publicUrl as string, typ: presign.type === "VIDEO" ? "VIDEO" : "IMAGE" });
    } catch (fehler) {
      toast.error((fehler as Error).message);
    } finally {
      setFortschritt(null);
      if (dateiRef.current) dateiRef.current.value = "";
    }
  };

  return (
    <Dialog open={offen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Story hinzufügen</DialogTitle>
          <DialogDescription>
            {laufendeTeile > 0
              ? `Kommt zu deiner laufenden Story dazu — dann sind es ${laufendeTeile + 1} Teile.`
              : `Sichtbar als „${quelle.name}“ — 24 Stunden lang, danach verschwindet sie von selbst.`}
          </DialogDescription>
        </DialogHeader>

        <form action={dispatch} className="space-y-4">
          <input type="hidden" name="mediaUrl" value={medium?.url ?? ""} />
          <input type="hidden" name="mediaType" value={medium?.typ ?? "IMAGE"} />

          <div className="relative aspect-9/16 max-h-[46dvh] overflow-hidden rounded-xl border border-border bg-muted">
            {medium ? (
              medium.typ === "VIDEO" ? (
                <video src={medium.url} className="size-full object-contain" controls playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={medium.url} alt="" className="size-full object-contain" />
              )
            ) : (
              <button
                type="button"
                onClick={() => dateiRef.current?.click()}
                disabled={laeuft}
                className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {laeuft ? (
                  <>
                    <Loader2 className="size-6 animate-spin" />
                    <span className="text-sm">{fortschritt} %</span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-2">
                      <ImagePlus className="size-6" />
                      <Clapperboard className="size-6" />
                    </span>
                    <span className="text-sm font-medium">Bild oder Video wählen</span>
                    <span className="text-xs">Hochformat wirkt am besten · max. 12 MB / 200 MB</span>
                  </>
                )}
              </button>
            )}
          </div>

          {medium && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setMedium(null)}>
              <Trash2 className="size-3.5" /> Anderes Medium wählen
            </Button>
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

          <Field label="Beschriftung" hint="Optional, höchstens 200 Zeichen." error={state.errors?.caption?.[0]}>
            <Input name="caption" maxLength={200} placeholder="z. B. Heute Abend in Zürich" />
          </Field>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" variant="brand" loading={pending} disabled={!medium || laeuft}>
              {!pending && <Send className="size-4" />} Veröffentlichen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

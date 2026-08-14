"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Mail, Pause, Play, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { publishProfileAction, toggleProfileStatusAction } from "@/server/actions/profile";
import {
  deleteManagedModelAction,
  removeModelAction,
  setManagedModelEmailAction,
} from "@/server/actions/agency";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import type { ActionState } from "@/server/action-utils";

/**
 * Statusleiste über dem Inserat eines Models.
 *
 * Dieselben Aktionen, die eine Anbieterin für ihr eigenes Inserat hat —
 * einreichen, pausieren, fortsetzen — nur mit dem Inserat des Models als Ziel.
 */
export function ModelStatusBar({
  profileId,
  displayName,
  status,
  mediaCount,
  hasCity,
  aboutLength,
  verwaltet,
  email,
}: {
  profileId: string;
  displayName: string;
  status: string;
  mediaCount: number;
  hasCity: boolean;
  aboutLength: number;
  /** Vom Haus angelegtes Konto — nur dann ist Löschen möglich. */
  verwaltet: boolean;
  email: string;
}) {
  const router = useRouter();
  const [laeuft, setLaeuft] = React.useState<string | null>(null);

  const ausfuehren = async (schluessel: string, fn: () => Promise<ActionState>, danach?: string) => {
    setLaeuft(schluessel);
    const res = await fn();
    if (res.ok) {
      toast.success(res.message ?? "Erledigt.");
      if (danach) router.push(danach);
      else router.refresh();
    } else {
      toast.error(res.message ?? "Fehlgeschlagen.");
    }
    setLaeuft(null);
  };

  // Dieselben Bedingungen, die die Server Action prüft — hier nur, um
  // vorher zu sagen, was noch fehlt, statt es nach dem Klick abzulehnen.
  const fehlt = [
    mediaCount === 0 ? "mindestens ein Foto" : null,
    !hasCity ? "eine Stadt" : null,
    aboutLength < 50 ? "50 Zeichen Beschreibung" : null,
  ].filter(Boolean) as string[];

  const platzhalterAdresse = email.endsWith("@verwaltet.invalid");

  return (
    <div className="space-y-3">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0 text-sm">
          {status === "DRAFT" || status === "REJECTED" ? (
            fehlt.length > 0 ? (
              <p className="flex items-start gap-2 text-muted-foreground">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                Zum Einreichen fehlt noch: {fehlt.join(", ")}.
              </p>
            ) : (
              <p className="text-muted-foreground">Das Inserat ist vollständig und kann eingereicht werden.</p>
            )
          ) : status === "PENDING_REVIEW" ? (
            <p className="text-muted-foreground">Liegt bei der Prüfung — meist innerhalb von zwei Stunden.</p>
          ) : status === "ACTIVE" ? (
            <p className="text-muted-foreground">Öffentlich sichtbar.</p>
          ) : (
            <p className="text-muted-foreground">Pausiert — aktuell nicht in der Suche.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {(status === "DRAFT" || status === "REJECTED") && (
            <Button
              type="button"
              variant="brand"
              size="sm"
              disabled={laeuft !== null || fehlt.length > 0}
              onClick={() => ausfuehren("publish", () => publishProfileAction(profileId))}
            >
              {laeuft === "publish" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Zur Prüfung einreichen
            </Button>
          )}

          {(status === "ACTIVE" || status === "PAUSED") && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={laeuft !== null}
              onClick={() => ausfuehren("toggle", () => toggleProfileStatusAction(profileId))}
            >
              {laeuft === "toggle" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : status === "ACTIVE" ? (
                <Pause className="size-4" />
              ) : (
                <Play className="size-4" />
              )}
              {status === "ACTIVE" ? "Pausieren" : "Wieder online"}
            </Button>
          )}

          {verwaltet ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={laeuft !== null}
              onClick={() => {
                if (
                  !confirm(
                    `„${displayName}“ — Inserat und zugehöriges Konto endgültig löschen?\n\n` +
                      "Fotos, Bewertungen und Nachrichten gehen dabei verloren. Das lässt sich nicht rückgängig machen.",
                  )
                )
                  return;
                void ausfuehren("delete", () => deleteManagedModelAction(profileId), "/dashboard/agentur/models");
              }}
            >
              {laeuft === "delete" ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Löschen
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={laeuft !== null}
              onClick={() => {
                if (!confirm("Zuordnung aufheben? Das Inserat bleibt bestehen und gehört weiter der Person."))
                  return;
                void ausfuehren("remove", () => removeModelAction(profileId), "/dashboard/agentur/models");
              }}
            >
              {laeuft === "remove" ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Aus dem Haus lösen
            </Button>
          )}
        </div>
      </Card>

      {verwaltet && platzhalterAdresse && <EmailNachtragen profileId={profileId} />}
    </div>
  );
}

/** Kleines Formular, um die Adresse eines verwalteten Kontos nachzutragen. */
function EmailNachtragen({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(setManagedModelEmailAction, {});

  React.useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success(state.message);
      router.refresh();
    } else {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <Card className="p-4">
      <p className="mb-3 flex items-start gap-2 text-xs text-muted-foreground">
        <Mail className="mt-0.5 size-3.5 shrink-0" />
        Dieses Konto hat noch keine E-Mail-Adresse. Ohne Adresse kann das Model das Inserat später nicht
        selbst übernehmen.
      </p>
      <form action={dispatch} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="profileId" value={profileId} />
        <Field label="E-Mail des Models" className="min-w-56 flex-1" error={state.errors?.email?.[0]}>
          <Input type="email" name="email" required placeholder="person@example.com" />
        </Field>
        <Button type="submit" variant="outline" size="sm" loading={pending}>
          Speichern
        </Button>
      </form>
    </Card>
  );
}

"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { addTeamMemberAction, removeTeamMemberAction } from "@/server/actions/agency";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { ActionState } from "@/server/action-utils";

export type TeamEintrag = {
  id: string;
  role: string;
  createdAt: Date;
  istSelbst: boolean;
  user: { displayName: string | null; email: string };
};

const ROLLE_LABEL: Record<string, string> = {
  OWNER: "Inhaberin",
  MANAGER: "Verwaltung",
  STAFF: "Nur lesen",
};

const ROLLE_HINWEIS: Record<string, string> = {
  OWNER: "Darf alles, inklusive Team verwalten.",
  MANAGER: "Darf Stammdaten, Standort, Zeiten, Angebot und Models pflegen.",
  STAFF: "Darf alles sehen, aber nichts ändern.",
};

export function AgencyTeam({ mitglieder, istInhaberin }: { mitglieder: TeamEintrag[]; istInhaberin: boolean }) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(addTeamMemberAction, {});
  const formRef = React.useRef<HTMLFormElement>(null);
  const [laeuft, setLaeuft] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success(state.message);
      formRef.current?.reset();
      router.refresh();
    } else {
      toast.error(state.message);
    }
  }, [state, router]);

  const entfernen = async (eintrag: TeamEintrag) => {
    const name = eintrag.user.displayName ?? eintrag.user.email;
    if (!confirm(`Zugang von ${name} entfernen?`)) return;
    setLaeuft(eintrag.id);
    const res = await removeTeamMemberAction(eintrag.id);
    if (res.ok) {
      toast.success(res.message ?? "Entfernt.");
      router.refresh();
    } else {
      toast.error(res.message ?? "Fehlgeschlagen.");
    }
    setLaeuft(null);
  };

  return (
    <div className="space-y-6">
      {istInhaberin && (
        <Card className="p-6">
          <h2 className="mb-1 text-base font-semibold">Person hinzufügen</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Die Person braucht bereits ein Konto auf der Plattform. Sie erhält damit Zugriff auf die Verwaltung
            deines Hauses — nicht auf die Profile deiner Models.
          </p>

          <form ref={formRef} action={dispatch} className="grid gap-4 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
            <Field label="E-Mail-Adresse" required error={state.errors?.email?.[0]}>
              <Input type="email" name="email" required placeholder="person@example.com" />
            </Field>
            <Field label="Rolle">
              <Select name="role" defaultValue="STAFF">
                <option value="STAFF">Nur lesen</option>
                <option value="MANAGER">Verwaltung</option>
              </Select>
            </Field>
            <Button type="submit" variant="brand" loading={pending} className="sm:mb-0">
              {!pending && <UserPlus className="size-4" />} Hinzufügen
            </Button>
          </form>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold">Team ({mitglieder.length})</h2>
        <ul className="divide-y divide-border">
          {mitglieder.map((eintrag) => (
            <li key={eintrag.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {eintrag.user.displayName ?? eintrag.user.email}
                  {eintrag.istSelbst && <span className="ml-2 text-xs text-muted-foreground">(du)</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {eintrag.user.email} · dabei seit {formatDate(eintrag.createdAt)}
                </p>
              </div>

              <Badge size="sm" variant={eintrag.role === "OWNER" ? "success" : "neutral"} title={ROLLE_HINWEIS[eintrag.role]}>
                {eintrag.role === "OWNER" && <ShieldCheck className="size-3" />}
                {ROLLE_LABEL[eintrag.role] ?? eintrag.role}
              </Badge>

              {istInhaberin && !eintrag.istSelbst && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={laeuft === eintrag.id}
                  onClick={() => entfernen(eintrag)}
                >
                  {laeuft === eintrag.id ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
                  Entfernen
                </Button>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-5 space-y-1.5 border-t border-border pt-4 text-xs text-muted-foreground">
          {Object.entries(ROLLE_LABEL).map(([wert, label]) => (
            <p key={wert}>
              <span className="font-medium text-foreground">{label}:</span> {ROLLE_HINWEIS[wert]}
            </p>
          ))}
        </div>
      </Card>
    </div>
  );
}

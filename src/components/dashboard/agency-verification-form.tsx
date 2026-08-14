"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Clock, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { submitAgencyVerificationAction } from "@/server/actions/agency";
import { UploadField } from "@/components/dashboard/secure-upload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import type { ActionState } from "@/server/action-utils";

export type PruefStand = {
  status: string;
  note: string | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  legalName: string | null;
  uid: string | null;
  contactName: string | null;
  contactRole: string | null;
} | null;

/**
 * Prüfantrag eines Hauses.
 *
 * Nachgewiesen wird die Firmierung, nicht die Identität einer Privatperson —
 * deshalb Handelsregisterauszug statt Selfie. Die kantonale Bewilligung ist
 * freiwillig, weil längst nicht jeder Kanton eine verlangt.
 */
export function AgencyVerificationForm({
  stand,
  istVerifiziert,
  istInhaberin,
}: {
  stand: PruefStand;
  istVerifiziert: boolean;
  istInhaberin: boolean;
}) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(submitAgencyVerificationAction, {});
  const [registry, setRegistry] = React.useState<string | null>(null);
  const [permit, setPermit] = React.useState<string | null>(null);
  const [ausweis, setAusweis] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success(state.message);
      router.refresh();
    } else {
      toast.error(state.message);
    }
  }, [state, router]);

  const laeuft = stand?.status === "SUBMITTED" || stand?.status === "IN_REVIEW";

  if (istVerifiziert) {
    return (
      <Card className="border-success/30 bg-success/5 p-6">
        <p className="flex items-start gap-3 text-sm">
          <BadgeCheck className="mt-0.5 size-5 shrink-0 text-success" />
          <span>
            <span className="block font-semibold text-foreground">Dein Haus ist geprüft.</span>
            Das Siegel erscheint auf deiner Seite und in der Trefferliste. Melde dich bei uns, wenn sich
            Firmierung oder verantwortliche Person ändern.
          </span>
        </p>
      </Card>
    );
  }

  if (laeuft) {
    return (
      <Card className="p-6">
        <p className="flex items-start gap-3 text-sm">
          <Clock className="mt-0.5 size-5 shrink-0 text-warning" />
          <span>
            <span className="block font-semibold">Dein Antrag liegt bei uns.</span>
            <span className="text-muted-foreground">
              Wir prüfen die Unterlagen in der Regel innerhalb von zwei Werktagen und melden uns per
              Benachrichtigung. Eingereicht für{" "}
              <span className="text-foreground">{stand?.legalName}</span>.
            </span>
          </span>
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {stand?.status === "REJECTED" && (
        <Card className="border-danger/30 bg-danger/5 p-5">
          <p className="flex items-start gap-3 text-sm">
            <XCircle className="mt-0.5 size-5 shrink-0 text-danger" />
            <span>
              <span className="block font-semibold">Der letzte Antrag wurde abgelehnt.</span>
              <span className="text-muted-foreground">
                {stand.note ?? "Wir konnten die Angaben nicht bestätigen."} Du kannst ihn korrigiert erneut
                einreichen.
              </span>
            </span>
          </p>
        </Card>
      )}

      <Card className="p-6">
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Das Geprüft-Siegel zeigt Gästen, dass hinter dem Inserat ein nachweisbares Unternehmen steht. Wir
            gleichen dafür Firmierung und verantwortliche Person ab. Die Unterlagen sieht ausschliesslich die
            Moderation, sie erscheinen nirgends öffentlich und werden nach der Prüfung gelöscht.
          </p>
        </div>

        {!istInhaberin ? (
          <p className="text-sm text-muted-foreground">
            Den Antrag kann nur die Inhaberin des Hauses stellen.
          </p>
        ) : (
          <form action={dispatch} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Firmierung"
                required
                hint="Wie im Handelsregister eingetragen."
                error={state.errors?.legalName?.[0]}
              >
                <Input name="legalName" required maxLength={160} defaultValue={stand?.legalName ?? ""} />
              </Field>
              <Field label="UID-Nummer" hint="CHE-123.456.789 — falls vorhanden." error={state.errors?.uid?.[0]}>
                <Input name="uid" maxLength={30} placeholder="CHE-…" defaultValue={stand?.uid ?? ""} />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Verantwortliche Person" required error={state.errors?.contactName?.[0]}>
                <Input name="contactName" required maxLength={120} defaultValue={stand?.contactName ?? ""} />
              </Field>
              <Field label="Funktion" hint="z. B. Geschäftsführerin, Inhaberin.">
                <Input name="contactRole" maxLength={80} defaultValue={stand?.contactRole ?? ""} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <UploadField
                label="Handelsregisterauszug"
                hint="Oder ein anderer Nachweis der Firmierung."
                name="registryKey"
                required
                value={registry}
                onChange={setRegistry}
              />
              <UploadField
                label="Ausweis der verantwortlichen Person"
                hint="Vorderseite genügt."
                name="idKey"
                required
                value={ausweis}
                onChange={setAusweis}
              />
            </div>

            <UploadField
              label="Kantonale Bewilligung"
              hint="Optional — nur, wenn dein Kanton eine verlangt."
              name="permitKey"
              value={permit}
              onChange={setPermit}
            />

            <Button type="submit" variant="brand" loading={pending} disabled={!registry || !ausweis}>
              {!pending && <ShieldCheck className="size-4" />} Zur Prüfung einreichen
            </Button>

            <p className="text-xs text-muted-foreground">
              Mit dem Einreichen bestätigst du, dass du berechtigt bist, für dieses Haus zu handeln.
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}

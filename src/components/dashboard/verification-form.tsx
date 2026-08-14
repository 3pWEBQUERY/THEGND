"use client";

import * as React from "react";
import { useActionState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { submitVerificationAction } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { UploadField } from "@/components/dashboard/secure-upload";
import { LOCALE } from "@/lib/utils";

export function VerificationForm({ displayName }: { displayName: string }) {
  const [state, action, pending] = useActionState(submitVerificationAction, {});
  const [idFront, setIdFront] = React.useState<string | null>(null);
  const [idBack, setIdBack] = React.useState<string | null>(null);
  const [selfie, setSelfie] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (state.ok) toast.success(state.message ?? "Eingereicht");
    else if (state.message) toast.error(state.message);
  }, [state]);

  const today = new Date().toLocaleDateString(LOCALE);

  return (
    <Card className="p-6">
      <form action={action} className="space-y-6">
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="size-4 text-primary" /> Dein Selfie-Code
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Schreibe auf einen Zettel: <b className="text-foreground">THEGND · {displayName} · {today}</b> und
            halte ihn gut sichtbar ins Bild.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <UploadField
            label="Ausweis Vorderseite"
            hint="Perso, Reisepass oder Führerschein"
            name="idFrontKey"
            required
            value={idFront}
            onChange={setIdFront}
          />
          <UploadField
            label="Ausweis Rückseite"
            hint="Optional, bei Personalausweis empfohlen"
            name="idBackKey"
            value={idBack}
            onChange={setIdBack}
          />
        </div>

        <UploadField
          label="Verifizierungs-Selfie"
          hint="Gesicht + Zettel mit Code, gut ausgeleuchtet"
          name="selfieKey"
          required
          value={selfie}
          onChange={setSelfie}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Vollständiger Name" hint="Wie im Ausweis">
            <Input name="legalName" maxLength={80} />
          </Field>
          <Field label="Geburtsdatum">
            <Input type="date" name="birthDate" />
          </Field>
          <Field label="Dokumentnummer" hint="Optional">
            <Input name="documentNo" maxLength={40} />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
          <p className="text-xs text-muted-foreground">
            Mit dem Absenden bestätigst du, dass die Dokumente dir gehören und echt sind.
          </p>
          <Button type="submit" variant="brand" loading={pending} disabled={!idFront || !selfie}>
            Zur Prüfung einreichen
          </Button>
        </div>
      </form>
    </Card>
  );
}

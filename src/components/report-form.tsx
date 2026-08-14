"use client";

import * as React from "react";
import { useActionState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { reportAction } from "@/server/actions/misc";
import { Button } from "@/components/ui/button";
import {Field, Input, Textarea} from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { REPORT_REASON_LABEL } from "@/lib/constants";

export function ReportForm() {
  const [state, action, pending] = useActionState(reportAction, {});

  if (state.ok) {
    return (
      <div className="py-8 text-center">
        <CheckCircle2 className="mx-auto mb-4 size-10 text-success" />
        <h2 className="text-lg font-semibold">Meldung eingegangen</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {state.message && <p className="text-sm text-danger">{state.message}</p>}

      <Field label="Was möchtest du melden?" required>
        <Select name="targetType" required defaultValue="PROFILE">
          <option value="PROFILE">Ein Profil</option>
          <option value="MESSAGE">Eine Nachricht</option>
          <option value="REVIEW">Eine Bewertung</option>
          <option value="POST">Einen Beitrag</option>
          <option value="USER">Ein Mitglied</option>
        </Select>
      </Field>

      <Field label="Link oder Profilname" required hint="z. B. https://thegnd.net/escort/name">
        <Input name="targetId" required maxLength={200} placeholder="URL oder Name" />
      </Field>

      <Field label="Grund" required>
        <Select name="reason" required defaultValue="">
          <option value="" disabled>
            Bitte wählen
          </option>
          {Object.entries(REPORT_REASON_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Was ist passiert?" hint="Je konkreter, desto schneller können wir handeln.">
        <Textarea name="details" rows={6} maxLength={2000} />
      </Field>

      <Button type="submit" variant="danger" size="lg" className="w-full" loading={pending}>
        <Send className="size-4" /> Meldung absenden
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Bei Verdacht auf Zwang, Menschenhandel oder Minderjährigkeit informieren wir umgehend die Behörden.
      </p>
    </form>
  );
}

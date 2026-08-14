"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { createOwnAgencyAction } from "@/server/actions/agency";
import { CityPicker, type StadtOption } from "@/components/map/city-picker";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { AGENCY_KIND_LABEL } from "@/lib/constants";
import type { ActionState } from "@/server/action-utils";

/**
 * Onboarding für Häuser — das Gegenstück zum Profil-Onboarding.
 *
 * Bewusst kurz: Name, Art, Stadt, ein Satz. Standort, Öffnungszeiten und
 * Angebot folgen im vollständigen Editor. Veröffentlicht wird erst auf
 * ausdrückliche Freigabe.
 */
export function AgencyOnboardingForm({ cities }: { cities: StadtOption[] }) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(createOwnAgencyAction, {});

  React.useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success(state.message);
      router.replace("/dashboard/agentur");
    } else {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <Card className="p-6">
      <form action={dispatch} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name des Hauses" required error={state.errors?.name?.[0]}>
            <Input name="name" required maxLength={120} placeholder="z. B. Maison Noir" autoFocus />
          </Field>

          <Field label="Art des Hauses" required>
            <Select name="kind" defaultValue="AGENCY">
              {Object.entries(AGENCY_KIND_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Standort" hint="Ort suchen — die passende Stadt wird zugeordnet. Genauer geht es gleich danach.">
          <CityPicker staedte={cities} />
        </Field>

        <Field label="Kurzbeschreibung" hint="Ein Satz für die Trefferliste. Kannst du später ändern.">
          <Textarea name="headline" rows={2} maxLength={160} placeholder="z. B. Diskrete Begleitagentur seit 2014" />
        </Field>

        <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Du wirst automatisch Inhaberin dieses Hauses. Im nächsten Schritt ergänzt du Adresse,
          Öffnungszeiten und Angebot — und gibst selbst frei, wann das Inserat öffentlich wird.
        </div>

        <Button type="submit" variant="brand" size="lg" loading={pending} className="w-full">
          Weiter zur Einrichtung
          {!pending && <ArrowRight className="size-4" />}
        </Button>
      </form>
    </Card>
  );
}

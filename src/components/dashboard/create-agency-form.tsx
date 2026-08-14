"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { createOwnAgencyAction } from "@/server/actions/agency";
import { CityPicker, type StadtOption } from "@/components/map/city-picker";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { AGENCY_KIND_LABEL } from "@/lib/constants";
import type { ActionState } from "@/server/action-utils";

/**
 * Erstanlage eines Hauses — bewusst knapp gehalten.
 *
 * Alles Weitere (Standort, Zeiten, Angebot) folgt danach im vollständigen
 * Editor. Neue Häuser starten versteckt, damit niemand versehentlich ein
 * halbfertiges Inserat veröffentlicht.
 */
export function CreateAgencyForm({ cities }: { cities: StadtOption[] }) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(createOwnAgencyAction, {});

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
    <Card className="max-w-2xl p-6">
      <form action={dispatch} className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
          <Building2 className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Du legst das Haus an und wirst automatisch Inhaberin. Danach kannst du Standort, Öffnungszeiten und
            Angebot ergänzen und weitere Personen ins Team holen. Veröffentlicht wird erst, wenn du es freigibst.
          </p>
        </div>

        <Field label="Name" required error={state.errors?.name?.[0]}>
          <Input name="name" required maxLength={120} placeholder="z. B. Maison Noir" />
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

        <Field label="Stadt" hint="Lässt sich später jederzeit genauer setzen.">
          <CityPicker staedte={cities} />
        </Field>

        <Button type="submit" variant="brand" loading={pending}>
          Haus anlegen
        </Button>
      </form>
    </Card>
  );
}

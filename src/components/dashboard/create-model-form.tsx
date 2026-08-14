"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { createManagedModelAction } from "@/server/actions/agency";
import { CityPicker, type StadtOption } from "@/components/map/city-picker";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { GENDER_LABEL } from "@/lib/constants";
import type { ActionState } from "@/server/action-utils";

/**
 * Eigenes Model anlegen.
 *
 * Bewusst kurz: Name, Geschlecht, Stadt. Alles Weitere — Fotos, Preise,
 * Services — folgt im vollständigen Inserat, das dieselben Formulare nutzt
 * wie ein selbstständiges Profil.
 */
export function CreateModelForm({ cities }: { cities: StadtOption[] }) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(createManagedModelAction, {});
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success(state.message);
      formRef.current?.reset();
      const neu = state.data as { profileId?: string } | undefined;
      if (neu?.profileId) router.push(`/dashboard/agentur/models/${neu.profileId}`);
      else router.refresh();
    } else {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <Card className="p-6">
      <h2 className="mb-1 text-base font-semibold">Eigenes Model anlegen</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Für Models, die kein eigenes Konto führen. Du legst das Inserat an und pflegst es vollständig — Fotos,
        Preise, Services, Tourplan.
      </p>

      <form ref={formRef} action={dispatch} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Anzeigename" required error={state.errors?.displayName?.[0]}>
            <Input name="displayName" required maxLength={40} placeholder="z. B. Vanessa" />
          </Field>
          <Field label="Geschlecht" required>
            <Select name="gender" defaultValue="FEMALE">
              {Object.entries(GENDER_LABEL).map(([wert, label]) => (
                <option key={wert} value={wert}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Stadt" hint="Ohne Angabe wird die Stadt deines Hauses übernommen.">
          <CityPicker staedte={cities} />
        </Field>

        <Field
          label="E-Mail des Models"
          hint="Optional. Mit Adresse kann die Person das Inserat später über „Passwort vergessen“ selbst übernehmen."
          error={state.errors?.email?.[0]}
        >
          <Input type="email" name="email" maxLength={160} placeholder="optional" />
        </Field>

        <Button type="submit" variant="brand" loading={pending}>
          {!pending && <UserPlus className="size-4" />} Anlegen und Inserat ausfüllen
        </Button>
      </form>
    </Card>
  );
}

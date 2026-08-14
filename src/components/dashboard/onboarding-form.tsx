"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle, ArrowRight, Building2 } from "lucide-react";
import { createProfileAction } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {Field, Input, Textarea} from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CityPicker, type StadtOption } from "@/components/map/city-picker";
import { GENDER_LABEL, PROFILE_KIND_LABEL, ORIENTATION_LABEL } from "@/lib/constants";

export function OnboardingForm({
  cities,
  defaultName,
}: {
  cities: StadtOption[];
  defaultName: string;
}) {
  const [state, action, pending] = useActionState(createProfileAction, {});
  const [about, setAbout] = React.useState("");

  const maxBirth = new Date(Date.now() - 18 * 31557600000).toISOString().slice(0, 10);

  return (
    <Card className="p-6 sm:p-8">
      <form action={action} className="space-y-5">
        {state.message && !state.ok && (
          <p className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {state.message}
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Anzeigename" required error={state.errors?.displayName?.[0]} hint="So erscheinst du in der Suche.">
            <Input name="displayName" defaultValue={defaultName} required minLength={2} maxLength={40} />
          </Field>
          <Field label="Slogan" hint="Ein Satz, der neugierig macht.">
            <Input name="headline" maxLength={90} placeholder="Elegante Begleitung für besondere Abende" />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Ich bin" required>
            <Select name="gender" required defaultValue="FEMALE">
              {Object.entries(GENDER_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Kategorie" required hint="Agentur, Club oder Studio? Siehe Hinweis unten.">
            <Select name="kind" required defaultValue="INDEPENDENT">
              {Object.entries(PROFILE_KIND_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Orientierung">
            <Select name="orientation" defaultValue="">
              <option value="">Keine Angabe</option>
              {Object.entries(ORIENTATION_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Geburtsdatum" required error={state.errors?.birthDate?.[0]} hint="Nur intern, 18+.">
            <Input type="date" name="birthDate" max={maxBirth} required />
          </Field>
          <Field label="Nationalität">
            <Input name="nationality" maxLength={60} placeholder="z. B. Deutsch" />
          </Field>
          <Field label="Stadt" required hint="Ort suchen — die passende Stadt wird zugeordnet.">
            <CityPicker staedte={cities} required />
          </Field>
        </div>

        <Field
          label="Über mich"
          required
          hint={`${about.length}/5000 Zeichen — mindestens 50 für die Veröffentlichung.`}
        >
          <Textarea
            name="about"
            rows={7}
            maxLength={5000}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Erzähl, wer du bist, was dich ausmacht und worauf du Wert legst…"
          />
        </Field>

        <p className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          <Building2 className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            <span className="block font-medium text-foreground">
              Du führst eine Agentur, einen Club, ein Studio oder einen Massagesalon?
            </span>
            Dann legst du kein persönliches Inserat an, sondern ein Haus — mit Standort, Öffnungszeiten,
            Team und eigener Prüfung.{" "}
            <Link href="/onboarding/agentur" className="text-primary hover:underline">
              Haus anlegen
            </Link>
          </span>
        </p>

        <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
          <p className="text-xs text-muted-foreground">
            Dein Profil startet als Entwurf. Erst nach deiner Freigabe wird es geprüft und veröffentlicht.
          </p>
          <Button type="submit" variant="brand" size="lg" loading={pending}>
            Weiter <ArrowRight className="size-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
}

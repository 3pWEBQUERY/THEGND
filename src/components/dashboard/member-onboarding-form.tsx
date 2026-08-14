"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { completeMemberOnboardingAction } from "@/server/actions/profile";
import { ImageUploadField } from "@/components/dashboard/image-upload";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { LanguageSelect } from "@/components/ui/language-select";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/primitives";
import type { ActionState } from "@/server/action-utils";

/**
 * Willkommensschritt für Mitgliedskonten.
 *
 * Ein Mitglied inseriert nicht — es sucht, merkt sich Profile und schreibt
 * Nachrichten. Gefragt ist deshalb nur, was ein Gastkonto ausmacht: unter
 * welchem Namen es auftritt, mit welchem Bild, in welcher Sprache und was es
 * an Post bekommen möchte.
 */
export function MemberOnboardingForm({
  defaultName,
  defaultAvatar,
  defaultLocale,
}: {
  defaultName: string;
  defaultAvatar: string | null;
  defaultLocale: string;
}) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(completeMemberOnboardingAction, {});
  const [avatar, setAvatar] = React.useState<string | null>(defaultAvatar);

  React.useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success(state.message);
      router.replace("/dashboard");
    } else {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <Card className="p-6">
      <form action={dispatch} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-start">
          <ImageUploadField
            label="Profilbild"
            name="avatarUrl"
            scope="profile"
            wert={avatar}
            onChange={setAvatar}
            hint="Optional."
            error={state.errors?.avatarUrl?.[0]}
          />

          <div className="space-y-5">
            <Field
              label="Anzeigename"
              required
              hint="So erscheinst du in Nachrichten und Bewertungen. Ein Fantasiename genügt."
              error={state.errors?.displayName?.[0]}
            >
              <Input
                name="displayName"
                required
                minLength={2}
                maxLength={40}
                defaultValue={defaultName}
                placeholder="z. B. Chris"
                autoFocus
              />
            </Field>

            <Field label="Sprache" hint="In welcher Sprache wir dich ansprechen.">
              <LanguageSelect name="locale" defaultValue={defaultLocale} />
            </Field>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-sm font-medium">Post von uns</p>
          {[
            {
              name: "newsletterOptIn",
              title: "Neue Profile und Empfehlungen",
              text: "Höchstens einmal pro Woche, jederzeit abbestellbar.",
              standard: true,
            },
            {
              name: "marketingOptIn",
              title: "Aktionen und Guthaben-Angebote",
              text: "Nur, wenn es wirklich etwas zu sagen gibt.",
              standard: false,
            },
          ].map((eintrag) => (
            <label key={eintrag.name} className="flex items-start justify-between gap-4">
              <span className="min-w-0">
                <span className="block text-sm">{eintrag.title}</span>
                <span className="block text-xs text-muted-foreground">{eintrag.text}</span>
              </span>
              <Switch name={eintrag.name} defaultChecked={eintrag.standard} />
            </label>
          ))}
        </div>

        <Button type="submit" variant="brand" size="lg" loading={pending} className="w-full">
          Fertig — zum Dashboard
          {!pending && <ArrowRight className="size-4" />}
        </Button>
      </form>
    </Card>
  );
}

"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { updateMemberProfileAction } from "@/server/actions/profile";
import { ImageUploadField } from "@/components/dashboard/image-upload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { LanguageSelect } from "@/components/ui/language-select";
import type { ActionState } from "@/server/action-utils";

/**
 * Profil eines Kontos — Name, Bild, Sprache.
 *
 * Dieselben Angaben wie im Willkommensschritt, nur später änderbar. Post und
 * Benachrichtigungen bleiben in den Einstellungen; hier geht es allein darum,
 * wie man auf der Seite auftritt.
 */
export function MemberProfileForm({
  displayName,
  avatarUrl,
  locale,
}: {
  displayName: string;
  avatarUrl: string | null;
  locale: string;
}) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(updateMemberProfileAction, {});
  const [avatar, setAvatar] = React.useState<string | null>(avatarUrl);

  React.useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success(state.message);
      // Kopfzeile und Menü zeigen Name und Bild — die sollen sofort stimmen.
      router.refresh();
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
                defaultValue={displayName}
                placeholder="z. B. Chris"
              />
            </Field>

            <Field label="Sprache" hint="In welcher Sprache wir dich ansprechen." error={state.errors?.locale?.[0]}>
              <LanguageSelect name="locale" defaultValue={locale} />
            </Field>
          </div>
        </div>

        <div className="flex justify-end border-t border-border pt-5">
          <Button type="submit" variant="brand" loading={pending}>
            <Save className="size-4" /> Speichern
          </Button>
        </div>
      </form>
    </Card>
  );
}

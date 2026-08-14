"use client";

import { useActionState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { forgotPasswordAction, resetPasswordAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, {});

  if (state.ok) {
    return (
      <div className="mt-8 rounded-2xl border border-success/30 bg-success/10 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 size-8 text-success" />
        <p className="text-sm text-success">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-8 space-y-4">
      {state.message && <p className="text-sm text-danger">{state.message}</p>}
      <Field label="E-Mail" required error={state.errors?.email?.[0]}>
        <Input name="email" type="email" required autoComplete="email" placeholder="deine@email.de" />
      </Field>
      <Button type="submit" variant="brand" size="lg" className="w-full" loading={pending}>
        <Mail className="size-4" /> Link anfordern
      </Button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, {});

  if (state.ok) {
    return (
      <div className="mt-8 space-y-4">
        <div className="rounded-2xl border border-success/30 bg-success/10 p-6 text-center">
          <CheckCircle2 className="mx-auto mb-3 size-8 text-success" />
          <p className="text-sm text-success">{state.message}</p>
        </div>
        <Button asChild variant="brand" size="lg" className="w-full">
          <a href="/login">Zur Anmeldung</a>
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="token" value={token} />
      {state.message && <p className="text-sm text-danger">{state.message}</p>}
      <Field label="Neues Passwort" required error={state.errors?.password?.[0]} hint="Mindestens 8 Zeichen mit Ziffer.">
        <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
      </Field>
      <Field label="Passwort wiederholen" required error={state.errors?.passwordConfirm?.[0]}>
        <Input name="passwordConfirm" type="password" required minLength={8} autoComplete="new-password" />
      </Field>
      <Button type="submit" variant="brand" size="lg" className="w-full" loading={pending}>
        Passwort speichern
      </Button>
    </form>
  );
}

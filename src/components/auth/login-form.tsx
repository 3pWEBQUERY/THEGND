"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle, Eye, EyeOff, LogIn } from "lucide-react";
import { loginAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/primitives";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, {});
  const [show, setShow] = React.useState(false);

  return (
    <form action={action} className="mt-8 space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      {state.message && !state.ok && (
        <p className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </p>
      )}

      <Field label="E-Mail" required error={state.errors?.email?.[0]}>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="deine@email.de"
          defaultValue=""
        />
      </Field>

      <Field label="Passwort" required error={state.errors?.password?.[0]}>
        <div className="relative">
          <Input
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Passwort verbergen" : "Passwort anzeigen"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <Checkbox name="remember" defaultChecked />
          Angemeldet bleiben
        </label>
        <Link href="/passwort-vergessen" className="text-sm text-primary hover:underline">
          Passwort vergessen?
        </Link>
      </div>

      <Button type="submit" variant="brand" size="lg" className="w-full" loading={pending}>
        <LogIn className="size-4" /> Anmelden
      </Button>
    </form>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle, Building2, Eye, EyeOff, Sparkles, UserRound } from "lucide-react";
import { registerAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "MEMBER", label: "Ich suche", icon: UserRound, hint: "Profile entdecken, chatten, buchen" },
  { value: "ESCORT", label: "Ich biete an", icon: Sparkles, hint: "Eigenes Profil erstellen" },
  { value: "AGENCY", label: "Agentur / Club", icon: Building2, hint: "Mehrere Profile verwalten" },
] as const;

export function RegisterForm({ defaultRole = "MEMBER" }: { defaultRole?: string }) {
  const [state, action, pending] = useActionState(registerAction, {});
  const [role, setRole] = React.useState(defaultRole);
  const [show, setShow] = React.useState(false);

  return (
    <form action={action} className="mt-8 space-y-4">
      {state.message && !state.ok && (
        <p className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </p>
      )}

      <input type="hidden" name="role" value={role} />
      <Field label="Ich bin hier als" required>
        <div className="grid gap-2">
          {ROLES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRole(option.value)}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                role === option.value
                  ? "border-primary bg-primary/8"
                  : "border-border hover:border-foreground/25",
              )}
            >
              <option.icon className={cn("size-5 shrink-0", role === option.value ? "text-primary" : "text-muted-foreground")} />
              <span className="flex-1">
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="block text-xs text-muted-foreground">{option.hint}</span>
              </span>
              <span
                className={cn(
                  "size-4 shrink-0 rounded-md border-2",
                  role === option.value ? "border-primary bg-primary" : "border-border",
                )}
              />
            </button>
          ))}
        </div>
      </Field>

      <Field label="Anzeigename" required error={state.errors?.displayName?.[0]} hint="So wirst du auf der Plattform angezeigt.">
        <Input name="displayName" required minLength={2} maxLength={40} placeholder="z. B. Sophia" />
      </Field>

      <Field label="E-Mail" required error={state.errors?.email?.[0]}>
        <Input name="email" type="email" autoComplete="email" required placeholder="deine@email.de" />
      </Field>

      <Field
        label="Passwort"
        required
        error={state.errors?.password?.[0]}
        hint="Mindestens 8 Zeichen, mit Buchstabe und Ziffer."
      >
        <div className="relative">
          <Input
            name="password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
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

      <Field label="Passwort wiederholen" required error={state.errors?.passwordConfirm?.[0]}>
        <Input name="passwordConfirm" type="password" autoComplete="new-password" required minLength={8} />
      </Field>

      <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
        <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
          <Checkbox name="ageConfirmed" required className="mt-0.5" />
          <span>
            Ich bestätige, dass ich <b className="text-foreground">mindestens 18 Jahre</b> alt bin und freiwillig auf
            Inhalte für Erwachsene zugreife.
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
          <Checkbox name="termsAccepted" required className="mt-0.5" />
          <span>
            Ich akzeptiere die{" "}
            <Link href="/agb" className="text-primary hover:underline">
              AGB
            </Link>{" "}
            und die{" "}
            <Link href="/datenschutz" className="text-primary hover:underline">
              Datenschutzerklärung
            </Link>
            .
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
          <Checkbox name="newsletter" className="mt-0.5" />
          <span>Schick mir gelegentlich Neuigkeiten und Angebote (jederzeit abbestellbar).</span>
        </label>
      </div>

      {(state.errors?.ageConfirmed?.[0] || state.errors?.termsAccepted?.[0]) && (
        <p className="text-xs text-danger">
          {state.errors?.ageConfirmed?.[0] ?? state.errors?.termsAccepted?.[0]}
        </p>
      )}

      <Button type="submit" variant="brand" size="lg" className="w-full" loading={pending}>
        Konto erstellen
      </Button>
    </form>
  );
}

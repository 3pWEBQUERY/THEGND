"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { AlertTriangle, KeyRound, Laptop, MailCheck, Save, ShieldOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { changePasswordAction, deleteAccountAction, resendVerificationAction } from "@/server/actions/auth";
import { updateAccountAction } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {Field, Input} from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/primitives";
import { formatDateTime, timeAgo } from "@/lib/utils";
import type { ActionState } from "@/server/action-utils";

type Account = {
  email: string;
  displayName: string | null;
  phone: string | null;
  locale: string;
  timezone: string;
  newsletterOptIn: boolean;
  marketingOptIn: boolean;
  emailVerified: string | null;
  createdAt: string;
};

export function AccountSettings({
  account,
  sessions,
  blocks,
}: {
  account: Account;
  sessions: { id: string; ip: string | null; userAgent: string | null; createdAt: string }[];
  blocks: { id: string; blocked: { id: string; displayName: string | null } }[];
}) {
  const profile = useAction(updateAccountAction);
  const password = useAction(changePasswordAction);
  const remove = useAction(deleteAccountAction);
  const [resending, startResend] = React.useTransition();

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="mb-1 text-base font-semibold">Konto</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Mitglied seit {formatDateTime(account.createdAt)}
        </p>

        <form action={profile.dispatch} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="E-Mail">
              <div className="flex items-center gap-2">
                <Input value={account.email} disabled className="flex-1" />
                {account.emailVerified ? (
                  <Badge variant="success" size="sm">
                    <MailCheck className="size-3" /> bestätigt
                  </Badge>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    loading={resending}
                    onClick={() =>
                      startResend(async () => {
                        const res = await resendVerificationAction();
                        res.ok ? toast.success(res.message) : toast.error(res.message);
                      })
                    }
                  >
                    Bestätigen
                  </Button>
                )}
              </div>
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Telefon">
              <Input name="phone" type="tel" defaultValue={account.phone ?? ""} />
            </Field>
            <Field label="Zeitzone">
              <Select name="timezone" defaultValue={account.timezone}>
                {["Europe/Zurich", "Europe/Berlin", "Europe/Vienna", "Europe/Paris", "Europe/Rome", "UTC"].map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
              Newsletter erhalten
              <Switch name="newsletterOptIn" defaultChecked={account.newsletterOptIn} />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
              Produkt-Updates & Angebote
              <Switch name="marketingOptIn" defaultChecked={account.marketingOptIn} />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <p className="text-sm text-muted-foreground">
              Anzeigename, Bild und Sprache stehen unter{" "}
              <Link href="/dashboard/konto" className="text-primary hover:underline">
                Mein Profil
              </Link>
              .
            </p>
            <Button type="submit" variant="brand" loading={profile.pending}>
              <Save className="size-4" /> Speichern
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold">
          <KeyRound className="size-4 text-primary" /> Passwort ändern
        </h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Nach der Änderung wirst du auf allen Geräten abgemeldet.
        </p>

        <form action={password.dispatch} className="grid gap-4 sm:grid-cols-3">
          <Field label="Aktuelles Passwort" error={password.state.errors?.currentPassword?.[0]}>
            <Input name="currentPassword" type="password" required autoComplete="current-password" />
          </Field>
          <Field label="Neues Passwort" error={password.state.errors?.password?.[0]}>
            <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
          </Field>
          <Field label="Wiederholen" error={password.state.errors?.passwordConfirm?.[0]}>
            <Input name="passwordConfirm" type="password" required minLength={8} autoComplete="new-password" />
          </Field>
          <div className="sm:col-span-3 flex justify-end">
            <Button type="submit" variant="outline" loading={password.pending}>
              Passwort aktualisieren
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold">
          <Laptop className="size-4 text-primary" /> Aktive Sitzungen
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">{sessions.length} Gerät(e) angemeldet.</p>
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li key={session.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
              <span className="min-w-0">
                <span className="block truncate">{session.userAgent?.slice(0, 60) ?? "Unbekanntes Gerät"}</span>
                <span className="block text-xs text-muted-foreground">
                  {session.ip ?? "—"} · seit {timeAgo(session.createdAt)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {blocks.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <ShieldOff className="size-4 text-primary" /> Blockierte Mitglieder
          </h2>
          <ul className="flex flex-wrap gap-2">
            {blocks.map((block) => (
              <Badge key={block.id} variant="neutral" size="lg">
                {block.blocked.displayName ?? "Mitglied"}
              </Badge>
            ))}
          </ul>
        </Card>
      )}

      <Card className="border-danger/30 p-6">
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-danger">
          <AlertTriangle className="size-4" /> Konto löschen
        </h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Dein Profil wird sofort offline genommen, personenbezogene Daten werden anonymisiert. Dieser Schritt kann
          nicht rückgängig gemacht werden.
        </p>
        <form action={remove.dispatch} className="flex flex-wrap items-end gap-3">
          <Field label='Tippe "LÖSCHEN" zur Bestätigung' className="flex-1 min-w-56">
            <Input name="confirm" placeholder="LÖSCHEN" />
          </Field>
          <Button type="submit" variant="danger" loading={remove.pending}>
            <Trash2 className="size-4" /> Konto endgültig löschen
          </Button>
        </form>
      </Card>
    </div>
  );
}

function useAction(action: (prev: ActionState, formData: FormData) => Promise<ActionState>) {
  const [state, dispatch, pending] = useActionState(action, {});
  React.useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
    else if (state.message) toast.error(state.message);
  }, [state]);
  return { state, dispatch, pending };
}

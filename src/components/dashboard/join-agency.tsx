"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Building2, Clock, Loader2, MapPin, Search, Send, X } from "lucide-react";
import { toast } from "sonner";
import { requestJoinAction, withdrawJoinRequestAction } from "@/server/actions/agency";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AGENCY_KIND_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/server/action-utils";

export type HausTreffer = {
  slug: string;
  name: string;
  kind: string;
  cityName: string | null;
  logoUrl: string | null;
  isVerified: boolean;
  modelCount: number;
};

export type EigeneAnfrage = {
  id: string;
  createdAt: Date;
  message: string | null;
  agency: { name: string; slug: string; kind: string };
};

/**
 * Beitritt aus eigenem Antrieb: Haus suchen, anfragen, warten.
 *
 * Zusagen muss das Haus — genau spiegelbildlich zur Einladung, bei der die
 * Anbieterin zusagt. Keine Seite kann die andere einseitig zuordnen.
 */
export function JoinAgency({ haeuser, anfrage }: { haeuser: HausTreffer[]; anfrage: EigeneAnfrage | null }) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(requestJoinAction, {});
  const [suche, setSuche] = React.useState("");
  const [gewaehlt, setGewaehlt] = React.useState<HausTreffer | null>(null);
  const [laeuft, setLaeuft] = React.useState(false);

  React.useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success(state.message);
      setGewaehlt(null);
      setSuche("");
      router.refresh();
    } else {
      toast.error(state.message);
    }
  }, [state, router]);

  const zurueckziehen = async () => {
    if (!anfrage) return;
    setLaeuft(true);
    const res = await withdrawJoinRequestAction(anfrage.id);
    if (res.ok) {
      toast.success(res.message ?? "Zurückgezogen.");
      router.refresh();
    } else {
      toast.error(res.message ?? "Fehlgeschlagen.");
    }
    setLaeuft(false);
  };

  if (anfrage) {
    return (
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-semibold">
              <Clock className="size-4 text-warning" />
              Anfrage läuft
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Du hast{" "}
              <Link href={`/agenturen/${anfrage.agency.slug}`} target="_blank" className="text-primary hover:underline">
                {anfrage.agency.name}
              </Link>{" "}
              am {formatDate(anfrage.createdAt)} angefragt. Das Haus entscheidet — du bekommst eine
              Benachrichtigung, sobald es geantwortet hat.
            </p>
            {anfrage.message && (
              <p className="mt-3 whitespace-pre-line rounded-xl border border-border bg-muted/40 p-3 text-sm">
                {anfrage.message}
              </p>
            )}
          </div>

          <Button type="button" variant="ghost" size="sm" disabled={laeuft} onClick={zurueckziehen}>
            {laeuft ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />} Zurückziehen
          </Button>
        </div>
      </Card>
    );
  }

  const treffer = suche.trim()
    ? haeuser.filter((h) =>
        `${h.name} ${h.cityName ?? ""}`.toLowerCase().includes(suche.trim().toLowerCase()),
      )
    : haeuser;

  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold">Einem Haus beitreten</h2>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">
        Such dir ein Haus und stell eine Anfrage. Erst wenn das Haus zusagt, erscheint dein Profil dort — bis
        dahin ändert sich für dich nichts.
      </p>

      <form action={dispatch} className="space-y-4">
        <input type="hidden" name="agencySlug" value={gewaehlt?.slug ?? ""} />

        <div className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-3 focus-within:border-ring">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={suche}
            onChange={(event) => {
              setSuche(event.target.value);
              setGewaehlt(null);
            }}
            placeholder="Haus oder Stadt suchen …"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
        </div>

        {treffer.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            Kein Haus gefunden.
          </p>
        ) : (
          <ul className="max-h-80 space-y-1.5 overflow-y-auto">
            {treffer.map((haus) => (
              <li key={haus.slug}>
                <button
                  type="button"
                  onClick={() => setGewaehlt(haus)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                    gewaehlt?.slug === haus.slug
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-foreground/25",
                  )}
                >
                  <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {haus.logoUrl ? (
                      <Image src={haus.logoUrl} alt="" fill sizes="40px" className="object-cover" />
                    ) : (
                      <span className="grid size-full place-items-center">
                        <Building2 className="size-4 text-muted-foreground" />
                      </span>
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                      {haus.name}
                      {haus.isVerified && <BadgeCheck className="size-3.5 shrink-0 text-primary" />}
                    </span>
                    <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />
                      {haus.cityName ?? "—"} · {haus.modelCount} {haus.modelCount === 1 ? "Model" : "Models"}
                    </span>
                  </span>

                  <Badge variant="neutral" size="sm">
                    {AGENCY_KIND_LABEL[haus.kind] ?? haus.kind}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        )}

        {gewaehlt && (
          <>
            <Field label="Nachricht" hint="Optional — z. B. wie du arbeitest und ab wann du verfügbar bist.">
              <Textarea name="message" rows={3} maxLength={500} />
            </Field>

            <Button type="submit" variant="brand" loading={pending}>
              {!pending && <Send className="size-4" />} Anfrage an {gewaehlt.name} senden
            </Button>
          </>
        )}
      </form>
    </Card>
  );
}

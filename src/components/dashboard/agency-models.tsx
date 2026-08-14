"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Check, Clock, Inbox, Loader2, Pencil, Search, Send, UserMinus, X } from "lucide-react";
import { toast } from "sonner";
import {
  decideJoinRequestAction,
  inviteModelAction,
  removeModelAction,
  revokeInviteAction,
} from "@/server/actions/agency";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { CreateModelForm } from "@/components/dashboard/create-model-form";
import type { StadtOption } from "@/components/map/city-picker";
import { PROFILE_STATUS_LABEL } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import type { ActionState } from "@/server/action-utils";

export type ModelEintrag = {
  id: string;
  slug: string;
  displayName: string;
  status: string;
  isVerified: boolean;
  coverUrl: string | null;
  cityName: string | null;
  /** Vom Haus angelegt und verwaltet — kein eigenes Login. */
  verwaltet: boolean;
};

export type EinladungEintrag = {
  id: string;
  createdAt: Date;
  profile: { slug: string; displayName: string };
};

export type AnfrageEintrag = EinladungEintrag & { message: string | null };

export function AgencyModels({
  models,
  einladungen,
  anfragen,
  cities,
  darfBearbeiten,
}: {
  models: ModelEintrag[];
  einladungen: EinladungEintrag[];
  /** Anbieterinnen, die von sich aus beitreten möchten. */
  anfragen: AnfrageEintrag[];
  /** Für das Anlegeformular. */
  cities: StadtOption[];
  darfBearbeiten: boolean;
}) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(inviteModelAction, {});
  const formRef = React.useRef<HTMLFormElement>(null);
  const [laeuft, setLaeuft] = React.useState<string | null>(null);

  // Ein Haus kann viele Models führen — ohne Suche und Statusfilter wird die
  // Liste ab etwa zwanzig Einträgen unbrauchbar.
  const [suche, setSuche] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALLE");

  const begriff = suche.trim().toLowerCase();
  const sichtbar = models.filter(
    (m) =>
      (statusFilter === "ALLE" || m.status === statusFilter) &&
      (!begriff || `${m.displayName} ${m.cityName ?? ""}`.toLowerCase().includes(begriff)),
  );

  const zaehler = (status: string) =>
    status === "ALLE" ? models.length : models.filter((m) => m.status === status).length;

  const FILTER = [
    { wert: "ALLE", label: "Alle" },
    { wert: "ACTIVE", label: "Aktiv" },
    { wert: "DRAFT", label: "Entwurf" },
    { wert: "PENDING_REVIEW", label: "In Prüfung" },
    { wert: "PAUSED", label: "Pausiert" },
  ].filter((f) => f.wert === "ALLE" || zaehler(f.wert) > 0);

  React.useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success(state.message);
      formRef.current?.reset();
      router.refresh();
    } else {
      toast.error(state.message);
    }
  }, [state, router]);

  const ausfuehren = async (id: string, fn: () => Promise<ActionState>) => {
    setLaeuft(id);
    const res = await fn();
    if (res.ok) {
      toast.success(res.message ?? "Erledigt.");
      router.refresh();
    } else {
      toast.error(res.message ?? "Fehlgeschlagen.");
    }
    setLaeuft(null);
  };

  const TAB_LABELS = [
    ...(darfBearbeiten
      ? [
          { wert: "anlegen", label: "Eigenes Model anlegen" },
          { wert: "einladen", label: "Model einladen", badge: anfragen.length + einladungen.length },
        ]
      : []),
    { wert: "liste", label: `Unsere Models (${models.length})` },
  ];

  return (
    // Standardmässig die Liste — beim Öffnen will man in der Regel sehen,
    // wer schon da ist, nicht ein leeres Anlegeformular.
    <Tabs defaultValue="liste">
      <div className="no-scrollbar -mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <TabsList>
          {TAB_LABELS.map((tab) => (
            <TabsTrigger key={tab.wert} value={tab.wert}>
              {tab.label}
              {"badge" in tab && tab.badge ? (
                <Badge size="sm" className="ml-1.5">
                  {tab.badge}
                </Badge>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {darfBearbeiten && (
        <TabsContent value="anlegen">
          <CreateModelForm cities={cities} />
        </TabsContent>
      )}

      {darfBearbeiten && (
        <TabsContent value="einladen" className="space-y-6">
          {darfBearbeiten && (
            <Card className="p-6">
              <h2 className="mb-1 text-base font-semibold">Model einladen</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Gib die Profiladresse an. Die Person entscheidet selbst, ob sie zusagt — erst dann erscheint
                sie bei deinem Haus.
              </p>

              <form ref={formRef} action={dispatch} className="space-y-4">
                <Field
                  label="Profiladresse"
                  required
                  hint="Der Teil nach /escort/ — eine vollständige URL geht auch."
                  error={state.errors?.slug?.[0]}
                >
                  <Input name="slug" required placeholder="z. B. angie" />
                </Field>

                <Field label="Nachricht" hint="Optional — wird der Person mit der Einladung angezeigt.">
                  <Textarea name="message" rows={2} maxLength={500} />
                </Field>

                <Button type="submit" variant="brand" loading={pending}>
                  {!pending && <Send className="size-4" />} Einladung senden
                </Button>
              </form>
            </Card>
          )}

          {anfragen.length > 0 && (
            <Card className="border-primary/30 bg-primary/5 p-6">
              <h2 className="mb-1 flex items-center gap-2 text-base font-semibold">
                <Inbox className="size-4 text-primary" /> Beitrittsanfragen ({anfragen.length})
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Diese Anbieterinnen möchten von sich aus zu deinem Haus gehören.
              </p>

              <ul className="divide-y divide-border">
                {anfragen.map((anfrage) => (
                  <li key={anfrage.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/escort/${anfrage.profile.slug}`}
                          target="_blank"
                          className="font-medium hover:text-primary"
                        >
                          {anfrage.profile.displayName}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          angefragt am {formatDate(anfrage.createdAt)}
                        </p>
                        {anfrage.message && (
                          <p className="mt-2 whitespace-pre-line rounded-xl border border-border bg-card p-3 text-sm">
                            {anfrage.message}
                          </p>
                        )}
                      </div>

                      {darfBearbeiten && (
                        <div className="flex shrink-0 gap-2">
                          <Button
                            type="button"
                            variant="brand"
                            size="sm"
                            disabled={laeuft === anfrage.id}
                            onClick={() =>
                              ausfuehren(anfrage.id, () => decideJoinRequestAction(anfrage.id, true))
                            }
                          >
                            {laeuft === anfrage.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Check className="size-4" />
                            )}
                            Aufnehmen
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={laeuft === anfrage.id}
                            onClick={() =>
                              ausfuehren(anfrage.id, () => decideJoinRequestAction(anfrage.id, false))
                            }
                          >
                            <X className="size-4" /> Ablehnen
                          </Button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {einladungen.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
                <Clock className="size-4 text-muted-foreground" /> Offene Einladungen ({einladungen.length})
              </h2>
              <ul className="divide-y divide-border">
                {einladungen.map((einladung) => (
                  <li
                    key={einladung.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/escort/${einladung.profile.slug}`}
                        target="_blank"
                        className="font-medium hover:text-primary"
                      >
                        {einladung.profile.displayName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        eingeladen am {formatDate(einladung.createdAt)} · wartet auf Antwort
                      </p>
                    </div>
                    {darfBearbeiten && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={laeuft === einladung.id}
                        onClick={() => ausfuehren(einladung.id, () => revokeInviteAction(einladung.id))}
                      >
                        {laeuft === einladung.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <X className="size-4" />
                        )}
                        Zurückziehen
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </TabsContent>
      )}

      <TabsContent value="liste">
        <Card className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold">
              Unsere Models <span className="font-normal text-muted-foreground">({models.length})</span>
            </h2>

            {models.length > 5 && (
              <div className="flex h-9 min-w-52 items-center gap-2 rounded-xl border border-border bg-background px-3">
                <Search className="size-3.5 shrink-0 text-muted-foreground" />
                <input
                  value={suche}
                  onChange={(event) => setSuche(event.target.value)}
                  placeholder="Name oder Stadt …"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                />
                {suche && (
                  <button
                    type="button"
                    onClick={() => setSuche("")}
                    aria-label="Suche leeren"
                    className="grid size-5 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {models.length > 5 && FILTER.length > 1 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {FILTER.map((f) => (
                <button
                  key={f.wert}
                  type="button"
                  onClick={() => setStatusFilter(f.wert)}
                  aria-pressed={statusFilter === f.wert}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                    statusFilter === f.wert
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                  )}
                >
                  {f.label} <span className="tabular-nums opacity-70">{zaehler(f.wert)}</span>
                </button>
              ))}
            </div>
          )}

          {models.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              Noch keine Models zugeordnet.
            </p>
          ) : sichtbar.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              Kein Model passt zu dieser Auswahl.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {sichtbar.map((model) => (
                <li key={model.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0">
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {model.coverUrl && (
                      <Image src={model.coverUrl} alt="" fill sizes="44px" className="object-cover" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate font-medium">
                      {darfBearbeiten ? (
                        <Link
                          href={`/dashboard/agentur/models/${model.id}`}
                          className="truncate hover:text-primary"
                        >
                          {model.displayName}
                        </Link>
                      ) : (
                        <span className="truncate">{model.displayName}</span>
                      )}
                      {model.isVerified && <BadgeCheck className="size-3.5 shrink-0 text-primary" />}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {model.cityName ?? "—"} · {PROFILE_STATUS_LABEL[model.status] ?? model.status}
                      {model.status === "ACTIVE" && (
                        <>
                          {" · "}
                          <Link href={`/escort/${model.slug}`} target="_blank" className="hover:text-primary">
                            öffentliche Seite ↗
                          </Link>
                        </>
                      )}
                    </p>
                  </div>

                  <Badge size="sm" variant={model.verwaltet ? "outline" : "neutral"}>
                    {model.verwaltet ? "von uns verwaltet" : "eigenes Konto"}
                  </Badge>

                  <Badge size="sm" variant={model.status === "ACTIVE" ? "success" : "neutral"}>
                    {model.status === "ACTIVE" ? "aktiv" : "nicht öffentlich"}
                  </Badge>

                  {darfBearbeiten && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/agentur/models/${model.id}`}>
                        <Pencil className="size-3.5" /> Bearbeiten
                      </Link>
                    </Button>
                  )}

                  {darfBearbeiten && !model.verwaltet && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={laeuft === model.id}
                      onClick={() => {
                        if (
                          !confirm(
                            `Zuordnung von ${model.displayName} aufheben? Das Profil selbst bleibt bestehen.`,
                          )
                        )
                          return;
                        void ausfuehren(model.id, () => removeModelAction(model.id));
                      }}
                    >
                      {laeuft === model.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <UserMinus className="size-4" />
                      )}
                      Entfernen
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </TabsContent>
    </Tabs>
  );
}

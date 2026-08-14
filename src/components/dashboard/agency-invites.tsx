"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Building2, Check, Loader2, LogOut, X } from "lucide-react";
import { toast } from "sonner";
import { leaveAgencyAction, respondToInviteAction } from "@/server/actions/agency";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AGENCY_KIND_LABEL } from "@/lib/constants";
import type { ActionState } from "@/server/action-utils";

export type Einladung = {
  id: string;
  message: string | null;
  agency: {
    name: string;
    slug: string;
    kind: string;
    logoUrl: string | null;
    isVerified: boolean;
    cityName: string | null;
  };
};

/**
 * Einladungen von Häusern — und der Austritt.
 *
 * Die Zuordnung zu einem Haus ist eine öffentliche Aussage über die eigene
 * Arbeit. Deshalb liegt die Entscheidung hier und nirgendwo sonst: zusagen,
 * ablehnen, jederzeit wieder gehen.
 */
export function AgencyInvites({
  einladungen,
  aktuellesHaus,
}: {
  einladungen: Einladung[];
  aktuellesHaus: { name: string; slug: string; kind: string; isVerified: boolean } | null;
}) {
  const router = useRouter();
  const [laeuft, setLaeuft] = React.useState<string | null>(null);

  if (einladungen.length === 0 && !aktuellesHaus) return null;

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

  return (
    <div className="space-y-4">
      {einladungen.map((einladung) => (
        <Card key={einladung.id} className="border-primary/30 bg-primary/5 p-5">
          <div className="flex flex-wrap items-start gap-4">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-muted">
              {einladung.agency.logoUrl ? (
                <Image src={einladung.agency.logoUrl} alt="" fill sizes="48px" className="object-cover" />
              ) : (
                <span className="grid size-full place-items-center">
                  <Building2 className="size-5 text-muted-foreground" />
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                {einladung.agency.name}
                {einladung.agency.isVerified && <BadgeCheck className="size-4 text-primary" />}
                <Badge variant="neutral" size="sm">
                  {AGENCY_KIND_LABEL[einladung.agency.kind] ?? einladung.agency.kind}
                </Badge>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {einladung.agency.cityName ?? "—"} · möchte dich ins Team aufnehmen
              </p>

              {einladung.message && (
                <p className="mt-3 whitespace-pre-line rounded-xl border border-border bg-card p-3 text-sm">
                  {einladung.message}
                </p>
              )}

              <p className="mt-3 text-xs text-muted-foreground">
                Sagst du zu, erscheint dein Profil öffentlich bei diesem Haus. Du kannst jederzeit wieder
                austreten.{" "}
                <Link href={`/agenturen/${einladung.agency.slug}`} target="_blank" className="text-primary hover:underline">
                  Haus ansehen ↗
                </Link>
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="brand"
                  size="sm"
                  disabled={laeuft === einladung.id}
                  onClick={() => ausfuehren(einladung.id, () => respondToInviteAction(einladung.id, true))}
                >
                  {laeuft === einladung.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Zusagen
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={laeuft === einladung.id}
                  onClick={() => ausfuehren(einladung.id, () => respondToInviteAction(einladung.id, false))}
                >
                  <X className="size-4" /> Ablehnen
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}

      {aktuellesHaus && (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Du gehörst zu</p>
            <p className="flex items-center gap-2 font-semibold">
              <Link href={`/agenturen/${aktuellesHaus.slug}`} target="_blank" className="hover:text-primary">
                {aktuellesHaus.name}
              </Link>
              {aktuellesHaus.isVerified && <BadgeCheck className="size-4 text-primary" />}
              <Badge variant="neutral" size="sm">
                {AGENCY_KIND_LABEL[aktuellesHaus.kind] ?? aktuellesHaus.kind}
              </Badge>
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={laeuft === "austritt"}
            onClick={() => {
              if (!confirm(`Aus ${aktuellesHaus.name} austreten? Dein Profil bleibt vollständig erhalten.`)) return;
              void ausfuehren("austritt", () => leaveAgencyAction());
            }}
          >
            {laeuft === "austritt" ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
            Austreten
          </Button>
        </Card>
      )}
    </div>
  );
}

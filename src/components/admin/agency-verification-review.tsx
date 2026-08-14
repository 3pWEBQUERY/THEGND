"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, ExternalLink, FileText, Loader2, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { reviewAgencyVerificationAction } from "@/server/actions/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";

export type PruefAntrag = {
  id: string;
  legalName: string | null;
  uid: string | null;
  contactName: string | null;
  contactRole: string | null;
  registryKey: string | null;
  permitKey: string | null;
  idKey: string | null;
  submittedAt: Date | null;
  agency: { name: string; slug: string };
};

/**
 * Prüfanträge der Häuser.
 *
 * Die Dokumente liegen im privaten Bucket und werden über `/media`
 * ausgeliefert — dort greift die Zugriffsprüfung für Moderationspersonal.
 */
export function AgencyVerificationReview({ antraege }: { antraege: PruefAntrag[] }) {
  const router = useRouter();
  const [laeuft, setLaeuft] = React.useState<string | null>(null);
  const [notizen, setNotizen] = React.useState<Record<string, string>>({});

  if (antraege.length === 0) return null;

  const entscheiden = async (antrag: PruefAntrag, freigeben: boolean) => {
    if (!freigeben && !notizen[antrag.id]?.trim()) {
      toast.error("Bitte einen Grund angeben — er wird dem Haus mitgeteilt.");
      return;
    }
    setLaeuft(antrag.id);
    const res = await reviewAgencyVerificationAction(antrag.id, freigeben, notizen[antrag.id]?.trim() || undefined);
    if (res.ok) {
      toast.success(res.message ?? "Erledigt.");
      router.refresh();
    } else {
      toast.error(res.message ?? "Fehlgeschlagen.");
    }
    setLaeuft(null);
  };

  return (
    <Card className="mb-6 border-warning/30 bg-warning/8 p-6">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
        <ShieldCheck className="size-4 text-warning" /> Offene Prüfanträge ({antraege.length})
      </h2>

      <ul className="space-y-5">
        {antraege.map((antrag) => (
          <li key={antrag.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {antrag.agency.name}
                  <Link
                    href={`/agenturen/${antrag.agency.slug}`}
                    target="_blank"
                    className="ml-2 inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                  >
                    ansehen <ExternalLink className="size-3" />
                  </Link>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {antrag.legalName}
                  {antrag.uid ? ` · ${antrag.uid}` : ""} · {antrag.contactName}
                  {antrag.contactRole ? ` (${antrag.contactRole})` : ""}
                </p>
                {antrag.submittedAt && (
                  <p className="text-xs text-muted-foreground">
                    eingereicht {formatDateTime(antrag.submittedAt)}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["Handelsregister", antrag.registryKey],
                  ["Ausweis", antrag.idKey],
                  ["Bewilligung", antrag.permitKey],
                ] as const
              ).map(([label, key]) =>
                key ? (
                  <a
                    key={label}
                    href={`/media/${key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs transition-colors hover:border-primary hover:text-primary"
                  >
                    <FileText className="size-3.5" /> {label}
                  </a>
                ) : null,
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Input
                value={notizen[antrag.id] ?? ""}
                onChange={(e) => setNotizen((n) => ({ ...n, [antrag.id]: e.target.value }))}
                placeholder="Notiz — bei Ablehnung Pflicht"
                className="h-9 min-w-48 flex-1"
                maxLength={300}
              />
              <Button
                type="button"
                variant="brand"
                size="sm"
                disabled={laeuft === antrag.id}
                onClick={() => entscheiden(antrag, true)}
              >
                {laeuft === antrag.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <BadgeCheck className="size-4" />
                )}
                Siegel vergeben
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={laeuft === antrag.id}
                onClick={() => entscheiden(antrag, false)}
              >
                <X className="size-4" /> Ablehnen
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

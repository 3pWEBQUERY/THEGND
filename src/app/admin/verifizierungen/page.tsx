import type { Metadata } from "next";
import { BadgeCheck, Check, X } from "lucide-react";
import { db } from "@/lib/db";
import { reviewVerificationAction } from "@/server/actions/admin";
import { createDownloadUrl, s3Configured } from "@/lib/s3";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { ActionButton } from "@/components/admin/action-buttons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Verifizierungen · Admin" };

export default async function AdminVerificationsPage() {
  const requests = await db.verification.findMany({
    where: { status: { in: ["SUBMITTED", "IN_REVIEW"] } },
    orderBy: { submittedAt: "asc" },
    include: { profile: { select: { displayName: true, slug: true, birthDate: true, user: { select: { email: true } } } } },
  });

  const withUrls = await Promise.all(
    requests.map(async (request) => ({
      ...request,
      idFrontUrl: s3Configured && request.idFrontKey ? await createDownloadUrl(request.idFrontKey) : null,
      idBackUrl: s3Configured && request.idBackKey ? await createDownloadUrl(request.idBackKey) : null,
      selfieUrl: s3Configured && request.selfieKey ? await createDownloadUrl(request.selfieKey) : null,
    })),
  );

  return (
    <>
      <PageHeader
        title="Verifizierungen"
        description="Ausweis und Selfie abgleichen. Dokumente sind nur über kurzlebige Links einsehbar."
      />

      {withUrls.length === 0 ? (
        <EmptyState icon={BadgeCheck} title="Keine offenen Anträge" description="Alle Verifizierungen sind bearbeitet." />
      ) : (
        <div className="space-y-4">
          {withUrls.map((request) => (
            <Card key={request.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-56">
                  <h2 className="font-semibold">{request.profile.displayName}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {request.profile.user.email} · eingereicht {request.submittedAt ? timeAgo(request.submittedAt) : "—"}
                  </p>
                  <dl className="mt-3 space-y-1 text-sm">
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">Name laut Antrag:</dt>
                      <dd className="font-medium">{request.legalName ?? "—"}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">Geburtsdatum:</dt>
                      <dd className="font-medium">{request.birthDate ? formatDate(request.birthDate) : "—"}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">Profil-Geburtsdatum:</dt>
                      <dd className="font-medium">
                        {request.profile.birthDate ? formatDate(request.profile.birthDate) : "—"}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">Dokumentnr.:</dt>
                      <dd className="font-medium">{request.documentNo ?? "—"}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      ["Ausweis Vorderseite", request.idFrontUrl],
                      ["Ausweis Rückseite", request.idBackUrl],
                      ["Selfie", request.selfieUrl],
                    ].map(([label, url]) =>
                      url ? (
                        <a
                          key={label as string}
                          href={url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
                        >
                          {label} öffnen ↗
                        </a>
                      ) : (
                        <Badge key={label as string} variant="neutral" size="sm">
                          {label}: nicht verfügbar
                        </Badge>
                      ),
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <ActionButton size="sm" variant="success" action={reviewVerificationAction.bind(null, request.id, true, "ID", undefined)}>
                    <Check className="size-4" /> Ausweis bestätigt
                  </ActionButton>
                  <ActionButton size="sm" variant="outline" action={reviewVerificationAction.bind(null, request.id, true, "PHOTO", undefined)}>
                    Nur Foto-Check
                  </ActionButton>
                  <ActionButton
                    size="sm"
                    variant="ghost"
                    confirm="Antrag ablehnen?"
                    action={reviewVerificationAction.bind(null, request.id, false, "ID", "Dokumente nicht eindeutig lesbar.")}
                  >
                    <X className="size-4" /> Ablehnen
                  </ActionButton>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

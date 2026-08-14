import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BadgeCheck, Clock, ShieldCheck, XCircle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { VerificationForm } from "@/components/dashboard/verification-form";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VERIFICATION_LABEL } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Verifizierung" };

export default async function VerificationPage() {
  const user = await requireUser();
  if (!user.profileId) redirect("/onboarding");

  const profile = await db.profile.findUnique({
    where: { id: user.profileId },
    select: { displayName: true, isVerified: true, verificationLevel: true, verification: true },
  });

  const verification = profile?.verification;
  const status = verification?.status ?? "NOT_STARTED";

  return (
    <>
      <PageHeader
        title="Verifizierung"
        description="Verifizierte Profile erhalten das blaue Badge, ranken besser und bekommen deutlich mehr Anfragen."
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div>
          {status === "APPROVED" ? (
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-success/12 text-success">
                  <BadgeCheck className="size-6" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold">Verifizierung abgeschlossen</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Dein Profil trägt das Badge „{VERIFICATION_LABEL[profile?.verificationLevel ?? "ID"]}“.
                  </p>
                  {verification?.reviewedAt && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Geprüft am {formatDateTime(verification.reviewedAt)}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ) : status === "SUBMITTED" || status === "IN_REVIEW" ? (
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-warning/12 text-warning">
                  <Clock className="size-6" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold">In Prüfung</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Wir prüfen deine Unterlagen — in der Regel innerhalb von 24 Stunden. Du bekommst eine E-Mail,
                    sobald es Neuigkeiten gibt.
                  </p>
                  {verification?.submittedAt && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Eingereicht am {formatDateTime(verification.submittedAt)}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <>
              {status === "REJECTED" && (
                <Card className="mb-4 border-danger/30 bg-danger/6 p-5">
                  <p className="flex items-center gap-2 font-medium text-danger">
                    <XCircle className="size-4" /> Verifizierung abgelehnt
                  </p>
                  {verification?.note && <p className="mt-2 text-sm text-muted-foreground">{verification.note}</p>}
                  <p className="mt-2 text-sm text-muted-foreground">Du kannst die Unterlagen erneut einreichen.</p>
                </Card>
              )}
              <VerificationForm displayName={profile?.displayName ?? ""} />
            </>
          )}
        </div>

        <Card className="h-fit p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <ShieldCheck className="size-5 text-primary" /> So läuft die Prüfung
          </h2>
          <ol className="space-y-4">
            {[
              { title: "Ausweis hochladen", text: "Personalausweis oder Reisepass, gut lesbar. Seriennummer darf geschwärzt sein." },
              { title: "Verifizierungs-Selfie", text: "Foto von dir mit einem handschriftlichen Zettel: „THEGND“ + heutiges Datum." },
              { title: "Manuelle Prüfung", text: "Unser Team gleicht die Angaben ab — meist in unter 24 Stunden." },
              { title: "Badge & Ranking", text: "Nach Freigabe erhältst du das Badge und einen Ranking-Bonus." },
            ].map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/12 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 rounded-xl bg-muted/60 p-4">
            <p className="text-xs font-semibold">Datenschutz</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Ausweisdokumente werden verschlüsselt gespeichert, sind nie öffentlich sichtbar und werden nach
              Abschluss der Prüfung binnen 90 Tagen gelöscht.
            </p>
            <Badge variant="neutral" size="sm" className="mt-3">
              DSGVO-konform
            </Badge>
          </div>
        </Card>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { s3Configured } from "@/lib/s3";
import { PageHeader } from "@/components/dashboard/page-header";
import { MediaManager } from "@/components/dashboard/media-manager";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Fotos & Videos" };

export default async function MediaPage() {
  const user = await requireUser();
  if (!user.profileId) redirect("/onboarding");

  const media = await db.media.findMany({
    where: { profileId: user.profileId },
    orderBy: [{ isCover: "desc" }, { position: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Fotos & Videos"
        description="Das erste Bild ist dein Titelbild. Hochwertige, aktuelle Fotos bringen deutlich mehr Anfragen."
        action={<Badge variant="neutral">{media.length} / 60</Badge>}
      />

      {!s3Configured && (
        <div className="mb-6 rounded-2xl border border-warning/30 bg-warning/8 px-5 py-4 text-sm">
          <p className="font-medium">Speicher noch nicht konfiguriert</p>
          <p className="mt-1 text-muted-foreground">
            Setze <code className="rounded bg-muted px-1">S3_ENDPOINT</code>,{" "}
            <code className="rounded bg-muted px-1">S3_BUCKET</code>,{" "}
            <code className="rounded bg-muted px-1">S3_ACCESS_KEY_ID</code> und{" "}
            <code className="rounded bg-muted px-1">S3_SECRET_ACCESS_KEY</code>, damit Uploads funktionieren.
          </p>
        </div>
      )}

      <MediaManager media={media} />
    </>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import { Check, Images, X } from "lucide-react";
import { db } from "@/lib/db";
import { moderateMediaAction } from "@/server/actions/admin";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { ActionButton } from "@/components/admin/action-buttons";
import { Card } from "@/components/ui/card";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Medien · Admin" };

export default async function AdminMediaPage() {
  const media = await db.media.findMany({
    where: { moderation: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: 60,
    include: { profile: { select: { displayName: true, slug: true } } },
  });

  return (
    <>
      <PageHeader title="Medien-Moderation" description="Prüfe neue Uploads auf Richtlinienverstösse." />

      {media.length === 0 ? (
        <EmptyState icon={Images} title="Alles geprüft" description="Aktuell warten keine Medien auf Freigabe." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {media.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative aspect-3/4 bg-muted">
                {item.type === "VIDEO" ? (
                  <video src={item.url} controls className="size-full object-cover" />
                ) : (
                  <Image src={item.thumbUrl ?? item.url} alt="" fill sizes="25vw" className="object-cover" />
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-medium">{item.profile.displayName}</p>
                <p className="text-[11px] text-muted-foreground">{timeAgo(item.createdAt)}</p>
                <div className="mt-3 flex gap-2">
                  <ActionButton
                    size="xs"
                    variant="success"
                    className="flex-1"
                    action={moderateMediaAction.bind(null, item.id, true, undefined)}
                  >
                    <Check className="size-3.5" /> OK
                  </ActionButton>
                  <ActionButton
                    size="xs"
                    variant="outline"
                    className="flex-1"
                    action={moderateMediaAction.bind(null, item.id, false, "Verstoss gegen die Richtlinien.")}
                  >
                    <X className="size-3.5" /> Ablehnen
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

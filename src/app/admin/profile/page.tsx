import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Building2, Check, ExternalLink, Pause, X } from "lucide-react";
import { db } from "@/lib/db";
import { moderateProfileAction } from "@/server/actions/admin";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { ActionButton } from "@/components/admin/action-buttons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { PROFILE_STATUS_LABEL } from "@/lib/constants";
import { timeAgo, truncate } from "@/lib/utils";
import { UserRound } from "lucide-react";

export const metadata: Metadata = { title: "Profile · Admin" };

const SELECT = {
  id: true,
  slug: true,
  displayName: true,
  headline: true,
  about: true,
  status: true,
  updatedAt: true,
  isVerified: true,
  city: { select: { name: true } },
  agency: { select: { name: true, slug: true } },
  user: { select: { email: true, createdAt: true } },
  media: { take: 4, orderBy: { position: "asc" as const }, select: { id: true, url: true, thumbUrl: true, moderation: true } },
  _count: { select: { media: true, reviews: true } },
};

export default async function AdminProfilesPage() {
  const [pending, drafts, active, rejected] = await Promise.all([
    db.profile.findMany({ where: { status: "PENDING_REVIEW" }, orderBy: { updatedAt: "asc" }, select: SELECT }),
    /*
     * Entwürfe gehören ebenfalls hierher: Inserate, die ein Haus für seine
     * Models anlegt, bleiben im Entwurf, solange das Haus sie nicht selbst
     * einreicht. Ohne diesen Reiter wären sie für die Freigabe unsichtbar.
     */
    db.profile.findMany({ where: { status: "DRAFT" }, orderBy: { updatedAt: "desc" }, take: 60, select: SELECT }),
    db.profile.findMany({ where: { status: "ACTIVE" }, orderBy: { updatedAt: "desc" }, take: 40, select: SELECT }),
    db.profile.findMany({ where: { status: { in: ["REJECTED", "PAUSED"] } }, orderBy: { updatedAt: "desc" }, take: 40, select: SELECT }),
  ]);

  return (
    <>
      <PageHeader title="Profile" description="Freigabe, Ablehnung und Sperrung von Inseraten." />

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Wartend ({pending.length})</TabsTrigger>
          <TabsTrigger value="drafts">Entwürfe ({drafts.length})</TabsTrigger>
          <TabsTrigger value="active">Aktiv ({active.length})</TabsTrigger>
          <TabsTrigger value="other">Abgelehnt / Pausiert ({rejected.length})</TabsTrigger>
        </TabsList>

        {[
          { value: "pending", items: pending },
          { value: "drafts", items: drafts },
          { value: "active", items: active },
          { value: "other", items: rejected },
        ].map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.items.length === 0 ? (
              <EmptyState icon={UserRound} title="Nichts zu tun" description="In dieser Kategorie gibt es aktuell keine Profile." />
            ) : (
              <div className="space-y-4">
                {tab.items.map((profile) => (
                  <Card key={profile.id} id={profile.id} className="p-5">
                    <div className="flex flex-wrap gap-5">
                      <div className="flex gap-2">
                        {profile.media.slice(0, 3).map((media) => (
                          <div key={media.id} className="relative size-20 overflow-hidden rounded-xl bg-muted">
                            <Image src={media.thumbUrl ?? media.url} alt="" fill sizes="80px" className="object-cover" />
                          </div>
                        ))}
                        {profile.media.length === 0 && (
                          <div className="grid size-20 place-items-center rounded-xl bg-muted text-xs text-muted-foreground">
                            kein Bild
                          </div>
                        )}
                      </div>

                      <div className="min-w-56 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold">{profile.displayName}</h2>
                          <Badge size="sm" variant="neutral">{PROFILE_STATUS_LABEL[profile.status]}</Badge>
                          {profile.isVerified && <Badge size="sm" variant="success">verifiziert</Badge>}
                          {profile.agency && (
                            <Badge size="sm" variant="outline">
                              <Building2 className="size-3" /> {profile.agency.name}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {profile.city?.name ?? "keine Stadt"} · {profile.user.email} · {profile._count.media} Medien ·{" "}
                          {profile._count.reviews} Bewertungen · aktualisiert {timeAgo(profile.updatedAt)}
                        </p>
                        {profile.status === "DRAFT" && (() => {
                          // Dieselben Bedingungen, die das Einreichen verlangt —
                          // damit klar ist, warum das Inserat noch liegt.
                          const fehlt = [
                            profile._count.media === 0 ? "Foto" : null,
                            !profile.city ? "Stadt" : null,
                            (profile.about?.length ?? 0) < 50 ? "Beschreibung (50 Zeichen)" : null,
                          ].filter(Boolean);
                          return fehlt.length > 0 ? (
                            <p className="mt-2 text-xs text-warning">Nicht eingereicht — es fehlt: {fehlt.join(", ")}.</p>
                          ) : (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Vollständig, aber noch nicht eingereicht.
                            </p>
                          );
                        })()}

                        {profile.headline && <p className="mt-2 text-sm">{profile.headline}</p>}
                        {profile.about && (
                          <p className="mt-1 text-sm text-muted-foreground">{truncate(profile.about, 220)}</p>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-wrap items-start gap-2">
                        <ActionButton
                          size="sm"
                          variant="success"
                          action={moderateProfileAction.bind(null, profile.id, "APPROVE", undefined)}
                        >
                          <Check className="size-4" /> Freigeben
                        </ActionButton>
                        <ActionButton
                          size="sm"
                          variant="outline"
                          confirm="Profil wirklich ablehnen?"
                          action={moderateProfileAction.bind(null, profile.id, "REJECT", undefined)}
                        >
                          <X className="size-4" /> Ablehnen
                        </ActionButton>
                        <ActionButton
                          size="sm"
                          variant="ghost"
                          action={moderateProfileAction.bind(null, profile.id, "SUSPEND", undefined)}
                        >
                          <Pause className="size-4" /> Pausieren
                        </ActionButton>
                        <Link
                          href={`/escort/${profile.slug}`}
                          target="_blank"
                          className="grid size-9 place-items-center rounded-xl text-muted-foreground hover:bg-muted"
                          aria-label="Profil ansehen"
                        >
                          <ExternalLink className="size-4" />
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}

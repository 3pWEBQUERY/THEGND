import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUnreadCounts } from "@/server/queries/user";
import { darfBearbeiten, eigeneMitgliedschaft } from "@/server/queries/agency-access";
import { eigeneStoryQuelle } from "@/server/queries/stories";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { SiteHeader } from "@/components/layout/site-header";
import { PresenceTracker } from "@/components/presence-tracker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PROFILE_STATUS_LABEL } from "@/lib/constants";
import { ExternalLink, Sparkles } from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [counts, profile, mitgliedschaft, storyQuelle] = await Promise.all([
    getUnreadCounts(user.id),
    user.profileId
      ? db.profile.findUnique({
          where: { id: user.profileId },
          select: { slug: true, status: true, displayName: true, isVerified: true },
        })
      : null,
    eigeneMitgliedschaft(),
    eigeneStoryQuelle(),
  ]);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <div className="mx-auto flex w-full max-w-[1500px] flex-1 gap-8 px-4 py-6 sm:px-6">
        <DashboardNav
          user={user}
          counts={counts}
          hasProfile={Boolean(profile)}
          eigenesInseratAktiv={Boolean(profile && profile.status !== "ARCHIVED")}
          darfStories={Boolean(storyQuelle)}
          agentur={{
            gehoertDazu: Boolean(mitgliedschaft),
            darfBearbeiten: mitgliedschaft ? darfBearbeiten(mitgliedschaft.rolle) : false,
          }}
        />

        <div className="min-w-0 flex-1">
          {profile && profile.status !== "ACTIVE" && (
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-warning/30 bg-warning/8 px-5 py-4">
              <Sparkles className="size-5 shrink-0 text-warning" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  Dein Profil ist <Badge variant="warning" size="sm">{PROFILE_STATUS_LABEL[profile.status]}</Badge>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {profile.status === "DRAFT"
                    ? "Vervollständige dein Profil und reiche es zur Prüfung ein."
                    : profile.status === "PENDING_REVIEW"
                      ? "Wir prüfen dein Profil — meist innerhalb von 2 Stunden."
                      : "Dein Profil ist aktuell nicht öffentlich sichtbar."}
                </p>
              </div>
              <Button asChild size="sm" variant="brand">
                <Link href="/dashboard/profil">Profil bearbeiten</Link>
              </Button>
            </div>
          )}

          {profile?.status === "ACTIVE" && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-5 py-3">
              <p className="truncate text-sm">
                <span className="text-muted-foreground">Öffentliches Profil:</span>{" "}
                <span className="font-medium">{profile.displayName}</span>
              </p>
              <Button asChild size="xs" variant="outline">
                <Link href={`/escort/${profile.slug}`} target="_blank">
                  Ansehen <ExternalLink className="size-3.5" />
                </Link>
              </Button>
            </div>
          )}

          {children}
        </div>
      </div>

      <PresenceTracker />
    </div>
  );
}

export const dynamic = "force-dynamic";

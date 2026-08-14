import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminNav } from "@/components/admin/admin-nav";
import { ThemeToggleCompact } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { SITE } from "@/lib/constants";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isStaff(user.role)) redirect("/dashboard");

  const [pendingProfiles, pendingMedia, pendingVerifications, openReports, pendingReviews] = await Promise.all([
    db.profile.count({ where: { status: "PENDING_REVIEW" } }),
    db.media.count({ where: { moderation: "PENDING" } }),
    db.verification.count({ where: { status: { in: ["SUBMITTED", "IN_REVIEW"] } } }),
    db.report.count({ where: { status: "OPEN" } }),
    db.review.count({ where: { status: "PENDING" } }),
  ]);


  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border glass">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-4 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-foreground text-background">
              <ShieldCheck className="size-4" />
            </span>
            <span className="text-sm font-bold tracking-wide">
              {SITE.name} <span className="text-muted-foreground">Admin</span>
            </span>
          </Link>
          <Badge variant="neutral" size="sm" className="hidden sm:inline-flex">
            {user.role}
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggleCompact />
            <Link href="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Zurück zum Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-8">
        <AdminNav
          counts={{
            profiles: pendingProfiles,
            media: pendingMedia,
            verifications: pendingVerifications,
            reviews: pendingReviews,
            reports: openReports,
          }}
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

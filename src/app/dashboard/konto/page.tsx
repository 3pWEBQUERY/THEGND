import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, IdCard, UserRound } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { MemberProfileForm } from "@/components/dashboard/member-profile-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Mein Profil" };

/**
 * Profil des Kontos — für Mitglieder ihr einziges.
 *
 * Getrennt von den Einstellungen, weil hier steht, wie man auf der Seite
 * auftritt, und dort, wie das Konto technisch eingestellt ist. Anbieterinnen
 * haben zusätzlich ihr Inserat, das ganz eigene Felder hat.
 */
export default async function AccountProfilePage() {
  const session = await requireUser();

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { displayName: true, avatarUrl: true, locale: true },
  });
  if (!user) redirect("/login");

  return (
    <>
      <PageHeader title="Mein Profil" description="Name, Bild und Sprache deines Kontos." />

      <div className="space-y-6">
        <MemberProfileForm
          displayName={user.displayName ?? ""}
          avatarUrl={user.avatarUrl}
          locale={user.locale}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              href: "/dashboard/einstellungen",
              icon: Bell,
              title: "Benachrichtigungen & Konto",
              text: "E-Mail, Telefon, Zeitzone, Newsletter, Passwort und Sitzungen.",
            },
            {
              href: session.profileId ? "/dashboard/profil" : "/onboarding?typ=profil",
              icon: session.profileId ? IdCard : UserRound,
              title: session.profileId ? "Mein Inserat" : "Selbst inserieren",
              text: session.profileId
                ? "Dein öffentliches Inserat mit Fotos, Preisen und Services."
                : "Du bietest selbst an? Dein Inserat ist in zwei Minuten angelegt.",
            },
          ].map(({ href, icon: Icon, title, text }) => (
            <Card key={href} className="p-5 transition-colors hover:border-primary/40">
              <Link href={href} className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-sm text-muted-foreground">{text}</span>
                </span>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

export const dynamic = "force-dynamic";

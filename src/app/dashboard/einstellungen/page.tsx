import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { AccountSettings } from "@/components/dashboard/account-settings";

export const metadata: Metadata = { title: "Einstellungen" };

export default async function SettingsPage() {
  const user = await requireUser();

  const [account, sessions, blocks] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      select: {
        email: true,
        displayName: true,
        phone: true,
        locale: true,
        timezone: true,
        newsletterOptIn: true,
        marketingOptIn: true,
        emailVerified: true,
        createdAt: true,
      },
    }),
    db.session.findMany({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, ip: true, userAgent: true, createdAt: true },
    }),
    db.block.findMany({
      where: { blockerId: user.id },
      include: { blocked: { select: { id: true, displayName: true } } },
    }),
  ]);

  return (
    <>
      <PageHeader title="Einstellungen" description="Konto, Sicherheit und Benachrichtigungen verwalten." />
      <AccountSettings
        account={JSON.parse(JSON.stringify(account))}
        sessions={JSON.parse(JSON.stringify(sessions))}
        blocks={JSON.parse(JSON.stringify(blocks))}
      />
    </>
  );
}

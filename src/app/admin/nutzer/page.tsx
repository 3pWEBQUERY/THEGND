import type { Metadata } from "next";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { UserRow } from "@/components/admin/user-row";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Nutzer · Admin" };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;

  const users = await db.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { displayName: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      status: true,
      credits: true,
      createdAt: true,
      lastSeenAt: true,
      emailVerified: true,
      profile: { select: { slug: true, status: true } },
    },
  });

  return (
    <>
      <PageHeader title="Nutzerverwaltung" description="Konten suchen, sperren und Guthaben korrigieren." />

      <form className="mb-5">
        <Input name="q" defaultValue={q ?? ""} placeholder="E-Mail oder Name suchen…" className="max-w-sm" />
      </form>

      <Card className="divide-y divide-border">
        {users.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Keine Treffer.</p>
        ) : (
          users.map((user) => <UserRow key={user.id} user={JSON.parse(JSON.stringify(user))} />)
        )}
      </Card>
    </>
  );
}

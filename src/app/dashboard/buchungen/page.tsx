import type { Metadata } from "next";
import Link from "next/link";
import { CalendarX } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { BookingRow } from "@/components/dashboard/booking-row";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Buchungen" };

export default async function BookingsPage() {
  const user = await requireUser();

  const [incoming, outgoing] = await Promise.all([
    user.profileId
      ? db.booking.findMany({
          where: { profile: { userId: user.id } },
          orderBy: { startAt: "desc" },
          take: 100,
          include: { client: { select: { id: true, displayName: true, avatarUrl: true } }, profile: { select: { displayName: true, slug: true } } },
        })
      : [],
    db.booking.findMany({
      where: { clientId: user.id },
      orderBy: { startAt: "desc" },
      take: 100,
      include: { client: { select: { id: true, displayName: true, avatarUrl: true } }, profile: { select: { displayName: true, slug: true } } },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Buchungen"
        description="Anfragen bestätigen, ablehnen oder als abgeschlossen markieren."
      />

      <Tabs defaultValue={user.profileId ? "incoming" : "outgoing"}>
        <TabsList>
          {user.profileId && (
            <TabsTrigger value="incoming">
              Anfragen an mich
              {incoming.filter((b) => b.status === "REQUESTED").length > 0 && (
                <span className="ml-1 grid min-w-5 place-items-center rounded-md bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                  {incoming.filter((b) => b.status === "REQUESTED").length}
                </span>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="outgoing">Meine Anfragen</TabsTrigger>
        </TabsList>

        {user.profileId && (
          <TabsContent value="incoming">
            {incoming.length === 0 ? (
              <EmptyState icon={CalendarX} title="Noch keine Anfragen" description="Sobald dich jemand bucht, erscheint die Anfrage hier." />
            ) : (
              <div className="space-y-3">
                {incoming.map((booking) => (
                  <BookingRow key={booking.id} booking={JSON.parse(JSON.stringify(booking))} role="provider" />
                ))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="outgoing">
          {outgoing.length === 0 ? (
            <EmptyState
              icon={CalendarX}
              title="Keine eigenen Anfragen"
              description="Finde ein Profil und frage unverbindlich einen Termin an."
              action={
                <Button asChild variant="brand">
                  <Link href="/escorts">Profile entdecken</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {outgoing.map((booking) => (
                <BookingRow key={booking.id} booking={JSON.parse(JSON.stringify(booking))} role="client" />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}

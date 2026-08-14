import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteSavedSearchAction } from "@/server/actions/misc";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Suchaufträge" };

export default async function SavedSearchesPage() {
  const user = await requireUser();
  const searches = await db.savedSearch.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Suchaufträge"
        description="Gespeicherte Filter — auf Wunsch mit E-Mail-Benachrichtigung bei neuen Treffern."
      />

      {searches.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Keine gespeicherten Suchen"
          description="Setze Filter in der Suche und klicke auf „Suche speichern“."
          action={
            <Button asChild variant="brand">
              <Link href="/escorts">Zur Suche</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {searches.map((search) => {
            const params = new URLSearchParams(search.query as Record<string, string>).toString();
            return (
              <Card key={search.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="font-medium">{search.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    angelegt am {formatDate(search.createdAt)}
                    {search.alertMail && " · E-Mail-Alarm aktiv"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {search.alertMail && <Badge variant="success" size="sm">Alarm</Badge>}
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/escorts?${params}`}>Ergebnisse</Link>
                  </Button>
                  <form action={deleteSavedSearchAction.bind(null, search.id)}>
                    <Button type="submit" size="icon-sm" variant="ghost" aria-label="Löschen">
                      <Trash2 className="size-4 text-danger" />
                    </Button>
                  </form>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

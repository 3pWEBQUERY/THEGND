import type { Metadata } from "next";
import { Flag } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { ReportRow } from "@/components/admin/report-row";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Meldungen · Admin" };

export default async function AdminReportsPage() {
  const [open, resolved] = await Promise.all([
    db.report.findMany({
      where: { status: { in: ["OPEN", "IN_REVIEW"] } },
      orderBy: { createdAt: "asc" },
      include: { reporter: { select: { displayName: true, email: true } } },
    }),
    db.report.findMany({
      where: { status: { in: ["RESOLVED", "DISMISSED"] } },
      orderBy: { updatedAt: "desc" },
      take: 40,
      include: { reporter: { select: { displayName: true, email: true } } },
    }),
  ]);

  return (
    <>
      <PageHeader title="Meldungen" description="Priorität: Verdacht auf Minderjährigkeit und Zwang zuerst." />

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">Offen ({open.length})</TabsTrigger>
          <TabsTrigger value="done">Erledigt ({resolved.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="open">
          {open.length === 0 ? (
            <EmptyState icon={Flag} title="Keine offenen Meldungen" description="Alles abgearbeitet." />
          ) : (
            <div className="space-y-3">
              {open.map((report) => (
                <ReportRow key={report.id} report={JSON.parse(JSON.stringify(report))} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="done">
          <div className="space-y-3">
            {resolved.map((report) => (
              <ReportRow key={report.id} report={JSON.parse(JSON.stringify(report))} readOnly />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

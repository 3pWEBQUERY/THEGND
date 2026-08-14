"use client";

import * as React from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { resolveReportAction } from "@/server/actions/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { REPORT_REASON_LABEL } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";

type Report = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  details: string | null;
  status: string;
  resolution: string | null;
  createdAt: string;
  reporter: { displayName: string | null; email: string } | null;
};

const CRITICAL = ["UNDERAGE", "TRAFFICKING", "ILLEGAL"];

export function ReportRow({ report, readOnly }: { report: Report; readOnly?: boolean }) {
  const [state, action, pending] = useActionState(resolveReportAction, {});

  React.useEffect(() => {
    if (state.ok) toast.success(state.message ?? "Bearbeitet");
    else if (state.message) toast.error(state.message);
  }, [state]);

  const critical = CRITICAL.includes(report.reason);

  return (
    <Card className={critical ? "border-danger/40 p-5" : "p-5"}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-64 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge size="sm" variant={critical ? "danger" : "warning"}>
              {REPORT_REASON_LABEL[report.reason] ?? report.reason}
            </Badge>
            <Badge size="sm" variant="neutral">
              {report.targetType}
            </Badge>
            <span className="text-xs text-muted-foreground">{timeAgo(report.createdAt)}</span>
            {report.status !== "OPEN" && (
              <Badge size="sm" variant={report.status === "RESOLVED" ? "success" : "neutral"}>
                {report.status}
              </Badge>
            )}
          </div>

          <p className="mt-2 break-all font-mono text-xs text-muted-foreground">Ziel: {report.targetId}</p>
          {report.details && <p className="mt-2 whitespace-pre-line text-sm">{report.details}</p>}
          <p className="mt-2 text-xs text-muted-foreground">
            Gemeldet von: {report.reporter?.displayName ?? report.reporter?.email ?? "anonym"}
          </p>
          {report.resolution && (
            <p className="mt-2 rounded-lg bg-muted/60 p-2 text-xs">Ergebnis: {report.resolution}</p>
          )}
        </div>

        {!readOnly && (
          <form action={action} className="flex w-full flex-col gap-2 sm:w-64">
            <input type="hidden" name="reportId" value={report.id} />
            <Input name="resolution" placeholder="Notiz zur Entscheidung" className="h-9 text-xs" />
            <div className="flex gap-2">
              <Button type="submit" name="status" value="RESOLVED" size="sm" variant="success" loading={pending} className="flex-1">
                Erledigt
              </Button>
              <Button type="submit" name="status" value="DISMISSED" size="sm" variant="outline" loading={pending} className="flex-1">
                Verwerfen
              </Button>
            </div>
          </form>
        )}
      </div>
    </Card>
  );
}

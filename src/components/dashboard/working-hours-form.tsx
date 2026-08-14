"use client";

import * as React from "react";
import { useActionState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { updateWorkingHoursAction } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/primitives";
import { WEEKDAYS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Hour = { weekday: number; from: string; to: string; closed: boolean };

export function WorkingHoursForm({ hours }: { hours: Hour[] }) {
  const [state, action, pending] = useActionState(updateWorkingHoursAction, {});
  const [rows, setRows] = React.useState<Hour[]>(() =>
    Array.from({ length: 7 }, (_, weekday) => {
      const existing = hours.find((h) => h.weekday === weekday);
      return existing ?? { weekday, from: "10:00", to: "23:00", closed: weekday === 0 };
    }),
  );

  React.useEffect(() => {
    if (state.ok) toast.success(state.message ?? "Gespeichert");
    else if (state.message) toast.error(state.message);
  }, [state]);

  const order = [1, 2, 3, 4, 5, 6, 0];

  return (
    <Card className="p-6">
      <form action={action} className="space-y-3">
        {order.map((weekday) => {
          const row = rows[weekday];
          return (
            <div
              key={weekday}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-xl border border-border px-4 py-3",
                row.closed && "opacity-60",
              )}
            >
              <span className="w-28 shrink-0 text-sm font-medium">{WEEKDAYS[weekday]}</span>

              <input type="hidden" name={`closed_${weekday}`} value={row.closed ? "on" : ""} />

              <div className="flex flex-1 items-center gap-2">
                <input
                  type="time"
                  name={`from_${weekday}`}
                  value={row.from}
                  disabled={row.closed}
                  onChange={(e) =>
                    setRows((prev) => prev.map((r) => (r.weekday === weekday ? { ...r, from: e.target.value } : r)))
                  }
                  className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none disabled:opacity-50"
                />
                <span className="text-muted-foreground">–</span>
                <input
                  type="time"
                  name={`to_${weekday}`}
                  value={row.to}
                  disabled={row.closed}
                  onChange={(e) =>
                    setRows((prev) => prev.map((r) => (r.weekday === weekday ? { ...r, to: e.target.value } : r)))
                  }
                  className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none disabled:opacity-50"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Geschlossen
                <Switch
                  checked={row.closed}
                  onCheckedChange={(v) =>
                    setRows((prev) => prev.map((r) => (r.weekday === weekday ? { ...r, closed: v } : r)))
                  }
                />
              </label>
            </div>
          );
        })}

        <div className="flex justify-end border-t border-border pt-5">
          <Button type="submit" variant="brand" loading={pending}>
            <Save className="size-4" /> Speichern
          </Button>
        </div>
      </form>
    </Card>
  );
}

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, Map } from "lucide-react";
import { cn } from "@/lib/utils";

/** Umschalter zwischen Trefferliste und Karte. Merkt sich die Wahl in der URL. */
export function ViewSwitch({ ansicht }: { ansicht: "liste" | "karte" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const wechseln = (ziel: "liste" | "karte") => {
    const next = new URLSearchParams(searchParams.toString());
    if (ziel === "liste") next.delete("ansicht");
    else next.set("ansicht", ziel);
    next.delete("page");
    router.push(`${pathname}?${next}`, { scroll: false });
  };

  return (
    <div className="inline-flex overflow-hidden rounded-xl border border-border">
      {(
        [
          { wert: "liste", label: "Liste", Icon: LayoutGrid },
          { wert: "karte", label: "Karte", Icon: Map },
        ] as const
      ).map(({ wert, label, Icon }) => (
        <button
          key={wert}
          type="button"
          onClick={() => wechseln(wert)}
          aria-pressed={ansicht === wert}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
            ansicht === wert ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
          )}
        >
          <Icon className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

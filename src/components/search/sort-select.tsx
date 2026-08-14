"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, LayoutGrid, Rows3 } from "lucide-react";
import { AGENCY_SORT_OPTIONS, SORT_OPTIONS } from "@/lib/constants";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? "relevance";
  // „Nächstgelegen“ ergibt nur bei aktiver Umkreissuche Sinn und ist dort
  // ohnehin die Vorgabe — deshalb erscheint die Option nur dann.
  const mitUmkreis = searchParams.has("lat") && searchParams.has("lng");

  return (
    <label className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-sm">
      <ArrowUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="sr-only">Sortierung</span>
      <Select
        value={current}
        onValueChange={(v) => {
          const next = new URLSearchParams(searchParams.toString());
          v === "relevance" ? next.delete("sort") : next.set("sort", v);
          next.delete("page");
          router.push(`${pathname}?${next}`, { scroll: false });
        }}
        className="h-auto w-auto gap-1 border-0 bg-transparent px-0 py-0 font-medium shadow-none focus-visible:ring-0"
        contentClassName="min-w-48"
      >
        {mitUmkreis && <option value="relevance">Nächstgelegen</option>}
        {SORT_OPTIONS.filter((o) => !mitUmkreis || o.value !== "relevance").map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </label>
  );
}

/** Sortierung der Agentursuche — eigene Optionen, gleiche Bedienung. */
export function AgencySortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? "relevance";
  const mitUmkreis = searchParams.has("lat") && searchParams.has("lng");

  return (
    <label className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-sm">
      <ArrowUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="sr-only">Sortierung</span>
      <Select
        value={current}
        onValueChange={(v) => {
          const next = new URLSearchParams(searchParams.toString());
          v === "relevance" ? next.delete("sort") : next.set("sort", v);
          next.delete("page");
          router.push(`${pathname}?${next}`, { scroll: false });
        }}
        className="h-auto w-auto gap-1 border-0 bg-transparent px-0 py-0 font-medium shadow-none focus-visible:ring-0"
        contentClassName="min-w-48"
      >
        {mitUmkreis && <option value="relevance">Nächstgelegen</option>}
        {AGENCY_SORT_OPTIONS.filter((o) => !mitUmkreis || o.value !== "relevance").map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </label>
  );
}

export function ViewToggle({ value, onChange }: { value: "grid" | "list"; onChange: (v: "grid" | "list") => void }) {
  return (
    <div className="hidden items-center gap-0.5 rounded-xl border border-border bg-card p-0.5 sm:flex">
      {(
        [
          { key: "grid", icon: LayoutGrid },
          { key: "list", icon: Rows3 },
        ] as const
      ).map(({ key, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          aria-label={key === "grid" ? "Rasteransicht" : "Listenansicht"}
          className={cn(
            "grid size-8 place-items-center rounded-lg transition-colors",
            value === key ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}

"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, RotateCcw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Gemeinsame Bausteine der Filterleisten (Profile und Agenturen).
 *
 * Beide Suchen sehen bewusst gleich aus und verhalten sich gleich — deshalb
 * liegen Gruppierung, Chips und die URL-Logik hier an einer Stelle statt in
 * jeder Leiste erneut.
 */

export function Group({
  title,
  children,
  collapsible,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border-t border-border pt-5 first:border-0 first:pt-0">
      <button
        type="button"
        onClick={() => collapsible && setOpen((v) => !v)}
        className={cn("mb-3 flex w-full items-center justify-between text-left", !collapsible && "cursor-default")}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
        {collapsible && <span className="text-xs text-muted-foreground">{open ? "−" : "+"}</span>}
      </button>
      {(!collapsible || open) && children}
    </div>
  );
}

export function ChipGroup({
  items,
  isActive,
  onToggle,
}: {
  items: { value: string; label: string }[];
  isActive: (value: string) => boolean;
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => {
        const active = isActive(item.value);
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onToggle(item.value)}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {active && <Check className="size-3" />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export type FilterChip = { key: string; value: string; label: string };

/**
 * Aktive Filter als entfernbare Chips.
 *
 * `gruppen` bündelt Parameter, die nur gemeinsam Sinn ergeben (etwa der
 * Umkreis aus lat/lng/radius/ort) — ein Klick entfernt dann alle davon.
 */
export function ActiveFilterChips({
  labels,
  gruppen = {},
}: {
  labels: FilterChip[];
  gruppen?: Record<string, string[]>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!labels.length) return null;

  const remove = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());

    const gruppe = gruppen[key];
    if (gruppe) {
      for (const k of gruppe) next.delete(k);
    } else {
      const multi = (next.get(key) ?? "").split(",").filter(Boolean);
      if (multi.length > 1) {
        next.set(key, multi.filter((v) => v !== value).join(","));
      } else if (next.getAll(key).length > 1) {
        const rest = next.getAll(key).filter((v) => v !== value);
        next.delete(key);
        for (const v of rest) next.append(key, v);
      } else {
        next.delete(key);
      }
    }

    next.delete("page");
    router.push(`${pathname}?${next}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {labels.map((chip) => (
        <button
          key={`${chip.key}-${chip.value}`}
          onClick={() => remove(chip.key, chip.value)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-2.5 py-1 text-xs transition-colors hover:border-danger/50 hover:text-danger"
        >
          {chip.label}
          <X className="size-3" />
        </button>
      ))}
    </div>
  );
}

/** Kopfzeile der Filterleiste mit Zähler und „Zurücksetzen“. */
export function FilterHeader({
  anzahl,
  onZuruecksetzen,
}: {
  anzahl: number;
  onZuruecksetzen: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold">
        Filter {anzahl > 0 && <Badge size="sm">{anzahl}</Badge>}
      </p>
      {anzahl > 0 && (
        <button
          onClick={onZuruecksetzen}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-danger"
        >
          <RotateCcw className="size-3" /> Zurücksetzen
        </button>
      )}
    </div>
  );
}

/**
 * URL-Schreibhelfer für Filterleisten — kapselt Mehrfachauswahl per
 * Kommaliste, wiederholte Parameter und das Zurücksetzen der Seitenzahl.
 */
export function useFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = React.useTransition();

  const params = React.useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  const update = React.useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      next.delete("page");
      startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
    },
    [pathname, router, searchParams],
  );

  const setParam = React.useCallback(
    (key: string, value?: string | null) => update((p) => (value ? p.set(key, value) : p.delete(key))),
    [update],
  );

  const toggleMulti = React.useCallback(
    (key: string, value: string) =>
      update((p) => {
        const current = (p.get(key) ?? "").split(",").filter(Boolean);
        const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
        next.length ? p.set(key, next.join(",")) : p.delete(key);
      }),
    [update],
  );

  const toggleRepeat = React.useCallback(
    (key: string, value: string) =>
      update((p) => {
        const current = p.getAll(key);
        p.delete(key);
        const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
        for (const v of next) p.append(key, v);
      }),
    [update],
  );

  const has = React.useCallback(
    (key: string, value: string) => (params.get(key) ?? "").split(",").includes(value),
    [params],
  );
  const hasRepeat = React.useCallback((key: string, value: string) => params.getAll(key).includes(value), [params]);

  const zuruecksetzen = React.useCallback(() => {
    const next = new URLSearchParams();
    const q = params.get("q");
    if (q) next.set("q", q);
    startTransition(() => router.push(`${pathname}?${next}`, { scroll: false }));
  }, [params, pathname, router]);

  const aktiveAnzahl = [...params.keys()].filter((k) => !["page", "sort", "q", "ansicht"].includes(k)).length;

  return {
    params,
    pending,
    update,
    setParam,
    toggleMulti,
    toggleRepeat,
    has,
    hasRepeat,
    zuruecksetzen,
    aktiveAnzahl,
  };
}

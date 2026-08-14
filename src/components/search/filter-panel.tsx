"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { RadiusFilter } from "@/components/search/radius-filter";
import { ChipGroup, FilterHeader, Group, useFilterParams } from "@/components/search/filter-primitives";
import { Checkbox, Slider, Switch, Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/primitives";
import {
  BODY_LABEL,
  CUP_SIZES,
  ETHNICITY_LABEL,
  GENDER_LABEL,
  HAIR_LABEL,
  KIND_LABEL,
  PLACE_LABEL,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

export type FilterOptions = {
  cities: { slug: string; name: string; count: number }[];
  services: { slug: string; name: string; category: string }[];
  languages: { code: string; name: string }[];
};

export function FilterSidebar({ options, className }: { options: FilterOptions; className?: string }) {
  return (
    <aside className={cn("hidden lg:block", className)}>
      <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-2">
        <FilterForm options={options} />
      </div>
    </aside>
  );
}

export function FilterSheet({ options }: { options: FilterOptions }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <SlidersHorizontal className="size-4" /> Filter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-0">
        <DialogTitle className="border-b border-border px-5 py-4 text-base">Filter</DialogTitle>
        <div className="max-h-[70dvh] overflow-y-auto p-5">
          <FilterForm options={options} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FilterForm({ options }: { options: FilterOptions }) {
  const { params, pending, update, setParam, toggleMulti, toggleRepeat, has, hasRepeat, zuruecksetzen, aktiveAnzahl } =
    useFilterParams();

  const [price, setPrice] = React.useState<[number, number]>([
    Number(params.get("priceMin") ?? 0),
    Number(params.get("priceMax") ?? 1500),
  ]);
  const [age, setAge] = React.useState<[number, number]>([
    Number(params.get("ageMin") ?? 18),
    Number(params.get("ageMax") ?? 65),
  ]);

  const activeCount = [...params.keys()].filter((k) => !["page", "sort", "q"].includes(k)).length;

  return (
    <div className={cn("space-y-6", pending && "opacity-70")}>
      <FilterHeader anzahl={aktiveAnzahl} onZuruecksetzen={zuruecksetzen} />

      <Group title="Schnellfilter">
        <div className="space-y-3">
          {[
            { key: "online", label: "Nur jetzt online" },
            { key: "verified", label: "Nur verifiziert" },
            { key: "withVideo", label: "Mit Video" },
            { key: "withReviews", label: "Mit Bewertungen" },
          ].map((item) => (
            <label key={item.key} className="flex cursor-pointer items-center justify-between text-sm">
              {item.label}
              <Switch
                checked={params.get(item.key) === "1"}
                onCheckedChange={(v) => setParam(item.key, v ? "1" : null)}
              />
            </label>
          ))}
        </div>
      </Group>

      <Group title="Umkreis">
        <RadiusFilter
          lat={params.get("lat") ? Number(params.get("lat")) : undefined}
          lng={params.get("lng") ? Number(params.get("lng")) : undefined}
          radius={params.get("radius") ? Number(params.get("radius")) : undefined}
          ort={params.get("ort") ?? undefined}
          anfahrt={params.get("anfahrt") === "1"}
          onAendern={(werte) =>
            update((p) => {
              for (const schluessel of ["lat", "lng", "radius", "ort", "anfahrt"] as const) p.delete(schluessel);
              if (werte.lat === undefined || werte.lng === undefined) return;
              p.set("lat", werte.lat.toFixed(5));
              p.set("lng", werte.lng.toFixed(5));
              p.set("radius", String(werte.radius ?? 25));
              if (werte.ort) p.set("ort", werte.ort);
              if (werte.anfahrt) p.set("anfahrt", "1");
              // Umkreis und feste Stadt widersprechen sich — Stadt weicht.
              p.delete("city");
            })
          }
        />
      </Group>

      <Group title="Stadt">
        <Select
          value={params.get("city") ?? ""}
          onValueChange={(v) => setParam("city", v || null)}
          className="h-10 px-3"
        >
          <option value="">Alle Städte</option>
          {options.cities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name} ({c.count})
            </option>
          ))}
        </Select>
      </Group>

      <Group title="Kategorie">
        <ChipGroup
          items={Object.entries(KIND_LABEL).map(([value, label]) => ({ value, label }))}
          isActive={(v) => has("kind", v)}
          onToggle={(v) => toggleMulti("kind", v)}
        />
      </Group>

      <Group title="Geschlecht">
        <ChipGroup
          items={Object.entries(GENDER_LABEL).map(([value, label]) => ({ value, label }))}
          isActive={(v) => has("gender", v)}
          onToggle={(v) => toggleMulti("gender", v)}
        />
      </Group>

      <Group title={`Alter · ${age[0]}–${age[1]} Jahre`}>
        <Slider
          min={18}
          max={65}
          step={1}
          value={age}
          onValueChange={(v) => setAge(v as [number, number])}
          onValueCommit={(v) =>
            update((p) => {
              p.set("ageMin", String(v[0]));
              p.set("ageMax", String(v[1]));
            })
          }
        />
      </Group>

      <Group title={`Preis/Stunde · CHF ${price[0]}–${price[1]}`}>
        <Slider
          min={0}
          max={1500}
          step={25}
          value={price}
          onValueChange={(v) => setPrice(v as [number, number])}
          onValueCommit={(v) =>
            update((p) => {
              p.set("priceMin", String(v[0]));
              p.set("priceMax", String(v[1]));
            })
          }
        />
      </Group>

      <Group title="Treffpunkt">
        <ChipGroup
          items={Object.entries(PLACE_LABEL).map(([value, label]) => ({ value, label }))}
          isActive={(v) => params.get("place") === v}
          onToggle={(v) => setParam("place", params.get("place") === v ? null : v)}
        />
      </Group>

      <Group title="Figur">
        <ChipGroup
          items={Object.entries(BODY_LABEL).map(([value, label]) => ({ value, label }))}
          isActive={(v) => has("body", v)}
          onToggle={(v) => toggleMulti("body", v)}
        />
      </Group>

      <Group title="Haarfarbe">
        <ChipGroup
          items={Object.entries(HAIR_LABEL).map(([value, label]) => ({ value, label }))}
          isActive={(v) => has("hair", v)}
          onToggle={(v) => toggleMulti("hair", v)}
        />
      </Group>

      <Group title="Herkunft">
        <ChipGroup
          items={Object.entries(ETHNICITY_LABEL).map(([value, label]) => ({ value, label }))}
          isActive={(v) => has("ethnicity", v)}
          onToggle={(v) => toggleMulti("ethnicity", v)}
        />
      </Group>

      <Group title="Körbchengrösse">
        <ChipGroup
          items={CUP_SIZES.map((value) => ({ value, label: value }))}
          isActive={(v) => has("cup", v)}
          onToggle={(v) => toggleMulti("cup", v)}
        />
      </Group>

      <Group title="Sprachen" collapsible>
        <div className="space-y-2">
          {options.languages.map((lang) => (
            <label key={lang.code} className="flex cursor-pointer items-center gap-2.5 text-sm">
              <Checkbox
                checked={hasRepeat("lang", lang.code)}
                onCheckedChange={() => toggleRepeat("lang", lang.code)}
              />
              {lang.name}
            </label>
          ))}
        </div>
      </Group>

      <Group title="Services" collapsible defaultOpen={false}>
        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {options.services.map((service) => (
            <label key={service.slug} className="flex cursor-pointer items-center gap-2.5 text-sm">
              <Checkbox
                checked={hasRepeat("service", service.slug)}
                onCheckedChange={() => toggleRepeat("service", service.slug)}
              />
              <span className="flex-1">{service.name}</span>
            </label>
          ))}
        </div>
      </Group>
    </div>
  );
}

"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { RadiusFilter } from "@/components/search/radius-filter";
import { ChipGroup, FilterHeader, Group, useFilterParams } from "@/components/search/filter-primitives";
import { Checkbox, Slider, Switch, Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/primitives";
import { AGENCY_AMENITIES, AGENCY_KIND_LABEL } from "@/lib/constants";
import type { AgencyFilterOptions } from "@/server/queries/agencies";
import { cn } from "@/lib/utils";

/**
 * Filterleiste der Agentur- und Clubsuche.
 *
 * Aufbau und Bedienung sind bewusst identisch zur Profilsuche — dieselben
 * Bausteine, dieselbe URL-Logik, nur andere Felder.
 */
export function AgencyFilterSidebar({
  options,
  className,
}: {
  options: AgencyFilterOptions;
  className?: string;
}) {
  return (
    <aside className={cn("hidden lg:block", className)}>
      <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-2">
        <AgencyFilterForm options={options} />
      </div>
    </aside>
  );
}

export function AgencyFilterSheet({ options }: { options: AgencyFilterOptions }) {
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
          <AgencyFilterForm options={options} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AgencyFilterForm({ options }: { options: AgencyFilterOptions }) {
  const { params, pending, update, setParam, toggleMulti, toggleRepeat, has, hasRepeat, zuruecksetzen, aktiveAnzahl } =
    useFilterParams();

  const preisObergrenze = Math.max(100, Math.ceil(options.priceMax / 50) * 50);
  const [preis, setPreis] = React.useState(Number(params.get("priceMax") ?? preisObergrenze));

  React.useEffect(() => {
    setPreis(Number(params.get("priceMax") ?? preisObergrenze));
  }, [params, preisObergrenze]);

  return (
    <div className={cn("space-y-6", pending && "opacity-70")}>
      <FilterHeader anzahl={aktiveAnzahl} onZuruecksetzen={zuruecksetzen} />

      <Group title="Schnellfilter">
        <div className="space-y-3">
          {[
            { key: "open", label: "Jetzt geöffnet" },
            { key: "verified", label: "Nur geprüft" },
            { key: "withModels", label: "Mit aktiven Models" },
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
          onAendern={(werte) =>
            update((p) => {
              for (const schluessel of ["lat", "lng", "radius", "ort"] as const) p.delete(schluessel);
              if (werte.lat === undefined || werte.lng === undefined) return;
              p.set("lat", werte.lat.toFixed(5));
              p.set("lng", werte.lng.toFixed(5));
              p.set("radius", String(werte.radius ?? 25));
              if (werte.ort) p.set("ort", werte.ort);
              // Umkreis und feste Stadt widersprechen sich — Stadt weicht.
              p.delete("city");
            })
          }
        />
      </Group>

      <Group title="Art des Hauses">
        <ChipGroup
          items={Object.entries(AGENCY_KIND_LABEL).map(([value, label]) => ({
            value,
            label: options.kinds[value] ? `${label} (${options.kinds[value]})` : label,
          }))}
          isActive={(v) => has("kind", v)}
          onToggle={(v) => toggleMulti("kind", v)}
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

      <Group title={`Eintritt / ab-Preis · bis CHF ${preis}`}>
        <Slider
          min={0}
          max={preisObergrenze}
          step={10}
          value={[preis]}
          onValueChange={(v) => setPreis(v[0])}
          onValueCommit={(v) => setParam("priceMax", v[0] >= preisObergrenze ? null : String(v[0]))}
          aria-label="Höchstpreis in Franken"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Häuser ohne Preisangabe werden bei aktivem Filter ausgeblendet.
        </p>
      </Group>

      <Group title="Ausstattung">
        <ChipGroup
          items={AGENCY_AMENITIES.map((a) => ({ value: a.key, label: a.label }))}
          isActive={(v) => has("amenity", v)}
          onToggle={(v) => toggleMulti("amenity", v)}
        />
      </Group>

      {options.languages.length > 0 && (
        <Group title="Sprachen" collapsible>
          <div className="space-y-2.5">
            {options.languages.map((language) => (
              <label key={language.code} className="flex cursor-pointer items-center gap-2.5 text-sm">
                <Checkbox
                  checked={hasRepeat("lang", language.code)}
                  onCheckedChange={() => toggleRepeat("lang", language.code)}
                />
                {language.name}
              </label>
            ))}
          </div>
        </Group>
      )}

      {options.services.length > 0 && (
        <Group title="Angebot" collapsible defaultOpen={false}>
          <div className="space-y-2.5">
            {options.services.map((service) => (
              <label key={service.slug} className="flex cursor-pointer items-start gap-2.5 text-sm">
                <Checkbox
                  checked={hasRepeat("service", service.slug)}
                  onCheckedChange={() => toggleRepeat("service", service.slug)}
                  className="mt-0.5"
                />
                <span className="min-w-0">
                  {service.name}
                  <span className="block text-xs text-muted-foreground">{service.category}</span>
                </span>
              </label>
            ))}
          </div>
        </Group>
      )}
    </div>
  );
}

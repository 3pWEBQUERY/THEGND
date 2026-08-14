"use client";

import * as React from "react";
import { SearchSelect } from "@/components/ui/search-select";
import { HAEUFIGE_SPRACHEN, SPRACHEN } from "@/lib/languages";

/**
 * Sprachauswahl mit Suche und Flagge.
 *
 * Zur Wahl stehen alle Sprachen mit ISO-639-1-Kürzel. Die im Verzeichnis
 * gebräuchlichsten stehen zuoberst, darunter folgt die vollständige Liste
 * alphabetisch. Gesucht wird über den deutschen, den englischen und den
 * Eigennamen — „Spanisch“, „Spanish“ und „Español“ führen zum selben Eintrag.
 */
export function LanguageSelect({
  name = "locale",
  value,
  defaultValue,
  onValueChange,
  required,
  disabled,
  id,
  className,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}) {
  const optionen = React.useMemo(() => {
    const eintrag = (code: string, gruppe: string) => {
      const sprache = SPRACHEN.find((s) => s.code === code);
      if (!sprache) return null;
      return {
        value: sprache.code,
        label: sprache.name,
        zusatz: sprache.eigen === sprache.name ? undefined : sprache.eigen,
        suchbegriffe: [sprache.en],
        land: sprache.land,
        gruppe,
      };
    };

    const haeufig = HAEUFIGE_SPRACHEN.map((code) => eintrag(code, "Häufig")).filter(Boolean);
    const rest = SPRACHEN.filter((s) => !HAEUFIGE_SPRACHEN.includes(s.code as never)).map(
      (s) => eintrag(s.code, "Alle Sprachen")!,
    );
    return [...(haeufig as NonNullable<ReturnType<typeof eintrag>>[]), ...rest];
  }, []);

  return (
    <SearchSelect
      name={name}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      optionen={optionen}
      mitFlagge
      placeholder="Sprache wählen"
      suchPlatzhalter="Sprache suchen …"
      leerText="Keine Sprache gefunden."
      required={required}
      disabled={disabled}
      id={id}
      className={className}
    />
  );
}

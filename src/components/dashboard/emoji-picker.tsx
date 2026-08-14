"use client";

import * as React from "react";
import { Search, Smile } from "lucide-react";
import { EMOJI_CATEGORIES, searchEmojis, type EmojiEntry } from "@/lib/emoji";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Eigene Emoji-Auswahl — keine fremde Bibliothek, keine externen Bilder.
 * Eingefügt wird der Unicode-Codepoint; die Darstellung übernimmt das System
 * (auf Apple-Geräten also die Apple-Emoji).
 */
export function EmojiPicker({ onPick, disabled }: { onPick: (emoji: string) => void; disabled?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [aktiv, setAktiv] = React.useState(EMOJI_CATEGORIES[0].id);
  const [suche, setSuche] = React.useState("");

  const treffer = suche.trim() ? searchEmojis(suche) : null;
  const liste: EmojiEntry[] = treffer ?? EMOJI_CATEGORIES.find((c) => c.id === aktiv)!.emojis;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          disabled={disabled}
          aria-label="Emoji einfügen"
          className={cn(open && "bg-muted")}
        >
          <Smile className="size-4.5" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={suche}
            onChange={(event) => setSuche(event.target.value)}
            placeholder="Emoji suchen…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
        </div>

        {!treffer && (
          <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border px-2 py-2">
            {EMOJI_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                title={category.label}
                aria-label={category.label}
                aria-pressed={aktiv === category.id}
                onClick={() => setAktiv(category.id)}
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-lg text-base transition-colors",
                  aktiv === category.id ? "bg-primary/10" : "hover:bg-muted",
                )}
              >
                {category.icon}
              </button>
            ))}
          </div>
        )}

        <div className="max-h-56 overflow-y-auto p-2">
          {liste.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nichts gefunden für „{suche}“.</p>
          ) : (
            <div className="grid grid-cols-8 gap-0.5">
              {liste.map((entry) => (
                <button
                  key={entry.char}
                  type="button"
                  title={entry.keywords[0]}
                  onClick={() => {
                    onPick(entry.char);
                    setOpen(false);
                    setSuche("");
                  }}
                  className="grid size-8 place-items-center rounded-lg text-lg leading-none transition-colors hover:bg-muted"
                >
                  {entry.char}
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

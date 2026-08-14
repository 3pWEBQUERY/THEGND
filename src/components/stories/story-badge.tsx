"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Clapperboard } from "lucide-react";
import { StoryViewer } from "@/components/stories/story-viewer";
import type { StoryBuendel } from "@/server/queries/stories";

/**
 * Einstieg in die Stories eines Profils oder Hauses.
 *
 * Steht in der Kopfzeile des Inserats bei den übrigen Auszeichnungen und
 * öffnet dieselbe Abfolge wie die Kachel im Feed — damit läuft niemand an
 * einer laufenden Story vorbei, nur weil er direkt aufs Profil kommt.
 */
export function StoryBadge({ buendel }: { buendel: StoryBuendel }) {
  const router = useRouter();
  const [offen, setOffen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOffen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 py-1 pr-2.5 pl-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
      >
        <span className="grid size-5 shrink-0 place-items-center overflow-hidden rounded-md bg-primary/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={buendel.teile[buendel.teile.length - 1]!.mediaUrl} alt="" className="size-full object-cover" />
        </span>
        <Clapperboard className="size-3.5" />
        {buendel.teile.length > 1 ? `${buendel.teile.length} Stories` : "Story ansehen"}
      </button>

      {offen && (
        <StoryViewer
          buendel={[buendel]}
          start={0}
          offen
          onOpenChange={(auf) => {
            if (auf) return;
            setOffen(false);
            router.refresh();
          }}
          onGeloescht={() => router.refresh()}
        />
      )}
    </>
  );
}

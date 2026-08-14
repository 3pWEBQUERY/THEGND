"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Clock, Eye, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteStoryAction } from "@/server/actions/stories";
import { StoryComposer } from "@/components/stories/story-composer";
import { StoryViewer } from "@/components/stories/story-viewer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { StoryBuendel, StoryQuelle } from "@/server/queries/stories";
import { timeAgo } from "@/lib/utils";

export type EigeneStory = {
  id: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO" | "AUDIO";
  caption: string | null;
  createdAt: string;
  expiresAt: string;
  views: number;
};

/**
 * Verwaltung der eigenen Stories.
 *
 * Alles, was gerade läuft, mit Reichweite und Restlaufzeit — und dem Weg,
 * einen Teil wieder zu entfernen. Die Vorschau öffnet dieselbe Abfolge, die
 * auch Besucherinnen sehen.
 */
export function StoryManager({ quelle, stories }: { quelle: StoryQuelle; stories: EigeneStory[] }) {
  const router = useRouter();
  const [aufnahme, setAufnahme] = React.useState(false);
  const [vorschau, setVorschau] = React.useState<number | null>(null);
  const [loescht, setLoescht] = React.useState<string | null>(null);

  // Für die Vorschau dieselbe Form wie im Feed — nur mit einem Urheber.
  const buendel: StoryBuendel[] = React.useMemo(
    () => [
      {
        key: `${quelle.art.toLowerCase()}:${quelle.id}`,
        art: quelle.art,
        name: quelle.name,
        href: "#",
        bildUrl: quelle.bildUrl,
        isVerified: false,
        eigene: true,
        ungesehen: false,
        teile: [...stories]
          .reverse()
          .map((story) => ({
            id: story.id,
            mediaUrl: story.mediaUrl,
            mediaType: story.mediaType,
            caption: story.caption,
            createdAt: story.createdAt,
            views: story.views,
            gesehen: true,
          })),
      },
    ],
    [quelle, stories],
  );

  const loeschen = async (id: string) => {
    if (!confirm("Diese Story löschen? Das lässt sich nicht rückgängig machen.")) return;
    setLoescht(id);
    const res = await deleteStoryAction(id);
    setLoescht(null);
    if (res.ok) {
      toast.success(res.message ?? "Gelöscht.");
      router.refresh();
    } else {
      toast.error(res.message ?? "Löschen fehlgeschlagen.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-muted-foreground">
          {stories.length === 0
            ? `Noch nichts am Laufen. Deine Story erscheint als „${quelle.name}“ im Feed.`
            : `${stories.length} ${stories.length === 1 ? "Teil" : "Teile"} laufen — sie erscheinen im Feed als eine Story.`}
        </p>
        <div className="flex gap-2">
          {stories.length > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={() => setVorschau(0)}>
              <Eye className="size-4" /> Ansehen
            </Button>
          )}
          <Button type="button" variant="brand" size="sm" onClick={() => setAufnahme(true)}>
            <Plus className="size-4" /> Story hinzufügen
          </Button>
        </div>
      </Card>

      {stories.length > 0 && (
        <ul className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {stories.map((story, index) => (
            <li key={story.id}>
              <Card className="overflow-hidden p-0">
                <button
                  type="button"
                  onClick={() => setVorschau(0)}
                  className="relative block aspect-3/4 w-full overflow-hidden bg-muted"
                  aria-label={`Teil ${stories.length - index} ansehen`}
                >
                  {story.mediaType === "VIDEO" ? (
                    <video src={`${story.mediaUrl}#t=0.1`} className="size-full object-cover" muted preload="metadata" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={story.mediaUrl} alt="" className="size-full object-cover" />
                  )}
                  <span className="absolute top-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                    Teil {stories.length - index}
                  </span>
                </button>

                <div className="space-y-2 p-3">
                  {story.caption && <p className="line-clamp-2 text-xs">{story.caption}</p>}
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="size-3.5" /> {story.views}
                    </span>
                    <span className="flex items-center gap-1" suppressHydrationWarning>
                      <Clock className="size-3.5" /> {timeAgo(story.expiresAt)}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    disabled={loescht === story.id}
                    onClick={() => void loeschen(story.id)}
                  >
                    {loescht === story.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                    Löschen
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <StoryComposer
        quelle={quelle}
        offen={aufnahme}
        onOpenChange={setAufnahme}
        laufendeTeile={stories.length}
      />

      {vorschau !== null && (
        <StoryViewer
          buendel={buendel}
          start={0}
          offen
          onOpenChange={(offen) => !offen && setVorschau(null)}
          onGeloescht={() => router.refresh()}
        />
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Lock,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import {
  addMediaAction,
  deleteMediaAction,
  setCoverAction,
  updateMediaVisibilityAction,
} from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type MediaItem = {
  id: string;
  url: string;
  thumbUrl: string | null;
  type: "IMAGE" | "VIDEO" | "AUDIO";
  visibility: "PUBLIC" | "MEMBERS" | "PRIVATE";
  unlockCost: number;
  isCover: boolean;
  moderation: "PENDING" | "APPROVED" | "REJECTED";
  moderationNote: string | null;
};

export function MediaManager({
  media,
  profileId,
}: {
  media: MediaItem[];
  /** Gesetzt, wenn eine Agentur die Medien eines Models pflegt. */
  profileId?: string;
}) {
  const [uploading, setUploading] = React.useState<{ name: string; progress: number }[]>([]);
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [, startTransition] = React.useTransition();

  const upload = React.useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;

    setUploading(list.map((f) => ({ name: f.name, progress: 0 })));

    for (const [index, file] of list.entries()) {
      try {
        const presignRes = await fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scope: "gallery",
            filename: file.name,
            contentType: file.type,
            size: file.size,
          }),
        });

        if (!presignRes.ok) {
          const { error } = await presignRes.json().catch(() => ({ error: "Upload fehlgeschlagen." }));
          toast.error(error ?? "Upload fehlgeschlagen.");
          continue;
        }

        const presign = await presignRes.json();

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", presign.url);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.upload.onprogress = (e) => {
            if (!e.lengthComputable) return;
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploading((prev) => prev.map((u, i) => (i === index ? { ...u, progress } : u)));
          };
          xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
          xhr.onerror = () => reject(new Error("Netzwerkfehler"));
          xhr.send(file);
        });

        const result = await addMediaAction({
          profileId,
          key: presign.key,
          url: presign.publicUrl,
          type: presign.type,
          sizeBytes: file.size,
          mimeType: file.type,
        });
        if (!result.ok) toast.error(result.message ?? "Speichern fehlgeschlagen.");
      } catch (error) {
        toast.error(`${file.name}: ${(error as Error).message}`);
      }
    }

    setUploading([]);
    toast.success("Upload abgeschlossen.");
  }, [profileId]);

  const act = (fn: () => Promise<{ ok?: boolean; message?: string }>) =>
    startTransition(async () => {
      const res = await fn();
      res.ok ? res.message && toast.success(res.message) : toast.error(res.message ?? "Fehler");
    });

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          upload(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-foreground/25",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
        <UploadCloud className="mx-auto mb-3 size-9 text-muted-foreground" />
        <p className="text-sm font-medium">Dateien hierher ziehen oder klicken</p>
        <p className="mt-1 text-xs text-muted-foreground">
          JPG, PNG, WebP, AVIF bis 12 MB · MP4, MOV, WebM bis 200 MB · max. 60 Dateien
        </p>
      </div>

      {uploading.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
          {uploading.map((u) => (
            <div key={u.name} className="flex items-center gap-3">
              <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
              <span className="min-w-0 flex-1 truncate text-sm">{u.name}</span>
              <div className="h-1.5 w-28 overflow-hidden rounded-xs bg-input">
                <div
                  className="h-full rounded-xs bg-primary transition-all"
                  style={{ width: `${u.progress}%` }}
                />
              </div>
              <span className="w-9 text-right text-xs text-muted-foreground">{u.progress}%</span>
            </div>
          ))}
        </div>
      )}

      {media.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-14 text-center">
          <ImagePlus className="mx-auto mb-3 size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Noch keine Medien. Lade dein erstes Foto hoch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {media.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-2xl border border-border bg-card">
              <div className="relative aspect-3/4 bg-muted">
                {item.type === "VIDEO" ? (
                  <video src={item.url} className="size-full object-cover" muted playsInline />
                ) : (
                  <Image
                    src={item.thumbUrl ?? item.url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                  />
                )}

                <div className="absolute left-2 top-2 flex flex-col gap-1">
                  {item.isCover && (
                    <Badge variant="glass" size="sm">
                      <Star className="size-3" /> Titel
                    </Badge>
                  )}
                  {item.moderation === "PENDING" && (
                    <Badge variant="glass" size="sm">
                      In Prüfung
                    </Badge>
                  )}
                  {item.moderation === "REJECTED" && (
                    <Badge variant="danger" size="sm">
                      Abgelehnt
                    </Badge>
                  )}
                  {item.visibility === "PRIVATE" && (
                    <Badge variant="glass" size="sm">
                      <Lock className="size-3" /> {item.unlockCost} C
                    </Badge>
                  )}
                </div>

                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <IconAction
                    label="Als Titelbild"
                    onClick={() => act(() => setCoverAction(item.id, profileId))}
                    disabled={item.isCover}
                  >
                    <Star className="size-3.5" />
                  </IconAction>
                  <IconAction
                    label={item.visibility === "PUBLIC" ? "Privat schalten" : "Öffentlich schalten"}
                    onClick={() =>
                      act(() =>
                        updateMediaVisibilityAction(
                          item.id,
                          item.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC",
                          15,
                          profileId,
                        ),
                      )
                    }
                  >
                    {item.visibility === "PUBLIC" ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </IconAction>
                  <IconAction
                    label="Löschen"
                    danger
                    onClick={() => {
                      if (confirm("Diese Datei wirklich löschen?")) act(() => deleteMediaAction(item.id, profileId));
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </IconAction>
                </div>
              </div>

              {item.moderationNote && (
                <p className="px-3 py-2 text-[11px] text-danger">{item.moderationNote}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IconAction({
  label,
  children,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-lg bg-black/60 text-white backdrop-blur-md transition-colors hover:bg-black/85 disabled:opacity-40",
        danger && "hover:bg-danger",
      )}
    >
      {children}
    </button>
  );
}

"use client";

import * as React from "react";
import { Check, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Upload für Prüfdokumente.
 *
 * Die Datei geht per vorsigniertem PUT direkt in den Bucket; im Formular
 * landet nur der Objektschlüssel, nie eine öffentliche URL. Ausgeliefert
 * werden diese Objekte ausschliesslich über `/media`, das den Zugriff auf
 * Eigentümerin und Moderation begrenzt.
 */

export function useSecureUpload() {
  const [uploading, setUploading] = React.useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const res = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "verification",
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Upload fehlgeschlagen." }));
        throw new Error(error);
      }
      const presign = await res.json();
      const put = await fetch(presign.url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error("Upload fehlgeschlagen.");
      return presign.key as string;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading };
}

export function UploadField({
  label,
  hint,
  name,
  required,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  name: string;
  required?: boolean;
  value: string | null;
  onChange: (key: string | null) => void;
}) {
  const { upload, uploading } = useSecureUpload();
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div>
      <input type="hidden" name={name} value={value ?? ""} />
      <p className="mb-1.5 text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-primary">*</span>}
      </p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border-2 border-dashed px-4 py-4 text-left transition-colors",
          value ? "border-success/50 bg-success/5" : "border-border hover:border-foreground/25",
        )}
      >
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg",
            value ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
          )}
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : value ? <Check className="size-4" /> : <Upload className="size-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">
            {uploading ? "Wird hochgeladen…" : value ? "Datei hochgeladen" : "Datei auswählen"}
          </span>
          {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            onChange(await upload(file));
            toast.success("Datei sicher hochgeladen.");
          } catch (error) {
            toast.error((error as Error).message);
          }
        }}
      />
    </div>
  );
}


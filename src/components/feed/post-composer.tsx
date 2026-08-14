"use client";

import * as React from "react";
import { useActionState } from "react";
import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";
import { createPostAction } from "@/server/actions/interactions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {Textarea} from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function PostComposer() {
  const [state, action, pending] = useActionState(createPostAction, {});
  const [mediaUrl, setMediaUrl] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [visibility, setVisibility] = React.useState("PUBLIC");
  const formRef = React.useRef<HTMLFormElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Veröffentlicht");
      formRef.current?.reset();
      setMediaUrl(null);
    } else if (state.message) toast.error(state.message);
  }, [state]);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const res = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "post", filename: file.name, contentType: file.type, size: file.size }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Upload fehlgeschlagen.");
      const presign = await res.json();
      const put = await fetch(presign.url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!put.ok) throw new Error("Upload fehlgeschlagen.");
      setMediaUrl(presign.publicUrl);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-4">
      <form ref={formRef} action={action} className="space-y-3">
        {mediaUrl && <input type="hidden" name="mediaUrl" value={mediaUrl} />}
        <input type="hidden" name="visibility" value={visibility} />

        <Textarea
          name="body"
          required
          rows={3}
          maxLength={2000}
          placeholder="Was gibt's Neues? Teile ein Update mit deinen Followern…"
          className="border-0 bg-transparent px-0 focus-visible:ring-0"
        />

        {mediaUrl && (
          <div className="relative w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaUrl} alt="" className="max-h-48 rounded-xl object-cover" />
            <button
              type="button"
              onClick={() => setMediaUrl(null)}
              className="absolute right-2 top-2 grid size-7 place-items-center rounded-lg bg-black/60 text-white"
              aria-label="Bild entfernen"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            Bild
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />

          <Select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="h-9 w-auto min-w-36 text-xs"
          >
            <option value="PUBLIC">Öffentlich</option>
            <option value="FOLLOWERS">Nur Follower</option>
            <option value="PAID">Kostenpflichtig</option>
          </Select>

          {visibility === "PAID" && (
            <input
              type="number"
              name="unlockCost"
              min={1}
              max={500}
              defaultValue={20}
              className="h-9 w-24 rounded-xl border border-border bg-card px-3 text-xs outline-none"
              placeholder="Credits"
            />
          )}

          <Button type="submit" variant="brand" size="sm" className="ml-auto" loading={pending}>
            <Send className="size-4" /> Posten
          </Button>
        </div>
      </form>
    </Card>
  );
}

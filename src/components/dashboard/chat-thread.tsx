"use client";

import * as React from "react";
import { useActionState } from "react";
import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";
import { markConversationReadAction, sendMessageAction } from "@/server/actions/interactions";
import { EmojiPicker } from "@/components/dashboard/emoji-picker";
import { Button } from "@/components/ui/button";
import { LOCALE, cn, formatDateTime } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  body: string;
  senderId: string;
  attachmentUrl: string | null;
  attachmentType?: "IMAGE" | "VIDEO" | "AUDIO" | null;
  readAt: string | Date | null;
  createdAt: string | Date;
};

type Anhang = { url: string; type: "IMAGE" | "VIDEO"; name: string };

const ERLAUBT = "image/jpeg,image/png,image/webp,image/avif,image/heic,video/mp4,video/quicktime,video/webm";

export function ChatThread({
  conversationId,
  currentUserId,
  initialMessages,
  otherName,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  otherName: string;
}) {
  const [messages, setMessages] = React.useState(initialMessages);
  const [state, action, pending] = useActionState(sendMessageAction, {});
  const [anhang, setAnhang] = React.useState<Anhang | null>(null);
  const [uploadFortschritt, setUploadFortschritt] = React.useState<number | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const textRef = React.useRef<HTMLTextAreaElement>(null);
  const dateiRef = React.useRef<HTMLInputElement>(null);
  const lastAt = React.useRef<string>(
    initialMessages.at(-1)?.createdAt ? new Date(initialMessages.at(-1)!.createdAt).toISOString() : new Date(0).toISOString(),
  );

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Nach dem Öffnen als gelesen markieren — nach dem Mount, nicht im Render,
  // damit die Revalidierung des Zählers erlaubt ist.
  React.useEffect(() => {
    void markConversationReadAction(conversationId);
  }, [conversationId]);

  React.useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setAnhang(null);
    } else if (state.message) toast.error(state.message);
  }, [state]);

  // Polling für neue Nachrichten
  React.useEffect(() => {
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/messages/${conversationId}?after=${encodeURIComponent(lastAt.current)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages?.length) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            return [...prev, ...data.messages.filter((m: ChatMessage) => !ids.has(m.id))];
          });
          lastAt.current = new Date(data.messages.at(-1).createdAt).toISOString();
        }
      } catch {
        /* ignorieren */
      }
    };
    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, [conversationId]);

  const emojiEinfuegen = (emoji: string) => {
    const feld = textRef.current;
    if (!feld) return;
    const start = feld.selectionStart ?? feld.value.length;
    const ende = feld.selectionEnd ?? start;
    feld.value = feld.value.slice(0, start) + emoji + feld.value.slice(ende);
    feld.focus();
    feld.selectionStart = feld.selectionEnd = start + emoji.length;
  };

  const hochladen = async (datei: File) => {
    setUploadFortschritt(0);
    try {
      const res = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "message",
          filename: datei.name,
          contentType: datei.type,
          size: datei.size,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Upload fehlgeschlagen.");
      const presign = await res.json();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presign.url);
        xhr.setRequestHeader("Content-Type", datei.type);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) setUploadFortschritt(Math.round((event.loaded / event.total) * 100));
        };
        xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
        xhr.onerror = () => reject(new Error("Netzwerkfehler"));
        xhr.send(datei);
      });

      setAnhang({ url: presign.publicUrl, type: presign.type, name: datei.name });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploadFortschritt(null);
      if (dateiRef.current) dateiRef.current.value = "";
    }
  };

  return (
    <div className="flex h-[calc(100dvh-16rem)] min-h-96 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Schreib {otherName} die erste Nachricht.
          </p>
        )}
        {messages.map((message, i) => {
          const mine = message.senderId === currentUserId;
          const prev = messages[i - 1];
          const showDate =
            !prev || new Date(prev.createdAt).toDateString() !== new Date(message.createdAt).toDateString();

          return (
            <React.Fragment key={message.id}>
              {showDate && (
                <p className="py-2 text-center text-[11px] text-muted-foreground">
                  {new Intl.DateTimeFormat(LOCALE, { dateStyle: "full" }).format(new Date(message.createdAt))}
                </p>
              )}
              <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    mine
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-muted text-foreground",
                  )}
                >
                  {message.attachmentUrl &&
                    (message.attachmentType === "VIDEO" ? (
                      <video
                        src={message.attachmentUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="mb-2 max-h-72 w-full rounded-xl bg-black"
                      />
                    ) : (
                      <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={message.attachmentUrl}
                          alt="Anhang"
                          loading="lazy"
                          className="mb-2 max-h-72 rounded-xl object-cover"
                        />
                      </a>
                    ))}
                  {message.body && <p className="whitespace-pre-line break-words">{message.body}</p>}
                  <p className={cn("mt-1 text-[10px]", mine ? "text-primary-foreground/65" : "text-muted-foreground")}>
                    {formatDateTime(message.createdAt).split(", ")[1] ?? ""}
                    {mine && message.readAt ? " · gelesen" : ""}
                  </p>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form ref={formRef} action={action} className="border-t border-border p-3">
        <input type="hidden" name="conversationId" value={conversationId} />
        {anhang && <input type="hidden" name="attachmentUrl" value={anhang.url} />}
        {anhang && <input type="hidden" name="attachmentType" value={anhang.type} />}

        {(anhang || uploadFortschritt !== null) && (
          <div className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-2">
            {uploadFortschritt !== null ? (
              <>
                <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                <span className="flex-1 text-xs text-muted-foreground">Wird hochgeladen …</span>
                <div className="h-1.5 w-24 overflow-hidden rounded-xs bg-input">
                  <div className="h-full bg-primary transition-all" style={{ width: `${uploadFortschritt}%` }} />
                </div>
              </>
            ) : (
              anhang && (
                <>
                  {anhang.type === "VIDEO" ? (
                    <video src={anhang.url} className="size-12 shrink-0 rounded-lg bg-black object-cover" muted />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={anhang.url} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{anhang.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Anhang entfernen"
                    onClick={() => setAnhang(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </>
              )
            )}
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={dateiRef}
            type="file"
            accept={ERLAUBT}
            className="hidden"
            onChange={(event) => event.target.files?.[0] && hochladen(event.target.files[0])}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label="Foto oder Video anhängen"
            disabled={uploadFortschritt !== null}
            onClick={() => dateiRef.current?.click()}
          >
            {uploadFortschritt !== null ? (
              <Loader2 className="size-4.5 animate-spin" />
            ) : (
              <ImagePlus className="size-4.5" />
            )}
          </Button>

          <EmojiPicker onPick={emojiEinfuegen} disabled={pending} />

          <textarea
            ref={textRef}
            name="body"
            rows={1}
            maxLength={4000}
            placeholder={anhang ? "Kommentar (optional) …" : "Nachricht schreiben…"}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus-visible:border-ring"
          />

          <Button type="submit" variant="brand" size="icon-lg" loading={pending} aria-label="Senden">
            {!pending && <Send className="size-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}

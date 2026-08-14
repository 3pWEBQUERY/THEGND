import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getConversations } from "@/server/queries/user";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { AvatarFallback, AvatarImage, AvatarRoot } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { cn, initials, isOnline, timeAgo, truncate } from "@/lib/utils";

export const metadata: Metadata = { title: "Nachrichten" };

export default async function MessagesPage() {
  const user = await requireUser();
  const conversations = await getConversations(user.id);

  return (
    <>
      <PageHeader title="Nachrichten" description="Alle Unterhaltungen an einem Ort — verschlüsselt und diskret." />

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="Noch keine Nachrichten"
          description="Sobald dir jemand schreibt oder du ein Profil kontaktierst, erscheint die Unterhaltung hier."
          action={
            <Button asChild variant="brand">
              <Link href="/escorts">Profile entdecken</Link>
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/dashboard/nachrichten/${c.id}`}
                className={cn("flex items-center gap-3 p-4 transition-colors hover:bg-muted/60", c.unread && "bg-primary/4")}
              >
                <div className="relative shrink-0">
                  <AvatarRoot className="size-11">
                    {c.other?.avatarUrl && <AvatarImage src={c.other.avatarUrl} alt="" />}
                    <AvatarFallback>{initials(c.other?.displayName)}</AvatarFallback>
                  </AvatarRoot>
                  {isOnline(c.other?.lastSeenAt) && (
                    <span className="absolute bottom-0 right-0 size-3 rounded-xs border-2 border-card bg-success" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("truncate text-sm", c.unread ? "font-semibold" : "font-medium")}>
                      {c.other?.displayName ?? "Gelöschtes Konto"}
                    </p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(c.lastMessageAt)}</span>
                  </div>
                  <p className={cn("truncate text-xs", c.unread ? "text-foreground" : "text-muted-foreground")}>
                    {c.last ? truncate(c.last.body, 80) : "Unterhaltung gestartet"}
                  </p>
                </div>

                {c.unread && <span className="size-2 shrink-0 rounded-xs bg-primary" />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
